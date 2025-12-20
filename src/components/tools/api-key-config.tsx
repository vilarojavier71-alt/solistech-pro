"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saveGoogleMapsApiKey } from '@/lib/actions/settings';
import { Loader2, KeyRound, CheckCircle, XCircle } from 'lucide-react';

interface ApiKeyConfigProps {
    initialKeyStatus: 'unconfigured' | 'configured' | 'error';
}

export function ApiKeyConfig({ initialKeyStatus }: ApiKeyConfigProps) {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState(initialKeyStatus);
    const [isLoading, setIsLoading] = useState(false);
    // const { toast } = useToast(); -> Removed, using direct import

    const handleSave = async () => {
        if (!apiKey.trim()) return;

        setIsLoading(true);
        // setStatus('unconfigured'); // Optional: visual feedback

        const result = await saveGoogleMapsApiKey(apiKey);

        if (result.success) {
            setStatus('configured');
            toast.success("Éxito", {
                description: "Clave API de Google guardada. Recargando...",
            });
            // ?? Importante: Forzar un refresh de la página para cargar el script dinámicamente
            // Small delay to let toast show
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            setStatus('error');
            toast.error("Error de Guardado", {
                description: result.message,
            });
        }
        setIsLoading(false);
    };

    const statusIcon = status === 'configured' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
    const statusText = status === 'configured' ? 'Configurada' : 'Requerida';
    const variant = status === 'configured' ? 'default' : 'destructive';
    const borderColor = status === 'configured' ? 'border-green-500/20' : 'border-red-500/20';

    return (
        <div className={`bg-card p-4 rounded-lg border ${borderColor} shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all`}>
            <div className="flex items-center gap-3 flex-grow w-full md:w-auto">
                <div className="p-2 bg-indigo-500/10 rounded-full">
                    <KeyRound className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                        Google Maps API
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status === 'configured' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                            {statusText}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {status === 'configured'
                            ? 'El servicio de autocompletado está activo.'
                            : 'Necesaria para buscar direcciones exactas.'
                        }
                    </p>
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto min-w-[300px]">
                <Input
                    type="password"
                    placeholder={status === 'configured' ? "••••••••••••••••••••••••" : "Introduce tu API Key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isLoading}
                    className="flex-grow font-mono text-sm"
                />
                <Button onClick={handleSave} disabled={isLoading || !apiKey.trim()} variant={status === 'configured' ? 'outline' : 'default'}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (status === 'configured' ? 'Actualizar' : 'Guardar')}
                </Button>
            </div>
        </div>
    );
}
