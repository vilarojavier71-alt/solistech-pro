import { z } from "zod"

/**
 * Supported data types for import fields
 */
export type ImportFieldType = 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'currency' | 'select'

/**
 * Definition of a single field to be imported
 */
export interface ImportFieldDefinition {
    /** Unique identifier for the field (database column name) */
    key: string
    /** User-facing label */
    label: string
    /** Data type for UI rendering and basic validation */
    type: ImportFieldType
    /** Is this field mandatory? */
    required: boolean
    /** Zod schema for validation */
    validation?: z.ZodTypeAny
    /** Optional transformer function for single value */
    transform?: (value: any) => any
    /** Aliases for auto-mapping (e.g. ['email', 'correo', 'mail']) */
    aliases?: string[]
    /** If type is 'select', allowed values */
    options?: { label: string; value: string | number }[]
    /** Description or tooltip */
    description?: string
    /** Default value if missing */
    defaultValue?: any
}

/**
 * Strategy for handling duplicate records
 */
export type DuplicateStrategy = 'skip' | 'update' | 'error' | 'append'

/**
 * The Schema defining how an entity is imported.
 * Corresponds to "ImportConfigDefinition" in other contexts.
 */
export interface ImportSchema<T = any> {
    /** Unique ID for this configuration (e.g. 'customer_import_v1') */
    id: string
    /** Database table name */
    targetModel: string // Renamed from entityName to match "ImportSchema" spec
    /** Human readable name */
    label: string
    /** List of fields to import */
    fields: ImportFieldDefinition[]
    /** Fields used to detect duplicates (compound key) */
    identityFields: string[]
    /** Default duplicate strategy */
    defaultDuplicateStrategy?: DuplicateStrategy
    /** Batch size for processing */
    batchSize?: number
    /** 
    * Hook to manually transform/validate the entire row before schema validation.
    * Useful for complex inter-field logic.
    */
    transformRow?: (row: any) => T
    /** Hook to run before insertion (e.g. validaciones cruzadas async) */
    beforeInsert?: (row: T) => Promise<T>
}

// Backward compatibility alias if needed
export type ImportConfigDefinition = ImportSchema
