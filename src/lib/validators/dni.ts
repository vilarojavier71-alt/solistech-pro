/**
 * Validador de Documentos de Identidad Españoles (DNI/NIE)
 * Implementa el algoritmo Módulo 23 para validación estricta
 * 
 * @module validators/dni
 * @author Solar Core Migration
 */

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export interface ValidationResult {
    valid: boolean;
    error?: string;
    normalized?: string;
}

/**
 * Valida un DNI español usando el algoritmo Módulo 23
 * @param dni - DNI a validar (formato: 8 números + 1 letra)
 * @returns Resultado de validación
 */
export function validateSpanishDNI(dni: string): ValidationResult {
    // 1. Normalizar entrada
    const normalized = dni.trim().toUpperCase().replace(/[\s-]/g, '');

    // 2. Validar formato (8 dígitos + 1 letra)
    const regex = /^(\d{8})([A-Z])$/;
    const match = normalized.match(regex);

    if (!match) {
        return {
            valid: false,
            error: 'Formato inválido: debe ser 8 números + 1 letra (ej: 12345678Z)'
        };
    }

    const [, numberPart, letterPart] = match;
    const number = parseInt(numberPart, 10);

    // 3. Calcular letra esperada (Módulo 23)
    const expectedLetter = DNI_LETTERS[number % 23];

    // 4. Comparar
    if (letterPart !== expectedLetter) {
        return {
            valid: false,
            error: `Letra de control incorrecta: esperada '${expectedLetter}', recibida '${letterPart}'`
        };
    }

    return { valid: true, normalized };
}

/**
 * Valida un NIE español (Número de Identidad de Extranjero)
 * @param nie - NIE a validar (formato: X/Y/Z + 7 números + 1 letra)
 * @returns Resultado de validación
 */
export function validateSpanishNIE(nie: string): ValidationResult {
    // 1. Normalizar entrada
    const normalized = nie.trim().toUpperCase().replace(/[\s-]/g, '');

    // 2. Validar formato (X/Y/Z + 7 dígitos + 1 letra)
    const regex = /^([XYZ])(\d{7})([A-Z])$/;
    const match = normalized.match(regex);

    if (!match) {
        return {
            valid: false,
            error: 'Formato NIE inválido: debe ser X/Y/Z + 7 números + 1 letra (ej: X1234567L)'
        };
    }

    const [, prefix, numberPart, letter] = match;

    // 3. Convertir prefijo a número: X=0, Y=1, Z=2
    const prefixMap: Record<string, string> = { 'X': '0', 'Y': '1', 'Z': '2' };
    const fullNumber = parseInt(prefixMap[prefix] + numberPart, 10);

    // 4. Calcular letra esperada (Módulo 23)
    const expectedLetter = DNI_LETTERS[fullNumber % 23];

    if (letter !== expectedLetter) {
        return {
            valid: false,
            error: `Letra de control NIE incorrecta: esperada '${expectedLetter}', recibida '${letter}'`
        };
    }

    return { valid: true, normalized };
}

/**
 * Valida cualquier documento de identidad español (DNI o NIE)
 * Detecta automáticamente el tipo y aplica validación correspondiente
 * @param id - Documento a validar
 * @returns Resultado de validación con tipo detectado
 */
export function validateSpanishID(id: string): ValidationResult & { type?: 'DNI' | 'NIE' } {
    const normalized = id.trim().toUpperCase().replace(/[\s-]/g, '');

    // Detectar tipo por primer carácter
    if (/^[XYZ]/.test(normalized)) {
        const result = validateSpanishNIE(normalized);
        return { ...result, type: 'NIE' };
    } else {
        const result = validateSpanishDNI(normalized);
        return { ...result, type: 'DNI' };
    }
}

/**
 * Valida email según RFC 5322 (simplificado)
 * @param email - Email a validar
 * @returns Resultado de validación
 */
export function validateEmail(email: string): ValidationResult {
    const normalized = email.trim().toLowerCase();

    // Regex simplificado pero robusto para emails
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!regex.test(normalized)) {
        return { valid: false, error: 'Formato de email inválido' };
    }

    // Verificar que tiene dominio
    if (!normalized.includes('.')) {
        return { valid: false, error: 'Email debe tener un dominio válido' };
    }

    return { valid: true, normalized };
}
