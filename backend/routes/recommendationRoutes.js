const express = require('express');
const router = express.Router();
const recommendations = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, recommendations.getRecommendations);

module.exports = router;
