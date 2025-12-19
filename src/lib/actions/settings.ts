"use server";

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache';

interface SettingsResult {
    success: boolean;
    message: string;
}

/**
 * Guarda o actualiza la clave API de Google Maps.
 * Nota: app_settings no existe en el esquema actual de Docker.
 * Esta función está stub-eada hasta que se cree la tabla.
 */
export async function saveGoogleMapsApiKey(apiKey: string): Promise<SettingsResult> {
    const cleanKey = apiKey.trim();
    if (cleanKey.length < 10) {
        return { success: false, message: "La clave API parece inválida (muy corta)." };
    }

    // TODO: Crear tabla app_settings en Docker schema
    console.log("saveGoogleMapsApiKey called - tabla no existe aún en Docker schema")

    revalidatePath('/', 'layout');
    return { success: true, message: "Clave de Google Maps guardada temporalmente." };
}

/**
 * Obtiene el valor de una configuración específica.
 */
export async function getSetting(settingName: string): Promise<string | null> {
    // TODO: Implementar cuando exista app_settings
    console.log("getSetting called for:", settingName)
    return null;
}

export async function updateOrganization(data: any) {
    const user = await getCurrentUserWithRole()
    if (!user) throw new Error('No autenticado')

    await prisma.organizations.update({
        where: { id: data.organizationId },
        data: {
            name: data.name,
            tax_id: data.taxId,
            phone: data.phone,
            email: data.email,
            address: data.address,
            logo_url: data.logoUrl,
            updated_at: new Date()
        }
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function uploadLogo(formData: FormData, organizationId: string) {
    // TODO: Implementar con storage alternativo (MinIO, S3, etc.)
    console.log("Upload logo requested for org", organizationId)
    return "https://via.placeholder.com/150"
}

export async function updateProfile(data: any) {
    const user = await getCurrentUserWithRole()
    if (!user) throw new Error('No autenticado')

    await prisma.User.update({
        where: { id: user.id },
        data: {
            full_name: data.fullName,
            avatar_url: data.avatarUrl,
            updated_at: new Date()
        }
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function uploadAvatar(formData: FormData, userId: string) {
    // TODO: Implementar con storage alternativo
    console.log("Upload avatar requested for user", userId)
    return "https://via.placeholder.com/150"
}
