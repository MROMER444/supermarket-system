const express = require('express');
const router = express.Router();
const {
    createRefund,
    getRefunds,
    getRefundById,
    getRefundsByOrderId,
} = require('../controllers/refund.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

router.post('/', createRefund);
router.get('/', getRefunds);
router.get('/:id', getRefundById);
router.get('/order/:orderId', getRefundsByOrderId);

module.exports = router;
