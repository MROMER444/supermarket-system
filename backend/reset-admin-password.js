const prisma = require('./src/utils/prisma');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
    try {
        const email = 'admin@supermarket.com';
        const newPassword = 'password123'; // Default password - change this if needed
        
        console.log(`🔐 Resetting password for ${email}...`);
        
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.error(`❌ User with email ${email} not found!`);
            process.exit(1);
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log(`✅ Password reset successfully for ${email}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 New Password: ${newPassword}`);
        console.log(`\n⚠️  Please change this password after logging in for security!`);
        
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
