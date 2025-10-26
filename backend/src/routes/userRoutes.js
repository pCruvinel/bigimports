const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Todas as rotas de usuário são protegidas por autenticação
 */

/**
 * @route   GET /api/user/status
 * @desc    Obter status da conexão do usuário
 * @access  Private (User)
 */
router.get('/status', authMiddleware, userController.getStatus);

/**
 * @route   POST /api/user/connect
 * @desc    Conectar instância WhatsApp
 * @access  Private (User)
 */
router.post('/connect', authMiddleware, userController.connect);

/**
 * @route   POST /api/user/regenerate-qr
 * @desc    Regenerar QR Code
 * @access  Private (User)
 */
router.post('/regenerate-qr', authMiddleware, userController.regenerateQR);

/**
 * @route   POST /api/user/disconnect
 * @desc    Desconectar instância WhatsApp
 * @access  Private (User)
 */
router.post('/disconnect', authMiddleware, userController.disconnect);

module.exports = router;
