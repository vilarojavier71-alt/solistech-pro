import { getCadastralData } from './src/lib/services/catastro'

async function testCatastro() {
    console.log("Testing Catastro Service...")
    // Puerta del Sol, Madrid
    const lat = 40.416775
    const lng = -3.703790

    console.log(`Coordinates: ${lat}, ${lng}`)

    const result = await getCadastralData(lat, lng)

    if (result) {
        console.log("SUCCESS ✅")
        console.log("Reference:", result.reference)
        console.log("Address:", result.address)
        console.log("Municipality:", result.municipality)
    } else {
        console.log("FAILED ❌")
    }
}

testCatastro()
