/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Tipos requeridos
export interface QuoteItem {
    description: string
    quantity: number
    unit_price: number
    total: number
}

export interface QuoteData {
    quote_number: string
    created_at: string
    valid_until: string

    // Org Info
    org_name: string
    org_email?: string
    org_phone?: string

    // Client Info
    customer_name: string
    customer_dni?: string
    customer_address?: string

    // Items
    line_items: QuoteItem[]

    // Totals
    subtotal: number
    tax_rate: number // 21
    tax_amount: number
    total: number

    // Config
    notes?: string
    terms?: string

    // Subvenciones (FASE 9) - Opcional
    subsidies?: {
        region: string
        direct_grant: number
        irpf_deduction: number
        total_subsidies: number
        net_cost: number
    }
}

// Estilos PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        borderBottom: '1px solid #EEE',
        paddingBottom: 20
    },
    logoSection: {
        width: '40%'
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0ea5e9', // Sky-500
        marginBottom: 4
    },
    orgDetails: {
        fontSize: 9,
        color: '#666',
        lineHeight: 1.4
    },
    invoiceDetails: {
        width: '40%',
        textAlign: 'right'
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b', // Slate-800
        marginBottom: 8
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4
    },
    label: {
        color: '#64748b', // Slate-500
        marginRight: 8
    },
    value: {
        fontWeight: 'bold'
    },

    // Cliente Section
    clientSection: {
        marginTop: 0,
        marginBottom: 30,
        backgroundColor: '#f8fafc', // Slate-50
        padding: 15,
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 8,
        textTransform: 'uppercase'
    },

    // Table
    table: {
        width: '100%',
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9', // Slate-100
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottom: '1px solid #e2e8f0'
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottom: '1px solid #f1f5f9'
    },
    colDesc: { width: '50%' },
    colQty: { width: '15%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },

    headerText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569'
    },

    // Totals
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10
    },
    totalsBox: {
        width: '40%'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottom: '1px solid #f1f5f9'
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderTop: '2px solid #0ea5e9',
        marginTop: 5
    },
    totalLabel: {
        color: '#64748b'
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 11
    },
    grandTotalValue: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#0ea5e9'
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        borderTop: '1px solid #e2e8f0',
        paddingTop: 20,
    },
    notes: {
        fontSize: 9,
        color: '#64748b',
        fontStyle: 'italic',
        lineHeight: 1.5
    },
    thankYou: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0ea5e9'
    },

    // Estilos para Sección de Subvenciones (FASE 9)
    subsidiesSection: {
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#f0fdf4', // green-50
        border: '2px solid #22c55e', // green-500
        borderRadius: 4,
        padding: 15
    },
    subsidiesTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#15803d', // green-700
        marginBottom: 10,
        textAlign: 'center'
    },
    subsidiesDisclaimer: {
        fontSize: 8,
        color: '#64748b',
        fontStyle: 'italic',
        marginBottom: 10,
        textAlign: 'center'
    },
    subsidiesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottom: '1px solid #dcfce7'
    },
    subsidiesRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTop: '2px solid #22c55e',
        marginTop: 5
    },
    subsidiesLabel: {
        fontSize: 10,
        color: '#475569'
    },
    subsidiesValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#15803d'
    },
    netCostValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#15803d'
    }
})

const formatCurrency = (num: number) => {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export const QuotePDF = ({ data }: { data: QuoteData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoSection}>
                    <Text style={styles.logoText}>{data.org_name}</Text>
                    <Text style={styles.orgDetails}>{data.org_email || 'contacto@empresa.com'}</Text>
                    <Text style={styles.orgDetails}>{data.org_phone || ''}</Text>
                </View>
                <View style={styles.invoiceDetails}>
                    <Text style={styles.mainTitle}>PRESUPUESTO</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Nº:</Text>
                        <Text style={styles.value}>{data.quote_number}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Fecha:</Text>
                        <Text style={styles.value}>{data.created_at}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Válido hasta:</Text>
                        <Text style={styles.value}>{data.valid_until}</Text>
                    </View>
                </View>
            </View>

            {/* Client Info */}
            <View style={styles.clientSection}>
                <Text style={styles.sectionTitle}>Facturar a:</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{data.customer_name}</Text>
                {data.customer_dni && <Text style={{ marginBottom: 2 }}>DNI/CIF: {data.customer_dni}</Text>}
                {data.customer_address && <Text>{data.customer_address}</Text>}
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.colDesc, styles.headerText]}>DESCRIPCIÓN</Text>
                    <Text style={[styles.colQty, styles.headerText]}>CANT.</Text>
                    <Text style={[styles.colPrice, styles.headerText]}>PRECIO U.</Text>
                    <Text style={[styles.colTotal, styles.headerText]}>TOTAL</Text>
                </View>
                {data.line_items.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{item.description}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
                        <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>IVA ({data.tax_rate}%)</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.tax_amount)}</Text>
                    </View>
                    <View style={styles.finalTotalRow}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(data.total)}</Text>
                    </View>
                </View>
            </View>

            {/* Sección de Subvenciones (FASE 9) - Solo si hay datos */}
            {data.subsidies && (
                <View style={styles.subsidiesSection}>
                    <Text style={styles.subsidiesTitle}>
                        ?? AYUDAS Y SUBVENCIONES APLICABLES ({data.subsidies.region})
                    </Text>
                    <Text style={styles.subsidiesDisclaimer}>
                        * Estimación orientativa. Sujeto a disponibilidad presupuestaria y cumplimiento de requisitos.
                    </Text>

                    <View style={styles.subsidiesRow}>
                        <Text style={styles.subsidiesLabel}>Inversión Total (con IVA):</Text>
                        <Text style={styles.subsidiesValue}>{formatCurrency(data.total)}</Text>
                    </View>

                    {data.subsidies.direct_grant > 0 && (
                        <View style={styles.subsidiesRow}>
                            <Text style={styles.subsidiesLabel}>Subvención Directa (Next Generation EU):</Text>
                            <Text style={styles.subsidiesValue}>-{formatCurrency(data.subsidies.direct_grant)}</Text>
                        </View>
                    )}

                    {data.subsidies.irpf_deduction > 0 && (
                        <View style={styles.subsidiesRow}>
                            <Text style={styles.subsidiesLabel}>Deducción IRPF (tramo autonómico):</Text>
                            <Text style={styles.subsidiesValue}>-{formatCurrency(data.subsidies.irpf_deduction)}</Text>
                        </View>
                    )}

                    <View style={styles.subsidiesRowFinal}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>COSTE NETO ESTIMADO:</Text>
                        <Text style={styles.netCostValue}>{formatCurrency(data.subsidies.net_cost)}</Text>
                    </View>

                    <Text style={{ fontSize: 8, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                        El ahorro real puede reducir su inversión entre un 40% y 70% según su comunidad autónoma.
                    </Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                {data.notes && (
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>Notas:</Text>
                        <Text style={styles.notes}>{data.notes}</Text>
                    </View>
                )}

                {data.terms && (
                    <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>Términos y Condiciones:</Text>
                        <Text style={styles.notes}>{data.terms}</Text>
                    </View>
                )}

                <Text style={styles.thankYou}>Gracias por su confianza</Text>
            </View>
        </Page>
    </Document>
)
