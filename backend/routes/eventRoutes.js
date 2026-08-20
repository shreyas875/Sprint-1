const express = require('express');
const router = express.Router();
const events = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public
router.get('/search', events.searchEvents);
router.get('/nearby', events.getNearbyEvents);
router.get('/', events.getEvents);
router.get('/:id', events.getEventById);

// Admin only
router.post('/', authMiddleware, adminMiddleware, events.createEvent);
router.put('/:id', authMiddleware, adminMiddleware, events.updateEvent);
router.delete('/:id', authMiddleware, adminMiddleware, events.deleteEvent);

module.exports = router;
