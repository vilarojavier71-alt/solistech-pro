/**
 * useOfflineSync Hook (Refactored for Multi-Entity)
 * 
 * Gestiona la sincronización offline de múltiples entidades (Fichajes, Leads, etc.).
 * Incluye retry exponencial, detección de conexión y sincronización automática.
 * 
 * @version 2.0.0
 */

"use client"

import * as React from "react"
import { toast } from "sonner"

// Tipos de entidades soportadas
export type SyncEntity = 'time_entry' | 'lead' | 'client' | 'test_entity'
export type SyncAction = 'create' | 'update' | 'delete' | 'clock_in' | 'clock_out'

export interface QueueItem {
    id: string
    entity: SyncEntity
    action: SyncAction
    data: any
    timestamp: string
    retries: number
    synced: boolean
    lastAttempt?: string
}

export interface SyncState {
    totalPending: number
    byEntity: Record<SyncEntity, number>
    isSyncing: boolean
}

interface UseOfflineSyncReturn {
    isOnline: boolean
    syncState: SyncState
    addToQueue: (item: Omit<QueueItem, "id" | "retries" | "synced">) => Promise<void>
    syncNow: () => Promise<void>
    clearQueue: () => Promise<void>
    getQueueItems: () => Promise<QueueItem[]>
}

const DB_NAME = "solistech_offline"
const STORE_NAME = "sync_queue"
const DB_VERSION = 2
const MAX_RETRIES = 5
const RETRY_DELAY_BASE = 1000 // 1 segundo

// Mapa de endpoints para sincronización
const SYNC_CONFIG: Record<SyncEntity, { endpoint: string, method?: string }> = {
    'time_entry': { endpoint: "/api/time-entries/sync" },
    'lead': { endpoint: "/api/sales/leads/sync" },
    'client': { endpoint: "/api/clients/sync" },
    'test_entity': { endpoint: "/api/test/sync" } // Para pruebas
}

export function useOfflineSync(): UseOfflineSyncReturn {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true'

    const [isOnline, setIsOnline] = React.useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    )

    const [syncState, setSyncState] = React.useState<SyncState>({
        totalPending: 0,
        byEntity: {} as Record<SyncEntity, number>,
        isSyncing: false
    })

    const dbRef = React.useRef<IDBDatabase | null>(null)
    const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    // Bypass Hook if Disabled
    if (!isEnabled) {
        return {
            isOnline: true,
            syncState: { totalPending: 0, byEntity: {} as any, isSyncing: false },
            addToQueue: async () => { },
            syncNow: async () => { },
            clearQueue: async () => { },
            getQueueItems: async () => []
        }
    }

    // ============================================================================
    // INICIALIZACIÓN DE INDEXEDDB
    // ============================================================================

    const initDB = React.useCallback(async (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => {
                console.error("Error al abrir IndexedDB:", request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                const transaction = (event.target as IDBOpenDBRequest).transaction

                // Crear object store si no existe (V1)
                let store: IDBObjectStore
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
                    store.createIndex("timestamp", "timestamp", { unique: false })
                    store.createIndex("synced", "synced", { unique: false })
                    // V1 solo tenía type, ahora añadimos entity
                } else {
                    store = transaction!.objectStore(STORE_NAME)
                }

                // Migración V2: Añadir índice 'entity'
                if (!store.indexNames.contains("entity")) {
                    store.createIndex("entity", "entity", { unique: false })
                }
            }
        })
    }, [])

    // Inicializar DB al montar
    React.useEffect(() => {
        initDB()
            .then((db) => {
                dbRef.current = db
                updateQueueState()
            })
            .catch((error) => {
                console.error("Error al inicializar IndexedDB:", error)
            })

        return () => {
            dbRef.current?.close()
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
        }
    }, [initDB])

    // ============================================================================
    // MONITOREO DE CONEXIÓN
    // ============================================================================

    React.useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            toast.success("Conexión recuperada. Sincronizando...")
            syncTimeoutRef.current = setTimeout(() => {
                syncNow()
            }, 2000)
        }

        const handleOffline = () => {
            setIsOnline(false)
            toast.warning("Modo Offline activado. Los cambios se guardarán localmente.")
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    // ============================================================================
    // GESTIÓN DE COLA
    // ============================================================================

    const updateQueueState = async () => {
        if (!dbRef.current) return

        try {
            const items = await getQueueItems() // Obtenemos todos los pendientes (synced=false)

            // Calcular estado
            const total = items.length
            const byEntity = items.reduce((acc, item) => {
                acc[item.entity] = (acc[item.entity] || 0) + 1
                return acc
            }, {} as Record<SyncEntity, number>)

            setSyncState(prev => ({
                ...prev,
                totalPending: total,
                byEntity
            }))

        } catch (error) {
            console.error("Error al actualizar estado de cola:", error)
        }
    }

    const addToQueue = async (
        item: Omit<QueueItem, "id" | "retries" | "synced">
    ): Promise<void> => {
        if (!dbRef.current) {
            // Un pequeño retry de inicialización si la DB aun no está lista
            if (!dbRef.current) await initDB().then(db => dbRef.current = db)
        }

        const queueItem: QueueItem = {
            ...item,
            id: crypto.randomUUID(),
            retries: 0,
            synced: false,
            lastAttempt: undefined
        }

        return new Promise((resolve, reject) => {
            const transaction = dbRef.current!.transaction([STORE_NAME], "readwrite")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.add(queueItem)

            request.onsuccess = () => {
                updateQueueState()
                console.log(`[Offline] Item ${queueItem.entity}:${queueItem.action} añadido a cola`)
                resolve()
            }

            request.onerror = () => {
                console.error("Error al añadir item a cola:", request.error)
                reject(request.error)
            }
        })
    }

    const getQueueItems = async (): Promise<QueueItem[]> => {
        if (!dbRef.current) return []

        return new Promise((resolve, reject) => {
            const transaction = dbRef.current!.transaction([STORE_NAME], "readonly")
            const store = transaction.objectStore(STORE_NAME)
            const index = store.index("synced")
            // Solo queremos los NO sincronizados (FALSE)
            const request = index.getAll(IDBKeyRange.only(false))

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    // ============================================================================
    // SINCRONIZACIÓN CON RETRY EXPONENCIAL
    // ============================================================================

    const syncNow = async (): Promise<void> => {
        if (!dbRef.current || !isOnline) return

        setSyncState(prev => ({ ...prev, isSyncing: true }))

        try {
            const items = await getQueueItems()

            if (items.length === 0) {
                setSyncState(prev => ({ ...prev, isSyncing: false }))
                return
            }

            console.log(`[Sync] Iniciando sincronización de ${items.length} items...`)

            for (const item of items) {
                // Verificar si ha excedido el máximo de reintentos
                if (item.retries >= MAX_RETRIES) {
                    console.error(`❌ Item ${item.id} excedió máximo de reintentos (${MAX_RETRIES})`)
                    await markAsFailed(item.id)
                    continue
                }

                // Calcular delay exponencial
                const delay = RETRY_DELAY_BASE * Math.pow(2, item.retries)

                if (item.lastAttempt) {
                    const timeSinceLastAttempt = Date.now() - new Date(item.lastAttempt).getTime()
                    if (timeSinceLastAttempt < delay) continue
                }

                try {
                    // Dispatcher Dinámico
                    const config = SYNC_CONFIG[item.entity]
                    if (!config) {
                        console.error(`No hay config de sync para entidad: ${item.entity}`)
                        await incrementRetries(item.id)
                        continue
                    }

                    const response = await fetch(config.endpoint, {
                        method: config.method || "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            action: item.action, // create, update, clock_in...
                            data: item.data,
                            offline_timestamp: item.timestamp,
                            offline_id: item.id
                        })
                    })

                    if (response.ok) {
                        await markAsSynced(item.id)
                        console.log(`✅ Item ${item.entity} sincronizado correctamente`)
                    } else {
                        const errorData = await response.json().catch(() => ({}))
                        console.error(`❌ Error al sincronizar ${item.entity}:`, errorData)
                        await incrementRetries(item.id)
                    }
                } catch (error) {
                    console.error(`❌ Error de red al sincronizar ${item.entity}:`, error)
                    await incrementRetries(item.id)
                }
            }

            // Cleanup & Update State
            await updateQueueState()
            await clearSyncedItems()

        } catch (error) {
            console.error("❌ Error general en sincronización:", error)
        } finally {
            setSyncState(prev => ({ ...prev, isSyncing: false }))
        }
    }

    // ============================================================================
    // OPERACIONES DE BASE DE DATOS
    // ============================================================================

    const markAsSynced = async (id: string): Promise<void> => {
        if (!dbRef.current) return
        return new Promise((resolve, reject) => {
            const tx = dbRef.current!.transaction([STORE_NAME], "readwrite")
            const store = tx.objectStore(STORE_NAME)
            const req = store.get(id)
            req.onsuccess = () => {
                const item = req.result
                if (item) {
                    item.synced = true
                    store.put(item)
                }
                resolve()
            }
            req.onerror = () => reject(req.error)
        })
    }

    const incrementRetries = async (id: string): Promise<void> => {
        if (!dbRef.current) return
        return new Promise((resolve, reject) => {
            const tx = dbRef.current!.transaction([STORE_NAME], "readwrite")
            const store = tx.objectStore(STORE_NAME)
            const req = store.get(id)
            req.onsuccess = () => {
                const item = req.result
                if (item) {
                    item.retries += 1
                    item.lastAttempt = new Date().toISOString()
                    store.put(item)
                }
                resolve()
            }
            req.onerror = () => reject(req.error)
        })
    }

    const markAsFailed = async (id: string): Promise<void> => {
        if (!dbRef.current) return
        return new Promise((resolve, reject) => {
            const tx = dbRef.current!.transaction([STORE_NAME], "readwrite")
            const store = tx.objectStore(STORE_NAME)
            const req = store.delete(id) // Eliminamos de cola por ahora
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    const clearQueue = async (): Promise<void> => {
        if (!dbRef.current) return
        return new Promise((resolve, reject) => {
            const tx = dbRef.current!.transaction([STORE_NAME], "readwrite")
            const store = tx.objectStore(STORE_NAME)
            const req = store.clear()
            req.onsuccess = () => {
                updateQueueState()
                resolve()
            }
            req.onerror = () => reject(req.error)
        })
    }

    const clearSyncedItems = async (): Promise<void> => {
        if (!dbRef.current) return
        return new Promise((resolve, reject) => {
            const tx = dbRef.current!.transaction([STORE_NAME], "readwrite")
            const store = tx.objectStore(STORE_NAME)
            const index = store.index("synced")
            const req = index.openCursor(IDBKeyRange.only(true))
            req.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest).result
                if (cursor) {
                    store.delete(cursor.primaryKey)
                    cursor.continue()
                } else {
                    resolve()
                }
            }
            req.onerror = () => reject(req.error)
        })
    }

    return {
        isOnline,
        syncState,
        addToQueue,
        syncNow,
        clearQueue,
        getQueueItems
    }
}
