'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ContractPDF } from './contract-pdf'

interface ContractDownloaderProps {
    data: any
    tariff: any
    cups: string
}

export default function ContractDownloader({ data, tariff, cups }: ContractDownloaderProps) {
    return (
        <PDFDownloadLink
            document={
                <ContractPDF
                    data={data}
                    tariff={tariff}
                />
            }
            fileName={`Contrato_${cups || 'Suministro'}.pdf`}
            className="w-full"
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => (
                <Button
                    size="lg"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                    disabled={loading}
                >
                    {loading ? 'Generando Contrato...' : (
                        <>
                            Cambiar Compañía Ahora
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
