const prisma = require('../utils/prisma');
const PrinterService = require('../utils/printer');

// Track printing status to prevent duplicate prints
const printingOrders = new Set();
let isPrinting = false; // Global lock to prevent concurrent prints

/**
 * Print receipt for an order
 */
const printReceipt = async (req, res) => {
    const { orderId } = req.params;
    const orderIdStr = orderId.toString();
    
    try {
        const userId = parseInt(req.userId);

        // Prevent concurrent prints (global lock)
        if (isPrinting) {
            return res.status(429).json({ 
                message: 'Another print job is in progress. Please wait.' 
            });
        }

        // Prevent duplicate prints for the same order
        if (printingOrders.has(orderIdStr)) {
            return res.status(429).json({ 
                message: 'Print request already in progress for this order. Please wait.' 
            });
        }

        isPrinting = true;
        printingOrders.add(orderIdStr);
        console.log(`Starting print job for order ${orderIdStr}`);

        // Get order with all details
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                User: true,
                OrderItem: {
                    include: {
                        Product: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get settings (printer IP, store info)
        const settings = await prisma.settings.findFirst();

        if (!settings || !settings.printerIp) {
            return res.status(400).json({ 
                message: 'Printer not configured. Please set printer IP in settings.' 
            });
        }

        // Format receipt data with proper data extraction
        const receiptData = {
            storeName: settings.storeName || 'My Supermarket',
            address: settings.address || '',
            orderId: order.id ? order.id.toString() : 'N/A',
            date: order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString(),
            cashier: order.User?.name || 'Unknown',
            items: order.OrderItem.map(item => {
                // Extract product name from multiple possible sources
                const productName = item.Product?.name || 
                                  item.product?.name || 
                                  'Unknown Product';
                
                return {
                    name: productName,
                    productName: productName,
                    quantity: parseInt(item.quantity) || 0,
                    price: parseFloat(item.price) || 0,
                    subtotal: parseFloat(item.subtotal) || 0,
                    Product: item.Product,
                    product: item.Product
                };
            }),
            subtotal: parseFloat(order.totalAmount) + parseFloat(order.discount || 0) - parseFloat(order.tax || 0),
            discount: parseFloat(order.discount || 0),
            tax: parseFloat(order.tax || 0),
            total: parseFloat(order.totalAmount),
            paymentMethod: order.paymentMethod || 'CASH',
            currency: settings.currency || 'IQD'
        };

        // Debug log to verify data
        console.log('Printing receipt for Order ID:', receiptData.orderId);
        console.log('Items count:', receiptData.items.length);
        receiptData.items.forEach((item, idx) => {
            console.log(`Item ${idx + 1}:`, item.name, 'Qty:', item.quantity);
        });

        // Generate receipt buffer
        const receiptBuffer = PrinterService.generateReceipt(receiptData);
        
        // Log receipt content for debugging
        console.log('Generated receipt content:');
        console.log('---');
        console.log(receiptBuffer.toString('utf8'));
        console.log('---');
        console.log(`Receipt buffer size: ${receiptBuffer.length} bytes`);

        // Send to printer (only once)
        console.log(`Sending receipt to printer at ${settings.printerIp}:9100`);
        await PrinterService.sendToPrinter(settings.printerIp, 9100, receiptBuffer);
        console.log('Receipt sent successfully');

        // Remove from printing set and release lock
        printingOrders.delete(orderIdStr);
        isPrinting = false;
        console.log(`Print job completed for order ${orderIdStr}`);

        res.status(200).json({ 
            message: 'Receipt printed successfully',
            orderId: order.id
        });
    } catch (error) {
        console.error('Print error:', error);
        
        // Remove from printing set and release lock on error
        printingOrders.delete(orderIdStr);
        isPrinting = false;
        
        res.status(500).json({ 
            message: 'Failed to print receipt',
            error: error.message 
        });
    }
};

/**
 * Test printer connection
 */
const testPrinter = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings || !settings.printerIp) {
            return res.status(400).json({ 
                message: 'Printer IP not configured. Please set printer IP in settings.' 
            });
        }

        // Test connection
        await PrinterService.testConnection(settings.printerIp, 9100);

        res.status(200).json({ 
            message: 'Printer connection successful',
            printerIp: settings.printerIp
        });
    } catch (error) {
        console.error('Printer test error:', error);
        res.status(500).json({ 
            message: 'Failed to connect to printer',
            error: error.message,
            suggestion: 'Please check: 1) Printer is powered on, 2) Printer IP is correct, 3) Printer is on the same network, 4) Port 9100 is open'
        });
    }
};

/**
 * Print test receipt
 */
const printTestReceipt = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings || !settings.printerIp) {
            return res.status(400).json({ 
                message: 'Printer IP not configured. Please set printer IP in settings.' 
            });
        }

        // Print test receipt
        await PrinterService.printTestReceipt(settings.printerIp, 9100, settings);

        res.status(200).json({ 
            message: 'Test receipt printed successfully',
            printerIp: settings.printerIp
        });
    } catch (error) {
        console.error('Test print error:', error);
        res.status(500).json({ 
            message: 'Failed to print test receipt',
            error: error.message
        });
    }
};

module.exports = {
    printReceipt,
    testPrinter,
    printTestReceipt
};
