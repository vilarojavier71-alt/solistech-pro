'use client'

import { useState, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { searchCustomers } from '@/lib/actions/projects'

interface Customer {
    id: string
    name: string
    email: string | null
}

interface ClientSelectorProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
    initialCustomers?: Customer[]
}

export function ClientSelector({
    value,
    onChange,
    disabled = false,
    placeholder = 'Buscar cliente...',
    initialCustomers = [],
}: ClientSelectorProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
    const [searchQuery, setSearchQuery] = useState('')

    const selectedCustomer = customers.find((c) => c.id === value)

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query)
        if (query.length < 1) {
            setCustomers(initialCustomers)
            return
        }

        setLoading(true)
        try {
            const result = await searchCustomers(query)
            if (result.success) {
                setCustomers(result.data)
            }
        } catch (error) {
            console.error('Error searching customers:', error)
        } finally {
            setLoading(false)
        }
    }, [initialCustomers])

    const handleSelect = (customerId: string) => {
        onChange(customerId === value ? '' : customerId)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedCustomer ? (
                        <span className="truncate">{selectedCustomer.name}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    </div>
                    <CommandList>
                        <CommandEmpty>
                            {loading ? 'Buscando...' : 'No se encontraron clientes.'}
                        </CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.id}
                                    onSelect={() => handleSelect(customer.id)}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === customer.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{customer.name}</span>
                                        {customer.email && (
                                            <span className="text-xs text-muted-foreground">
                                                {customer.email}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
