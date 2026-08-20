const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { sanitizeUser } = require('./authController');

// GET /api/users/profile
async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [interestRows] = await pool.query(
      `SELECT c.id, c.name FROM user_interests ui JOIN categories c ON c.id = ui.category_id WHERE ui.user_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile fetched successfully.',
      data: { ...sanitizeUser(rows[0]), interests: interestRows }
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/profile
async function updateProfile(req, res, next) {
  try {
    const { name, phone, city, profile_image, interests } = req.body;
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (city !== undefined) { fields.push('city = ?'); values.push(city); }
    if (profile_image !== undefined) { fields.push('profile_image = ?'); values.push(profile_image); }

    if (fields.length > 0) {
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, req.user.id]);
    }

    if (Array.isArray(interests)) {
      await pool.query('DELETE FROM user_interests WHERE user_id = ?', [req.user.id]);
      if (interests.length > 0) {
        const rows = interests.map((categoryId) => [req.user.id, categoryId]);
        await pool.query('INSERT INTO user_interests (user_id, category_id) VALUES ?', [rows]);
      }
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Profile updated successfully.', data: sanitizeUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/password
async function updatePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'current_password and new_password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    const match = await bcrypt.compare(current_password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// ---------------- Admin: user management ----------------

// GET /api/admin/users
async function getAllUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.city, u.role, u.created_at,
        (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status = 'CONFIRMED') AS registration_count
       FROM users u ORDER BY u.created_at DESC`
    );
    res.json({ success: true, message: 'Users fetched successfully.', data: rows });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id/role
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role must be USER or ADMIN.' });
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true, message: 'User role updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/registrations
async function getAllRegistrations(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email, e.title AS event_title, e.event_date
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       JOIN events e ON e.id = r.event_id
       ORDER BY r.registration_date DESC`
    );
    res.json({ success: true, message: 'Registrations fetched successfully.', data: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/dashboard
async function getDashboardStats(req, res, next) {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalEvents }]] = await pool.query('SELECT COUNT(*) AS totalEvents FROM events');
    const [[{ totalRegistrations }]] = await pool.query(
      `SELECT COUNT(*) AS totalRegistrations FROM registrations WHERE status = 'CONFIRMED'`
    );
    const [popularCategories] = await pool.query(
      `SELECT c.name, COUNT(e.id) AS event_count
       FROM categories c LEFT JOIN events e ON e.category_id = c.id
       GROUP BY c.id ORDER BY event_count DESC LIMIT 5`
    );
    const [upcomingEvents] = await pool.query(
      `SELECT id, title, event_date, city FROM events
       WHERE status = 'PUBLISHED' AND event_date >= CURDATE()
       ORDER BY event_date ASC LIMIT 5`
    );

    res.json({
      success: true,
      message: 'Dashboard stats fetched successfully.',
      data: { totalUsers, totalEvents, totalRegistrations, popularCategories, upcomingEvents }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile, updateProfile, updatePassword,
  getAllUsers, deleteUser, updateUserRole,
  getAllRegistrations, getDashboardStats
};
