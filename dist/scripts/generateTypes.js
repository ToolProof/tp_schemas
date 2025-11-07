import fs from 'fs';
import path from 'path';
import { compileFromFile } from 'json-schema-to-typescript';
const projectRoot = process.cwd();
const inputDir = path.join(projectRoot, 'src', 'schemas');
const outputDir = path.join(projectRoot, 'src', 'types');
const outputPath = path.join(outputDir, 'types.d.ts');
// Build an index of all schema files by their basename (e.g., Base.json -> absolute path)
// This supports location-independent $id values where folder segments were removed.
function buildSchemaIndex(root) {
    const index = new Map();
    const stack = [root];
    while (stack.length) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                // Skip dist or types output folders if present inside schemas (defensive)
                if (entry.name === 'node_modules' || entry.name.startsWith('.'))
                    continue;
                stack.push(full);
            }
            else if (entry.isFile() && entry.name.endsWith('.json')) {
                if (entry.name === '.combined-schema.json')
                    continue; // ignore temp file
                const baseName = entry.name; // keep extension for direct mapping
                if (index.has(baseName)) {
                    // Hard fail on collisions so they can be fixed explicitly
                    const existing = index.get(baseName);
                    throw new Error(`Schema basename collision detected for "${baseName}"\n` +
                        `First:  ${existing}\n` +
                        `Second: ${full}\n` +
                        `Please rename one of the schemas to ensure unique basenames.`);
                }
                else {
                    index.set(baseName, full);
                }
            }
        }
    }
    return index;
}
// List all schema files (relative to inputDir), excluding documentation and temp files
function listAllSchemaFiles(root) {
    const files = [];
    const stack = [root];
    while (stack.length) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'documentation' || entry.name === 'node_modules' || entry.name.startsWith('.'))
                    continue;
                stack.push(full);
            }
            else if (entry.isFile() && entry.name.endsWith('.json')) {
                if (entry.name === '.combined-schema.json')
                    continue; // ignore temp
                // buildersuce path relative to root with posix separators
                const rel = path.relative(root, full).split(path.sep).join('/');
                files.push(rel);
            }
        }
    }
    files.sort(); // deterministic order
    return files;
}
async function main() {
    fs.mkdirSync(outputDir, { recursive: true });
    const parts = [];
    parts.push('// Auto-generated from JSON schemas. Do not edit.\n');
    // Precompute index for location-independent IDs (filename only after version segment)
    const schemaIndex = buildSchemaIndex(inputDir);
    const idToCanonical = {};
    // Custom resolver to map our absolute schema IDs to local files, preventing HTTP fetches.
    // Supports two patterns:
    //  1. Legacy full-path IDs: https://schemas.toolproof.com/v0/primitives/Foo.json
    //  2. Location-independent IDs: https://schemas.toolproof.com/v0/Foo.json
    const toolproofResolver = {
        order: 1,
        canRead: (file) => {
            const url = (typeof file.url === 'string' ? file.url : file.url?.href) || '';
            return (/^https?:\/\/schemas\.toolproof\.(documentation|com)\//i.test(url) ||
                /^https?:\/\/toolproof\.com\/schemas\//i.test(url));
        },
        read: (file) => {
            const url = (typeof file.url === 'string' ? file.url : file.url?.href) || '';
            // Strip hash part (anchors) for path resolution
            const noHash = url.split('#')[0];
            // Remove base domains
            let rel = noHash
                .replace(/^https?:\/\/schemas\.toolproof\.(documentation|com)\//i, '')
                .replace(/^https?:\/\/toolproof\.com\/schemas\//i, '');
            // Drop leading version segment (v0/, v1/, etc.) if present
            rel = rel.replace(/^v\d+\//i, '');
            // Resolve by basename only (location-independent IDs)
            const fileName = path.basename(rel);
            const indexed = schemaIndex.get(fileName);
            if (indexed) {
                return fs.readFileSync(indexed, 'utf8');
            }
            throw new Error(`Toolproof resolver: could not locate schema for URL "${url}". ` +
                `Tried basename "${fileName}" in schema index. Ensure unique basenames and correct $id.`);
        }
    };
    // Files to include in the combined schema (auto-discovered, excludes documentation)
    const toCompile = listAllSchemaFiles(inputDir);
    // Build definitions for a combined schema that references each file.
    const definitions = {};
    const includedNames = [];
    // Track IdLib $defs so we can include them as top-level entries
    let idLibRefValue;
    let idLibDefs = [];
    for (const fileName of toCompile) {
        const p = path.join(inputDir, fileName);
        if (!fs.existsSync(p)) {
            console.warn(`Schema file missing, skipping: ${p}`);
            continue;
        }
        // Definition key: basename without extension, with path segments removed
        const base = path.basename(fileName, '.json');
        // Prefer the schema's declared $id so all references point to the same absolute URI
        // This helps json-schema-to-typescript dedupe declarations instead of emitting FooJson and FooJson1
        let refValue = `./${fileName}`;
        try {
            const raw = fs.readFileSync(p, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.$id === 'string' && parsed.$id.trim()) {
                refValue = parsed.$id.trim();
                idToCanonical[refValue] = base + 'Json';
            }
            // Capture IdLib $defs so we can promote them to top-level types
            if (base === 'IdLib' && parsed && parsed.$defs && typeof parsed.$defs === 'object') {
                idLibRefValue = refValue; // absolute $id for IdLib
                idLibDefs = Object.keys(parsed.$defs).filter((k) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k));
            }
        }
        catch (e) {
            // If parsing fails, fall back to relative ref; proceed gracefully
        }
        definitions[base] = { $ref: refValue };
        includedNames.push(base);
    }
    // If IdLib was found, add each of its $defs as top-level refs so they become exported aliases
    if (idLibRefValue && idLibDefs.length) {
        for (const defName of idLibDefs) {
            // Avoid collisions with existing definition names
            if (!(defName in definitions)) {
                definitions[defName] = { $ref: `${idLibRefValue}#/$defs/${defName}` };
                includedNames.push(defName);
            }
        }
    }
    if (includedNames.length === 0) {
        console.warn('No schema files found to compile. Nothing to do.');
        return;
    }
    const combinedSchema = {
        $id: 'combined-entry',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $defs: definitions,
        anyOf: includedNames.map((n) => ({ $ref: `#/$defs/${n}` }))
    };
    console.log('combinedSchema:', JSON.stringify(combinedSchema, null, 2));
    // Write combined schema to a temp file inside inputDir so relative $ref resolves.
    const combinedPath = path.join(inputDir, '.combined-schema.json');
    try {
        fs.writeFileSync(combinedPath, JSON.stringify(combinedSchema, null, 2), 'utf8');
        // Compile the single combined schema; referenced schemas will be emitted once.
        let ts = await compileFromFile(combinedPath, {
            bannerComment: '',
            // 
            declareExternallyReferenced: true,
            // Forward ref parser options so absolute $id/$ref URLs resolve from local files
            $refOptions: {
                // Don’t go to the network; we provide a local resolver for our domain
                resolve: {
                    file: { order: 2 },
                    http: false,
                    https: false,
                    toolproof: toolproofResolver
                }
            }
        });
        // Prune verbose type/interface names buildersuced from absolute $id URLs.
        // Deterministic pruning based on original $id -> baseName map
        // This avoids heuristic truncation that dropped prefixes like Resource / Workflow.
        function idToGeneratedIdentifier(id) {
            // json-schema-to-typescript seems to create a PascalCase of the URL with protocol prefix
            // Simplified reconstruction: 'https://' => 'Https', then capitalize path & host segments
            const noProto = id.replace(/^https?:\/\//i, '');
            const tokens = noProto
                .split(/[\/#?.=&_-]+/)
                .filter(Boolean)
                .map((t) => t.replace(/[^A-Za-z0-9]/g, ''))
                .filter(Boolean)
                .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
            return 'Https' + tokens.join('') + 'Json';
        }
        // Perform replacements for known IDs
        for (const [id, canonical] of Object.entries(idToCanonical)) {
            const longName = idToGeneratedIdentifier(id);
            if (longName === canonical)
                continue; // already minimal
            const re = new RegExp(`\\b${longName}\\b`, 'g');
            ts = ts.replace(re, canonical);
        }
        // Remove version prefixes inside any remaining long identifiers: Https...V0... -> remove V0 if followed by capital
        ts = ts.replace(/(Https[A-Za-z0-9_]*?)V\d+([A-Z])/g, '$1$2');
        // Final cleanup: aggressively strip the domain prefix `HttpsSchemasToolproofCom` from ALL identifiers.
        // This is safe because those long names are only artifacts of json-schema-to-typescript; base names don't start with that sequence.
        ts = ts.replace(/\bHttpsSchemasToolproofCom(?=[A-Z])/g, '');
        // Remove accidental duplicate union entries in CombinedEntry after shortening.
        ts = ts.replace(/export type CombinedEntry =([\s\S]*?);/, (m, body) => {
            const lines = body.split(/\n/);
            const seen2 = new Set();
            const kept = [];
            for (const line of lines) {
                const trimmed = line.trim();
                const match = /^\|\s*([A-Za-z0-9_]+)\b/.exec(trimmed);
                if (match) {
                    const name = match[1];
                    if (!seen2.has(name)) {
                        seen2.add(name);
                        kept.push('  | ' + name);
                    }
                }
                else if (trimmed.length) {
                    kept.push(line);
                }
            }
            return 'export type CombinedEntry =\n' + kept.join('\n') + ';';
        });
        parts.push(ts);
        const output = parts.join('\n');
        // Write to src/types (used by the TypeScript build)
        fs.writeFileSync(outputPath, output, 'utf8');
        console.log('Wrote', outputPath);
        // Also write a copy into dist so consumers get the generated declarations
        const distTypesDir = path.join(projectRoot, 'dist', 'types');
        const distOutputPath = path.join(distTypesDir, 'types.d.ts');
        try {
            fs.mkdirSync(distTypesDir, { recursive: true });
            fs.writeFileSync(distOutputPath, output, 'utf8');
            console.log('Wrote', distOutputPath);
        }
        catch (e) {
            // If copying to dist fails, log but don't crash the generator.
            console.warn('Failed to write types to dist:', e);
        }
    }
    finally {
        // Best-effort cleanup of the temporary combined schema
        try {
            if (fs.existsSync(combinedPath))
                fs.unlinkSync(combinedPath);
        }
        catch (e) {
            // ignore cleanup errors
        }
    }
}
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
