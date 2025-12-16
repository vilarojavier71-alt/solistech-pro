/**
 * Local Storage Adapter (Development Only)
 * Guarda archivos en el sistema de archivos local.
 */

import type { StorageAdapter, StorageUploadOptions, StorageDownloadOptions, StorageDeleteOptions, StorageUrlOptions, StorageListOptions, StorageFile } from '../index'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads'

export class LocalStorageAdapter implements StorageAdapter {
    async upload(options: StorageUploadOptions): Promise<{ url: string; path: string }> {
        const { bucket, path: filePath, file } = options
        const fullPath = path.join(STORAGE_PATH, bucket, filePath)

        // Crear directorio si no existe
        await fs.mkdir(path.dirname(fullPath), { recursive: true })

        // Convertir Blob/File a Buffer
        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(fullPath, buffer)

        return {
            url: `/uploads/${bucket}/${filePath}`,
            path: filePath
        }
    }

    async download(options: StorageDownloadOptions): Promise<Blob> {
        const { bucket, path: filePath } = options
        const fullPath = path.join(STORAGE_PATH, bucket, filePath)

        const buffer = await fs.readFile(fullPath)
        return new Blob([buffer])
    }

    async delete(options: StorageDeleteOptions): Promise<void> {
        const { bucket, paths } = options

        for (const filePath of paths) {
            const fullPath = path.join(STORAGE_PATH, bucket, filePath)
            await fs.unlink(fullPath).catch(() => { })
        }
    }

    async getUrl(options: StorageUrlOptions): Promise<string> {
        const { bucket, path: filePath } = options
        return `/uploads/${bucket}/${filePath}`
    }

    async list(options: StorageListOptions): Promise<StorageFile[]> {
        const { bucket, prefix } = options
        const dirPath = path.join(STORAGE_PATH, bucket, prefix || '')

        try {
            const files = await fs.readdir(dirPath, { withFileTypes: true })
            const result: StorageFile[] = []

            for (const file of files) {
                if (file.isFile()) {
                    const stat = await fs.stat(path.join(dirPath, file.name))
                    result.push({
                        name: file.name,
                        path: prefix ? `${prefix}/${file.name}` : file.name,
                        size: stat.size,
                        createdAt: stat.birthtime
                    })
                }
            }

            return result
        } catch {
            return []
        }
    }
}
