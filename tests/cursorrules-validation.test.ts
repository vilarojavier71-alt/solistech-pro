/**
 * 🌌 MPE-OS V3.0.0 - CURSORRULES VALIDATION SUITE
 * 
 * Suite de pruebas AAA (Arrange-Act-Assert) para verificar que los archivos
 * .cursorrules son interpretados correctamente por el agente.
 * 
 * Patrón AAA:
 * - Arrange: Preparar el contexto y datos de prueba
 * - Act: Ejecutar la acción a probar
 * - Assert: Verificar que el resultado es el esperado
 */

import { describe, it, expect } from '@jest/globals'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('MPE-OS V3.0.0 - Cursorrules Validation', () => {
  const projectRoot = process.cwd()

  describe('FASE 1: Verificación de Existencia de Archivos', () => {
    it('debe existir .cursorrules en la raíz del proyecto', () => {
      // Arrange
      const rootRulesPath = join(projectRoot, '.cursorrules')

      // Act
      const exists = existsSync(rootRulesPath)

      // Assert
      expect(exists).toBe(true)
    })

    it('debe existir src/.cursorrules para reglas de frontend', () => {
      // Arrange
      const frontendRulesPath = join(projectRoot, 'src', '.cursorrules')

      // Act
      const exists = existsSync(frontendRulesPath)

      // Assert
      expect(exists).toBe(true)
    })

    it('debe existir src/lib/actions/.cursorrules para reglas de backend', () => {
      // Arrange
      const backendRulesPath = join(projectRoot, 'src', 'lib', 'actions', '.cursorrules')

      // Act
      const exists = existsSync(backendRulesPath)

      // Assert
      expect(exists).toBe(true)
    })

    it('debe existir docker/.cursorrules para reglas de infraestructura', () => {
      // Arrange
      const infraRulesPath = join(projectRoot, 'docker', '.cursorrules')

      // Act
      const exists = existsSync(infraRulesPath)

      // Assert
      expect(exists).toBe(true)
    })
  })

  describe('FASE 2: Validación de Contenido - Reglas Críticas', () => {
    it('debe contener regla de 20 líneas en .cursorrules raíz', () => {
      // Arrange
      const rootRulesPath = join(projectRoot, '.cursorrules')
      const content = readFileSync(rootRulesPath, 'utf-8')

      // Act
      const has20LineRule = content.includes('20 líneas') || content.includes('20 lines')

      // Assert
      expect(has20LineRule).toBe(true)
    })

    it('debe contener Zero-Flag Policy en .cursorrules raíz', () => {
      // Arrange
      const rootRulesPath = join(projectRoot, '.cursorrules')
      const content = readFileSync(rootRulesPath, 'utf-8')

      // Act
      const hasZeroFlag = content.includes('Zero-Flag') || content.includes('User Flag Protection')

      // Assert
      expect(hasZeroFlag).toBe(true)
    })

    it('debe contener No-Raw-Fetch Policy en src/.cursorrules', () => {
      // Arrange
      const frontendRulesPath = join(projectRoot, 'src', '.cursorrules')
      const content = readFileSync(frontendRulesPath, 'utf-8')

      // Act
      const hasNoRawFetch = content.includes('NO-RAW-FETCH') || content.includes('No-Raw-Fetch')

      // Assert
      expect(hasNoRawFetch).toBe(true)
    })

    it('debe contener Atomic Design en src/.cursorrules', () => {
      // Arrange
      const frontendRulesPath = join(projectRoot, 'src', '.cursorrules')
      const content = readFileSync(frontendRulesPath, 'utf-8')

      // Act
      const hasAtomicDesign = content.includes('ATOMIC DESIGN') || content.includes('Atomic Design')

      // Assert
      expect(hasAtomicDesign).toBe(true)
    })

    it('debe contener SELECT FOR UPDATE en src/lib/actions/.cursorrules', () => {
      // Arrange
      const backendRulesPath = join(projectRoot, 'src', 'lib', 'actions', '.cursorrules')
      const content = readFileSync(backendRulesPath, 'utf-8')

      // Act
      const hasSelectForUpdate = content.includes('SELECT FOR UPDATE') || content.includes('FOR UPDATE')

      // Assert
      expect(hasSelectForUpdate).toBe(true)
    })

    it('debe contener FinOps Guardrails en src/lib/actions/.cursorrules', () => {
      // Arrange
      const backendRulesPath = join(projectRoot, 'src', 'lib', 'actions', '.cursorrules')
      const content = readFileSync(backendRulesPath, 'utf-8')

      // Act
      const hasFinOps = content.includes('FinOps') || content.includes('FINOPS')

      // Assert
      expect(hasFinOps).toBe(true)
    })

    it('debe contener Docker Excellence en docker/.cursorrules', () => {
      // Arrange
      const infraRulesPath = join(projectRoot, 'docker', '.cursorrules')
      const content = readFileSync(infraRulesPath, 'utf-8')

      // Act
      const hasDockerExcellence = content.includes('Docker Excellence') || content.includes('DOCKER EXCELLENCE')

      // Assert
      expect(hasDockerExcellence).toBe(true)
    })

    it('debe contener Anti-Ban 2.0 en docker/.cursorrules', () => {
      // Arrange
      const infraRulesPath = join(projectRoot, 'docker', '.cursorrules')
      const content = readFileSync(infraRulesPath, 'utf-8')

      // Act
      const hasAntiBan = content.includes('Anti-Ban') || content.includes('ANTI-BAN')

      // Assert
      expect(hasAntiBan).toBe(true)
    })
  })

  describe('FASE 3: Validación de Estructura - Formato y Organización', () => {
    it('debe tener formato markdown legible en todos los archivos', () => {
      // Arrange
      const rulesFiles = [
        join(projectRoot, '.cursorrules'),
        join(projectRoot, 'src', '.cursorrules'),
        join(projectRoot, 'src', 'lib', 'actions', '.cursorrules'),
        join(projectRoot, 'docker', '.cursorrules')
      ]

      // Act & Assert
      rulesFiles.forEach(filePath => {
        const content = readFileSync(filePath, 'utf-8')
        // Verificar que tiene estructura (títulos, secciones)
        expect(content.length).toBeGreaterThan(500) // Mínimo de contenido
        expect(content.includes('#') || content.includes('🌌')).toBe(true) // Tiene títulos o emojis de sección
      })
    })

    it('debe tener secciones claramente definidas', () => {
      // Arrange
      const rootRulesPath = join(projectRoot, '.cursorrules')
      const content = readFileSync(rootRulesPath, 'utf-8')

      // Act
      const hasSections = content.includes('---') || content.match(/^#{1,3}\s/gm)?.length > 0

      // Assert
      expect(hasSections).toBe(true)
    })
  })

  describe('FASE 4: Validación de Seguridad - Reglas Críticas de Seguridad', () => {
    it('debe mencionar ISO 27001 o seguridad en .cursorrules raíz', () => {
      // Arrange
      const rootRulesPath = join(projectRoot, '.cursorrules')
      const content = readFileSync(rootRulesPath, 'utf-8')

      // Act
      const hasSecurity = content.includes('ISO 27001') || 
                         content.includes('CYBERSECURITY') || 
                         content.includes('Seguridad')

      // Assert
      expect(hasSecurity).toBe(true)
    })

    it('debe mencionar SSRF prevention en src/lib/actions/.cursorrules', () => {
      // Arrange
      const backendRulesPath = join(projectRoot, 'src', 'lib', 'actions', '.cursorrules')
      const content = readFileSync(backendRulesPath, 'utf-8')

      // Act
      const hasSSRF = content.includes('SSRF') || content.includes('Server-Side Request Forgery')

      // Assert
      expect(hasSSRF).toBe(true)
    })

    it('debe mencionar IDOR prevention en src/lib/actions/.cursorrules', () => {
      // Arrange
      const backendRulesPath = join(projectRoot, 'src', 'lib', 'actions', '.cursorrules')
      const content = readFileSync(backendRulesPath, 'utf-8')

      // Act
      const hasIDOR = content.includes('IDOR') || content.includes('Insecure Direct Object Reference')

      // Assert
      expect(hasIDOR).toBe(true)
    })
  })

  describe('FASE 5: Validación de TypeScript - Reglas de Tipado', () => {
    it('debe mencionar strict mode o prohibición de any en .cursorrules raíz', () => {
      // Arrange
      const rootRulesPath = join(projectRoot, '.cursorrules')
      const content = readFileSync(rootRulesPath, 'utf-8')

      // Act
      const hasTypeSafety = content.includes('strict: true') || 
                           content.includes('Cero any') || 
                           content.includes('prohibición de any')

      // Assert
      expect(hasTypeSafety).toBe(true)
    })
  })
})

/**
 * NOTAS PARA EL AGENTE:
 * 
 * Esta suite de tests verifica que los archivos .cursorrules:
 * 1. Existen en las ubicaciones correctas
 * 2. Contienen las reglas críticas esperadas
 * 3. Tienen formato y estructura adecuados
 * 4. Incluyen medidas de seguridad esenciales
 * 
 * Para ejecutar estos tests:
 * - npm test -- tests/cursorrules-validation.test.ts
 * 
 * Si algún test falla, revisa el archivo .cursorrules correspondiente
 * y asegúrate de que contiene la regla o sección mencionada.
 */


