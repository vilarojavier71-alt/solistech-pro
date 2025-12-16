'use client'

import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Moon, Sun, Laptop } from 'lucide-react'

export function AppearanceForm() {
    const { theme, setTheme } = useTheme()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>
                    Personaliza la apariencia del sistema. Cambia automáticamente entre el tema claro y oscuro.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tema</Label>
                        <RadioGroup
                            defaultValue={theme}
                            onValueChange={(value) => setTheme(value)}
                            className="grid max-w-md grid-cols-3 gap-8 pt-2"
                        >
                            <div className="text-center">
                                <Label
                                    htmlFor="light"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <RadioGroupItem value="light" id="light" className="sr-only" />
                                    <Sun className="mb-3 h-6 w-6" />
                                    <span className="text-xs font-medium">Claro</span>
                                </Label>
                            </div>
                            <div className="text-center">
                                <Label
                                    htmlFor="dark"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <RadioGroupItem value="dark" id="dark" className="sr-only" />
                                    <Moon className="mb-3 h-6 w-6" />
                                    <span className="text-xs font-medium">Oscuro</span>
                                </Label>
                            </div>
                            <div className="text-center">
                                <Label
                                    htmlFor="system"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <RadioGroupItem value="system" id="system" className="sr-only" />
                                    <Laptop className="mb-3 h-6 w-6" />
                                    <span className="text-xs font-medium">Sistema</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
