const express = require('express');
const router = express.Router();
const categories = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', categories.getCategories);
router.post('/', authMiddleware, adminMiddleware, categories.createCategory);
router.put('/:id', authMiddleware, adminMiddleware, categories.updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, categories.deleteCategory);

module.exports = router;
