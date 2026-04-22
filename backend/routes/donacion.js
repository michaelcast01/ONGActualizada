// routes/donacion.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// ==================== GET ALL ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, donante.nombre_completo 
      FROM donacion d
      LEFT JOIN donante ON d.donante_id = donante.id
      ORDER BY d.fecha_donacion DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, donante.nombre_completo 
      FROM donacion d
      LEFT JOIN donante ON d.donante_id = donante.id
      WHERE d.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
router.post('/', async (req, res) => {
  try {
    const { donante_id, fecha_donacion, tipo, valor_estimado, metodo_recepcion } = req.body;

    if (!donante_id || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos: donante_id, tipo' });
    }

    const [result] = await pool.query(
      'INSERT INTO donacion (donante_id, fecha_donacion, tipo, valor_estimado, metodo_recepcion) VALUES (?, ?, ?, ?, ?)',
      [donante_id, fecha_donacion || new Date(), tipo, valor_estimado, metodo_recepcion]
    );

    res.status(201).json({
      id: result.insertId,
      donante_id,
      tipo,
      valor_estimado
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, valor_estimado, metodo_recepcion } = req.body;

    const [result] = await pool.query(
      'UPDATE donacion SET tipo = COALESCE(?, tipo), valor_estimado = COALESCE(?, valor_estimado), metodo_recepcion = COALESCE(?, metodo_recepcion) WHERE id = ?',
      [tipo, valor_estimado, metodo_recepcion, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }

    res.json({ message: 'Donación actualizada', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM donacion WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }

    res.json({ message: 'Donación eliminada', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;