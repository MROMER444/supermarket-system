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
        // Calculate refunded quantities per order item
        const refundedQuantities = {};
        if (transformed.Refund) {
            for (const refund of transformed.Refund) {
                if (refund.RefundItem) {
                    for (const refundItem of refund.RefundItem) {
                        if (!refundedQuantities[refundItem.orderItemId]) {
                            refundedQuantities[refundItem.orderItemId] = 0;
                        }
                        refundedQuantities[refundItem.orderItemId] += refundItem.quantity;
                    }
                }
            }
        }
        
        // Transform OrderItem array and nested Product relations
        transformed.items = transformed.OrderItem.map(item => {
            const transformedItem = { ...item };
            if (transformedItem.Product) {
                transformedItem.product = transformedItem.Product;
                delete transformedItem.Product;
            }
            // Add refunded quantity information
            transformedItem.refundedQuantity = refundedQuantities[item.id] || 0;
            transformedItem.availableQuantity = item.quantity - (refundedQuantities[item.id] || 0);
            return transformedItem;
        });
        delete transformed.OrderItem;
    }
    // Include refund information
    if (transformed.Refund) {
        transformed.refunds = transformed.Refund.map(refund => ({
            id: refund.id,
            totalAmount: refund.totalAmount,
            status: refund.status,
            createdAt: refund.createdAt,
            reason: refund.reason,
        }));
        // Calculate total refunded amount
        transformed.totalRefunded = transformed.refunds.reduce((sum, refund) => {
            return sum + parseFloat(refund.totalAmount);
        }, 0);
        delete transformed.Refund;
    } else {
        transformed.refunds = [];
        transformed.totalRefunded = 0;
    }
    return transformed;
};

const getOrders = async (req, res) => {
    try {
        const { startDate, endDate, cashierId, orderId, status, page = 1, limit = 10 } = req.query;
        let where = {};

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (cashierId) {
            where.userId = parseInt(cashierId);
        }

        if (orderId) {
            const orderIdNum = parseInt(orderId);
            if (!isNaN(orderIdNum)) {
                where.id = orderIdNum;
            }
        }

        // Filter by status (REFUNDED, PARTIALLY_REFUNDED, COMPLETED)
        // Support comma-separated multiple statuses
        if (status) {
            const statuses = status.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                where.status = statuses[0];
            } else {
                where.status = { in: statuses };
            }
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination (all orders matching filter)
        const totalCount = await prisma.order.count({ where });

        // Get paginated orders
        const orders = await prisma.order.findMany({
            where,
            include: { 
                User: true, 
                OrderItem: { include: { Product: true } },
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: limitNum,
        });
        const transformedOrders = orders.map(transformOrder);
        
        // Calculate totals for all orders matching the filter (not just paginated)
        const allOrdersForTotals = await prisma.order.findMany({
            where,
            include: {
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
        });

        // Check if filtering by refunded statuses (REFUNDED or PARTIALLY_REFUNDED)
        const statuses = status ? status.split(',').map(s => s.trim()) : [];
        const isRefundedFilter = statuses.includes('REFUNDED') || statuses.includes('PARTIALLY_REFUNDED');
        const isOnlyRefundedFilter = statuses.length === 1 && statuses[0] === 'REFUNDED';
        
        // If filtering by refunded statuses, calculate total refunded amount instead of sales
        let totalSales = 0;
        let totalRefundedAmount = 0;
        
        if (isRefundedFilter) {
            // For refunded orders, calculate total refunded amount
            totalRefundedAmount = allOrdersForTotals.reduce((sum, order) => {
                const refundedAmount = order.Refund.reduce((refundSum, refund) => {
                    return refundSum + parseFloat(refund.totalAmount);
                }, 0);
                return sum + refundedAmount;
            }, 0);
            totalSales = totalRefundedAmount; // Use same field for consistency
        } else {
            // Calculate net sales (excluding fully refunded orders, subtracting refunds from partially refunded)
            totalSales = allOrdersForTotals.reduce((sum, order) => {
                // Skip fully refunded orders
                if (order.status === 'REFUNDED') {
                    return sum;
                }
                
                const orderAmount = parseFloat(order.totalAmount);
                // Calculate total refunded for this order
                const refundedAmount = order.Refund.reduce((refundSum, refund) => {
                    return refundSum + parseFloat(refund.totalAmount);
                }, 0);
                // Net sales = order amount - refunds
                return sum + (orderAmount - refundedAmount);
            }, 0);
        }

        // Count orders based on status filter
        const totalOrders = isRefundedFilter
            ? allOrdersForTotals.length // All refunded/partially refunded orders
            : allOrdersForTotals.filter(order => order.status !== 'REFUNDED').length; // Non-refunded orders
        
        // Calculate total discounts (only for non-refunded orders, or all if filtering refunded)
        const totalDiscounts = isRefundedFilter
            ? allOrdersForTotals.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0)
            : allOrdersForTotals
                .filter(order => order.status !== 'REFUNDED')
                .reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
        
        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            orders: transformedOrders,
            totalSales,
            totalOrders,
            totalDiscounts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPreviousPage: pageNum > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

        const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: { 
                User: true, 
                OrderItem: { include: { Product: true } },
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
        });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        const transformedOrder = transformOrder(order);
        res.status(200).json(transformedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDailyReport = async (req, res) => {
    try {
        const { date, dates, startDate: startDateParam, endDate: endDateParam, page = 1, limit = 10, withDiscount } = req.query;
        
        // Handle multiple dates selection
        let dateConditions = [];
        
        if (dates) {
            // Multiple dates provided as array
            const datesArray = Array.isArray(dates) ? dates : [dates];
            
            // If exactly 2 dates are selected, treat them as a range
            if (datesArray.length === 2) {
                const sortedDates = datesArray.map(d => new Date(d)).sort((a, b) => a - b);
                const startDate = new Date(sortedDates[0]);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(sortedDates[1]);
                endDate.setHours(23, 59, 59, 999);
                
                // Use range condition instead of individual dates
                dateConditions = [{
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    }
                }];
            } else {
                // Multiple individual dates (more than 2)
                dateConditions = datesArray.map(dateStr => {
                    const startDate = new Date(dateStr);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 1);
                    return {
                        createdAt: {
                            gte: startDate,
                            lt: endDate,
                        }
                    };
                });
            }
        } else if (startDateParam && endDateParam) {
            // Date range provided
            const startDate = new Date(startDateParam);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999);
            dateConditions = [{
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                }
            }];
        } else if (date) {
            // Single date provided (backward compatibility)
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            dateConditions = [{
                createdAt: {
                    gte: startDate,
                    lt: endDate,
                }
            }];
        } else {
            // Default to today
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            dateConditions = [{
                createdAt: {
                    gte: startDate,
                    lt: endDate,
                }
            }];
        }

        // Build where clause with OR conditions for multiple dates
        let whereClause;
        
        if (dateConditions.length > 1) {
            // Multiple dates - need to combine with discount filter properly
            if (withDiscount === 'true' || withDiscount === true) {
                whereClause = {
                    AND: [
                        { OR: dateConditions },
                        { discount: { gt: 0 } }
                    ]
                };
            } else {
                whereClause = { OR: dateConditions };
            }
        } else {
            // Single date condition
            if (withDiscount === 'true' || withDiscount === true) {
                whereClause = {
                    ...dateConditions[0],
                    discount: { gt: 0 }
                };
            } else {
                whereClause = dateConditions[0];
            }
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const totalCount = await prisma.order.count({
            where: whereClause,
        });

        // Get paginated orders (include all orders, even refunded ones, for display)
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: { 
                User: true, 
                OrderItem: { include: { Product: true } },
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: limitNum,
        });
        const transformedOrders = orders.map(transformOrder);

        // Calculate total sales (for all orders on selected dates, not just paginated)
        // Include all orders for counting, but exclude fully refunded orders from sales calculations
        const allOrders = await prisma.order.findMany({
            where: whereClause,
            include: { 
                User: true,
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
        });

        // Calculate net sales (original amount - refunds)
        // Exclude fully refunded orders from sales totals
        // For partially refunded orders, subtract refund amount
        const totalSales = allOrders.reduce((sum, order) => {
            // Skip fully refunded orders in sales calculation
            if (order.status === 'REFUNDED') {
                return sum;
            }
            
            const orderAmount = parseFloat(order.totalAmount);
            // Calculate total refunded for this order
            const refundedAmount = order.Refund.reduce((refundSum, refund) => {
                return refundSum + parseFloat(refund.totalAmount);
            }, 0);
            // Net sales = order amount - refunds
            return sum + (orderAmount - refundedAmount);
        }, 0);
        
        // Count only non-refunded orders (exclude fully refunded orders from count)
        const totalOrders = allOrders.filter(order => order.status !== 'REFUNDED').length;
        // Calculate discount only for non-refunded orders
        const totalDiscount = allOrders
            .filter(order => order.status !== 'REFUNDED')
            .reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);

        const totalPages = Math.ceil(totalCount / limitNum);

        // Get the date range for response
        let responseStartDate, responseEndDate;
        if (dates) {
            const datesArray = Array.isArray(dates) ? dates : [dates];
            if (datesArray.length === 2) {
                // Range mode - use the actual range
                const sortedDates = datesArray.map(d => new Date(d)).sort((a, b) => a - b);
                responseStartDate = sortedDates[0];
                responseStartDate.setHours(0, 0, 0, 0);
                responseEndDate = new Date(sortedDates[1]);
                responseEndDate.setHours(23, 59, 59, 999);
            } else {
                // Multiple individual dates
                const sortedDates = datesArray.map(d => new Date(d)).sort((a, b) => a - b);
                responseStartDate = sortedDates[0];
                responseEndDate = sortedDates[sortedDates.length - 1];
            }
        } else if (startDateParam && endDateParam) {
            responseStartDate = new Date(startDateParam);
            responseEndDate = new Date(endDateParam);
        } else {
            responseStartDate = dateConditions[0].createdAt.gte;
            responseEndDate = dateConditions[0].createdAt.lt || dateConditions[0].createdAt.lte;
        }

        res.status(200).json({ 
            startDate: responseStartDate,
            endDate: responseEndDate,
            dates: dates ? (Array.isArray(dates) ? dates : [dates]) : undefined,
            date: responseStartDate, // Keep for backward compatibility
            totalSales, 
            totalOrders,
            totalDiscount,
            orders: transformedOrders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPreviousPage: pageNum > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's orders (include all orders to calculate net sales correctly)
        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                Refund: {
                    include: {
                        RefundItem: true,
                    },
                },
            },
        });

        // Calculate daily sales (net sales after refunds)
        // Exclude fully refunded orders from sales totals
        const dailySales = todayOrders.reduce((sum, order) => {
            // Skip fully refunded orders in sales calculation
            if (order.status === 'REFUNDED') {
                return sum;
            }
            
            const orderAmount = parseFloat(order.totalAmount);
            // Calculate total refunded for this order
            const refundedAmount = order.Refund.reduce((refundSum, refund) => {
                return refundSum + parseFloat(refund.totalAmount);
            }, 0);
            // Net sales = order amount - refunds
            return sum + (orderAmount - refundedAmount);
        }, 0);
        // Count only non-refunded orders (exclude fully refunded orders from count)
        const totalOrders = todayOrders.filter(order => order.status !== 'REFUNDED').length;

        // Get low stock items (quantity <= minQuantity)
        // We need to get all products and filter in JavaScript since Prisma doesn't support comparing two fields directly
        const allProducts = await prisma.product.findMany({
            select: {
                id: true,
                quantity: true,
                minQuantity: true,
            },
        });
        const lowStockProducts = allProducts.filter(product => product.quantity <= product.minQuantity);

        // Get active cashiers (users who made orders today)
        const activeCashiers = await prisma.user.findMany({
            where: {
                role: 'CASHIER',
                Order: {
                    some: {
                        createdAt: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                },
            },
        });

        res.status(200).json({
            dailySales,
            totalOrders,
            lowStockCount: lowStockProducts.length,
            activeCashiers: activeCashiers.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getOrders, getOrderById, getDailyReport, getDashboardStats };
