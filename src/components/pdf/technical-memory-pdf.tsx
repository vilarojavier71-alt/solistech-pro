/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Define interfaces for Technical Memory Data
export interface TechnicalData {
    // Project Info
    project_name: string
    created_at: string
    location_name: string
    location_coords?: { lat: number; lng: number }

    // Client Info
    customer_name: string
    customer_address?: string
    customer_dni?: string

    // System Specs
    system_size_kwp: number
    panels_count: number
    inverter_model?: string
    panel_model?: string

    // Production
    annual_production: number
    performance_ratio?: number
    monthly_production?: number[]

    // Org Info
    org_name: string
    org_logo?: string
}

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333'
    },
    coverPage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    coverTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1e293b',
        textAlign: 'center'
    },
    coverSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 40,
        textAlign: 'center'
    },
    logo: {
        width: 150,
        height: 80,
        objectFit: 'contain',
        marginBottom: 40
    },
    coverDetails: {
        marginTop: 60,
        borderTop: '1px solid #e2e8f0',
        paddingTop: 20,
        width: '100%',
        alignItems: 'center'
    },

    // Content Pages
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottom: '1px solid #EEE',
        paddingBottom: 10
    },
    headerText: {
        fontSize: 8,
        color: '#94a3b8'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0ea5e9', // Sky-500
        marginTop: 20,
        marginBottom: 10,
        borderBottom: '2px solid #0ea5e9',
        paddingBottom: 4
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
        marginTop: 10,
        marginBottom: 6
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: '40%',
        color: '#64748b',
        fontWeight: 'bold'
    },
    value: {
        width: '60%',
        color: '#1e293b'
    },
    box: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 4,
        marginBottom: 10
    }
})

export const TechnicalMemoryPDF = ({ data }: { data: TechnicalData }) => (
    <Document>
        {/* PAGE 1: COVER */}
        <Page size="A4" style={styles.page}>
            <View style={styles.coverPage}>
                {/* Logo Placeholder - In real use, pass base64 or url */}
                <View style={{ marginBottom: 40 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0ea5e9' }}>{data.org_name}</Text>
                </View>

                <Text style={styles.coverTitle}>PROYECTO TÉCNICO DE AUTOCONSUMO</Text>
                <Text style={styles.coverSubtitle}>Instalación Fotovoltaica Conectada a Red</Text>

                <View style={styles.coverDetails}>
                    <Text style={{ fontSize: 12, marginBottom: 8 }}>PROPIEDAD: {data.customer_name}</Text>
                    <Text style={{ fontSize: 12, marginBottom: 8 }}>UBICACIÓN: {data.location_name}</Text>
                    <Text style={{ fontSize: 12, marginBottom: 8 }}>POTENCIA: {data.system_size_kwp} kWp</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 20 }}>FECHA: {new Date().toLocaleDateString()}</Text>
                </View>
            </View>
        </Page>

        {/* PAGE 2: TECHNICAL DESCRIPTION */}
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>{data.project_name}</Text>
                <Text style={styles.headerText}>Memoria Técnica</Text>
            </View>

            <Text style={styles.sectionTitle}>1. DATOS GENERALES</Text>

            <View style={styles.box}>
                <Text style={styles.subSectionTitle}>1.1 Promotor de la Instalación</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre / Razón Social:</Text>
                    <Text style={styles.value}>{data.customer_name}</Text>
                </View>
                {data.customer_dni && (
                    <View style={styles.row}>
                        <Text style={styles.label}>NIF / CIF:</Text>
                        <Text style={styles.value}>{data.customer_dni}</Text>
                    </View>
                )}
                {data.customer_address && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Dirección:</Text>
                        <Text style={styles.value}>{data.customer_address}</Text>
                    </View>
                )}
            </View>

            <View style={styles.box}>
                <Text style={styles.subSectionTitle}>1.2 Ubicación del Proyecto</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Emplazamiento:</Text>
                    <Text style={styles.value}>{data.location_name}</Text>
                </View>
                {data.location_coords && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Coordenadas:</Text>
                        <Text style={styles.value}>{data.location_coords.lat.toFixed(6)}, {data.location_coords.lng.toFixed(6)}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>2. DESCRIPCIÓN TÉCNICA</Text>
            <Text style={{ fontSize: 10, marginBottom: 10, lineHeight: 1.5 }}>
                El objeto del presente proyecto es la definición técnica de una instalación solar fotovoltaica
                para autoconsumo, interconectada con la red eléctrica de distribución.
            </Text>

            <View style={styles.box}>
                <Text style={styles.subSectionTitle}>2.1 Generador Fotovoltaico</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Potencia Pico Total:</Text>
                    <Text style={styles.value}>{data.system_size_kwp} kWp</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Número de Módulos:</Text>
                    <Text style={styles.value}>{data.panels_count} unidades</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Modelo Estimado:</Text>
                    <Text style={styles.value}>{data.panel_model || 'Estándar 450W-550W'}</Text>
                </View>
            </View>

            <View style={styles.box}>
                <Text style={styles.subSectionTitle}>2.2 Inversor</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Tipo:</Text>
                    <Text style={styles.value}>Conexión a Red</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Modelo:</Text>
                    <Text style={styles.value}>{data.inverter_model || 'Según disponibilidad (Huawei/Fronius/SMA)'}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>3. PRODUCCIÓN ESTIMADA</Text>
            <View style={styles.box}>
                <View style={styles.row}>
                    <Text style={styles.label}>Producción Anual:</Text>
                    <Text style={styles.value}>{data.annual_production.toLocaleString()} kWh/año</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Performance Ratio (PR):</Text>
                    <Text style={styles.value}>{data.performance_ratio || 0.82} (82%)</Text>
                </View>
            </View>

            <Text style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic', marginTop: 20 }}>
                Nota: Los datos de producción son estimaciones basadas en datos históricos de irradiación y geometría de la instalación diseñada.
            </Text>

        </Page>
    </Document>
)
