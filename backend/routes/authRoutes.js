const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/me', authMiddleware, auth.getMe);

module.exports = router;
