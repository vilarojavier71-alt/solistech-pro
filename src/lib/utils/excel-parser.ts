/**
 * Excel Parser - Wrapper para compatibilidad
 * @deprecated Use parseExcelFileSecure from excel-parser-secure.ts
 * Este archivo mantiene compatibilidad pero redirige al parser seguro
 */

import { parseExcelFileSecure, type ParseResult, type ParsedRow } from './excel-parser-secure'

// Re-export types
export type { ParsedRow, ParseResult }

/**
 * Parsea archivo Excel usando el parser seguro
 * ISO 27001: Input validation + Prototype Pollution protection
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
    return parseExcelFileSecure(file)
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
    // Basic phone validation (allows international format)
    const phoneRegex = /^[\d\s\+\-\(\)]+$/
    return phoneRegex.test(phone)
}
