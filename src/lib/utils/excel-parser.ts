import * as XLSX from 'xlsx'

export interface ParsedRow {
    [key: string]: string | number | null
}

export interface ParseResult {
    headers: string[]
    data: ParsedRow[]
    errors: string[]
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })

                // Get first sheet
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })

                if (jsonData.length === 0) {
                    resolve({
                        headers: [],
                        data: [],
                        errors: ['El archivo está vacío']
                    })
                    return
                }

                // Extract headers from first row
                const headers = Object.keys(jsonData[0] as object)

                resolve({
                    headers,
                    data: jsonData as ParsedRow[],
                    errors: []
                })
            } catch (error) {
                reject(error)
            }
        }

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'))
        }

        reader.readAsBinaryString(file)
    })
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
