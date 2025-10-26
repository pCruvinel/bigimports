const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout de usuário
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obter dados do usuário autenticado
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
