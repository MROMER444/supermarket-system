const net = require('net');
const iconv = require('iconv-lite');

/**
 * ESC/POS Printer Utility
 * Supports network thermal printers via IP address
 */
class PrinterService {
    /**
     * Connect to printer and send ESC/POS commands
     * @param {string} printerIp - IP address of the printer
     * @param {number} port - Printer port (default: 9100 for most network printers)
     * @param {Buffer} data - ESC/POS command buffer to send
     * @returns {Promise<boolean>} - Success status
     */
    static async sendToPrinter(printerIp, port = 9100, data) {
        return new Promise((resolve, reject) => {
            if (!printerIp) {
                reject(new Error('Printer IP address is required'));
                return;
            }

            const socket = new net.Socket();
            let isResolved = false;
            let dataSent = false;

            // Set timeout
            socket.setTimeout(10000); // Increased timeout

            socket.on('connect', () => {
                console.log(`Connected to printer at ${printerIp}:${port}`);
                console.log(`Sending ${data.length} bytes to printer`);
                
                // Prevent multiple sends
                if (dataSent) {
                    console.log('Warning: Attempted to send data multiple times, ignoring');
                    return;
                }
                dataSent = true;

                // Write all data at once
                try {
                    // Send data in chunks if needed (some printers have buffer limits)
                    const chunkSize = 1024; // 1KB chunks
                    let offset = 0;
                    
                    const sendChunk = () => {
                        if (offset >= data.length) {
                            // All data sent, wait a bit then close
                            console.log('All data sent, waiting before closing...');
                            setTimeout(() => {
                                console.log('Closing socket connection');
                                socket.end();
                                if (!isResolved) {
                                    isResolved = true;
                                    resolve(true);
                                }
                            }, 500); // Increased wait time
                            return;
                        }
                        
                        const chunk = data.slice(offset, offset + chunkSize);
                        const writeSuccess = socket.write(chunk);
                        offset += chunk.length;
                        
                        console.log(`Sent chunk: ${chunk.length} bytes (total: ${offset}/${data.length})`);
                        
                        if (!writeSuccess) {
                            // Buffer is full, wait for drain
                            socket.once('drain', () => {
                                console.log('Socket drained, continuing...');
                                sendChunk();
                            });
                        } else {
                            // Continue sending next chunk
                            setImmediate(sendChunk);
                        }
                    };
                    
                    // Start sending chunks
                    sendChunk();
                    
                } catch (err) {
                    console.error('Error writing to socket:', err);
                    if (!isResolved) {
                        isResolved = true;
                        reject(err);
                    }
                }
            });

            socket.on('error', (err) => {
                console.error('Printer socket error:', err);
                if (!isResolved) {
                    isResolved = true;
                    reject(new Error(`Failed to connect to printer: ${err.message}`));
                }
            });

            socket.on('timeout', () => {
                console.error('Printer connection timeout');
                socket.destroy();
                if (!isResolved) {
                    isResolved = true;
                    reject(new Error('Connection to printer timed out'));
                }
            });

            socket.on('close', () => {
                console.log('Connection to printer closed');
            });

            // Connect to printer
            socket.connect(port, printerIp);
        });
    }

    /**
     * Generate receipt for A4/standard printers (plain text format)
     * @param {Object} receiptData - Receipt data object
     * @returns {Buffer} - Receipt text buffer
     */
    static generateReceipt(receiptData) {
        console.log('generateReceipt called with data:', JSON.stringify(receiptData, null, 2));
        
        const {
            storeName = 'My Supermarket',
            address = '',
            orderId,
            date,
            cashier,
            items = [],
            subtotal = 0,
            discount = 0,
            tax = 0,
            total = 0,
            paymentMethod = 'CASH',
            currency = 'IQD'
        } = receiptData;

        console.log('Extracted values:', {
            storeName,
            orderId,
            date,
            cashier,
            itemsCount: items.length,
            subtotal,
            total,
            paymentMethod
        });

        // Build receipt as plain text (no ESC/POS commands for A4 printers)
        let receiptText = '';

        // Header - Simple format
        receiptText += storeName + '\r\n';
        receiptText += '\r\n';

        // Address
        if (address) {
            receiptText += address + '\r\n';
        }
        receiptText += '============================================================\r\n';
        receiptText += '\r\n';

        // Order details
        const orderIdStr = orderId ? orderId.toString() : 'N/A';
        receiptText += `Order #: ${orderIdStr}\r\n`;
        
        const dateStr = date ? date.toString() : new Date().toLocaleString();
        receiptText += `Date: ${dateStr}\r\n`;
        
        if (cashier) {
            receiptText += `Cashier: ${cashier}\r\n`;
        }
        receiptText += '\r\n';
        receiptText += '============================================================\r\n';
        receiptText += '\r\n';

        // Items header
        receiptText += 'Item                                    Qty    Price      Total\r\n';
        receiptText += '------------------------------------------------------------\r\n';

        // Print items
        if (items && items.length > 0) {
            console.log(`Processing ${items.length} items...`);
            items.forEach((item, index) => {
                // Try multiple ways to get product name
                const name = item.name || 
                            item.product?.name || 
                            item.Product?.name || 
                            item.productName ||
                            'Unknown Product';
                
                const qty = parseInt(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                const itemSubtotal = parseFloat(item.subtotal) || (price * qty);

                console.log(`Item ${index + 1}: ${name}, Qty: ${qty}, Price: ${price}, Subtotal: ${itemSubtotal}`);

                // Format item line - simple format
                const nameLine = name.length > 35 ? name.substring(0, 32) + '...' : name;
                const qtyStr = qty.toString();
                const priceStr = price.toFixed(2);
                const subtotalStr = itemSubtotal.toFixed(2);

                receiptText += nameLine.padEnd(40) + qtyStr.padStart(5) + priceStr.padStart(10) + subtotalStr.padStart(10) + '\r\n';
            });
        } else {
            console.log('WARNING: No items found in receipt data!');
            receiptText += 'No items found\r\n';
        }

        receiptText += '\r\n';
        receiptText += '------------------------------------------------------------\r\n';
        receiptText += '\r\n';

        // Totals
        receiptText += `Subtotal: ${subtotal.toFixed(2)} ${currency}\r\n`;
        if (discount > 0) {
            receiptText += `Discount: ${discount.toFixed(2)} ${currency}\r\n`;
        }
        if (tax > 0) {
            receiptText += `Tax: ${tax.toFixed(2)} ${currency}\r\n`;
        }

        receiptText += '\r\n';
        receiptText += `TOTAL: ${total.toFixed(2)} ${currency}\r\n`;
        receiptText += '\r\n';
        receiptText += '============================================================\r\n';
        receiptText += `Payment Method: ${paymentMethod}\r\n`;
        receiptText += '\r\n';

        // Footer
        receiptText += 'Thank you for your purchase!\r\n';
        receiptText += '\r\n';
        receiptText += '\r\n';

        // Add form feed to ensure printer prints everything (for A4 printers)
        receiptText += '\f'; // Form feed character (0x0C)

        // For Arabic support on A4 printers, try multiple strategies
        // Many A4 printers don't support ESC/POS commands, so we focus on encoding
        let buffer;
        let encodingUsed = 'utf8';
        
        // Strategy 1: Try UTF-8 with BOM (Byte Order Mark) - some printers need this
        // BOM helps printers recognize UTF-8 encoding
        const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        
        // Strategy 2: Try Windows-1256 (Arabic Windows encoding)
        // Strategy 3: Try CP864 (Arabic DOS encoding)
        // Strategy 4: Plain UTF-8 without BOM
        
        // Check if text contains Arabic characters (Unicode range: 0600-06FF)
        const hasArabic = /[\u0600-\u06FF]/.test(receiptText);
        console.log('Text contains Arabic characters:', hasArabic);
        
        if (hasArabic) {
            // Try multiple Arabic encodings in order of preference
            // Strategy 1: Windows-1256 (most common for Arabic Windows printers)
            try {
                buffer = iconv.encode(receiptText, 'win1256');
                encodingUsed = 'win1256';
                console.log('✓ Using Windows-1256 encoding for Arabic support');
            } catch (err) {
                console.log('Windows-1256 failed, trying ISO-8859-6:', err.message);
                // Strategy 2: ISO-8859-6 (standard Arabic/Latin encoding)
                try {
                    buffer = iconv.encode(receiptText, 'iso-8859-6');
                    encodingUsed = 'iso-8859-6';
                    console.log('✓ Using ISO-8859-6 encoding for Arabic support');
                } catch (err2) {
                    console.log('ISO-8859-6 failed, trying CP864:', err2.message);
                    // Strategy 3: CP864 (Arabic DOS)
                    try {
                        buffer = iconv.encode(receiptText, 'cp864');
                        encodingUsed = 'cp864';
                        console.log('✓ Using CP864 encoding for Arabic support');
                    } catch (err3) {
                        console.log('CP864 failed, trying UTF-8 with BOM:', err3.message);
                        // Strategy 4: UTF-8 with BOM (some printers need BOM to recognize UTF-8)
                        const utf8Buffer = Buffer.from(receiptText, 'utf8');
                        buffer = Buffer.concat([utf8BOM, utf8Buffer]);
                        encodingUsed = 'utf8-bom';
                        console.log('✓ Using UTF-8 with BOM for Arabic support');
                    }
                }
            }
        } else {
            // No Arabic text, use plain UTF-8
            buffer = Buffer.from(receiptText, 'utf8');
            encodingUsed = 'utf8';
            console.log('No Arabic text detected, using UTF-8 encoding');
        }
        
        // For A4 printers, don't send ESC/POS commands as they may interfere
        // Some A4 printers interpret ESC/POS commands as text, causing issues
        // We'll send plain text with proper encoding only
        const finalBuffer = buffer;
        
        // Debug: Log the receipt text
        console.log('=== RECEIPT GENERATION COMPLETE ===');
        console.log('Encoding used:', encodingUsed);
        console.log('Generated receipt text length:', receiptText.length);
        console.log('Final buffer size:', finalBuffer.length, 'bytes');
        console.log('Full receipt content (UTF-8 view):');
        console.log('----------------------------------------');
        console.log(receiptText);
        console.log('----------------------------------------');
        
        // Log sample of encoded buffer for debugging
        if (encodingUsed === 'win1256' || encodingUsed === 'cp864') {
            console.log('Sample encoded bytes (first 50):');
            console.log(finalBuffer.slice(0, 50).toString('hex'));
            // Try to decode back to verify encoding
            try {
                const decoded = iconv.decode(finalBuffer.slice(0, 100), encodingUsed);
                console.log('Decoded sample (first 100 bytes):', decoded.substring(0, 50));
            } catch (e) {
                console.log('Could not decode sample:', e.message);
            }
        }
        
        return finalBuffer;
    }

    /**
     * Test printer connection
     * @param {string} printerIp - IP address of the printer
     * @param {number} port - Printer port
     * @returns {Promise<boolean>} - Success status
     */
    static async testConnection(printerIp, port = 9100) {
        const testData = Buffer.from([0x1B, 0x40]); // Initialize printer
        return this.sendToPrinter(printerIp, port, testData);
    }

    /**
     * Print a test receipt
     * @param {string} printerIp - IP address of the printer
     * @param {number} port - Printer port
     * @param {Object} settings - Store settings
     * @returns {Promise<boolean>} - Success status
     */
    static async printTestReceipt(printerIp, port = 9100, settings = {}) {
        const testReceipt = {
            storeName: settings.storeName || 'My Supermarket',
            address: settings.address || '',
            orderId: 'TEST-001',
            date: new Date().toLocaleString(),
            cashier: 'Test User',
            items: [
                { name: 'Test Product 1', quantity: 2, price: 10.00, subtotal: 20.00 },
                { name: 'Test Product 2', quantity: 1, price: 15.50, subtotal: 15.50 }
            ],
            subtotal: 35.50,
            discount: 0,
            tax: 0,
            total: 35.50,
            paymentMethod: 'CASH',
            currency: settings.currency || 'IQD'
        };

        const receiptBuffer = this.generateReceipt(testReceipt);
        return this.sendToPrinter(printerIp, port, receiptBuffer);
    }
}

module.exports = PrinterService;
