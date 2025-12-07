const express = require('express');
const { printReceipt, testPrinter, printTestReceipt } = require('../controllers/print.controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Print receipt for an order
router.post('/receipt/:orderId', [verifyToken], printReceipt);

// Test printer connection
router.post('/test', [verifyToken], testPrinter);

// Print test receipt
router.post('/test-receipt', [verifyToken], printTestReceipt);

module.exports = router;
