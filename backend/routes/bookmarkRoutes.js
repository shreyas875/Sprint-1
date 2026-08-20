const express = require('express');
const router = express.Router();
const bookmarks = require('../controllers/bookmarkController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', bookmarks.getMyBookmarks);
router.post('/:eventId', bookmarks.addBookmark);
router.delete('/:eventId', bookmarks.removeBookmark);

module.exports = router;
