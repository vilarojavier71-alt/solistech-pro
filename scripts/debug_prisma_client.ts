
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient()

console.log('User model:', 'user' in client ? 'user exists' : 'user MISSING')
console.log('users model:', 'users' in client ? 'users exists' : 'users MISSING')

// Log all keys in client
console.log('Client keys:', Object.keys(client))

// Check types
import * as PrismaInfo from '@prisma/client'
console.log('Exports:', Object.keys(PrismaInfo))
