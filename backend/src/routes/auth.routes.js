const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', [verifyToken, isAdmin], register);
router.post('/login', login);

module.exports = router;
