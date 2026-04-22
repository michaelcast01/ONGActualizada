// routes/donante.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// ==================== GET ALL ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM donante ORDER BY nombre_completo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM donante WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Donante no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
router.post('/', async (req, res) => {
  try {
    const { tipo, nombre_completo, numero_documento, correo } = req.body;

    if (!tipo || !nombre_completo) {
      return res.status(400).json({ error: 'Campos requeridos: tipo, nombre_completo' });
    }

    const [result] = await pool.query(
      'INSERT INTO donante (tipo, nombre_completo, numero_documento, correo) VALUES (?, ?, ?, ?)',
      [tipo, nombre_completo, numero_documento, correo]
    );

    res.status(201).json({
      id: result.insertId,
      tipo,
      nombre_completo,
      numero_documento,
      correo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, nombre_completo, numero_documento, correo } = req.body;

    const [result] = await pool.query(
      'UPDATE donante SET tipo = COALESCE(?, tipo), nombre_completo = COALESCE(?, nombre_completo), numero_documento = COALESCE(?, numero_documento), correo = COALESCE(?, correo) WHERE id = ?',
      [tipo, nombre_completo, numero_documento, correo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donante no encontrado' });
    }

    res.json({ message: 'Donante actualizado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM donante WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donante no encontrado' });
    }

    res.json({ message: 'Donante eliminado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;