// routes/beneficiario.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// ==================== GET ALL ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM beneficiario ORDER BY primer_nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM beneficiario WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
router.post('/', async (req, res) => {
  try {
    const { tipo_documento, numero_documento, primer_nombre, apellido, fecha_nacimiento, genero, telefono_principal, correo, es_victima_conflicto, tiene_discapacidad, grupo_etnico } = req.body;

    if (!tipo_documento || !numero_documento || !primer_nombre || !apellido) {
      return res.status(400).json({ error: 'Campos requeridos: tipo_documento, numero_documento, primer_nombre, apellido' });
    }

    const [result] = await pool.query(
      `INSERT INTO beneficiario (tipo_documento, numero_documento, primer_nombre, apellido, fecha_nacimiento, genero, telefono_principal, correo, es_victima_conflicto, tiene_discapacidad, grupo_etnico) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo_documento, numero_documento, primer_nombre, apellido, fecha_nacimiento, genero, telefono_principal, correo, es_victima_conflicto || false, tiene_discapacidad || false, grupo_etnico]
    );

    res.status(201).json({
      id: result.insertId,
      numero_documento,
      primer_nombre,
      apellido
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    const query = `UPDATE beneficiario SET ${updates.join(', ')} WHERE id = ?`;

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }

    res.json({ message: 'Beneficiario actualizado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM beneficiario WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }

    res.json({ message: 'Beneficiario eliminado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;