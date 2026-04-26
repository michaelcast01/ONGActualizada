const express = require('express');
const SchemaManager = require('../services/SchemaManager');

const router = express.Router();

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

async function getPrimaryKeys(pool, tableName) {
  const result = await pool.query(
    `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY kcu.ordinal_position
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

function normalizeValue(column, value) {
  if (value === '' || value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  switch (column.type) {
    case 'number': {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        throw new Error(`El campo ${column.name} debe ser numerico`);
      }
      return numericValue;
    }
    case 'boolean': {
      if (typeof value === 'boolean') {
        return value;
      }

      const normalized = String(value).toLowerCase();
      if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no'].includes(normalized)) {
        return false;
      }

      throw new Error(`El campo ${column.name} debe ser booleano`);
    }
    case 'json': {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    }
    default:
      return value;
  }
}

function buildTextSearchClause(fields, searchTerm, params) {
  const expression = `concat_ws(' ', ${fields.map((field) => quoteIdentifier(field)).join(', ')})`;
  const tokens = searchTerm.split(/\s+/).filter(Boolean);

  params.push(`%${searchTerm}%`);
  const fullSearchParam = params.length;

  const tokenClauses = tokens.map((token) => {
    params.push(`%${token}%`);
    return `${expression} ILIKE $${params.length}`;
  });

  return `(${expression} ILIKE $${fullSearchParam} OR (${tokenClauses.join(' AND ')}))`;
}

function getWritableColumns(columns, primaryKeys, config, mode) {
  const readOnly = (mode === 'create' && config.allowCreate === false) || (mode === 'update' && config.allowUpdate === false);
  if (readOnly) {
    return [];
  }

  return columns.filter((column) => {
    const hasSerialDefault = typeof column.default === 'string' && column.default.includes('nextval(');
    if (hasSerialDefault) {
      return false;
    }

    if (mode === 'update' && primaryKeys.includes(column.name)) {
      return false;
    }

    return true;
  });
}

function buildWhereFromPrimaryKeys(primaryKeys, payload, columnsByName, startAt = 1) {
  const values = [];
  const clauses = primaryKeys.map((primaryKey, index) => {
    if (!(primaryKey in payload)) {
      throw new Error(`Falta la llave primaria ${primaryKey}`);
    }

    values.push(normalizeValue(columnsByName[primaryKey], payload[primaryKey]));
    return `${quoteIdentifier(primaryKey)} = $${startAt + index}`;
  });

  return {
    clause: clauses.join(' AND '),
    values
  };
}

module.exports = (pool, entityConfig) => {
  const schemaManager = new SchemaManager(pool);
  const allowedTables = new Set(Object.keys(entityConfig));

  async function getTableContext(tableName) {
    if (!allowedTables.has(tableName)) {
      throw new Error('Tabla no permitida');
    }

    const schema = await schemaManager.getSchema();
    const columns = schema.schema[tableName];
    if (!columns) {
      throw new Error(`No se encontro metadata para ${tableName}`);
    }

    const primaryKeys = await getPrimaryKeys(pool, tableName);
    const columnsByName = Object.fromEntries(columns.map((column) => [column.name, column]));

    return {
      tableName,
      config: entityConfig[tableName] || {},
      columns,
      columnsByName,
      primaryKeys
    };
  }

  router.get('/:table', async (req, res) => {
    try {
      const context = await getTableContext(req.params.table);
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 15, 1), 100);
      const sortField = context.columnsByName[req.query.sortField]
        ? req.query.sortField
        : context.primaryKeys[0] || context.columns[0].name;
      const sortDirection = String(req.query.sortDirection || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const searchTerm = String(req.query.q || '').trim();
      const searchFields = (context.config.searchFields || [])
        .filter((field) => context.columnsByName[field] && context.columnsByName[field].type === 'string');

      const whereClauses = [];
      const params = [];

      if (searchTerm && searchFields.length > 0) {
        whereClauses.push(buildTextSearchClause(searchFields, searchTerm, params));
      }

      const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
      const baseSql = `FROM ${quoteIdentifier(context.tableName)}${whereSql}`;
      const countResult = await pool.query(`SELECT COUNT(*)::int AS total ${baseSql}`, params);

      const offset = (page - 1) * pageSize;
      const dataParams = [...params, pageSize, offset];
      const dataQuery = `
        SELECT *
        ${baseSql}
        ORDER BY ${quoteIdentifier(sortField)} ${sortDirection}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;
      const dataResult = await pool.query(dataQuery, dataParams);
      const total = countResult.rows[0]?.total || 0;

      res.json({
        data: dataResult.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: total > 0 ? Math.ceil(total / pageSize) : 1
        }
      });
    } catch (error) {
      const status = error.message === 'Tabla no permitida' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  router.get('/:table/:id', async (req, res) => {
    try {
      const context = await getTableContext(req.params.table);
      if (context.primaryKeys.length !== 1) {
        return res.status(400).json({ error: 'La tabla seleccionada usa llave primaria compuesta' });
      }

      const primaryKey = context.primaryKeys[0];
      const idValue = normalizeValue(context.columnsByName[primaryKey], req.params.id);
      const result = await pool.query(
        `SELECT * FROM ${quoteIdentifier(context.tableName)} WHERE ${quoteIdentifier(primaryKey)} = $1`,
        [idValue]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      const status = error.message === 'Tabla no permitida' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  router.post('/:table', async (req, res) => {
    res.status(403).json({ error: 'La aplicacion esta en modo solo consulta' });
  });

  router.put('/:table/:id', async (req, res) => {
    res.status(403).json({ error: 'La aplicacion esta en modo solo consulta' });
  });

  router.delete('/:table/:id', async (req, res) => {
    res.status(403).json({ error: 'La aplicacion esta en modo solo consulta' });
  });

  router.delete('/:table', async (req, res) => {
    try {
      const context = await getTableContext(req.params.table);
      if (context.config.allowDelete === false) {
        return res.status(403).json({ error: 'Esta tabla no permite eliminacion' });
      }

      if (context.primaryKeys.length < 2) {
        return res.status(400).json({ error: 'Usa la ruta con ID para tablas de llave simple' });
      }

      const where = buildWhereFromPrimaryKeys(context.primaryKeys, req.body || {}, context.columnsByName);
      const result = await pool.query(
        `DELETE FROM ${quoteIdentifier(context.tableName)} WHERE ${where.clause} RETURNING *`,
        where.values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      res.json({ deleted: true, record: result.rows[0] });
    } catch (error) {
      const status = error.message === 'Tabla no permitida' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  return router;
};
