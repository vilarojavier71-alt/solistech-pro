'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface TimeTrackingFiltersProps {
    users: Array<{ id: string; full_name: string }>
}

export function TimeTrackingFilters({ users }: TimeTrackingFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const params = new URLSearchParams()
        const userId = formData.get('userId') as string
        const dateFrom = formData.get('dateFrom') as string
        const dateTo = formData.get('dateTo') as string

        if (userId) params.set('userId', userId)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)

        router.push(`/dashboard/time-tracking/admin?${params.toString()}`)
    }

    const handleClear = () => {
        router.push('/dashboard/time-tracking/admin')
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleFilter} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="userId">Empleado</Label>
                            <Select name="userId" defaultValue={searchParams.get('userId') || 'all'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {users.filter(u => u.id && u.id !== "").map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="dateFrom">Desde</Label>
                            <Input
                                id="dateFrom"
                                name="dateFrom"
                                type="date"
                                defaultValue={searchParams.get('dateFrom') || ''}
                            />
                        </div>

                        <div>
                            <Label htmlFor="dateTo">Hasta</Label>
                            <Input
                                id="dateTo"
                                name="dateTo"
                                type="date"
                                defaultValue={searchParams.get('dateTo') || ''}
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Button type="submit" className="flex-1">
                                <Filter className="h-4 w-4 mr-2" />
                                Filtrar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleClear}>
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
