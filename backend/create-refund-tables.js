const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRefundTables() {
    try {
        // Create Refund table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS \`Refund\` (
                \`id\` INTEGER NOT NULL AUTO_INCREMENT,
                \`orderId\` INTEGER NOT NULL,
                \`userId\` INTEGER NOT NULL,
                \`totalAmount\` DECIMAL(65, 30) NOT NULL,
                \`reason\` VARCHAR(191) NULL,
                \`status\` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                INDEX \`Refund_orderId_idx\`(\`orderId\`),
                INDEX \`Refund_userId_idx\`(\`userId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;

        // Create RefundItem table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS \`RefundItem\` (
                \`id\` INTEGER NOT NULL AUTO_INCREMENT,
                \`refundId\` INTEGER NOT NULL,
                \`orderItemId\` INTEGER NOT NULL,
                \`productId\` INTEGER NOT NULL,
                \`quantity\` INTEGER NOT NULL,
                \`price\` DECIMAL(65, 30) NOT NULL,
                \`subtotal\` DECIMAL(65, 30) NOT NULL,
                INDEX \`RefundItem_refundId_idx\`(\`refundId\`),
                INDEX \`RefundItem_orderItemId_idx\`(\`orderItemId\`),
                INDEX \`RefundItem_productId_idx\`(\`productId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;

        // Add foreign keys
        try {
            await prisma.$executeRaw`
                ALTER TABLE \`Refund\` ADD CONSTRAINT \`Refund_orderId_fkey\` FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
            `;
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Foreign key Refund_orderId_fkey might already exist');
            }
        }

        try {
            await prisma.$executeRaw`
                ALTER TABLE \`Refund\` ADD CONSTRAINT \`Refund_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
            `;
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Foreign key Refund_userId_fkey might already exist');
            }
        }

        try {
            await prisma.$executeRaw`
                ALTER TABLE \`RefundItem\` ADD CONSTRAINT \`RefundItem_refundId_fkey\` FOREIGN KEY (\`refundId\`) REFERENCES \`Refund\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
            `;
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Foreign key RefundItem_refundId_fkey might already exist');
            }
        }

        try {
            await prisma.$executeRaw`
                ALTER TABLE \`RefundItem\` ADD CONSTRAINT \`RefundItem_orderItemId_fkey\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`OrderItem\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
            `;
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Foreign key RefundItem_orderItemId_fkey might already exist');
            }
        }

        try {
            await prisma.$executeRaw`
                ALTER TABLE \`RefundItem\` ADD CONSTRAINT \`RefundItem_productId_fkey\` FOREIGN KEY (\`productId\`) REFERENCES \`Product\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
            `;
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Foreign key RefundItem_productId_fkey might already exist');
            }
        }

        console.log('Refund tables created successfully!');
    } catch (error) {
        console.error('Error creating refund tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createRefundTables();
