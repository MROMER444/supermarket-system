const prisma = require('../utils/prisma');

// Transform refund data to match frontend expectations
const transformRefund = (refund) => {
    if (!refund) return null;
    
    return {
        ...refund,
        user: refund.User ? {
            id: refund.User.id,
            name: refund.User.name,
            email: refund.User.email,
            role: refund.User.role,
        } : null,
        order: refund.Order ? {
            id: refund.Order.id,
            totalAmount: refund.Order.totalAmount,
            paymentMethod: refund.Order.paymentMethod,
            createdAt: refund.Order.createdAt,
        } : null,
        items: refund.RefundItem ? refund.RefundItem.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            product: item.Product ? {
                id: item.Product.id,
                name: item.Product.name,
                barcode: item.Product.barcode,
            } : null,
        })) : [],
        User: undefined,
        Order: undefined,
        RefundItem: undefined,
    };
};

// Create a refund/return
const createRefund = async (req, res) => {
    try {
        const { orderId, items, reason } = req.body;
        const userId = req.userId; // From auth middleware

        // Get the order with items and existing refunds
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                OrderItem: {
                    include: {
                        Product: true,
                    },
                },
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Calculate already refunded quantities per order item
        const refundedQuantities = {};
        for (const refund of order.Refund) {
            for (const refundItem of refund.RefundItem) {
                if (!refundedQuantities[refundItem.orderItemId]) {
                    refundedQuantities[refundItem.orderItemId] = 0;
                }
                refundedQuantities[refundItem.orderItemId] += refundItem.quantity;
            }
        }

        // Calculate total refund amount
        let totalAmount = 0;
        const refundItems = [];

        for (const item of items) {
            const orderItem = order.OrderItem.find(oi => oi.id === item.orderItemId);
            if (!orderItem) {
                return res.status(404).json({ message: `Order item ${item.orderItemId} not found` });
            }

            const alreadyRefunded = refundedQuantities[item.orderItemId] || 0;
            const availableQuantity = orderItem.quantity - alreadyRefunded;

            if (item.quantity > availableQuantity) {
                return res.status(400).json({ 
                    message: `Cannot refund more than ${availableQuantity} items. ${alreadyRefunded} already refunded out of ${orderItem.quantity} total.` 
                });
            }

            if (item.quantity <= 0) {
                continue; // Skip items with 0 quantity
            }

            const subtotal = parseFloat(orderItem.price) * item.quantity;
            totalAmount += subtotal;

            refundItems.push({
                orderItemId: orderItem.id,
                productId: orderItem.productId,
                quantity: item.quantity,
                price: orderItem.price,
                subtotal: subtotal.toString(),
            });
        }

        // Create refund transaction
        const refund = await prisma.$transaction(async (tx) => {
            // Create refund record
            const newRefund = await tx.refund.create({
                data: {
                    orderId: parseInt(orderId),
                    userId: userId,
                    totalAmount: totalAmount.toString(),
                    reason: reason || null,
                    status: 'COMPLETED',
                    RefundItem: {
                        create: refundItems,
                    },
                },
                include: {
                    User: true,
                    Order: true,
                    RefundItem: {
                        include: {
                            Product: true,
                        },
                    },
                },
            });

            // Update product quantities (restore stock)
            for (const item of refundItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            // Check if order is fully or partially refunded
            const allRefundsForOrder = await tx.refund.findMany({
                where: { orderId: parseInt(orderId) },
                include: {
                    RefundItem: true,
                },
            });

            // Calculate total refunded quantities per order item
            const orderItemsRefunded = {};
            for (const refundRecord of allRefundsForOrder) {
                for (const refundItem of refundRecord.RefundItem) {
                    if (!orderItemsRefunded[refundItem.orderItemId]) {
                        orderItemsRefunded[refundItem.orderItemId] = 0;
                    }
                    orderItemsRefunded[refundItem.orderItemId] += refundItem.quantity;
                }
            }

            // Get all order items to check if fully refunded
            const allOrderItems = await tx.orderItem.findMany({
                where: { orderId: parseInt(orderId) },
            });

            // Check if all items are fully refunded
            const isFullyRefunded = allOrderItems.every(orderItem => {
                const refundedQty = orderItemsRefunded[orderItem.id] || 0;
                return refundedQty >= orderItem.quantity;
            });

            // Check if any items are refunded (partially or fully)
            const hasRefunds = allOrderItems.some(orderItem => {
                const refundedQty = orderItemsRefunded[orderItem.id] || 0;
                return refundedQty > 0;
            });

            // Update order status
            if (isFullyRefunded) {
                await tx.order.update({
                    where: { id: parseInt(orderId) },
                    data: { status: 'REFUNDED' },
                });
            } else if (hasRefunds) {
                await tx.order.update({
                    where: { id: parseInt(orderId) },
                    data: { status: 'PARTIALLY_REFUNDED' },
                });
            }

            return newRefund;
        });

        res.status(201).json(transformRefund(refund));
    } catch (error) {
        console.error('Error creating refund:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all refunds
const getRefunds = async (req, res) => {
    try {
        const refunds = await prisma.refund.findMany({
            include: {
                User: true,
                Order: true,
                RefundItem: {
                    include: {
                        Product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(refunds.map(transformRefund));
    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get refund by ID
const getRefundById = async (req, res) => {
    try {
        const { id } = req.params;

        const refund = await prisma.refund.findUnique({
            where: { id: parseInt(id) },
            include: {
                User: true,
                Order: {
                    include: {
                        OrderItem: {
                            include: {
                                Product: true,
                            },
                        },
                    },
                },
                RefundItem: {
                    include: {
                        Product: true,
                    },
                },
            },
        });

        if (!refund) {
            return res.status(404).json({ message: 'Refund not found' });
        }

        res.json(transformRefund(refund));
    } catch (error) {
        console.error('Error fetching refund:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get refunds by order ID
const getRefundsByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        const refunds = await prisma.refund.findMany({
            where: { orderId: parseInt(orderId) },
            include: {
                User: true,
                Order: true,
                RefundItem: {
                    include: {
                        Product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(refunds.map(transformRefund));
    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRefund,
    getRefunds,
    getRefundById,
    getRefundsByOrderId,
};
