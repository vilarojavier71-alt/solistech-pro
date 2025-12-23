/**
 * Security Headers - ISO 27001 A.8.28 Compliance
 * 
 * Configuración de headers de seguridad para Next.js
 * Implementa HSTS, CSP, X-Frame-Options, etc.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Headers de seguridad para todas las respuestas
 */
export function getSecurityHeaders(): Record<string, string> {
    const isProduction = process.env.NODE_ENV === 'production'
    
    return {
        // HSTS - Force HTTPS (1 año en producción, 1 día en desarrollo)
        'Strict-Transport-Security': isProduction
            ? 'max-age=31536000; includeSubDomains; preload'
            : 'max-age=86400',
        
        // CSP - Content Security Policy
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com", // Stripe requiere unsafe-inline
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.stripe.com https://*.sentry.io https://re.jrc.ec.europa.eu",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "upgrade-insecure-requests"
        ].join('; '),
        
        // X-Frame-Options - Clickjacking protection
        'X-Frame-Options': 'SAMEORIGIN',
        
        // X-Content-Type-Options - MIME type sniffing protection
        'X-Content-Type-Options': 'nosniff',
        
        // X-XSS-Protection - Legacy XSS protection (para navegadores antiguos)
        'X-XSS-Protection': '1; mode=block',
        
        // Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        
        // Permissions Policy (antes Feature-Policy)
        'Permissions-Policy': [
            'camera=()',
            'microphone=()',
            'geolocation=(self)',
            'interest-cohort=()', // Desactivar FLoC
            'payment=(self)'
        ].join(', '),
        
        // Remove server information
        'X-Powered-By': '', // Next.js lo remueve automáticamente, pero por si acaso
    }
}

/**
 * Middleware para añadir headers de seguridad a todas las respuestas
 */
export function securityHeadersMiddleware(request: NextRequest) {
    const response = NextResponse.next()
    const headers = getSecurityHeaders()
    
    // Añadir todos los headers
    Object.entries(headers).forEach(([key, value]) => {
        if (value) {
            response.headers.set(key, value)
        } else {
            // Remover header si el valor está vacío
            response.headers.delete(key)
        }
    })
    
    return response
}

