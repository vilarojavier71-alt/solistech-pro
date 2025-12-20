"use client"
import React, { useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
    onPlaceSelected: (data: { lat: number; lng: number; address: string; }) => void;
    initialAddress?: string;
    disabled?: boolean;
}

export function AddressAutocomplete({ onPlaceSelected, initialAddress = "", disabled = false }: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Verificar si la librería de Google Maps ya está cargada
        if (typeof (window as any).google === 'undefined' || !(window as any).google.maps || !(window as any).google.maps.places) {
            console.warn("Google Maps Places Library no cargada. Revisa la etiqueta <script> en tu layout.");
            return;
        }

        const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current!, {
            componentRestrictions: { 'country': 'es' }, // Enfocado en España
            fields: ["geometry", "formatted_address"]
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.formatted_address) {
                const lat = place.geometry.location?.lat();
                const lng = place.geometry.location?.lng();

                if (lat !== undefined && lng !== undefined) {
                    onPlaceSelected({
                        lat: lat,
                        lng: lng,
                        address: place.formatted_address
                    });
                }
            }
        });
    }, [onPlaceSelected]);

    return (
        <div className="space-y-2">
            <Label htmlFor="address-input" className="text-zinc-400">Dirección Completa (Google Autocomplete)</Label>
            <Input
                ref={inputRef}
                id="address-input"
                defaultValue={initialAddress}
                disabled={disabled}
                placeholder="Ej: Calle Zaragoza 16, Biota, 50695"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-amber-500/50"
            />
        </div>
    );
}
