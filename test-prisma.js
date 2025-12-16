const { PrismaClient } = require('@prisma/client');

async function test() {
    console.log('Creating Prisma client...');
    const prisma = new PrismaClient({
        log: ['query', 'error', 'warn']
    });

    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected successfully!');

        const user = await prisma.users.findFirst();
        console.log('User found:', user?.email);

        await prisma.$disconnect();
        console.log('Disconnected.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

test();
