'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { updateProfile, uploadAvatar } from '@/lib/actions/settings'

interface ProfileFormProps {
    user: { id: string; email?: string | null }
    profile: any
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fullName, setFullName] = useState(profile.full_name || '')
    const [email, setEmail] = useState(user.email || '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            toast.error('El archivo debe ser una imagen')
            return
        }

        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('La imagen no puede pesar más de 2MB')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const url = await uploadAvatar(formData, user.id)
            setAvatarUrl(url)
            toast.success('Avatar actualizado')
        } catch (error) {
            toast.error('Error al subir la imagen')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await updateProfile({
                userId: user.id,
                fullName,
                email,
                avatarUrl
            })
            toast.success('Perfil actualizado correctamente')
        } catch (error) {
            toast.error('Error al actualizar el perfil')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="text-2xl">
                        {fullName?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            <span>{uploading ? 'Subiendo...' : 'Cambiar Avatar'}</span>
                        </div>
                        <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                        />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG o GIF. Máximo 2MB.
                    </p>
                </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                />
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@solistech.es"
                />
                <p className="text-xs text-muted-foreground">
                    Cambiar tu email requiere verificación
                </p>
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
                <Label>Rol</Label>
                <Input value={profile.role || 'user'} disabled className="bg-muted" />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
            </Button>
        </form>
    )
}
