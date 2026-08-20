const { pool } = require('../config/db');
const { HAVERSINE_SQL } = require('../utils/distanceCalculator');

// Shared SELECT fragment: event fields + category name + live popularity counts.
const BASE_SELECT = `
  SELECT e.*, c.name AS category_name,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'CONFIRMED') AS registration_count,
    (SELECT COUNT(*) FROM bookmarks b WHERE b.event_id = e.id) AS bookmark_count
  FROM events e
  JOIN categories c ON c.id = e.category_id
`;

function buildDateRangeClause(dateFilter) {
  switch (dateFilter) {
    case 'today':
      return "e.event_date = CURDATE()";
    case 'tomorrow':
      return "e.event_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)";
    case 'this_weekend':
      return "e.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL (6 - WEEKDAY(CURDATE())) DAY)";
    case 'this_week':
      return "YEARWEEK(e.event_date, 1) = YEARWEEK(CURDATE(), 1)";
    case 'this_month':
      return "YEAR(e.event_date) = YEAR(CURDATE()) AND MONTH(e.event_date) = MONTH(CURDATE())";
    default:
      return null;
  }
}

function buildPriceClause(priceFilter) {
  switch (priceFilter) {
    case 'free':
      return 'e.price = 0';
    case 'under_500':
      return 'e.price > 0 AND e.price < 500';
    case '500_1000':
      return 'e.price BETWEEN 500 AND 1000';
    case '1000_plus':
      return 'e.price > 1000';
    default:
      return null;
  }
}

function buildSortClause(sort) {
  switch (sort) {
    case 'newest':
      return 'e.created_at DESC';
    case 'date_asc':
      return 'e.event_date ASC';
    case 'price_low':
      return 'e.price ASC';
    case 'price_high':
      return 'e.price DESC';
    case 'popular':
      return '(registration_count + bookmark_count) DESC';
    default:
      return 'e.event_date ASC'; // "most relevant" default
  }
}

// GET /api/events  (list with filters, sorting, pagination)
async function getEvents(req, res, next) {
  try {
    const {
      category, city, date, price, event_type: eventType,
      start_date: customStart, end_date: customEnd,
      sort, page = 1, limit = 12, status
    } = req.query;

    const where = [];
    const params = [];

    // Public listings only show published events unless explicitly overridden (admin use).
    where.push('e.status = ?');
    params.push(status || 'PUBLISHED');

    if (category) {
      where.push('c.name = ?');
      params.push(category);
    }
    if (city) {
      where.push('e.city = ?');
      params.push(city);
    }
    if (eventType) {
      where.push('e.event_type = ?');
      params.push(eventType.toUpperCase());
    }

    const dateClause = buildDateRangeClause(date);
    if (dateClause) {
      where.push(dateClause);
    } else if (date === 'custom' && customStart && customEnd) {
      where.push('e.event_date BETWEEN ? AND ?');
      params.push(customStart, customEnd);
    }

    const priceClause = buildPriceClause(price);
    if (priceClause) where.push(priceClause);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSortClause(sort);

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM events e JOIN categories c ON c.id = e.category_id ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    res.json({
      success: true,
      message: 'Events fetched successfully.',
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/events/search?q=
async function searchEvents(req, res, next) {
  try {
    const { q = '', page = 1, limit = 12 } = req.query;
    if (!q.trim()) {
      return res.status(400).json({ success: false, message: 'Search query "q" is required.' });
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const offset = (pageNum - 1) * limitNum;
    const like = `%${q.trim()}%`;

    const whereSql = `
      WHERE e.status = 'PUBLISHED' AND (
        e.title LIKE ? OR e.description LIKE ? OR c.name LIKE ? OR e.venue LIKE ? OR e.city LIKE ?
      )
    `;
    const params = [like, like, like, like, like];

    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereSql} ORDER BY e.event_date ASC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM events e JOIN categories c ON c.id = e.category_id ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    res.json({
      success: true,
      message: 'Search results fetched successfully.',
      data: rows,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/events/nearby?latitude=&longitude=&radius=
async function getNearbyEvents(req, res, next) {
  try {
    const { latitude, longitude, radius = 20 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    const [rows] = await pool.query(
      `
      SELECT * FROM (
        ${BASE_SELECT}
        WHERE e.status = 'PUBLISHED' AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
      ) AS evt
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
      `.replace(
        'SELECT e.*, c.name AS category_name,',
        `SELECT e.*, c.name AS category_name, ${HAVERSINE_SQL} AS distance_km,`
      ),
      [lat, lng, lat, radiusKm]
    );

    res.json({
      success: true,
      message: `Events within ${radiusKm} km fetched successfully.`,
      data: rows
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:id
async function getEventById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`${BASE_SELECT} WHERE e.id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = rows[0];

    // Related events: same category, excluding this one, upcoming first.
    const [related] = await pool.query(
      `${BASE_SELECT} WHERE e.category_id = ? AND e.id != ? AND e.status = 'PUBLISHED'
       ORDER BY e.event_date ASC LIMIT 4`,
      [event.category_id, id]
    );

    res.json({
      success: true,
      message: 'Event fetched successfully.',
      data: { ...event, related_events: related }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/events  (admin)
async function createEvent(req, res, next) {
  try {
    const {
      title, description, category_id, organizer_name, organizer_email,
      venue, address, city, latitude, longitude, event_date,
      start_time, end_time, price, capacity, event_type, image_url, status
    } = req.body;

    if (!title || !category_id || !city || !event_date || capacity === undefined) {
      return res.status(400).json({ success: false, message: 'title, category_id, city, event_date and capacity are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO events
        (title, description, category_id, organizer_name, organizer_email, venue, address, city,
         latitude, longitude, event_date, start_time, end_time, price, capacity, available_seats,
         event_type, image_url, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title, description || null, category_id, organizer_name || null, organizer_email || null,
        venue || null, address || null, city, latitude || null, longitude || null, event_date,
        start_time || null, end_time || null, price || 0, capacity, capacity,
        event_type || 'OFFLINE', image_url || null, status || 'PUBLISHED'
      ]
    );

    const [rows] = await pool.query(`${BASE_SELECT} WHERE e.id = ?`, [result.insertId]);
    res.status(201).json({ success: true, message: 'Event created successfully.', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PUT /api/events/:id  (admin)
async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const existing = existingRows[0];

    const fields = [
      'title', 'description', 'category_id', 'organizer_name', 'organizer_email',
      'venue', 'address', 'city', 'latitude', 'longitude', 'event_date',
      'start_time', 'end_time', 'price', 'capacity', 'event_type', 'image_url', 'status'
    ];

    const updates = {};
    fields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // If capacity changes, adjust available_seats proportionally so it never goes negative
    // and reflects existing confirmed bookings.
    if (updates.capacity !== undefined) {
      const [regRows] = await pool.query(
        `SELECT COALESCE(SUM(ticket_quantity),0) AS booked FROM registrations WHERE event_id = ? AND status = 'CONFIRMED'`,
        [id]
      );
      const booked = regRows[0].booked;
      updates.available_seats = Math.max(updates.capacity - booked, 0);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update.' });
    }

    const setSql = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.query(`UPDATE events SET ${setSql} WHERE id = ?`, [...values, id]);

    const [rows] = await pool.query(`${BASE_SELECT} WHERE e.id = ?`, [id]);
    res.json({ success: true, message: 'Event updated successfully.', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/events/:id  (admin)
async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEvents, searchEvents, getNearbyEvents, getEventById,
  createEvent, updateEvent, deleteEvent, BASE_SELECT
};
