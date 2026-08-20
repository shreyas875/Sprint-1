const { pool } = require('../config/db');

// GET /api/bookmarks (current user's bookmarked events)
async function getMyBookmarks(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT b.id AS bookmark_id, b.created_at AS bookmarked_at, e.*, c.name AS category_name
       FROM bookmarks b
       JOIN events e ON e.id = b.event_id
       JOIN categories c ON c.id = e.category_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Bookmarks fetched successfully.', data: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/bookmarks/:eventId
async function addBookmark(req, res, next) {
  try {
    const { eventId } = req.params;

    const [eventRows] = await pool.query('SELECT id FROM events WHERE id = ?', [eventId]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND event_id = ?',
      [req.user.id, eventId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Event already bookmarked.' });
    }

    await pool.query('INSERT INTO bookmarks (user_id, event_id) VALUES (?, ?)', [req.user.id, eventId]);
    res.status(201).json({ success: true, message: 'Event bookmarked successfully.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/bookmarks/:eventId
async function removeBookmark(req, res, next) {
  try {
    const { eventId } = req.params;
    const [result] = await pool.query(
      'DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?',
      [req.user.id, eventId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    }
    res.json({ success: true, message: 'Bookmark removed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyBookmarks, addBookmark, removeBookmark };
