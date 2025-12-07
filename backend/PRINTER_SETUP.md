# Printer Setup Guide

This guide will help you set up a thermal receipt printer for your supermarket POS system.

## Supported Printers

The system supports **network thermal printers** that use the **ESC/POS** command set. Most modern thermal printers support this standard, including:

- Epson TM series (TM-T20, TM-T82, TM-T88, etc.)
- Star Micronics printers
- Bixolon printers
- Xprinter models
- Most 58mm and 80mm thermal printers

## Prerequisites

1. **Network-enabled thermal printer** (connected via Ethernet/WiFi)
2. **Printer IP address** (you'll need to find this)
3. **Printer on the same network** as your backend server

## Step 1: Find Your Printer's IP Address

### Method 1: Printer Menu
1. Press the **Menu** or **Settings** button on your printer
2. Navigate to **Network Settings** or **TCP/IP Settings**
3. Look for **IP Address** or **IPv4 Address**
4. Write down the IP address (e.g., `192.168.1.100`)

### Method 2: Printer Configuration Page
1. Print a **configuration page** or **network status page** from your printer
2. Look for the IP address on the printed page

### Method 3: Router Admin Panel
1. Log into your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for **Connected Devices** or **DHCP Client List**
3. Find your printer by name or MAC address
4. Note the assigned IP address

### Method 4: Network Scanner
Use a network scanning tool or command:
```bash
# On Linux/Mac
nmap -sn 192.168.1.0/24

# On Windows (PowerShell)
Get-NetIPAddress | Where-Object {$_.IPAddress -like "192.168.*"}
```

## Step 2: Configure Printer in Settings

### Via API (Backend)

1. **Get current settings:**
   ```bash
   GET http://localhost:5000/api/settings
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

2. **Update printer IP:**
   ```bash
   PUT http://localhost:5000/api/settings
   Headers: 
     Authorization: Bearer YOUR_TOKEN
     Content-Type: application/json
   Body:
   {
     "storeName": "My Supermarket",
     "address": "123 Main St",
     "currency": "IQD",
     "printerIp": "192.168.1.100"
   }
   ```

### Via Frontend (Recommended)

1. Navigate to **Settings** page in your frontend application
2. Enter the printer IP address in the **Printer IP** field
3. Click **Save**

## Step 3: Test Printer Connection

### Test Connection Endpoint

```bash
POST http://localhost:5000/api/print/test
Headers: Authorization: Bearer YOUR_TOKEN
```

**Success Response:**
```json
{
  "message": "Printer connection successful",
  "printerIp": "192.168.1.100"
}
```

**Error Response:**
```json
{
  "message": "Failed to connect to printer",
  "error": "Connection timeout",
  "suggestion": "Please check: 1) Printer is powered on, 2) Printer IP is correct, 3) Printer is on the same network, 4) Port 9100 is open"
}
```

### Print Test Receipt

```bash
POST http://localhost:5000/api/print/test-receipt
Headers: Authorization: Bearer YOUR_TOKEN
```

This will print a sample receipt to verify everything is working.

## Step 4: Print Receipts from Orders

### Print Receipt for an Order

```bash
POST http://localhost:5000/api/print/receipt/:orderId
Headers: Authorization: Bearer YOUR_TOKEN
```

**Example:**
```bash
POST http://localhost:5000/api/print/receipt/123
```

This will automatically print a formatted receipt with:
- Store name and address
- Order number and date
- Cashier name
- List of items (name, quantity, price, subtotal)
- Subtotal, discount, tax
- Total amount
- Payment method
- Thank you message

## Troubleshooting

### Printer Not Connecting

1. **Check Printer Power**
   - Ensure printer is turned on
   - Check power LED indicator

2. **Verify IP Address**
   - Ping the printer: `ping 192.168.1.100`
   - If ping fails, check network connection

3. **Check Network Connection**
   - Ensure printer and server are on the same network
   - Check Ethernet cable or WiFi connection
   - Verify printer's network settings

4. **Check Port**
   - Default port is **9100** (most network printers)
   - Some printers use port **9101** or **515**
   - Check your printer's documentation

5. **Firewall Issues**
   - Ensure port 9100 is not blocked by firewall
   - Check both server and printer firewall settings

### Receipt Format Issues

1. **Text Not Aligning**
   - This is normal for different printer models
   - Adjust column widths in `src/utils/printer.js` if needed

2. **Characters Not Printing Correctly**
   - Ensure printer supports UTF-8 encoding
   - Some printers may need different character encoding

3. **Paper Not Cutting**
   - Check if your printer supports auto-cut
   - Some printers require manual cutting

### Common Printer Ports

- **9100** - Most common (default)
- **9101** - Some Epson printers
- **515** - LPR/LPD protocol
- **631** - IPP (Internet Printing Protocol)

## Advanced Configuration

### Custom Port

If your printer uses a different port, you can modify the port in the print controller:

```javascript
// In src/controllers/print.controller.js
await PrinterService.sendToPrinter(settings.printerIp, 9101, receiptBuffer);
```

### Custom Receipt Format

Edit `src/utils/printer.js` to customize:
- Receipt width
- Font sizes
- Alignment
- Additional fields
- Footer text

### USB Printers

For USB printers, you'll need additional setup:
1. Install printer drivers on the server machine
2. Share printer over network
3. Use the shared printer's network IP

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/print/receipt/:orderId` | POST | Print receipt for an order |
| `/api/print/test` | POST | Test printer connection |
| `/api/print/test-receipt` | POST | Print a test receipt |

All endpoints require authentication (Bearer token).

## Example Receipt Output

```
        MY SUPERMARKET
    123 Main Street, City
--------------------------------
Order #: 123
Date: 12/25/2024, 10:30:00 AM
Cashier: John Doe
--------------------------------
Item                Qty  Price
--------------------------------
Bread
  2x    2.50 =      5.00
Milk
  1x    3.00 =      3.00
--------------------------------
Subtotal:               8.00 IQD
TOTAL:                  8.00 IQD
--------------------------------
Payment: CASH

    Thank you for your purchase!
```

## Support

If you continue to have issues:
1. Check printer manufacturer's documentation
2. Verify ESC/POS compatibility
3. Test with printer's utility software
4. Check server logs for detailed error messages
