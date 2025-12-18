/**
 * Storage Adapter Interface
 * Abstracción para desacoplar lógica de almacenamiento de proveedor específico.
 * Permite migrar de Supabase Storage a S3/R2/cualquier otro sin cambiar componentes.
 */

export interface StorageUploadOptions {
    bucket: string
    path: string
    file: File | Blob
    contentType?: string
    upsert?: boolean
}

export interface StorageDownloadOptions {
    bucket: string
    path: string
}

export interface StorageDeleteOptions {
    bucket: string
    paths: string[]
}

export interface StorageUrlOptions {
    bucket: string
    path: string
    expiresIn?: number // segundos
}

export interface StorageListOptions {
    bucket: string
    prefix?: string
    limit?: number
}

export interface StorageFile {
    name: string
    path: string
    size: number
    createdAt: Date
    contentType?: string
}

export interface StorageAdapter {
    /**
     * Subir archivo
     * @returns URL pública o signed del archivo
     */
    upload(options: StorageUploadOptions): Promise<{ url: string; path: string }>

    /**
     * Descargar archivo
     * @returns Blob del archivo
     */
    download(options: StorageDownloadOptions): Promise<Blob>

    /**
     * Eliminar archivos
     */
    delete(options: StorageDeleteOptions): Promise<void>

    /**
     * Obtener URL pública o firmada
     */
    getUrl(options: StorageUrlOptions): Promise<string>

    /**
     * Listar archivos en un bucket/prefix
     */
    list(options: StorageListOptions): Promise<StorageFile[]>
}

/**
 * Proveedor actual de storage (configurar via ENV)
 */
export type StorageProvider = 's3' | 'r2' | 'local'

/**
 * Obtener el adaptador de storage según configuración
 */
export async function getStorageAdapter(): Promise<StorageAdapter> {
    const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

    switch (provider) {
        case 's3':
            const { S3StorageAdapter } = await import('./adapters/s3')
            return new S3StorageAdapter()

        case 'r2':
            const { R2StorageAdapter } = await import('./adapters/r2')
            return new R2StorageAdapter()

        case 'local':
        default:
            const { LocalStorageAdapter } = await import('./adapters/local')
            return new LocalStorageAdapter()
    }
}

// Re-export para uso simplificado
export { getStorageAdapter as storage }

