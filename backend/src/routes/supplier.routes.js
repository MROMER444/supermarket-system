const express = require('express');
const { createSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('../controllers/supplier.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', [verifyToken, isAdmin], createSupplier);
router.get('/', [verifyToken], getSuppliers);
router.put('/:id', [verifyToken, isAdmin], updateSupplier);
router.delete('/:id', [verifyToken, isAdmin], deleteSupplier);

module.exports = router;
