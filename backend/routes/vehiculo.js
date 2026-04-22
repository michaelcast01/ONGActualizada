// routes/vehiculo.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// ==================== GET ALL ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehiculo ORDER BY placa');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM vehiculo WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
router.post('/', async (req, res) => {
  try {
    const { placa, tipo, vencimiento_soat, vencimiento_tecnomecanica } = req.body;

    if (!placa || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos: placa, tipo' });
    }

    const [result] = await pool.query(
      'INSERT INTO vehiculo (placa, tipo, vencimiento_soat, vencimiento_tecnomecanica, esta_activo) VALUES (?, ?, ?, ?, true)',
      [placa, tipo, vencimiento_soat, vencimiento_tecnomecanica]
    );

    res.status(201).json({
      id: result.insertId,
      placa,
      tipo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, vencimiento_soat, vencimiento_tecnomecanica, esta_activo } = req.body;

    const [result] = await pool.query(
      'UPDATE vehiculo SET tipo = COALESCE(?, tipo), vencimiento_soat = COALESCE(?, vencimiento_soat), vencimiento_tecnomecanica = COALESCE(?, vencimiento_tecnomecanica), esta_activo = COALESCE(?, esta_activo) WHERE id = ?',
      [tipo, vencimiento_soat, vencimiento_tecnomecanica, esta_activo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json({ message: 'Vehículo actualizado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM vehiculo WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json({ message: 'Vehículo eliminado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;