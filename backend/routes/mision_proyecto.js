// routes/mision_proyecto.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// ==================== GET ALL ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mision_proyecto ORDER BY nombre_mision');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM mision_proyecto WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Misión no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
router.post('/', async (req, res) => {
  try {
    const { nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado } = req.body;

    if (!nombre_mision || !tipo_mision) {
      return res.status(400).json({ error: 'Campos requeridos: nombre_mision, tipo_mision' });
    }

    const [result] = await pool.query(
      'INSERT INTO mision_proyecto (nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado || 'PLANIFICADA']
    );

    res.status(201).json({
      id: result.insertId,
      nombre_mision,
      tipo_mision
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE mision_proyecto SET nombre_mision = COALESCE(?, nombre_mision), tipo_mision = COALESCE(?, tipo_mision), fecha_inicio = COALESCE(?, fecha_inicio), fecha_fin = COALESCE(?, fecha_fin), cod_municipio_objetivo = COALESCE(?, cod_municipio_objetivo), estado = COALESCE(?, estado) WHERE id = ?',
      [nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Misión no encontrada' });
    }

    res.json({ message: 'Misión actualizada', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM mision_proyecto WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Misión no encontrada' });
    }

    res.json({ message: 'Misión eliminada', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;