
'use client'

import React, { useState } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SerializedCrmAccount, updateAccountStatus } from '@/lib/actions/crm'
import { cn } from '@/lib/utils'
import { Plus, GripVertical, AlertCircle } from 'lucide-react'

// --- CONSTANTS ---
const COLUMNS = [
    { id: 'new', title: 'Nuevos', color: 'bg-blue-500' },
    { id: 'contacted', title: 'Contactados', color: 'bg-yellow-500' },
    { id: 'proposal', title: 'Propuesta', color: 'bg-indigo-500' },
    { id: 'won', title: 'Ganados', color: 'bg-emerald-500' },
    { id: 'lost', title: 'Perdidos', color: 'bg-rose-500' },
]

// --- COMPONENTS ---

function DraggableCard({ item }: { item: SerializedCrmAccount }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: item
    })

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "mb-3 cursor-grab hover:shadow-md transition-shadow dark:bg-zinc-800 border-l-4",
                isDragging ? "opacity-30" : "opacity-100",
                item.type === 'lead' ? 'border-l-blue-500' : 'border-l-indigo-500' // Visual indicator type
            )}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                    </div>
                    {item.type === 'lead' && <Badge variant="secondary" className="text-[10px] h-5">Lead</Badge>}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                        {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                    <GripVertical className="h-3 w-3" />
                </div>
            </CardContent>
        </Card>
    )
}

function KanbanColumn({ id, title, items, color }: { id: string, title: string, items: SerializedCrmAccount[], color: string }) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div className="flex flex-col min-h-[500px] w-80 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", color)} />
                    <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{title}</h3>
                    <Badge variant="outline" className="ml-2 font-mono text-xs">{items.length}</Badge>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 rounded-xl bg-zinc-100/50 dark:bg-black/20 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
            >
                {items.map(item => (
                    <DraggableCard key={item.id} item={item} />
                ))}
                {items.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground italic border-2 border-dashed border-transparent rounded-lg">
                        Arrastra aquí
                    </div>
                )}
            </div>
        </div>
    )
}

// --- MAIN BOARD ---

export function KanbanBoard({ initialData }: { initialData: any[] }) {
    // Map initial data to our serialized type if needed, but assuming action returns matching shape
    // Check shapes: action returns Prisma object. Serialized needs dates as strings if passed to Client Component?
    // Actually we pass SerializedCrmAccount but dates from server action to client component are serialized.
    // If not, we might need to convert.
    // Let's assume passed data is correct.

    // Optimistic UI state
    const [items, setItems] = useState<SerializedCrmAccount[]>(initialData)
    const [activeId, setActiveId] = useState<string | null>(null)

    // Group items by status
    const getItemsByStatus = (status: string) => items.filter(i => i.status === status)

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const newStatus = over.id as string

            // Only update if dropping into a different column (status)
            // But 'over.id' is the Droppable ID (the column status)
            // We verify if mapped status is different
            // Actually our Droppable IDs are exactly the status key.

            // Optimistic Update
            const oldItem = items.find(i => i.id === active.id)
            if (oldItem && oldItem.status !== newStatus) {
                setItems(prev => prev.map(i =>
                    i.id === active.id ? { ...i, status: newStatus, updated_at: new Date() } : i
                ))

                try {
                    await updateAccountStatus(active.id as string, newStatus)
                } catch (error) {
                    // Revert on error
                    setItems(prev => prev.map(i =>
                        i.id === active.id ? oldItem : i
                    ))
                    // Toast error could go here
                }
            }
        }

        setActiveId(null)
    }

    const activeItem = activeId ? items.find(i => i.id === activeId) : null

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        items={getItemsByStatus(col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem ? (
                    <Card className="w-80 shadow-2xl skew-y-2 cursor-grabbing border-l-4 border-l-blue-500 opacity-90">
                        <CardContent className="p-3">
                            <h4 className="font-semibold text-sm">{activeItem.name}</h4>
                            <p className="text-xs text-muted-foreground">{activeItem.email}</p>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
