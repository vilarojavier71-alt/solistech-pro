import { NextRequest, NextResponse } from 'next/server';

const PVGIS_API_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const endpoint = params.path.join('/');
    const { searchParams } = new URL(request.url);
    const targetUrl = `${PVGIS_API_BASE}/${endpoint}?${searchParams.toString()}`;

    console.log('[PVGIS Proxy] Forwarding to:', targetUrl);

    try {
        const res = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[PVGIS Proxy] Error:', res.status, errorText);
            return NextResponse.json(
                { error: `PVGIS Error: ${res.statusText}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[PVGIS Proxy] Exception:', error);
        return NextResponse.json(
            { error: 'Failed to fetch PVGIS data', details: error.message },
            { status: 500 }
        );
    }
}
