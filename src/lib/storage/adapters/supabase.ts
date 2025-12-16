/**
 * Supabase Storage Adapter
 * Implementación legacy para compatibilidad con código existente.
 * TODO: Migrar componentes a usar interfaz genérica y eliminar este adapter.
 */

import { createClient } from '@supabase/supabase-js'
import type { StorageAdapter, StorageUploadOptions, StorageDownloadOptions, StorageDeleteOptions, StorageUrlOptions, StorageListOptions, StorageFile } from '../index'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class SupabaseStorageAdapter implements StorageAdapter {
    async upload(options: StorageUploadOptions): Promise<{ url: string; path: string }> {
        const { bucket, path, file, contentType, upsert } = options

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                contentType,
                upsert: upsert ?? false
            })

        if (error) throw new Error(`Upload failed: ${error.message}`)

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path)

        return {
            url: urlData.publicUrl,
            path: data.path
        }
    }

    async download(options: StorageDownloadOptions): Promise<Blob> {
        const { bucket, path } = options

        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path)

        if (error) throw new Error(`Download failed: ${error.message}`)

        return data
    }

    async delete(options: StorageDeleteOptions): Promise<void> {
        const { bucket, paths } = options

        const { error } = await supabase.storage
            .from(bucket)
            .remove(paths)

        if (error) throw new Error(`Delete failed: ${error.message}`)
    }

    async getUrl(options: StorageUrlOptions): Promise<string> {
        const { bucket, path, expiresIn } = options

        if (expiresIn) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn)

            if (error) throw new Error(`Get URL failed: ${error.message}`)
            return data.signedUrl
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)

        return data.publicUrl
    }

    async list(options: StorageListOptions): Promise<StorageFile[]> {
        const { bucket, prefix, limit } = options

        const { data, error } = await supabase.storage
            .from(bucket)
            .list(prefix, { limit: limit ?? 100 })

        if (error) throw new Error(`List failed: ${error.message}`)

        return data.map(file => ({
            name: file.name,
            path: prefix ? `${prefix}/${file.name}` : file.name,
            size: file.metadata?.size || 0,
            createdAt: new Date(file.created_at),
            contentType: file.metadata?.mimetype
        }))
    }
}
