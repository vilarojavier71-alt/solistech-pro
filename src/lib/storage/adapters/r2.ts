/**
 * Cloudflare R2 Storage Adapter
 * Implementación para Cloudflare R2 (S3-compatible, sin egress fees)
 */

import type { StorageAdapter, StorageUploadOptions, StorageDownloadOptions, StorageDeleteOptions, StorageUrlOptions, StorageListOptions, StorageFile } from '../index'

// Para producción, usar @aws-sdk/client-s3 con endpoint de R2
// npm install @aws-sdk/client-s3

export class R2StorageAdapter implements StorageAdapter {
    private endpoint: string
    private accessKeyId: string
    private secretAccessKey: string

    constructor() {
        this.endpoint = process.env.R2_ENDPOINT || ''
        this.accessKeyId = process.env.R2_ACCESS_KEY_ID || ''
        this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ''

        if (!this.endpoint) {
            console.warn('[R2StorageAdapter] Missing R2_ENDPOINT configuration')
        }
    }

    async upload(options: StorageUploadOptions): Promise<{ url: string; path: string }> {
        // TODO: Implementar con @aws-sdk/client-s3
        // const client = new S3Client({
        //     region: 'auto',
        //     endpoint: this.endpoint,
        //     credentials: {
        //         accessKeyId: this.accessKeyId,
        //         secretAccessKey: this.secretAccessKey,
        //     }
        // })
        throw new Error('R2 adapter not yet implemented. Set STORAGE_PROVIDER=supabase')
    }

    async download(options: StorageDownloadOptions): Promise<Blob> {
        throw new Error('R2 adapter not yet implemented')
    }

    async delete(options: StorageDeleteOptions): Promise<void> {
        throw new Error('R2 adapter not yet implemented')
    }

    async getUrl(options: StorageUrlOptions): Promise<string> {
        throw new Error('R2 adapter not yet implemented')
    }

    async list(options: StorageListOptions): Promise<StorageFile[]> {
        throw new Error('R2 adapter not yet implemented')
    }
}
