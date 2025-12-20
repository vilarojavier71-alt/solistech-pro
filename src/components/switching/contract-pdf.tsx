import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Estilos para el PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112240',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112240',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 0,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#112240',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 150,
        fontSize: 10,
        color: '#64748B',
    },
    value: {
        flex: 1,
        fontSize: 10,
        color: '#0F172A',
        fontWeight: 'bold',
    },
    legalText: {
        fontSize: 8,
        color: '#94A3B8',
        marginTop: 30,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    signatureBox: {
        marginTop: 50,
        borderTopWidth: 1,
        borderTopColor: '#000000',
        width: 200,
        alignSelf: 'flex-end',
        paddingTop: 5,
    },
    signatureText: {
        fontSize: 10,
        textAlign: 'center',
    }
})

interface ContractPDFProps {
    data: {
        holderName?: string
        holderDni?: string
        cups?: string
        address?: string
        p1?: number
        p2?: number
    }
    tariff: {
        company: string
        planName: string
        priceP1: number
        priceEnergy: number
    }
}

export const ContractPDF = ({ data, tariff }: ContractPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Cabecera */}
            <View style={styles.header}>
                <Text style={styles.title}>CONTRATO DE SUMINISTRO</Text>
                <Text style={styles.subtitle}>{tariff.company} - {tariff.planName}</Text>
            </View>

            {/* Datos del Titular */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Datos del Titular</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre / Razón Social:</Text>
                    <Text style={styles.value}>{data.holderName || '____________________________________'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>NIF / CIF:</Text>
                    <Text style={styles.value}>{data.holderDni || '__________________'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Dirección del Suministro:</Text>
                    <Text style={styles.value}>{data.address || '____________________________________'}</Text>
                </View>
            </View>

            {/* Datos del Suministro */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Datos del Suministro</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>CUPS:</Text>
                    <Text style={styles.value}>{data.cups || '__________________'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Potencia Contratada P1:</Text>
                    <Text style={styles.value}>{data.p1} kW</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Potencia Contratada P2:</Text>
                    <Text style={styles.value}>{data.p2 || data.p1} kW</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Uso:</Text>
                    <Text style={styles.value}>Residencial / Pyme</Text>
                </View>
            </View>

            {/* Condiciones Económicas */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Condiciones Económicas - {tariff.planName}</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Término de Energía:</Text>
                    <Text style={styles.value}>{tariff.priceEnergy} €/kWh</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Término de Potencia:</Text>
                    <Text style={styles.value}>{tariff.priceP1} €/kW/año</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Duración del Contrato:</Text>
                    <Text style={styles.value}>12 Meses</Text>
                </View>
            </View>

            {/* Legal */}
            <Text style={styles.legalText}>
                PROTECCIÓN DE DATOS: En cumplimiento del Reglamento (UE) 2016/679, se informa que los datos personales recogidos en este contrato serán tratados por {tariff.company} con la finalidad de gestionar la relación contractual. El titular consiente expresamente el tratamiento de sus datos para la gestión del suministro eléctrico y la facturación correspondiente.

                CONDICIONES GENERALES: El titular declara conocer y aceptar las condiciones generales de contratación de {tariff.company}, así como las tarifas vigentes aplicables al presente contrato. Este contrato anula y sustituye a cualquier otro anterior para el mismo punto de suministro.
            </Text>

            {/* Firma */}
            <View style={styles.signatureBox}>
                <Text style={styles.signatureText}>Firma del Titular</Text>
                <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 5, color: '#94A3B8' }}>{new Date().toLocaleDateString()}</Text>
            </View>
        </Page>
    </Document>
)
