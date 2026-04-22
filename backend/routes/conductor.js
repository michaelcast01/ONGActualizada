// routes/conductor.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// ==================== GET ALL ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM conductor ORDER BY nombre_completo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM conductor WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
router.post('/', async (req, res) => {
  try {
    const { numero_documento, nombre_completo, numero_licencia, vencimiento_licencia, telefono } = req.body;

    if (!numero_documento || !nombre_completo || !numero_licencia) {
      return res.status(400).json({ 
        error: 'Campos requeridos: numero_documento, nombre_completo, numero_licencia' 
      });
    }

    const [result] = await pool.query(
      'INSERT INTO conductor (numero_documento, nombre_completo, numero_licencia, vencimiento_licencia, telefono) VALUES (?, ?, ?, ?, ?)',
      [numero_documento, nombre_completo, numero_licencia, vencimiento_licencia, telefono]
    );

    res.status(201).json({
      id: result.insertId,
      numero_documento,
      nombre_completo,
      numero_licencia
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, numero_licencia, vencimiento_licencia, telefono } = req.body;

    const [result] = await pool.query(
      'UPDATE conductor SET nombre_completo = COALESCE(?, nombre_completo), numero_licencia = COALESCE(?, numero_licencia), vencimiento_licencia = COALESCE(?, vencimiento_licencia), telefono = COALESCE(?, telefono) WHERE id = ?',
      [nombre_completo, numero_licencia, vencimiento_licencia, telefono, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    res.json({ message: 'Conductor actualizado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM conductor WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    res.json({ message: 'Conductor eliminado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;