import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?${searchParams.toString()}`;

    try {
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error(`PVGIS Error: ${res.statusText}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch PVGIS data' }, { status: 500 });
    }
}
