const { PrismaClient } = require('@prisma/client')
const client = new PrismaClient()
console.log('Prisma keys:', Object.keys(client))
// Check for user/User variants specifically
const props = Object.getOwnPropertyNames(client)
console.log('Props:', props)
// Also check if we can access .user or .User
console.log('client.user:', !!client.user)
console.log('client.User:', !!client.User)
