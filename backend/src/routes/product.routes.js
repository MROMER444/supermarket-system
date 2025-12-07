const express = require('express');
const { createProduct, getProducts, getProductByBarcode, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', [verifyToken, isAdmin], createProduct);
router.get('/', [verifyToken], getProducts);
router.get('/barcode/:barcode', [verifyToken], getProductByBarcode);
router.put('/:id', [verifyToken, isAdmin], updateProduct);
router.delete('/:id', [verifyToken, isAdmin], deleteProduct);

module.exports = router;
