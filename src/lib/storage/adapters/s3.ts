/**
 * AWS S3 Storage Adapter
 * Para migraciones a AWS S3 estándar
 */

import type { StorageAdapter, StorageUploadOptions, StorageDownloadOptions, StorageDeleteOptions, StorageUrlOptions, StorageListOptions, StorageFile } from '../index'

export class S3StorageAdapter implements StorageAdapter {
    constructor() {
        // TODO: Implementar con @aws-sdk/client-s3
        console.warn('[S3StorageAdapter] Set STORAGE_PROVIDER=supabase until S3 is configured')
    }

    async upload(options: StorageUploadOptions): Promise<{ url: string; path: string }> {
        throw new Error('S3 adapter not yet implemented')
    }

    async download(options: StorageDownloadOptions): Promise<Blob> {
        throw new Error('S3 adapter not yet implemented')
    }

    async delete(options: StorageDeleteOptions): Promise<void> {
        throw new Error('S3 adapter not yet implemented')
    }

    async getUrl(options: StorageUrlOptions): Promise<string> {
        throw new Error('S3 adapter not yet implemented')
    }

    async list(options: StorageListOptions): Promise<StorageFile[]> {
        throw new Error('S3 adapter not yet implemented')
    }
}
