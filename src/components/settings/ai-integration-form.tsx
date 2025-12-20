'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { getOrganizationSettings, saveOrganizationApiKey } from '@/lib/actions/organization-settings'

const AI_PROVIDERS = [
    {
        id: 'replicate',
        name: 'Replicate',
        description: 'Stable Diffusion XL - Recomendado',
        price: '~$0.0055 por imagen',
        docsUrl: 'https://replicate.com/account/api-tokens'
    },
    {
        id: 'stability',
        name: 'Stability AI',
        description: 'Stable Diffusion - Más económico',
        price: '~$0.002 por imagen',
        docsUrl: 'https://platform.stability.ai/account/keys'
    },
    {
        id: 'openai',
        name: 'OpenAI DALL-E',
        description: 'DALL-E 3 - Calidad premium',
        price: '~$0.04 por imagen',
        docsUrl: 'https://platform.openai.com/api-keys'
    }
]

export function AIIntegrationForm() {
    const [provider, setProvider] = useState<string>('replicate')
    const [apiKey, setApiKey] = useState('')
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [currentSettings, setCurrentSettings] = useState<any>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        const result = await getOrganizationSettings()
        if (result.data) {
            setCurrentSettings(result.data)
            if (result.data.ai_provider) {
                setProvider(result.data.ai_provider)
            }
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error('Por favor, ingresa tu API key')
            return
        }

        setValidating(true)
        const result = await saveOrganizationApiKey(provider, apiKey)
        setValidating(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('? API key configurada correctamente')
            setApiKey('') // Limpiar input por seguridad
            loadSettings() // Recargar configuración
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    const selectedProvider = AI_PROVIDERS.find(p => p.id === provider)

    return (
        <div className="space-y-6">
            {/* Estado actual */}
            {currentSettings?.has_api_key && currentSettings?.ai_api_key_valid && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        API configurada correctamente con <strong>{currentSettings.ai_provider}</strong>.
                        Las presentaciones con IA están habilitadas.
                    </AlertDescription>
                </Alert>
            )}

            {!currentSettings?.has_api_key && (
                <Alert>
                    <AlertDescription>
                        Configura tu API key para generar imágenes con IA en las presentaciones.
                        <strong> Tú pagas solo lo que usas</strong> (~$0.002-0.04 por imagen).
                    </AlertDescription>
                </Alert>
            )}

            {/* Selector de proveedor */}
            <div className="space-y-3">
                <Label>Proveedor de IA</Label>
                <RadioGroup value={provider} onValueChange={setProvider}>
                    {AI_PROVIDERS.map((p) => (
                        <div key={p.id} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent transition">
                            <RadioGroupItem value={p.id} id={p.id} className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor={p.id} className="cursor-pointer">
                                    <div className="font-semibold">{p.name}</div>
                                    <div className="text-sm text-muted-foreground">{p.description}</div>
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">{p.price}</div>
                                </Label>
                            </div>
                            <a
                                href={p.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                Obtener API key <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {/* Input de API key */}
            <div className="space-y-2">
                <Label htmlFor="apiKey">API Key de {selectedProvider?.name}</Label>
                <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={validating}
                />
                <p className="text-xs text-muted-foreground">
                    Tu API key se almacena encriptada. Nunca la compartimos.
                </p>
            </div>

            {/* Botón de guardar */}
            <Button
                onClick={handleSave}
                disabled={validating || !apiKey.trim()}
                className="w-full"
            >
                {validating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando API key...
                    </>
                ) : (
                    'Guardar y Validar'
                )}
            </Button>

            {/* Información adicional */}
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <h4 className="font-semibold">?? Información importante:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>La API key se valida automáticamente al guardar</li>
                    <li>Solo pagas por las imágenes que generes</li>
                    <li>Puedes cambiar de proveedor en cualquier momento</li>
                    <li>Las imágenes se generan bajo demanda al crear presentaciones</li>
                </ul>
            </div>
        </div>
    )
}
