const prisma = require('./src/utils/prisma');
const fs = require('fs');

async function main() {
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log('Connection successful. User count:', userCount);
        fs.writeFileSync('verify_result.txt', `SUCCESS: Connected. User count: ${userCount}`);
    } catch (e) {
        console.error(e);
        fs.writeFileSync('verify_result.txt', `ERROR: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
