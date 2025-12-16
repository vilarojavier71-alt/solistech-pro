'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getOrganizationSettings, saveOrganizationApiKey } from '@/lib/actions/organization-settings'
import { toast } from 'sonner'

type AIProvider = 'replicate' | 'openai' | 'stability'

export function IntegrationsForm() {
    const [provider, setProvider] = useState<AIProvider>('replicate')
    const [apiKey, setApiKey] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [currentConfig, setCurrentConfig] = useState<{
        provider: string | null
        hasApiKey: boolean
        isValid: boolean
    } | null>(null)

    // Cargar configuración actual
    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true)
            const result = await getOrganizationSettings()

            if (result.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = result.data as any
                setCurrentConfig({
                    provider: data.ai_provider,
                    hasApiKey: data.has_api_key || false,
                    isValid: data.ai_api_key_valid || false
                })

                if (data.ai_provider) {
                    setProvider(data.ai_provider as AIProvider)
                }
            }

            setIsLoading(false)
        }

        loadSettings()
    }, [])

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error('Por favor, introduce una API key')
            return
        }

        setIsSaving(true)

        try {
            const result = await saveOrganizationApiKey(provider, apiKey)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('API key guardada y validada correctamente')
                setApiKey('') // Limpiar el campo por seguridad

                // Recargar configuración
                const updated = await getOrganizationSettings()
                if (updated.data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = updated.data as any
                    setCurrentConfig({
                        provider: data.ai_provider,
                        hasApiKey: data.has_api_key || false,
                        isValid: data.ai_api_key_valid || false
                    })
                }
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar la configuración')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración de IA</CardTitle>
                <CardDescription>
                    Configura tu API key para generar imágenes simuladas de instalaciones solares
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Estado actual */}
                {currentConfig?.hasApiKey && (
                    <Alert className={currentConfig.isValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                        {currentConfig.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <AlertDescription className={currentConfig.isValid ? 'text-green-800' : 'text-yellow-800'}>
                            {currentConfig.isValid ? (
                                <>API key configurada para <strong>{currentConfig.provider}</strong> y validada correctamente</>
                            ) : (
                                <>API key configurada pero no válida. Por favor, actualízala.</>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Selector de proveedor */}
                <div className="space-y-2">
                    <Label htmlFor="provider">Proveedor de IA</Label>
                    <Select value={provider} onValueChange={(value) => setProvider(value as AIProvider)}>
                        <SelectTrigger id="provider">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="replicate">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Replicate</span>
                                    <span className="text-xs text-muted-foreground">Recomendado - Stable Diffusion XL</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="openai">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">OpenAI</span>
                                    <span className="text-xs text-muted-foreground">DALL-E 3</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="stability">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Stability AI</span>
                                    <span className="text-xs text-muted-foreground">Stable Diffusion</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        {provider === 'replicate' && 'Obtén tu API key en: replicate.com/account/api-tokens'}
                        {provider === 'openai' && 'Obtén tu API key en: platform.openai.com/api-keys'}
                        {provider === 'stability' && 'Obtén tu API key en: platform.stability.ai/account/keys'}
                    </p>
                </div>

                {/* Campo de API Key */}
                <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Pega tu API key aquí"
                        className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                        Tu API key se almacena encriptada y nunca se expone al cliente
                    </p>
                </div>

                {/* Botón de guardar */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !apiKey.trim()}
                    className="w-full"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validando...
                        </>
                    ) : (
                        'Guardar y Validar'
                    )}
                </Button>

                {/* Información adicional */}
                <div className="rounded-lg bg-muted p-4 text-sm">
                    <p className="font-medium mb-2">¿Para qué se usa la IA?</p>
                    <ul className="space-y-1 text-muted-foreground">
                        <li>• Generar imágenes simuladas de placas solares en tejados</li>
                        <li>• Crear presentaciones más impactantes para clientes</li>
                        <li>• Visualizar el resultado final antes de la instalación</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
