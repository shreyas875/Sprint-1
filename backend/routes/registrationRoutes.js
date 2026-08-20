const express = require('express');
const router = express.Router();
const registrations = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', registrations.createRegistration);
router.get('/', registrations.getMyRegistrations);
router.get('/:id', registrations.getRegistrationById);
router.delete('/:id', registrations.cancelRegistration);

module.exports = router;
