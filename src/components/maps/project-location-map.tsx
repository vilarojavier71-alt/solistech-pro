'use client'

import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface ProjectLocationMapProps {
    address: string
    coordinates?: { lat: number; lng: number }
}

export default function ProjectLocationMap({ address, coordinates }: ProjectLocationMapProps) {
    // Simulation of a heavy component (e.g. Leaflet or Google Maps libraries)
    // In a real scenario, this would import 'leaflet' or '@react-google-maps/api'

    return (
        <Card className="overflow-hidden border-none shadow-none h-full w-full bg-slate-100 dark:bg-slate-800 relative group">
            <CardContent className="p-0 h-[300px] flex items-center justify-center relative">
                {/* Mock Map Visuals */}
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Madrid&zoom=14&size=600x300&sensor=false')] bg-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700"
                    style={{ backgroundImage: `linear-gradient(to bottom right, #e2e8f0 2px, transparent 2px), linear-gradient(to bottom left, #e2e8f0 2px, transparent 2px)` }}
                >
                    {/* Pattern to simulate map grid if image fails */}
                    <div className="w-full h-full opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>

                <div className="z-10 bg-background/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border flex flex-col items-center gap-2 animate-in text-center max-w-[80%]">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <MapPin className="h-6 w-6 text-primary animate-bounce" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Ubicación del Proyecto</p>
                        <p className="text-xs text-muted-foreground">{address}</p>
                        {coordinates && (
                            <p className="text-[10px] font-mono mt-1 text-muted-foreground">
                                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Simulated markers */}
                <div className="absolute top-1/3 left-1/4 h-3 w-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </CardContent>
        </Card>
    )
}
