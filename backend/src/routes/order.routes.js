const express = require('express');
const { getOrders, getOrderById, getDailyReport, getDashboardStats } = require('../controllers/order.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', [verifyToken], getOrders); // Allow both ADMIN and CASHIER - cashiers see only their orders
router.get('/daily-report', [verifyToken], getDailyReport); // Allow both ADMIN and CASHIER - cashiers see only their orders
router.get('/dashboard-stats', [verifyToken], getDashboardStats); // Allow both ADMIN and CASHIER to view dashboard stats
router.get('/:id', [verifyToken], getOrderById);

module.exports = router;
