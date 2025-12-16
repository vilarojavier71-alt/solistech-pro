'use client'

import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LeafletMapInnerProps {
    center: [number, number]
    zoom: number
    polygonPoints: [number, number][]
    isDrawing: boolean
    onPointAdded: (point: [number, number]) => void
    onCenterChange?: (center: [number, number]) => void
}

// Componente para detectar clicks
function MapClickHandler({
    isDrawing,
    onPointAdded
}: {
    isDrawing: boolean
    onPointAdded: (point: [number, number]) => void
}) {
    useMapEvents({
        click(e) {
            if (isDrawing) {
                onPointAdded([e.latlng.lat, e.latlng.lng])
            }
        }
    })
    return null
}

// Componente para cambiar el centro del mapa
function MapCenterUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap()

    useEffect(() => {
        map.setView(center, zoom)
    }, [center, zoom, map])

    return null
}

export default function LeafletMapInner({
    center,
    zoom,
    polygonPoints,
    isDrawing,
    onPointAdded,
    onCenterChange
}: LeafletMapInnerProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler
                isDrawing={isDrawing}
                onPointAdded={onPointAdded}
            />

            <MapCenterUpdater center={center} zoom={zoom} />

            {polygonPoints.length > 0 && (
                <Polygon
                    positions={polygonPoints}
                    pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.3,
                        weight: 2
                    }}
                />
            )}
        </MapContainer>
    )
}
