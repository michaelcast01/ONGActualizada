// routes/usuario.js
const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const router = express.Router();

// ==================== GET ALL ====================
// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre_usuario, correo_electronico, ultima_actividad FROM usuario ORDER BY nombre_usuario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GET BY ID ====================
// Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, nombre_usuario, correo_electronico, ultima_actividad FROM usuario WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== POST (CREATE) ====================
// Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { nombre_usuario, correo_electronico, contraseña } = req.body;

    if (!nombre_usuario || !correo_electronico || !contraseña) {
      return res.status(400).json({ error: 'Campos requeridos: nombre_usuario, correo_electronico, contraseña' });
    }

    // Hash de contraseña
    const hash_contrasena = await bcrypt.hash(contraseña, 10);

    const [result] = await pool.query(
      'INSERT INTO usuario (nombre_usuario, correo_electronico, hash_contrasena) VALUES (?, ?, ?)',
      [nombre_usuario, correo_electronico, hash_contrasena]
    );

    res.status(201).json({
      id: result.insertId,
      nombre_usuario,
      correo_electronico
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT (UPDATE) ====================
// Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, correo_electronico, contraseña } = req.body;

    let updateQuery = 'UPDATE usuario SET ';
    const updateValues = [];

    if (nombre_usuario) {
      updateQuery += 'nombre_usuario = ?, ';
      updateValues.push(nombre_usuario);
    }

    if (correo_electronico) {
      updateQuery += 'correo_electronico = ?, ';
      updateValues.push(correo_electronico);
    }

    if (contraseña) {
      const hash_contrasena = await bcrypt.hash(contraseña, 10);
      updateQuery += 'hash_contrasena = ?, ';
      updateValues.push(hash_contrasena);
    }

    if (updateValues.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    // Remover la última coma
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    const [result] = await pool.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario actualizado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DELETE ====================
// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM usuario WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;