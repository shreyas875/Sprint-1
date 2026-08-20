const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Strip password before sending user objects back to the client.
function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, phone, city, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, city, role) VALUES (?, ?, ?, ?, ?, 'USER')`,
      [name, email, hashed, phone || null, city || null]
    );

    const userId = result.insertId;

    if (Array.isArray(interests) && interests.length > 0) {
      const values = interests.map((categoryId) => [userId, categoryId]);
      await pool.query('INSERT INTO user_interests (user_id, category_id) VALUES ?', [values]);
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: sanitizeUser(user), token }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: sanitizeUser(user), token }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
// Stateless JWT — logout is handled client-side by discarding the token.
// This endpoint exists for API completeness / future token-blacklisting.
async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'Current user fetched.', data: sanitizeUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe, sanitizeUser };
