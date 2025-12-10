const express = require('express');
const { register, login, getUsers, updateUser, deleteUser } = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', [verifyToken, isAdmin], register);
router.post('/login', login);
router.get('/users', [verifyToken, isAdmin], getUsers);
router.put('/users/:id', [verifyToken, isAdmin], updateUser);
router.delete('/users/:id', [verifyToken, isAdmin], deleteUser);

module.exports = router;
