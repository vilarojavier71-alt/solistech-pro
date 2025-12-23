import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limiter';
import { fetchWithRotatedUserAgent } from '@/lib/security/user-agent-rotation';

const PVGIS_API_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2';

/**
 * Whitelist de dominios permitidos para prevenir SSRF
 */
const ALLOWED_DOMAINS = ['re.jrc.ec.europa.eu'];

/**
 * IPs privadas y rangos bloqueados (prevención SSRF)
 */
const PRIVATE_IP_RANGES = [
    /^127\./,           // 127.0.0.0/8
    /^10\./,            // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
    /^192\.168\./,      // 192.168.0.0/16
    /^169\.254\./,      // 169.254.0.0/16 (link-local)
    /^::1$/,            // IPv6 localhost
    /^fc00:/,           // IPv6 private
    /^fe80:/            // IPv6 link-local
];

/**
 * Valida que una URL no apunte a IPs privadas o metadatos cloud
 */
function validateUrl(url: string): { valid: boolean; error?: string } {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;

        // Verificar dominio permitido
        if (!ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
            return { valid: false, error: 'Domain not in whitelist' };
        }

        // Resolver IP y verificar rangos privados (en producción, usar DNS lookup)
        // Por ahora, validamos que el hostname sea del dominio permitido
        if (PRIVATE_IP_RANGES.some(range => range.test(hostname))) {
            return { valid: false, error: 'Private IP range blocked' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Invalid URL format' };
    }
}

// Rate limiting centralizado (Anti-Ban 2.0)

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limiting centralizado (Anti-Ban 2.0)
    const rateLimitResult = checkRateLimit(request, {
        ...RATE_LIMIT_PRESETS.public,
        keyGenerator: (req) => {
            const ip = req.ip || 
                req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                req.headers.get('x-real-ip') ||
                'unknown';
            return `pvgis:${ip}`;
        }
    });

    if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', {
            source: 'pvgis-proxy',
            action: 'rate_limit',
            ip: clientIp,
            remaining: rateLimitResult.remaining,
            retryAfter: rateLimitResult.retryAfter
        });
        
        const response = NextResponse.json(
            { 
                error: 'Too many requests. Please try again later.',
                retryAfter: rateLimitResult.retryAfter
            },
            { status: 429 }
        );
        
        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', '0');
        if (rateLimitResult.retryAfter) {
            response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
        }
        
        return response;
    }

    const endpoint = params.path.join('/');
    const { searchParams } = new URL(request.url);
    const targetUrl = `${PVGIS_API_BASE}/${endpoint}?${searchParams.toString()}`;

    // Validación SSRF
    const validation = validateUrl(targetUrl);
    if (!validation.valid) {
        logger.error('SSRF attempt blocked', {
            source: 'pvgis-proxy',
            action: 'ssrf_blocked',
            url: targetUrl,
            ip: clientIp,
            error: validation.error
        });
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        );
    }

    try {
        // Fetch con User-Agent rotado (Anti-Ban 2.0)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        const res = await fetchWithRotatedUserAgent(
            targetUrl,
            {
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            },
            're.jrc.ec.europa.eu'
        );
        
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            logger.error('PVGIS API error', {
                source: 'pvgis-proxy',
                action: 'api_error',
                status: res.status,
                error: errorText.substring(0, 200) // Limitar tamaño del log
            });
            return NextResponse.json(
                { error: 'PVGIS service error' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('PVGIS proxy exception', {
            source: 'pvgis-proxy',
            action: 'proxy_exception',
            error: errorMessage,
            ip: clientIp
        });
        return NextResponse.json(
            { error: 'Failed to fetch PVGIS data' },
            { status: 500 }
        );
    }
}
