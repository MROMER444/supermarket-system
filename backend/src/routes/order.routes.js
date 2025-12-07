const express = require('express');
const { getOrders, getOrderById, getDailyReport, getDashboardStats } = require('../controllers/order.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', [verifyToken, isAdmin], getOrders);
router.get('/daily-report', [verifyToken, isAdmin], getDailyReport);
router.get('/dashboard-stats', [verifyToken, isAdmin], getDashboardStats);
router.get('/:id', [verifyToken], getOrderById);

module.exports = router;
