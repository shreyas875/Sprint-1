const { pool } = require('../config/db');

// POST /api/registrations
// Body: { event_id, ticket_quantity }
// Uses a MySQL transaction with a row lock so seat counts never go negative
// even under concurrent registration attempts.
async function createRegistration(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { event_id: eventId, ticket_quantity: ticketQuantityRaw } = req.body;
    const ticketQuantity = parseInt(ticketQuantityRaw, 10) || 1;

    if (!eventId) {
      connection.release();
      return res.status(400).json({ success: false, message: 'event_id is required.' });
    }
    if (ticketQuantity < 1) {
      connection.release();
      return res.status(400).json({ success: false, message: 'ticket_quantity must be at least 1.' });
    }

    await connection.beginTransaction();

    // Lock the event row to safely check/decrement available_seats.
    const [eventRows] = await connection.query(
      'SELECT * FROM events WHERE id = ? FOR UPDATE',
      [eventId]
    );

    if (eventRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventRows[0];

    if (event.status !== 'PUBLISHED') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'This event is not open for registration.' });
    }

    const [existingReg] = await connection.query(
      `SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status = 'CONFIRMED'`,
      [userId, eventId]
    );
    if (existingReg.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: 'You are already registered for this event.' });
    }

    if (event.available_seats < ticketQuantity) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Only ${event.available_seats} seat(s) left. Requested ${ticketQuantity}.`
      });
    }

    // Decrement seats — guarded again in the WHERE clause to prevent negative values.
    const [updateResult] = await connection.query(
      'UPDATE events SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?',
      [ticketQuantity, eventId, ticketQuantity]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: 'Seats just became unavailable. Please try again.' });
    }

    const [insertResult] = await connection.query(
      `INSERT INTO registrations (user_id, event_id, status, ticket_quantity) VALUES (?, ?, 'CONFIRMED', ?)`,
      [userId, eventId, ticketQuantity]
    );

    await connection.commit();
    connection.release();

    const [regRows] = await pool.query(
      `SELECT r.*, e.title AS event_title, e.event_date, e.venue
       FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.id = ?`,
      [insertResult.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Registration confirmed successfully.',
      data: regRows[0]
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
}

// GET /api/registrations  (current user's registrations)
async function getMyRegistrations(req, res, next) {
  try {
    const { status } = req.query;
    const params = [req.user.id];
    let statusClause = '';
    if (status) {
      statusClause = 'AND r.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT r.*, e.title, e.event_date, e.start_time, e.venue, e.city, e.price, e.image_url, e.status AS event_status
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ? ${statusClause}
       ORDER BY e.event_date ASC`,
      params
    );

    res.json({ success: true, message: 'Registrations fetched successfully.', data: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/registrations/:id
async function getRegistrationById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT r.*, e.title, e.event_date, e.venue, e.city
       FROM registrations r JOIN events e ON e.id = r.event_id
       WHERE r.id = ? AND (r.user_id = ? OR ? = 'ADMIN')`,
      [id, req.user.id, req.user.role]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }
    res.json({ success: true, message: 'Registration fetched successfully.', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/registrations/:id  (cancel registration, restore seats)
async function cancelRegistration(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [regRows] = await connection.query('SELECT * FROM registrations WHERE id = ? FOR UPDATE', [id]);
    if (regRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const registration = regRows[0];

    if (registration.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      await connection.rollback();
      connection.release();
      return res.status(403).json({ success: false, message: 'You cannot cancel this registration.' });
    }

    if (registration.status === 'CANCELLED') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Registration is already cancelled.' });
    }

    await connection.query(`UPDATE registrations SET status = 'CANCELLED' WHERE id = ?`, [id]);
    await connection.query(
      'UPDATE events SET available_seats = available_seats + ? WHERE id = ?',
      [registration.ticket_quantity, registration.event_id]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
}

module.exports = { createRegistration, getMyRegistrations, getRegistrationById, cancelRegistration };
