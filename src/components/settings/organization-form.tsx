'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { updateOrganization, uploadLogo } from '@/lib/actions/settings'
import { CreateOrganizationForm } from '@/components/onboarding/create-organization-form'

interface OrganizationFormProps {
    organization: any
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [name, setName] = useState(organization?.name || '')
    const [taxId, setTaxId] = useState(organization?.tax_id || '')
    const [phone, setPhone] = useState(organization?.phone || '')
    const [email, setEmail] = useState(organization?.email || '')
    const [address, setAddress] = useState(
        typeof organization?.address === 'object' && organization.address !== null
            ? `${organization.address.street || ''}\n${organization.address.city || ''}\n${organization.address.postal_code || ''}`
            : organization?.address || ''
    )
    const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '')

    // Guard clause if no organization - show creation form instead
    if (!organization) {
        return <CreateOrganizationForm />
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('El archivo debe ser una imagen')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('La imagen no puede pesar más de 2MB')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const url = await uploadLogo(formData, organization.id)
            setLogoUrl(url)
            toast.success('Logo actualizado')
        } catch (error) {
            toast.error('Error al subir el logo')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await updateOrganization({
                organizationId: organization.id,
                name,
                taxId,
                phone,
                email,
                address,
                logoUrl
            })
            toast.success('Organización actualizada correctamente')
        } catch (error) {
            toast.error('Error al actualizar la organización')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 rounded-lg">
                    <AvatarImage src={logoUrl} alt={name} />
                    <AvatarFallback className="text-2xl rounded-lg">
                        {name?.charAt(0) || 'ORG'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <Label htmlFor="logo" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            <span>{uploading ? 'Subiendo...' : 'Cambiar Logo'}</span>
                        </div>
                        <input
                            id="logo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={uploading}
                        />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                        Logo de la empresa. Máximo 2MB.
                    </p>
                </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
                <Label htmlFor="orgName">Nombre de la Organización</Label>
                <Input
                    id="orgName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="SolisTech Solutions S.L."
                />
            </div>

            {/* Tax ID */}
            <div className="space-y-2">
                <Label htmlFor="taxId">CIF/NIF</Label>
                <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="B12345678"
                />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 912 345 678"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="orgEmail">Email de Contacto</Label>
                    <Input
                        id="orgEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@solistech.es"
                    />
                </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle Principal, 123&#10;28001 Madrid"
                    rows={3}
                />
            </div>

            {/* Secret Code Section */}
            <div className="pt-4 border-t">
                <Label htmlFor="promoCode" className="text-xs text-muted-foreground uppercase tracking-wider">Código de Activación</Label>
                <div className="flex gap-2 mt-1 max-w-sm">
                    <Input
                        id="promoCode"
                        placeholder="XXXX-XXXX"
                        className="uppercase"
                        onChange={(e) => {
                            if (e.target.value === 'GOZANDO') {
                                // Hidden trigger or just visual feedback?
                                // We'll use a separate button logic or just handle it here if requested
                            }
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const code = e.currentTarget.value
                                if (code === 'GOZANDO') {
                                    try {
                                        setLoading(true)
                                        // Dynamic import to avoid circular deps if any, or just direct call if safe
                                        const { activateGodMode } = await import('@/lib/actions/super-admin')
                                        const result = await activateGodMode(email, code) // Use current form email
                                        if (result.success) {
                                            toast.success(result.message)
                                            window.location.reload()
                                        } else {
                                            toast.error(result.error)
                                        }
                                    } catch (err) {
                                        toast.error('Error procesando código')
                                    } finally {
                                        setLoading(false)
                                    }
                                }
                            }
                        }}
                    />
                    <p className="text-[10px] text-muted-foreground self-center">Press Enter</p>
                </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
            </Button>
        </form>
    )
}
