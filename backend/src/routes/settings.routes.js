const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', [verifyToken], getSettings);
router.put('/', [verifyToken, isAdmin], updateSettings);

module.exports = router;
