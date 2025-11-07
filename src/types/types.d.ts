// Auto-generated from JSON schemas. Do not edit.

export type CombinedEntry =
  | BaseJson
  | IdLibJson
  | ResourceFormatJson
  | ResourceFormatBaseJson
  | ResourceFormatMetaJson
  | JobJson
  | JobBaseJson
  | JobMetaJson
  | InternalJson
  | ResourceRoleJson
  | ResourceRoleBaseJson
  | ResourceRoleMetaJson
  | RoleDirectionJson
  | ResourceTypeJson
  | ResourceTypeBaseJson
  | ResourceTypeMetaJson
  | ExposedSchemaJson
  | SemanticIdentityJson
  | SemanticIdentityPropJson
  | SemanticIdentityValueJson
  | SemanticMeritJson
  | SemanticMeritPropJson
  | SemanticMeritValueJson
  | WorkflowJson
  | WorkflowSpecJson
  | JsonValueJson
  | ResourceMapJson
  | ResourceMetaActiveJson
  | ResourceMetaPassiveJson
  | BranchStepJson
  | ForStepJson
  | JobStepJson
  | StepJson
  | WhileStepJson
  | ConditionalWrapperJson
  | ResourceBindingJson
  | ResourceFormatId
  | ResourceTypeId
  | ResourceRoleId
  | JobId
  | JobStepId
  | BranchStepId
  | WhileStepId
  | ForStepId
  | StepId
  | WorkflowId
  | WorkflowSpecId
  | ResourceId;
export type ResourceFormatJson = ResourceFormatBaseJson;
export type ResourceFormatBaseJson = Concept & {
  id?: ResourceFormatId;
  [k: string]: unknown;
};
export type Concept = Identifiable & {
  name: string;
  description?: string;
  [k: string]: unknown;
};
export type ResourceFormatId = string;
export type ResourceFormatMetaJson = MetaBase &
  ResourceFormatBaseJson;
export type JobJson = JobBaseJson;
export type JobBaseJson = Concept & {
  id?: JobId;
  isPredicate: boolean;
  resources: {
    inputs: ResourceRoleId[];
    outputs: ResourceRoleId[];
    [k: string]: unknown;
  };
  [k: string]: unknown;
} & {
  [k: string]: unknown;
};
export type JobId = string;
export type ResourceRoleId = string;
export type JobMetaJson = MetaBase &
  JobBaseJson & {
    url: string;
    [k: string]: unknown;
  };
export type InternalJson = "less-than";
export type ResourceRoleJson = ResourceRoleBaseJson;
export type ResourceRoleBaseJson = Concept & {
  id?: ResourceRoleId;
  typeId: ResourceTypeId;
  direction: RoleDirectionJson;
  isPredicate: boolean;
  [k: string]: unknown;
};
export type ResourceTypeId = string;
export type RoleDirectionJson = "input" | "output";
export type ResourceRoleMetaJson = MetaBase & ResourceRoleBaseJson;
export type ResourceTypeJson = ResourceTypeBaseJson & {
  exposedSchema: ExposedSchemaJson;
  [k: string]: unknown;
};
export type ResourceTypeBaseJson = Concept & {
  id?: ResourceTypeId;
  formatId: ResourceFormatId;
  [k: string]: unknown;
};
export type ExposedSchemaJson = (
  | {
      allOf: unknown[];
      [k: string]: unknown;
    }
  | ({
      [k: string]: unknown;
    } & (SemanticIdentityJson | SemanticMeritJson))
) &
  (
    | {
        additionalProperties: false;
        [k: string]: unknown;
      }
    | {
        unevaluatedProperties: false;
        [k: string]: unknown;
      }
  ) & {
    $schema: "https://json-schema.org/draft/2020-12/schema";
    type: "object";
    /**
     * @minItems 1
     */
    required?: [string, ...string[]];
    $defs?: {
      [k: string]: unknown;
    };
    allOf?: {
      [k: string]: unknown;
    }[];
    properties?: {
      semanticIdentity?: unknown;
      semanticMerit?: unknown;
      [k: string]: unknown;
    };
    additionalProperties?: false;
    unevaluatedProperties?: false;
  };
export type SemanticIdentityPropJson =
  | {
      type: "string" | "integer" | "boolean";
      [k: string]: unknown;
    }
  | {
      /**
       * @minItems 1
       */
      enum: [string, ...string[]];
      [k: string]: unknown;
    };
export type ResourceTypeMetaJson = MetaBase & ResourceTypeBaseJson;
export type SemanticIdentityValueJson = string | number;
export type SemanticMeritValueJson = number;
export type WorkflowJson = Identifiable & {
  id?: WorkflowId;
  steps: StepJson[];
  [k: string]: unknown;
};
export type WorkflowId = string;
export type StepJson =
  | JobStepJson
  | BranchStepJson
  | WhileStepJson
  | ForStepJson;
export type JobStepJson = Identifiable & {
  id?: JobStepId;
  kind: "job";
  jobId: JobId;
  resourceBindings: {
    inputBindings: ResourceBindingJson;
    outputBindings: ResourceBindingJson;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};
export type JobStepId = string;
export type ResourceId = string;
export type BranchStepJson = Identifiable & {
  id?: BranchStepId;
  kind: "branch";
  /**
   * @minItems 1
   */
  cases: [ConditionalWrapperJson, ...ConditionalWrapperJson[]];
  [k: string]: unknown;
};
export type BranchStepId = string;
export type WhileStepJson = Identifiable & {
  id?: WhileStepId;
  kind: "while";
  case: ConditionalWrapperJson;
  [k: string]: unknown;
};
export type WhileStepId = string;
export type ForStepJson = Identifiable & {
  id?: ForStepId;
  kind: "for";
  case: ConditionalWrapperJson & {
    when?: JobStepJson & {
      jobId?: "JOB-rBDIf8F1iQ6oflEbI59N";
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
};
export type ForStepId = string;
export type WorkflowSpecJson = Identifiable & {
  id?: WorkflowSpecId;
  workflow: WorkflowJson;
  resourceMaps: ResourceMapJson[];
  [k: string]: unknown;
};
export type WorkflowSpecId = string;
export type ResourceMetaActiveJson = Timestamp & {
  exposedData: JsonValueJson;
  [k: string]: unknown;
} & (
    | MetaBase
    | {
        pointer: ResourceId;
        [k: string]: unknown;
      }
  );
export type JsonValueJson =
  | string
  | number
  | boolean
  | null
  | JsonValueJson[]
  | {
      [k: string]: JsonValueJson;
    };
export type ResourceMetaPassiveJson = Timestamp & MetaBase;
export type StepId = JobStepId | BranchStepId | WhileStepId | ForStepId;

export interface BaseJson {
  [k: string]: unknown;
}
export interface IdLibJson {
  [k: string]: unknown;
}
export interface Identifiable {
  id: string;
  [k: string]: unknown;
}
export interface MetaBase {
  path: string;
  [k: string]: unknown;
}
export interface SemanticIdentityJson {
  properties?: {
    semanticIdentity: SemanticIdentityPropJson;
    semanticMerit?: unknown;
    [k: string]: unknown;
  };
  required?: unknown[];
  [k: string]: unknown;
}
export interface SemanticMeritJson {
  properties?: {
    semanticMerit: SemanticMeritPropJson;
    semanticIdentity?: unknown;
    [k: string]: unknown;
  };
  required?: unknown[];
  [k: string]: unknown;
}
export interface SemanticMeritPropJson {
  type: "number";
  [k: string]: unknown;
}
export interface ResourceBindingJson {
  [k: string]: ResourceId;
}
export interface ConditionalWrapperJson {
  when: JobStepJson;
  what: JobStepJson;
  [k: string]: unknown;
}
export interface ResourceMapJson {
  [k: string]: ResourceMetaActiveJson;
}
export interface Timestamp {
  timestamp: string;
  [k: string]: unknown;
}
