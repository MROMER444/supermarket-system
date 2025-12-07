const express = require('express');
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', [verifyToken, isAdmin], createCategory);
router.get('/', [verifyToken], getCategories);
router.put('/:id', [verifyToken, isAdmin], updateCategory);
router.delete('/:id', [verifyToken, isAdmin], deleteCategory);

module.exports = router;
