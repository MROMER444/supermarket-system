const express = require('express');
const { createOrder } = require('../controllers/pos.controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/checkout', [verifyToken], createOrder);

module.exports = router;
