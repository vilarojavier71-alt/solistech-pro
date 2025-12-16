'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ConsentSettings = {
    necessary: boolean
    analytics: boolean
    marketing: boolean
}

const DEFAULT_SETTINGS: ConsentSettings = {
    necessary: true,
    analytics: false,
    marketing: false
}

export function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [settings, setSettings] = useState<ConsentSettings>(DEFAULT_SETTINGS)

    useEffect(() => {
        // Check if consent is already stored
        const consent = localStorage.getItem('cookie-consent')
        if (!consent) {
            // Delay showing banner slightly for better UX
            const timer = setTimeout(() => setShowBanner(true), 1000)
            return () => clearTimeout(timer)
        } else {
            // Apply existing consent settings (e.g. initialize analytics if allowed)
            const savedSettings = JSON.parse(consent) as ConsentSettings
            applyConsent(savedSettings)
        }
    }, [])

    const applyConsent = (consentSettings: ConsentSettings) => {
        // Here you would initialize scripts based on settings
        // e.g. if (consentSettings.analytics) initGoogleAnalytics()
        console.log('Applying cookie settings:', consentSettings)
    }

    const handleAcceptAll = () => {
        const allAllowed = { necessary: true, analytics: true, marketing: true }
        saveConsent(allAllowed)
    }

    const handleRejectAll = () => {
        const allRejected = { necessary: true, analytics: false, marketing: false }
        saveConsent(allRejected)
    }

    const handleSavePreferences = () => {
        saveConsent(settings)
    }

    const saveConsent = (consentSettings: ConsentSettings) => {
        localStorage.setItem('cookie-consent', JSON.stringify(consentSettings))
        applyConsent(consentSettings)
        setShowBanner(false)
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
            <Card className="max-w-4xl mx-auto shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                                <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Tu privacidad es importante</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Utilizamos cookies propias y de terceros para mejorar nuestros servicios,
                                        elaborar información estadística y mostrarle publicidad relacionada con sus preferencias
                                        mediante el análisis de sus hábitos de navegación.
                                        Puede aceptar todas las cookies pulsando el botón "Aceptar todas" o configurarlas
                                        o rechazar su uso pulsando "Configurar".
                                        Para más información, consulte nuestra <Link href="/legal/cookies" className="underline hover:text-primary">Política de Cookies</Link>.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 -mr-2 -mt-2"
                                onClick={handleRejectAll}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {showDetails && (
                            <div className="grid gap-4 py-4 border-t border-b animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Necesarias</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Esenciales para el funcionamiento del sitio (Login, Stripe, etc). No se pueden desactivar.
                                        </p>
                                    </div>
                                    <Switch checked={true} disabled />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="analytics" className="text-base">Analíticas</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Nos ayudan a entender cómo usas el sitio para mejorarlo.
                                        </p>
                                    </div>
                                    <Switch
                                        id="analytics"
                                        checked={settings.analytics}
                                        onCheckedChange={(checked) => setSettings(p => ({ ...p, analytics: checked }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="marketing" className="text-base">Marketing</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Permiten mostrar publicidad relevante y medir su efectividad.
                                        </p>
                                    </div>
                                    <Switch
                                        id="marketing"
                                        checked={settings.marketing}
                                        onCheckedChange={(checked) => setSettings(p => ({ ...p, marketing: checked }))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                            <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
                                {showDetails ? (
                                    <>Menos detalles <ChevronUp className="ml-2 h-4 w-4" /></>
                                ) : (
                                    <>Configurar <ChevronDown className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>

                            {showDetails ? (
                                <Button onClick={handleSavePreferences} variant="secondary">
                                    Guardar preferencias
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={handleRejectAll}>
                                    Rechazar no esenciales
                                </Button>
                            )}

                            <Button onClick={handleAcceptAll}>
                                Aceptar todas
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
