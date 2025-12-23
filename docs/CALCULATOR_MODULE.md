# 📊 Calculator Module - Architecture Documentation

**Last Updated:** 2025-01-XX  
**Status:** ✅ Production Ready  
**ISO 27001 Compliance:** ✅ Verified

---

## 🏗️ Architecture Overview

The Calculator module (`/dashboard/calculator`) provides solar installation calculations with real-time PVGIS data integration, ROI analysis, and technical memory PDF generation.

### Key Components

1. **Server Component:** `src/app/dashboard/calculator/page.tsx`
   - Fetches user organization and customers
   - Robust error handling with try/catch
   - Graceful degradation on DB failures

2. **Client Component:** `src/components/calculator/solar-calculator-premium.tsx`
   - Premium calculator UI with advanced features
   - Uses centralized hook `useCalculator` (No-Raw-Fetch Policy)
   - Handles PDF generation and ROI calculations

3. **API Route:** `src/app/api/calculate-solar/route.ts`
   - Validates inputs with Zod schema
   - SSRF protection for PVGIS URLs
   - Fallback calculation if PVGIS fails
   - Logic flaw protection (negative values, division by zero)

4. **Centralized Hook:** `src/hooks/use-calculator.ts`
   - TanStack Query integration
   - Centralized error handling
   - PDF generation with Buffer validation
   - Automatic calculation saving

5. **Server Actions:**
   - `src/lib/actions/calculator.ts` - Save calculations
   - `src/lib/actions/technical-memory.ts` - PDF generation with FinOps guardrails
   - `src/lib/actions/roi-calculator.ts` - ROI calculations with subsidies

---

## 🔒 Security Features

### SSRF Protection
- URL validation ensures only `re.jrc.ec.europa.eu` is allowed
- Hostname check before making external requests
- Audit logging of blocked attempts

### Input Validation
- Zod schema validation for all inputs
- Rejects negative consumption, invalid coordinates
- Type-safe with zero `any` usage

### FinOps Guardrails
- Budget validation before PDF generation
- Automatic blocking if threshold exceeded
- Audit trail of blocked operations

### Error Handling
- Structured logging with timestamp, UserID, Action
- No PII in logs
- Graceful error UI instead of crashes

---

## 📝 Data Flow

```
User Input → Zod Validation → API Route → PVGIS API (with SSRF check)
                                    ↓
                            Fallback Calculation (if PVGIS fails)
                                    ↓
                            System Size Calculation
                                    ↓
                            Save to Database (via Server Action)
                                    ↓
                            ROI Calculation (with subsidies)
                                    ↓
                            Display Results
```

---

## 🧪 Testing

Tests are located in `tests/calculator/`:
- `calculation.test.ts` - Unit tests for calculation logic
- `pdf-generation.test.ts` - PDF generation and FinOps tests

Run tests with:
```bash
npm test -- tests/calculator
```

---

## 🚀 Usage Example

```typescript
import { useCalculator } from '@/hooks/use-calculator'

function MyComponent() {
    const { calculate, generatePDF, isCalculating } = useCalculator()

    const handleCalculate = async () => {
        const result = await calculate({
            consumption: 4000,
            installationType: 'residential',
            location: { lat: 40.4168, lng: -3.7038 },
            roofOrientation: 'south',
            roofTilt: 30
        })
    }
}
```

---

## 📚 Related Documentation

- [Critical Analysis](./CALCULATOR_CRITICAL_ANALYSIS.md) - Root cause analysis
- [Remediation Report](./CALCULATOR_REMEDIATION_COMPLETE.md) - Fix implementation details

---

**Maintainer:** MPE-OS Elite Quantum-Sentinel Architect  
**Last Review:** 2025-01-XX

