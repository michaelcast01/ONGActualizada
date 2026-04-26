const express = require('express');
const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_MISSION_NAME = 'Compatibilidad API antigua';

const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El registro ya existe' });
    }
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar porque tiene registros asociados' });
    }
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const splitName = (nombres) => {
  const parts = String(nombres || '').trim().split(/\s+/).filter(Boolean);
  return {
    primer_nombre: parts.shift() || '',
    apellidos: parts.join(' ') || 'Sin apellidos'
  };
};

const addTokenSearch = (clauses, params, q, expression) => {
  const search = String(q || '').trim();
  if (!search) return;

  params.push(`%${search}%`);
  const fullSearchParam = params.length;
  const tokens = search.split(/\s+/).filter(Boolean);
  const tokenClauses = tokens.map((token) => {
    params.push(`%${token}%`);
    return `${expression} ILIKE $${params.length}`;
  });

  clauses.push(`(${expression} ILIKE $${fullSearchParam} OR (${tokenClauses.join(' AND ')}))`);
};

const beneficiarioCtes = `
  WITH regiones AS (
    SELECT row_number() OVER (ORDER BY cod_departamento_divipola)::int AS id_region,
           cod_departamento_divipola
    FROM (
      SELECT DISTINCT cod_departamento_divipola
      FROM direccion_ubicacion
      WHERE cod_departamento_divipola IS NOT NULL
    ) r
  ),
  ciudades AS (
    SELECT row_number() OVER (ORDER BY cod_municipio_divipola)::int AS id_ciudad,
           cod_municipio_divipola,
           cod_departamento_divipola
    FROM (
      SELECT DISTINCT cod_municipio_divipola, cod_departamento_divipola
      FROM direccion_ubicacion
      WHERE cod_municipio_divipola IS NOT NULL
    ) c
  ),
  tipos_poblacion AS (
    SELECT row_number() OVER (ORDER BY grupo_sisben)::int AS id_tipo_poblacion,
           grupo_sisben
    FROM (
      SELECT DISTINCT grupo_sisben
      FROM beneficiario
      WHERE grupo_sisben IS NOT NULL
    ) p
  ),
  beneficiario_ayudas AS (
    SELECT ee.beneficiario_id,
           string_agg(DISTINCT ii.nombre, ', ' ORDER BY ii.nombre) AS tipos_ayuda
    FROM entrega_encabezado ee
    JOIN entrega_detalle ed ON ed.entrega_encabezado_id = ee.id
    JOIN lote_inventario li ON li.id = ed.lote_inventario_id
    JOIN item_inventario ii ON ii.id = li.item_id
    GROUP BY ee.beneficiario_id
  )
`;

const beneficiarioSelect = `
  SELECT
    b.id AS id_beneficiario,
    concat_ws(' ', b.primer_nombre, b.apellidos) AS nombres,
    b.numero_documento AS documento,
    b.telefono_principal AS telefono,
    b.correo,
    du.direccion_fisica AS direccion,
    c.id_ciudad,
    du.cod_municipio_divipola AS codigo_dane_municipio,
    COALESCE(du.cod_municipio_divipola, 'Sin ciudad') AS nombre_ciudad,
    r.id_region,
    du.cod_departamento_divipola AS codigo_dane_departamento,
    COALESCE(du.cod_departamento_divipola, 'Sin region') AS nombre_region,
    pt.id_tipo_poblacion,
    b.grupo_sisben AS nombre_tipo,
    ba.tipos_ayuda
  FROM beneficiario b
  LEFT JOIN LATERAL (
    SELECT * FROM direccion_ubicacion d WHERE d.beneficiario_id = b.id ORDER BY d.id LIMIT 1
  ) du ON true
  LEFT JOIN ciudades c ON c.cod_municipio_divipola = du.cod_municipio_divipola
  LEFT JOIN regiones r ON r.cod_departamento_divipola = du.cod_departamento_divipola
  LEFT JOIN tipos_poblacion pt ON pt.grupo_sisben = b.grupo_sisben
  LEFT JOIN beneficiario_ayudas ba ON ba.beneficiario_id = b.id
`;

const buildBeneficiarioWhere = (query) => {
  const clauses = [];
  const params = [];

  addTokenSearch(
    clauses,
    params,
    query.q,
    "concat_ws(' ', b.primer_nombre, b.apellidos, b.numero_documento, b.correo)"
  );

  if (query.cityId) {
    params.push(String(query.cityId));
    clauses.push(`(c.id_ciudad::text = $${params.length} OR du.cod_municipio_divipola = $${params.length})`);
  }

  if (query.populationTypeId) {
    params.push(String(query.populationTypeId));
    clauses.push(`(pt.id_tipo_poblacion::text = $${params.length} OR b.grupo_sisben = $${params.length})`);
  }

  if (query.helpTypeId) {
    params.push(String(query.helpTypeId));
    clauses.push(`EXISTS (
      SELECT 1
      FROM entrega_encabezado eef
      JOIN entrega_detalle edf ON edf.entrega_encabezado_id = eef.id
      JOIN lote_inventario lif ON lif.id = edf.lote_inventario_id
      JOIN item_inventario iif ON iif.id = lif.item_id
      WHERE eef.beneficiario_id = b.id
        AND (iif.id::text = $${params.length} OR iif.nombre ILIKE $${params.length})
    )`);
  }

  return { whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

const entregaQuery = `
  WITH ciudades AS (
    SELECT row_number() OVER (ORDER BY cod_municipio_divipola)::int AS id_ciudad,
           cod_municipio_divipola,
           cod_departamento_divipola
    FROM (
      SELECT DISTINCT cod_municipio_divipola, cod_departamento_divipola
      FROM direccion_ubicacion
      WHERE cod_municipio_divipola IS NOT NULL
    ) c
  ),
  regiones AS (
    SELECT row_number() OVER (ORDER BY cod_departamento_divipola)::int AS id_region,
           cod_departamento_divipola
    FROM (
      SELECT DISTINCT cod_departamento_divipola
      FROM direccion_ubicacion
      WHERE cod_departamento_divipola IS NOT NULL
    ) r
  )
  SELECT
    ee.id AS id_entrega,
    ee.fecha_entrega::date AS fecha_entrega,
    b.id AS id_beneficiario,
    concat_ws(' ', b.primer_nombre, b.apellidos) AS beneficiario,
    c.id_ciudad AS id_ciudad_entrega,
    du.cod_municipio_divipola AS codigo_dane_municipio,
    COALESCE(du.cod_municipio_divipola, 'Sin ciudad') AS nombre_ciudad,
    r.id_region,
    du.cod_departamento_divipola AS codigo_dane_departamento,
    COALESCE(du.cod_departamento_divipola, 'Sin region') AS nombre_region,
    u.id AS id_colaborador,
    u.nombre_usuario AS nombre_colaborador,
    ii.id AS id_tipo_ayuda,
    ii.nombre AS nombre_ayuda,
    ed.cantidad_entregada AS cantidad,
    ee.estado AS observaciones
  FROM entrega_encabezado ee
  JOIN beneficiario b ON b.id = ee.beneficiario_id
  JOIN usuario u ON u.id = ee.usuario_id
  LEFT JOIN LATERAL (
    SELECT * FROM direccion_ubicacion d WHERE d.beneficiario_id = b.id ORDER BY d.id LIMIT 1
  ) du ON true
  LEFT JOIN ciudades c ON c.cod_municipio_divipola = du.cod_municipio_divipola
  LEFT JOIN regiones r ON r.cod_departamento_divipola = du.cod_departamento_divipola
  LEFT JOIN LATERAL (
    SELECT * FROM entrega_detalle det WHERE det.entrega_encabezado_id = ee.id ORDER BY det.id LIMIT 1
  ) ed ON true
  LEFT JOIN lote_inventario li ON li.id = ed.lote_inventario_id
  LEFT JOIN item_inventario ii ON ii.id = li.item_id
`;

const buildEntregaWhere = (query) => {
  const clauses = [];
  const params = [];

  addTokenSearch(
    clauses,
    params,
    query.q,
    "concat_ws(' ', b.primer_nombre, b.apellidos, b.numero_documento, ii.nombre, u.nombre_usuario)"
  );

  if (query.cityId) {
    params.push(String(query.cityId));
    clauses.push(`(c.id_ciudad::text = $${params.length} OR du.cod_municipio_divipola = $${params.length})`);
  }
  if (query.populationTypeId) {
    params.push(String(query.populationTypeId));
    clauses.push(`b.grupo_sisben = $${params.length}`);
  }
  if (query.helpTypeId) {
    params.push(String(query.helpTypeId));
    clauses.push(`(ii.id::text = $${params.length} OR ii.nombre ILIKE $${params.length})`);
  }

  return { whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

async function resolveCity(pool, cityId) {
  if (!cityId) return { cod_municipio_divipola: null, cod_departamento_divipola: null };
  const result = await pool.query(
    `
      WITH ciudades AS (
        SELECT row_number() OVER (ORDER BY cod_municipio_divipola)::int AS id_ciudad,
               cod_municipio_divipola,
               cod_departamento_divipola
        FROM (
          SELECT DISTINCT cod_municipio_divipola, cod_departamento_divipola
          FROM direccion_ubicacion
          WHERE cod_municipio_divipola IS NOT NULL
        ) c
      )
      SELECT cod_municipio_divipola, cod_departamento_divipola
      FROM ciudades
      WHERE id_ciudad::text = $1 OR cod_municipio_divipola = $1
      LIMIT 1
    `,
    [String(cityId)]
  );
  return result.rows[0] || { cod_municipio_divipola: String(cityId), cod_departamento_divipola: null };
}

async function resolvePopulationType(pool, populationTypeId) {
  if (!populationTypeId) return null;
  const result = await pool.query(
    `
      WITH tipos_poblacion AS (
        SELECT row_number() OVER (ORDER BY grupo_sisben)::int AS id_tipo_poblacion,
               grupo_sisben
        FROM (SELECT DISTINCT grupo_sisben FROM beneficiario WHERE grupo_sisben IS NOT NULL) p
      )
      SELECT grupo_sisben
      FROM tipos_poblacion
      WHERE id_tipo_poblacion::text = $1 OR grupo_sisben = $1
      LIMIT 1
    `,
    [String(populationTypeId)]
  );
  return result.rows[0]?.grupo_sisben || String(populationTypeId);
}

async function getDefaultMissionId(pool) {
  const existing = await pool.query('SELECT id FROM mision_operativa WHERE nombre_mision = $1 LIMIT 1', [DEFAULT_MISSION_NAME]);
  if (existing.rows.length > 0) return existing.rows[0].id;
  const created = await pool.query(
    "INSERT INTO mision_operativa (nombre_mision, tipo_mision, estado) VALUES ($1, 'Jornada', 'En Curso') RETURNING id",
    [DEFAULT_MISSION_NAME]
  );
  return created.rows[0].id;
}

async function getLoteForItem(pool, itemId) {
  const existing = await pool.query('SELECT id FROM lote_inventario WHERE item_id = $1 ORDER BY id LIMIT 1', [itemId]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const donante = await pool.query("INSERT INTO donante (tipo, nombre_completo) VALUES ('Anonimo', 'Compatibilidad API antigua') RETURNING id");
  const donacion = await pool.query(
    "INSERT INTO donacion (donante_id, tipo, valor_estimado) VALUES ($1, 'Fisica', 0) RETURNING id",
    [donante.rows[0].id]
  );
  const created = await pool.query(
    "INSERT INTO lote_inventario (item_id, donacion_id, numero_lote, cantidad_inicial, stock_actual) VALUES ($1, $2, 'LEGACY', 999999, 999999) RETURNING id",
    [itemId, donacion.rows[0].id]
  );
  return created.rows[0].id;
}

module.exports = (pool, authenticateToken) => {
  const router = express.Router();

  router.get('/dashboard/summary', asyncHandler(async (req, res) => {
    const [beneficiarios, colaboradores, entregas, ciudades, topCities] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM beneficiario'),
      pool.query('SELECT COUNT(*)::int AS total FROM usuario'),
      pool.query('SELECT COUNT(*)::int AS total FROM entrega_encabezado'),
      pool.query('SELECT COUNT(DISTINCT cod_municipio_divipola)::int AS total FROM direccion_ubicacion WHERE cod_municipio_divipola IS NOT NULL'),
      pool.query(`
        SELECT COALESCE(du.cod_municipio_divipola, 'Sin ciudad') AS nombre_ciudad,
               du.cod_municipio_divipola AS codigo_dane_municipio,
               COALESCE(du.cod_departamento_divipola, 'Sin region') AS nombre_region,
               du.cod_departamento_divipola AS codigo_dane_departamento,
               COUNT(*)::int AS total_entregas
        FROM entrega_encabezado ee
        JOIN beneficiario b ON b.id = ee.beneficiario_id
        LEFT JOIN LATERAL (SELECT * FROM direccion_ubicacion d WHERE d.beneficiario_id = b.id ORDER BY d.id LIMIT 1) du ON true
        GROUP BY du.cod_municipio_divipola, du.cod_departamento_divipola
        ORDER BY total_entregas DESC
        LIMIT 5
      `)
    ]);
    res.json({
      totalBeneficiarios: beneficiarios.rows[0].total,
      totalColaboradores: colaboradores.rows[0].total,
      totalEntregas: entregas.rows[0].total,
      totalCiudades: ciudades.rows[0].total,
      topCities: topCities.rows
    });
  }));

  router.get('/catalogos/regiones', asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT row_number() OVER (ORDER BY cod_departamento_divipola)::int AS id_region,
             cod_departamento_divipola AS codigo_dane_departamento,
             COALESCE(cod_departamento_divipola, 'Sin region') AS nombre_region
      FROM (SELECT DISTINCT cod_departamento_divipola FROM direccion_ubicacion WHERE cod_departamento_divipola IS NOT NULL) r
    `);
    res.json(result.rows);
  }));

  router.get('/catalogos/ciudades', asyncHandler(async (req, res) => {
    const result = await pool.query(`
      WITH regiones AS (
        SELECT row_number() OVER (ORDER BY cod_departamento_divipola)::int AS id_region, cod_departamento_divipola
        FROM (SELECT DISTINCT cod_departamento_divipola FROM direccion_ubicacion WHERE cod_departamento_divipola IS NOT NULL) r
      )
      SELECT row_number() OVER (ORDER BY c.cod_municipio_divipola)::int AS id_ciudad,
             c.cod_municipio_divipola AS codigo_dane_municipio,
             COALESCE(c.cod_municipio_divipola, 'Sin ciudad') AS nombre_ciudad,
             r.id_region,
             c.cod_departamento_divipola AS codigo_dane_departamento,
             COALESCE(c.cod_departamento_divipola, 'Sin region') AS nombre_region
      FROM (SELECT DISTINCT cod_municipio_divipola, cod_departamento_divipola FROM direccion_ubicacion WHERE cod_municipio_divipola IS NOT NULL) c
      LEFT JOIN regiones r ON r.cod_departamento_divipola = c.cod_departamento_divipola
    `);
    res.json(result.rows);
  }));

  router.get('/catalogos/tipos-poblacion', asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT row_number() OVER (ORDER BY grupo_sisben)::int AS id_tipo_poblacion,
             grupo_sisben AS nombre_tipo
      FROM (SELECT DISTINCT grupo_sisben FROM beneficiario WHERE grupo_sisben IS NOT NULL) p
    `);
    res.json(result.rows);
  }));

  router.get('/catalogos/tipos-ayuda', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT id AS id_tipo_ayuda, nombre AS nombre_ayuda, categoria AS descripcion FROM item_inventario ORDER BY nombre');
    res.json(result.rows);
  }));

  router.get('/catalogos/cargos', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT id AS id_cargo, nombre AS nombre_cargo, descripcion FROM rol ORDER BY nombre');
    res.json(result.rows);
  }));

  router.get('/beneficiarios', asyncHandler(async (req, res) => {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(req.query.limit || req.query.pageSize, 10), 1), 100);
    const offset = (page - 1) * limit;
    const { whereSql, params } = buildBeneficiarioWhere(req.query);
    const countResult = await pool.query(`${beneficiarioCtes} SELECT COUNT(*)::int AS total FROM (${beneficiarioSelect} ${whereSql}) filtered`, params);
    const dataResult = await pool.query(
      `${beneficiarioCtes} ${beneficiarioSelect} ${whereSql} ORDER BY b.primer_nombre, b.apellidos LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data: dataResult.rows, pagination: { page, limit, total: countResult.rows[0].total } });
  }));

  router.get('/beneficiarios/:id', asyncHandler(async (req, res) => {
    const result = await pool.query(`${beneficiarioCtes} ${beneficiarioSelect} WHERE b.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Beneficiario no encontrado' });
    return res.json(result.rows[0]);
  }));

  router.post('/beneficiarios', authenticateToken, asyncHandler(async (req, res) => {
    const { nombres, documento, telefono, correo, direccion, id_ciudad, id_tipo_poblacion } = req.body || {};
    if (!nombres || !documento || !id_ciudad || !id_tipo_poblacion) {
      return res.status(400).json({ error: 'nombres, documento, id_ciudad e id_tipo_poblacion son obligatorios' });
    }
    const { primer_nombre, apellidos } = splitName(nombres);
    const grupoSisben = await resolvePopulationType(pool, id_tipo_poblacion);
    const city = await resolveCity(pool, id_ciudad);
    const result = await pool.query(
      "INSERT INTO beneficiario (tipo_documento, numero_documento, primer_nombre, apellidos, telefono_principal, correo, grupo_sisben, consentimiento_datos) VALUES ('CC', $1, $2, $3, $4, $5, $6, true) RETURNING id",
      [documento, primer_nombre, apellidos, telefono || null, correo || null, grupoSisben]
    );
    if (direccion) {
      await pool.query(
        'INSERT INTO direccion_ubicacion (beneficiario_id, cod_departamento_divipola, cod_municipio_divipola, direccion_fisica) VALUES ($1, $2, $3, $4)',
        [result.rows[0].id, city.cod_departamento_divipola, city.cod_municipio_divipola, direccion]
      );
    }
    return res.status(201).json({ id_beneficiario: result.rows[0].id });
  }));

  router.put('/beneficiarios/:id', authenticateToken, asyncHandler(async (req, res) => {
    const exists = await pool.query('SELECT id FROM beneficiario WHERE id = $1', [req.params.id]);
    if (exists.rows.length === 0) return res.status(404).json({ error: 'Beneficiario no encontrado' });
    const { nombres, documento, telefono, correo, direccion, id_ciudad, id_tipo_poblacion } = req.body || {};
    const nameParts = nombres ? splitName(nombres) : {};
    const grupoSisben = id_tipo_poblacion ? await resolvePopulationType(pool, id_tipo_poblacion) : undefined;
    await pool.query(
      `UPDATE beneficiario SET primer_nombre = COALESCE($1, primer_nombre), apellidos = COALESCE($2, apellidos), numero_documento = COALESCE($3, numero_documento), telefono_principal = COALESCE($4, telefono_principal), correo = COALESCE($5, correo), grupo_sisben = COALESCE($6, grupo_sisben) WHERE id = $7`,
      [nameParts.primer_nombre || null, nameParts.apellidos || null, documento || null, telefono || null, correo || null, grupoSisben || null, req.params.id]
    );
    if (direccion || id_ciudad) {
      const city = await resolveCity(pool, id_ciudad);
      const current = await pool.query('SELECT id FROM direccion_ubicacion WHERE beneficiario_id = $1 ORDER BY id LIMIT 1', [req.params.id]);
      if (current.rows.length > 0) {
        await pool.query('UPDATE direccion_ubicacion SET direccion_fisica = COALESCE($1, direccion_fisica), cod_municipio_divipola = COALESCE($2, cod_municipio_divipola), cod_departamento_divipola = COALESCE($3, cod_departamento_divipola) WHERE id = $4', [direccion || null, city.cod_municipio_divipola, city.cod_departamento_divipola, current.rows[0].id]);
      } else {
        await pool.query('INSERT INTO direccion_ubicacion (beneficiario_id, cod_departamento_divipola, cod_municipio_divipola, direccion_fisica) VALUES ($1, $2, $3, $4)', [req.params.id, city.cod_departamento_divipola, city.cod_municipio_divipola, direccion || 'Sin direccion']);
      }
    }
    return res.json({ ok: true });
  }));

  router.delete('/beneficiarios/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM beneficiario WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Beneficiario no encontrado' });
    return res.status(204).send();
  }));

  router.get('/colaboradores', asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT u.id AS id_colaborador, u.nombre_usuario AS nombre_colaborador, u.id::text AS cedula, NULL::text AS telefono, u.correo_electronico AS correo, r.id AS id_cargo, r.nombre AS nombre_cargo
      FROM usuario u
      LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
      LEFT JOIN rol r ON r.id = ur.rol_id
      ORDER BY u.nombre_usuario
    `);
    res.json(result.rows);
  }));

  router.get('/colaboradores/:id', asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT u.id AS id_colaborador, u.nombre_usuario AS nombre_colaborador, u.id::text AS cedula, NULL::text AS telefono, u.correo_electronico AS correo, r.id AS id_cargo, r.nombre AS nombre_cargo
      FROM usuario u
      LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
      LEFT JOIN rol r ON r.id = ur.rol_id
      WHERE u.id = $1
      LIMIT 1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Colaborador no encontrado' });
    return res.json(result.rows[0]);
  }));

  router.post('/colaboradores', authenticateToken, asyncHandler(async (req, res) => {
    const { nombre_colaborador, cedula, correo, id_cargo } = req.body || {};
    if (!nombre_colaborador || !cedula || !id_cargo) return res.status(400).json({ error: 'nombre_colaborador, cedula e id_cargo son obligatorios' });
    const hash = await bcrypt.hash(req.body.contrasena || req.body.contraseña || req.body.password || DEFAULT_PASSWORD, 10);
    const result = await pool.query('INSERT INTO usuario (nombre_usuario, correo_electronico, hash_contrasena, esta_activo) VALUES ($1, $2, $3, true) RETURNING id', [nombre_colaborador, correo || `colaborador_${cedula}@ong.local`, hash]);
    await pool.query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [result.rows[0].id, id_cargo]);
    return res.status(201).json({ id_colaborador: result.rows[0].id });
  }));

  router.put('/colaboradores/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { nombre_colaborador, correo, id_cargo } = req.body || {};
    const result = await pool.query('UPDATE usuario SET nombre_usuario = COALESCE($1, nombre_usuario), correo_electronico = COALESCE($2, correo_electronico) WHERE id = $3 RETURNING id', [nombre_colaborador || null, correo || null, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Colaborador no encontrado' });
    if (id_cargo) {
      await pool.query('DELETE FROM usuario_rol WHERE usuario_id = $1', [req.params.id]);
      await pool.query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, id_cargo]);
    }
    return res.json({ ok: true });
  }));

  router.delete('/colaboradores/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM usuario WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Colaborador no encontrado' });
    return res.status(204).send();
  }));

  router.get('/entregas', asyncHandler(async (req, res) => {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(req.query.limit || req.query.pageSize, 10), 1), 100);
    const offset = (page - 1) * limit;
    const { whereSql, params } = buildEntregaWhere(req.query);
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM (${entregaQuery} ${whereSql}) x`, params);
    const dataResult = await pool.query(`${entregaQuery} ${whereSql} ORDER BY ee.fecha_entrega DESC, ee.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    return res.json({ data: dataResult.rows, pagination: { page, limit, total: countResult.rows[0].total } });
  }));

  router.get('/entregas/:id', asyncHandler(async (req, res) => {
    const result = await pool.query(`${entregaQuery} WHERE ee.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entrega no encontrada' });
    return res.json(result.rows[0]);
  }));

  router.post('/entregas', authenticateToken, asyncHandler(async (req, res) => {
    const { fecha_entrega, id_beneficiario, id_colaborador, id_tipo_ayuda, cantidad } = req.body || {};
    if (!fecha_entrega || !id_beneficiario || !id_colaborador || !id_tipo_ayuda || !cantidad) {
      return res.status(400).json({ error: 'Todos los campos principales de la entrega son obligatorios' });
    }
    const misionId = await getDefaultMissionId(pool);
    const loteId = await getLoteForItem(pool, id_tipo_ayuda);
    const entrega = await pool.query("INSERT INTO entrega_encabezado (beneficiario_id, mision_id, usuario_id, fecha_entrega, estado) VALUES ($1, $2, $3, $4, 'Completada') RETURNING id", [id_beneficiario, misionId, id_colaborador, fecha_entrega]);
    await pool.query('INSERT INTO entrega_detalle (entrega_encabezado_id, lote_inventario_id, cantidad_entregada) VALUES ($1, $2, $3)', [entrega.rows[0].id, loteId, cantidad]);
    return res.status(201).json({ id_entrega: entrega.rows[0].id });
  }));

  router.put('/entregas/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { fecha_entrega, id_beneficiario, id_colaborador, id_tipo_ayuda, cantidad, observaciones } = req.body || {};
    const result = await pool.query('UPDATE entrega_encabezado SET fecha_entrega = COALESCE($1, fecha_entrega), beneficiario_id = COALESCE($2, beneficiario_id), usuario_id = COALESCE($3, usuario_id), estado = COALESCE($4, estado) WHERE id = $5 RETURNING id', [fecha_entrega || null, id_beneficiario || null, id_colaborador || null, observaciones || null, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entrega no encontrada' });
    if (id_tipo_ayuda || cantidad) {
      const loteId = id_tipo_ayuda ? await getLoteForItem(pool, id_tipo_ayuda) : null;
      await pool.query('UPDATE entrega_detalle SET lote_inventario_id = COALESCE($1, lote_inventario_id), cantidad_entregada = COALESCE($2, cantidad_entregada) WHERE id = (SELECT id FROM entrega_detalle WHERE entrega_encabezado_id = $3 ORDER BY id LIMIT 1)', [loteId, cantidad || null, req.params.id]);
    }
    return res.json({ ok: true });
  }));

  router.delete('/entregas/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM entrega_encabezado WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entrega no encontrada' });
    return res.status(204).send();
  }));

  return router;
};
