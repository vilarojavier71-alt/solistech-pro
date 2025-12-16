const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verify() {
    const prisma = new PrismaClient();
    try {
        console.log('Checking for user vilarojavier@gmail.com...');
        const user = await prisma.users.findFirst({
            where: { email: 'vilarojavier@gmail.com' }
        });

        if (user) {
            console.log(`User found: ${user.email}`);
            console.log(`Role: ${user.role}`);

            if (user.role === 'ingeniero') {
                console.log('VERIFICATION SUCCESS: User is registered as ingeniero.');
            } else {
                console.log(`VERIFICATION ALERT: User role is '${user.role}', expected 'ingeniero'.`);
            }
        } else {
            console.log('User NOT found.');
        }
    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
