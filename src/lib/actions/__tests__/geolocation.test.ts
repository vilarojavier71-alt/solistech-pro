import { describe, expect, test } from 'vitest'

// Mock Haversine implementation from time-tracking.ts
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

const MAX_DISTANCE_METERS = 500;

describe('Time Tracking Geolocation Logic', () => {
    // Madrid Puerta del Sol (Target)
    const target = { lat: 40.416775, lng: -3.703790 }

    test('Should verify check-in within 10m', () => {
        const userPos = { lat: 40.416775, lng: -3.703790 } // Exact match
        const dist = calculateDistance(userPos.lat, userPos.lng, target.lat, target.lng)
        expect(dist).toBeLessThan(MAX_DISTANCE_METERS)
    })

    test('Should verify check-in within 400m', () => {
        // Slightly offset
        const userPos = { lat: 40.420000, lng: -3.703790 } // ~350m away
        const dist = calculateDistance(userPos.lat, userPos.lng, target.lat, target.lng)
        expect(dist).toBeLessThan(MAX_DISTANCE_METERS)
    })

    test('Should reject check-in at 1km distance', () => {
        const userPos = { lat: 40.425775, lng: -3.703790 } // ~1km North
        const dist = calculateDistance(userPos.lat, userPos.lng, target.lat, target.lng)
        expect(dist).toBeGreaterThan(MAX_DISTANCE_METERS)
    })
})
