const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createHash } = require('crypto');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const pool = require('./db');
const entityConfig = require('./config/entities');
const metaRoutes = require('./routes/meta');
const recordsRoutes = require('./routes/records');
const searchRoutes = require('./routes/search');

const app = express();
const port = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'sistema_gestion_social_ong_2026';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  return jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({ error: 'Token invalido o expirado' });
    }

    req.user = user;
    return next();
  });
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const body = req.body || {};
    const { usuario } = body;
    const contraseña = body.contraseña ?? body.contrasena;

    if (!usuario || !contraseña) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await pool.query(
      `
        SELECT
          u.id,
          u.nombre_usuario,
          u.correo_electronico,
          u.hash_contrasena,
          u.esta_activo,
          COALESCE(string_agg(DISTINCT r.nombre, ', ' ORDER BY r.nombre), 'Sin rol asignado') AS rol
        FROM usuario u
        LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
        LEFT JOIN rol r ON r.id = ur.rol_id
        WHERE u.nombre_usuario = $1 OR u.correo_electronico = $1
        GROUP BY u.id
      `,
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña invalidos' });
    }

    const usuarioDb = result.rows[0];
    if (!usuarioDb.esta_activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    const hashMd5 = createHash('md5').update(contraseña).digest('hex');
    const esHashBcrypt = typeof usuarioDb.hash_contrasena === 'string' && usuarioDb.hash_contrasena.startsWith('$2');
    const esValida = esHashBcrypt
      ? await bcrypt.compare(contraseña, usuarioDb.hash_contrasena)
      : hashMd5 === usuarioDb.hash_contrasena;

    if (!esValida) {
      return res.status(401).json({ error: 'Usuario o contraseña invalidos' });
    }

    const token = jwt.sign(
      {
        id: usuarioDb.id,
        nombre: usuarioDb.nombre_usuario,
        correo: usuarioDb.correo_electronico,
        rol: usuarioDb.rol
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuarioDb.id,
        nombre: usuarioDb.nombre_usuario,
        correo: usuarioDb.correo_electronico,
        rol: usuarioDb.rol
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          u.id,
          u.nombre_usuario,
          u.correo_electronico,
          u.esta_activo,
          u.mfa_habilitado,
          u.ultimo_acceso,
          COALESCE(string_agg(DISTINCT r.nombre, ', ' ORDER BY r.nombre), 'Sin rol asignado') AS rol
        FROM usuario u
        LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
        LEFT JOIN rol r ON r.id = ur.rol_id
        WHERE u.id = $1
        GROUP BY u.id
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.use('/api/meta', authenticateToken, metaRoutes(pool, entityConfig));
app.use('/api/records', authenticateToken, recordsRoutes(pool, entityConfig));
app.use('/api/search', authenticateToken, searchRoutes(pool, entityConfig));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    nombre: 'Sistema de Ayudas Sociales API',
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Documentacion Swagger disponible en http://localhost:${port}/api-docs`);
});
