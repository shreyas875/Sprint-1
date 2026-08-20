const express = require('express');
const router = express.Router();
const users = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Profile (self-service)
router.get('/profile', authMiddleware, users.getProfile);
router.put('/profile', authMiddleware, users.updateProfile);
router.put('/password', authMiddleware, users.updatePassword);

// Admin
router.get('/admin/all', authMiddleware, adminMiddleware, users.getAllUsers);
router.delete('/admin/:id', authMiddleware, adminMiddleware, users.deleteUser);
router.put('/admin/:id/role', authMiddleware, adminMiddleware, users.updateUserRole);

module.exports = router;
