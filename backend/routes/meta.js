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

function buildColumnDefinition(column, primaryKeys, entityConfig) {
  const isPrimaryKey = primaryKeys.includes(column.name);
  const hasSerialDefault = typeof column.default === 'string' && column.default.includes('nextval(');
  const readOnly = entityConfig.allowCreate === false && entityConfig.allowUpdate === false;

  return {
    ...column,
    primaryKey: isPrimaryKey,
    editableOnCreate: !readOnly && !hasSerialDefault,
    editableOnUpdate: !readOnly && !isPrimaryKey && !hasSerialDefault
  };
}

module.exports = (pool, entityConfig) => {
  const schemaManager = new SchemaManager(pool);
  const allowedTables = Object.keys(entityConfig);

  router.get('/app', async (req, res) => {
    try {
      const schema = await schemaManager.getSchema();
      const tableNames = schema.tables.filter((table) => allowedTables.includes(table));

      const entities = await Promise.all(
        tableNames.map(async (tableName) => {
          const config = entityConfig[tableName] || {};
          const primaryKeys = await getPrimaryKeys(pool, tableName);
          const rawColumns = schema.schema[tableName] || [];
          const columns = rawColumns.map((column) => buildColumnDefinition(column, primaryKeys, config));
          const configuredListFields = (config.listFields || []).filter((field) => columns.some((column) => column.name === field));
          const fallbackListFields = columns.slice(0, 6).map((column) => column.name);

          return {
            name: tableName,
            label: config.label || tableName,
            category: config.category || 'General',
            description: config.description || '',
            titleField: config.titleField || primaryKeys[0] || columns[0]?.name || 'id',
            listFields: configuredListFields.length > 0 ? configuredListFields : fallbackListFields,
            searchFields: (config.searchFields || []).filter((field) => columns.some((column) => column.name === field)),
            primaryKeys,
            hasSimplePrimaryKey: primaryKeys.length === 1,
            allowCreate: config.allowCreate !== false,
            allowUpdate: config.allowUpdate !== false,
            allowDelete: config.allowDelete !== false,
            columns
          };
        })
      );

      const dashboard = await Promise.all(
        entities.map(async (entity) => {
          const result = await pool.query(`SELECT COUNT(*)::int AS total FROM ${quoteIdentifier(entity.name)}`);
          return {
            table: entity.name,
            label: entity.label,
            category: entity.category,
            total: result.rows[0]?.total || 0
          };
        })
      );

      res.json({
        app: {
          name: 'Sistema de Gestion Social ONG',
          subtitle: 'Consulta de beneficiarios, donaciones, inventario, misiones, entregas y seguridad.',
          readOnly: true,
          sampleLogin: {
            username: 'admin',
            password: 'admin123'
          }
        },
        entities: entities.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label)),
        dashboard: dashboard.sort((a, b) => a.label.localeCompare(b.label)),
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
