export function getFriendlyCatastroError(errorMsg: string): { title: string; hint: string } {
    if (!errorMsg) return { title: "Error Desconocido", hint: "Intente nuevamente." }

    const lower = errorMsg.toLowerCase()

    if (lower.includes("fuera de parcela") || lower.includes("outside")) {
        return {
            title: "Ubicación Imprecisa",
            hint: "El punto seleccionado cae en la calle o un borde. Use el 'Ajuste Fino' para centrar el pin en el tejado."
        }
    }
    if (lower.includes("coordinates")) {
        return {
            title: "Coordenadas Inválidas",
            hint: "Verifique que la latitud y longitud sean numéricas y estén en el rango correcto."
        }
    }
    if (lower.includes("timeout") || lower.includes("conexión")) {
        return {
            title: "Catastro no responde",
            hint: "La sede electrónica del Catastro puede estar saturada. Espere unos segundos."
        }
    }
    if (lower.includes("not found") || lower.includes("no encontrada")) {
        return {
            title: "Parcela no encontrada",
            hint: "No existe referencia catastral asociada a estas coordenadas exactas."
        }
    }

    return {
        title: "Error de Consulta",
        hint: errorMsg
    }
}
