const { Client } = require('pg');

async function test() {
    console.log('Creating pg client...');
    console.log('Connecting to port 5435...');
    const client = new Client({
        host: 'localhost',
        port: 5435,
        user: 'solistech',
        password: 'solistech_secure_2024',
        database: 'solistech_pro'
    });

    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected successfully!');

        const result = await client.query('SELECT email FROM users LIMIT 1');
        console.log('User found:', result.rows[0]?.email);

        await client.end();
        console.log('Disconnected.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

test();
