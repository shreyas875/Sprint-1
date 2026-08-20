const { pool } = require('../config/db');

// GET /api/categories
async function getCategories(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM events e WHERE e.category_id = c.id) AS event_count
       FROM categories c ORDER BY c.name ASC`
    );
    res.json({ success: true, message: 'Categories fetched successfully.', data: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/categories (admin)
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required.' });
    }
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    res.status(201).json({ success: true, message: 'Category created successfully.', data: { id: result.insertId, name, description } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    }
    next(err);
  }
}

// PUT /api/categories/:id (admin)
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const [result] = await pool.query(
      'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [name || null, description || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id (admin)
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ success: false, message: 'Cannot delete a category that has events. Reassign or delete those events first.' });
    }
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
