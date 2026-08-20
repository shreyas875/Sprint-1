const express = require('express');
const router = express.Router();
const users = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', users.getDashboardStats);
router.get('/registrations', users.getAllRegistrations);
router.get('/users', users.getAllUsers);

module.exports = router;
