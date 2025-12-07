const prisma = require('../utils/prisma');

// Helper function to transform order object for frontend compatibility
const transformOrder = (order) => {
    if (!order) return order;
    const transformed = { ...order };
    if (transformed.User) {
        transformed.user = transformed.User;
        delete transformed.User;
    }
    if (transformed.OrderItem) {
        transformed.items = transformed.OrderItem;
        delete transformed.OrderItem;
    }
    return transformed;
};

const createOrder = async (req, res) => {
    try {
        const { items, paymentMethod, totalAmount, discount, tax } = req.body;
        
        // Get userId from JWT token (set by authMiddleware)
        const userId = parseInt(req.userId);
        
        if (!userId || isNaN(userId)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        // Validate that user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            // Get all users for debugging
            const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
            console.error(`User with ID ${userId} not found. Token contains user ID: ${userId}`);
            console.error(`Available users in database:`, allUsers);
            return res.status(404).json({ 
                message: `User not found. Your token contains user ID ${userId}, but this user doesn't exist in the database. Please log out and log back in to refresh your authentication token.` 
            });
        }

        // Start a transaction
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Create the order
            const order = await prisma.order.create({
                data: {
                    userId,
                    totalAmount,
                    discount: discount || 0,
                    tax: tax || 0,
                    paymentMethod,
                    status: 'COMPLETED',
                    OrderItem: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.subtotal,
                        })),
                    },
                },
                include: { User: true, OrderItem: { include: { Product: true } } },
            });

            // 2. Deduct stock for each item
            for (const item of items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            return order;
        });

        const transformedOrder = transformOrder(result);
        res.status(201).json(transformedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createOrder };
