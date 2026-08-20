const { pool } = require('../config/db');
const { scoreEvents } = require('../utils/recommendationEngine');
const { BASE_SELECT } = require('./eventController');

// GET /api/recommendations
// Personalizes upcoming published events for the logged-in user based on:
// interests, preferred city, popularity, and how soon the event is happening.
async function getRecommendations(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);

    const [userRows] = await pool.query('SELECT city FROM users WHERE id = ?', [userId]);
    const preferredCity = userRows[0] ? userRows[0].city : null;

    const [interestRows] = await pool.query(
      'SELECT category_id FROM user_interests WHERE user_id = ?',
      [userId]
    );
    const interestCategoryIds = interestRows.map((r) => r.category_id);

    const [events] = await pool.query(
      `${BASE_SELECT} WHERE e.status = 'PUBLISHED' AND e.event_date >= CURDATE()`
    );

    const scored = scoreEvents(events, { interestCategoryIds, preferredCity });

    res.json({
      success: true,
      message: 'Recommendations generated successfully.',
      data: scored.slice(0, limit)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendations };
