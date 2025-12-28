
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed (optional for now, using standard Helvetica)
// Font.register({ family: 'Inter', src: '...' });

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
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logo: {
        width: 120,
        height: 40, // Adjust aspect ratio
        backgroundColor: '#EEEEEE', // Placeholder
        justifyContent: 'center',
        alignItems: 'center'
    },
    companyInfo: {
        textAlign: 'right',
        fontSize: 9,
        color: '#666666'
    },
    titleSection: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111111',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 12,
        color: '#666666'
    },
    metaGrid: {
        flexDirection: 'row',
        marginBottom: 30
    },
    metaColumn: {
        width: '50%'
    },
    label: {
        fontSize: 8,
        color: '#999999',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    value: {
        fontSize: 10,
        marginBottom: 8
    },
    table: {
        width: '100%',
        borderColor: '#EEEEEE',
        borderWidth: 1,
        borderRadius: 4,
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        padding: 8,
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        padding: 8
    },
    colDesc: { width: '50%' },
    colQty: { width: '15%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },

    footer: {
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#999999'
    },
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20
    },
    totalsBox: {
        width: '40%'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        fontWeight: 'bold',
        fontSize: 12
    }
});

// Types based on Prisma models (simplified)
interface QuoteDocumentProps {
    quote: any; // Using any for simplicity in this artifact, strictly should be the Prisma Include type
    organization: any;
}

export const QuotePDF = ({ quote, organization }: QuoteDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.logo}>
                    {organization.logo_url ? (
                        <Image src={organization.logo_url} /> // Warning: CORS/Auth
                    ) : (
                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{organization.name}</Text>
                    )}
                </View>
                <View style={styles.companyInfo}>
                    <Text>{organization.name}</Text>
                    <Text>{organization.address?.street || 'Dirección de la empresa'}</Text>
                    <Text>{organization.phone}</Text>
                    <Text>{organization.email}</Text>
                </View>
            </View>

            {/* TITLE */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>PRESUPUESTO</Text>
                <Text style={styles.subtitle}>{quote.quote_number} - {quote.title}</Text>
            </View>

            {/* CLIENT & INFO */}
            <View style={styles.metaGrid}>
                <View style={styles.metaColumn}>
                    <Text style={styles.label}>CLIENTE</Text>
                    <Text style={styles.value}>{quote.crm_account?.name || 'Cliente sin asignar'}</Text>
                    <Text style={styles.value}>{quote.crm_account?.tax_id || ''}</Text>
                    <Text style={styles.value}>{quote.crm_account?.email || ''}</Text>
                </View>
                <View style={styles.metaColumn}>
                    <Text style={styles.label}>FECHA DE EMISIÓN</Text>
                    <Text style={styles.value}>{new Date(quote.issue_date).toLocaleDateString('es-ES')}</Text>

                    <Text style={styles.label}>VÁLIDO HASTA</Text>
                    <Text style={styles.value}>{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('es-ES') : '15 días'}</Text>

                    <Text style={styles.label}>ESTADO</Text>
                    <Text style={styles.value}>{quote.status.toUpperCase()}</Text>
                </View>
            </View>

            {/* TABLE */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>Concepto</Text>
                    <Text style={styles.colQty}>Cant.</Text>
                    <Text style={styles.colPrice}>Precio U.</Text>
                    <Text style={styles.colTotal}>Total</Text>
                </View>

                {quote.lines?.map((line: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{line.description}</Text>
                        <Text style={styles.colQty}>{line.quantity}</Text>
                        <Text style={styles.colPrice}>{Number(line.unit_price).toFixed(2)}€</Text>
                        <Text style={styles.colTotal}>{Number(line.total).toFixed(2)}€</Text>
                    </View>
                ))}
            </View>

            {/* TOTALS */}
            <View style={styles.totalsSection}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text>Subtotal</Text>
                        <Text>{Number(quote.subtotal).toFixed(2)}€</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>IVA</Text>
                        <Text>{Number(quote.tax_amount).toFixed(2)}€</Text>
                    </View>
                    <View style={styles.totalRowFinal}>
                        <Text>TOTAL</Text>
                        <Text>{Number(quote.total).toFixed(2)}€</Text>
                    </View>
                </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
                <Text>Generado por SolisTech Pro</Text>
                <Text>Página 1 de 1</Text>
            </View>

        </Page>
    </Document>
);
