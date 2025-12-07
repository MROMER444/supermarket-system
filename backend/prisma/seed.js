const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
    await prisma.settings.deleteMany();

    console.log('✅ Cleared existing data');

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const now = new Date();

    const admin = await prisma.user.create({
        data: {
            email: 'admin@supermarket.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            updatedAt: now,
        },
    });

    const cashier = await prisma.user.create({
        data: {
            email: 'cashier@supermarket.com',
            password: hashedPassword,
            name: 'Cashier User',
            role: 'CASHIER',
            updatedAt: now,
        },
    });

    console.log('✅ Created users');

    // Create Categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'Beverages',
                description: 'Drinks and beverages',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Dairy',
                description: 'Milk, cheese, and dairy products',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Snacks',
                description: 'Chips, cookies, and snacks',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Bakery',
                description: 'Bread, pastries, and baked goods',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Frozen Foods',
                description: 'Frozen meals and ice cream',
            },
        }),
    ]);

    console.log('✅ Created categories');

    // Create Suppliers
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                name: 'Fresh Foods Co.',
                contactInfo: '+1-555-0101',
                address: '123 Supply Street, City',
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'Dairy Distributors Inc.',
                contactInfo: '+1-555-0102',
                address: '456 Milk Avenue, Town',
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'Snack World Ltd.',
                contactInfo: '+1-555-0103',
                address: '789 Snack Road, Village',
            },
        }),
    ]);

    console.log('✅ Created suppliers');

    // Create Products with realistic IQD prices
    const products = await Promise.all([
        // Beverages
        prisma.product.create({
            data: {
                name: 'Coca Cola 500ml',
                barcode: '1234567890001',
                categoryId: categories[0].id,
                price: 900, // ~900 IQD
                costPrice: 550,
                quantity: 100,
                minQuantity: 20,
                supplierId: suppliers[0].id,
                updatedAt: now,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Orange Juice 1L',
                barcode: '1234567890002',
                categoryId: categories[0].id,
                price: 4000, // ~4000 IQD
                costPrice: 2500,
                quantity: 50,
                minQuantity: 10,
                supplierId: suppliers[0].id,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Mineral Water 1.5L',
                barcode: '1234567890003',
                categoryId: categories[0].id,
                price: 700, // ~700 IQD
                costPrice: 400,
                quantity: 200,
                minQuantity: 50,
                supplierId: suppliers[0].id,
                updatedAt: now,
            },
        }),
        // Dairy
        prisma.product.create({
            data: {
                name: 'Fresh Milk 1L',
                barcode: '1234567890004',
                categoryId: categories[1].id,
                price: 2200, // ~2200 IQD
                costPrice: 1500,
                quantity: 80,
                minQuantity: 15,
                supplierId: suppliers[1].id,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Cheddar Cheese 200g',
                barcode: '1234567890005',
                categoryId: categories[1].id,
                price: 6000, // ~6000 IQD
                costPrice: 4200,
                quantity: 40,
                minQuantity: 10,
                supplierId: suppliers[1].id,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Greek Yogurt 500g',
                barcode: '1234567890006',
                categoryId: categories[1].id,
                price: 4500, // ~4500 IQD
                costPrice: 3000,
                quantity: 60,
                minQuantity: 15,
                supplierId: suppliers[1].id,
                updatedAt: now,
            },
        }),
        // Snacks
        prisma.product.create({
            data: {
                name: 'Potato Chips 150g',
                barcode: '1234567890007',
                categoryId: categories[2].id,
                price: 3000, // ~3000 IQD
                costPrice: 2000,
                quantity: 120,
                minQuantity: 30,
                supplierId: suppliers[2].id,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Chocolate Cookies 300g',
                barcode: '1234567890008',
                categoryId: categories[2].id,
                price: 5000, // ~5000 IQD
                costPrice: 3500,
                quantity: 90,
                minQuantity: 20,
                supplierId: suppliers[2].id,
                updatedAt: now,
            },
        }),
        // Bakery
        prisma.product.create({
            data: {
                name: 'White Bread Loaf',
                barcode: '1234567890009',
                categoryId: categories[3].id,
                price: 1000, // ~1000 IQD
                costPrice: 600,
                quantity: 50,
                minQuantity: 15,
                supplierId: suppliers[0].id,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Croissants Pack of 6',
                barcode: '1234567890010',
                categoryId: categories[3].id,
                price: 6000, // ~6000 IQD
                costPrice: 4000,
                quantity: 30,
                minQuantity: 10,
                supplierId: suppliers[0].id,
                updatedAt: now,
            },
        }),
        // Frozen Foods
        prisma.product.create({
            data: {
                name: 'Vanilla Ice Cream 1L',
                barcode: '1234567890011',
                categoryId: categories[4].id,
                price: 7500, // ~7500 IQD
                costPrice: 5000,
                quantity: 40,
                minQuantity: 10,
                supplierId: suppliers[0].id,
                updatedAt: now,
            },
        }),
        prisma.product.create({
            data: {
                name: 'Frozen Pizza',
                barcode: '1234567890012',
                categoryId: categories[4].id,
                price: 9000, // ~9000 IQD
                costPrice: 6000,
                quantity: 35,
                minQuantity: 10,
                supplierId: suppliers[0].id,
                updatedAt: now,
            },
        }),
    ]);

    console.log('✅ Created products');

    // Create Settings
    await prisma.settings.create({
        data: {
            storeName: 'My Supermarket',
            address: '123 Main Street, City, Country',
            currency: 'IQD',
        },
    });

    console.log('✅ Created settings');

    // Create sample orders with IQD prices
    const order1 = await prisma.order.create({
        data: {
            userId: cashier.id,
            totalAmount: 3900, // 2x900 + 3x700 = 1800 + 2100 = 3900 IQD
            discount: 0,
            tax: 0,
            paymentMethod: 'CASH',
            status: 'COMPLETED',
            OrderItem: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 2,
                        price: 900,
                        subtotal: 1800,
                    },
                    {
                        productId: products[2].id,
                        quantity: 3,
                        price: 700,
                        subtotal: 2100,
                    },
                ],
            },
        },
    });

    const order2 = await prisma.order.create({
        data: {
            userId: cashier.id,
            totalAmount: 18900, // 2x2200 + 3x3000 + 1x7500 = 4400 + 9000 + 7500 = 20900, with discount of 2000 = 18900 IQD
            discount: 2000,
            tax: 0,
            paymentMethod: 'CARD',
            status: 'COMPLETED',
            OrderItem: {
                create: [
                    {
                        productId: products[3].id,
                        quantity: 2,
                        price: 2200,
                        subtotal: 4400,
                    },
                    {
                        productId: products[6].id,
                        quantity: 3,
                        price: 3000,
                        subtotal: 9000,
                    },
                    {
                        productId: products[10].id,
                        quantity: 1,
                        price: 7500,
                        subtotal: 7500,
                    },
                ],
            },
        },
    });

    console.log('✅ Created sample orders');

    // Create orders for November 1-7, 2025
    const novemberOrders = [];
    const novemberDates = [
        new Date(2025, 10, 1, 9, 15, 0),   // Nov 1, 9:15 AM
        new Date(2025, 10, 1, 14, 30, 0),  // Nov 1, 2:30 PM
        new Date(2025, 10, 2, 10, 0, 0),   // Nov 2, 10:00 AM
        new Date(2025, 10, 2, 16, 45, 0),  // Nov 2, 4:45 PM
        new Date(2025, 10, 3, 8, 20, 0),   // Nov 3, 8:20 AM
        new Date(2025, 10, 3, 13, 10, 0),  // Nov 3, 1:10 PM
        new Date(2025, 10, 4, 11, 30, 0),  // Nov 4, 11:30 AM
        new Date(2025, 10, 4, 18, 0, 0),   // Nov 4, 6:00 PM
        new Date(2025, 10, 5, 9, 45, 0),   // Nov 5, 9:45 AM
        new Date(2025, 10, 5, 15, 20, 0),  // Nov 5, 3:20 PM
        new Date(2025, 10, 6, 10, 15, 0),  // Nov 6, 10:15 AM
        new Date(2025, 10, 6, 17, 30, 0),  // Nov 6, 5:30 PM
        new Date(2025, 10, 7, 8, 0, 0),    // Nov 7, 8:00 AM
        new Date(2025, 10, 7, 12, 45, 0),  // Nov 7, 12:45 PM
    ];

    const orderConfigs = [
        // Nov 1 orders
        {
            items: [
                { productId: products[0].id, quantity: 3, price: 900, subtotal: 2700 },
                { productId: products[2].id, quantity: 2, price: 700, subtotal: 1400 },
            ],
            totalAmount: 4100,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[3].id, quantity: 1, price: 2200, subtotal: 2200 },
                { productId: products[6].id, quantity: 2, price: 3000, subtotal: 6000 },
            ],
            totalAmount: 7200,
            discount: 500,
            paymentMethod: 'CARD',
        },
        // Nov 2 orders
        {
            items: [
                { productId: products[1].id, quantity: 1, price: 4000, subtotal: 4000 },
                { productId: products[8].id, quantity: 2, price: 1000, subtotal: 2000 },
            ],
            totalAmount: 6000,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[4].id, quantity: 1, price: 6000, subtotal: 6000 },
                { productId: products[5].id, quantity: 1, price: 4500, subtotal: 4500 },
            ],
            totalAmount: 9500,
            discount: 1000,
            paymentMethod: 'CARD',
        },
        // Nov 3 orders
        {
            items: [
                { productId: products[0].id, quantity: 5, price: 900, subtotal: 4500 },
                { productId: products[2].id, quantity: 4, price: 700, subtotal: 2800 },
            ],
            totalAmount: 7300,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[7].id, quantity: 2, price: 5000, subtotal: 10000 },
                { productId: products[9].id, quantity: 1, price: 6000, subtotal: 6000 },
            ],
            totalAmount: 15000,
            discount: 2000,
            paymentMethod: 'CARD',
        },
        // Nov 4 orders
        {
            items: [
                { productId: products[3].id, quantity: 3, price: 2200, subtotal: 6600 },
                { productId: products[6].id, quantity: 1, price: 3000, subtotal: 3000 },
            ],
            totalAmount: 9600,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[10].id, quantity: 2, price: 7500, subtotal: 15000 },
                { productId: products[11].id, quantity: 1, price: 9000, subtotal: 9000 },
            ],
            totalAmount: 22000,
            discount: 3000,
            paymentMethod: 'CARD',
        },
        // Nov 5 orders
        {
            items: [
                { productId: products[1].id, quantity: 2, price: 4000, subtotal: 8000 },
                { productId: products[8].id, quantity: 3, price: 1000, subtotal: 3000 },
            ],
            totalAmount: 11000,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[4].id, quantity: 2, price: 6000, subtotal: 12000 },
                { productId: products[5].id, quantity: 2, price: 4500, subtotal: 9000 },
            ],
            totalAmount: 19000,
            discount: 2500,
            paymentMethod: 'CARD',
        },
        // Nov 6 orders
        {
            items: [
                { productId: products[0].id, quantity: 4, price: 900, subtotal: 3600 },
                { productId: products[2].id, quantity: 5, price: 700, subtotal: 3500 },
                { productId: products[6].id, quantity: 2, price: 3000, subtotal: 6000 },
            ],
            totalAmount: 13100,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[7].id, quantity: 3, price: 5000, subtotal: 15000 },
                { productId: products[9].id, quantity: 2, price: 6000, subtotal: 12000 },
            ],
            totalAmount: 25000,
            discount: 4000,
            paymentMethod: 'CARD',
        },
        // Nov 7 orders
        {
            items: [
                { productId: products[3].id, quantity: 2, price: 2200, subtotal: 4400 },
                { productId: products[8].id, quantity: 4, price: 1000, subtotal: 4000 },
            ],
            totalAmount: 8400,
            discount: 0,
            paymentMethod: 'CASH',
        },
        {
            items: [
                { productId: products[10].id, quantity: 1, price: 7500, subtotal: 7500 },
                { productId: products[11].id, quantity: 2, price: 9000, subtotal: 18000 },
            ],
            totalAmount: 23500,
            discount: 3500,
            paymentMethod: 'CARD',
        },
    ];

    for (let i = 0; i < novemberDates.length; i++) {
        const order = await prisma.order.create({
            data: {
                userId: cashier.id,
                totalAmount: orderConfigs[i].totalAmount,
                discount: orderConfigs[i].discount,
                tax: 0,
                paymentMethod: orderConfigs[i].paymentMethod,
                status: 'COMPLETED',
                createdAt: novemberDates[i],
                OrderItem: {
                    create: orderConfigs[i].items,
                },
            },
        });
        novemberOrders.push(order);
    }

    console.log(`✅ Created ${novemberOrders.length} orders for November 1-7, 2025`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 2 (1 Admin, 1 Cashier)`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Orders: ${2 + novemberOrders.length} (2 sample + ${novemberOrders.length} for November 2025)`);
    console.log(`\n🔑 Login credentials:`);
    console.log(`   Admin: admin@supermarket.com / password123`);
    console.log(`   Cashier: cashier@supermarket.com / password123`);
    console.log(`\n💰 Currency: IQD (Iraqi Dinar)`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
