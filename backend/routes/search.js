/**
 * backend/routes/search.js
 * Rutas para búsqueda inteligente y dinámica
 * 
 * GET  /api/search/schema              - Obtener esquema de BD
 * POST /api/search/execute             - Ejecutar búsqueda
 * POST /api/search/validate            - Validar query sin ejecutar
 * GET  /api/search/stats               - Estadísticas de ejecución
 */

const express = require('express');
const SchemaManager = require('../services/SchemaManager');
const DynamicQueryBuilder = require('../services/DynamicQueryBuilder');
const QueryExecutor = require('../services/QueryExecutor');

module.exports = (pool, entityConfig) => {
  const router = express.Router();
  const allowedTables = new Set(Object.keys(entityConfig));

  // Inicializar servicios
  const schemaManager = new SchemaManager(pool);
  const queryBuilder = new DynamicQueryBuilder(pool, schemaManager);
  const queryExecutor = new QueryExecutor(pool);

  const filterSchema = (schema) => {
    const tables = schema.tables.filter((table) => allowedTables.has(table));
    const filteredSchema = Object.fromEntries(
      Object.entries(schema.schema).filter(([tableName]) => allowedTables.has(tableName))
    );
    const relationships = Object.fromEntries(
      Object.entries(schema.relationships).filter(([tableName]) => allowedTables.has(tableName))
    );

    return {
      ...schema,
      tables,
      schema: filteredSchema,
      relationships
    };
  };

  const validateAllowedTable = (tableName) => {
    if (!allowedTables.has(tableName)) {
      throw new Error(`Tabla no permitida: ${tableName}`);
    }
  };

  /**
   * GET /api/search/schema
   * Retorna el esquema completo de la BD (tablas, columnas, relaciones)
   */
  router.get('/schema', async (req, res) => {
    try {
      const schema = filterSchema(await schemaManager.getSchema());

      res.json({
        success: true,
        data: schema,
        cached: schemaManager.schemaCache !== null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error obteniendo schema:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/search/execute
   * Ejecuta búsqueda dinámica con filtros
   * Query params: page, pageSize
   * Body: searchParams (ver DynamicQueryBuilder)
   */
  router.post('/execute', async (req, res) => {
    try {
      const searchParams = req.body;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;

      // Validar inputs básicos
      if (!searchParams.primaryTable) {
        return res.status(400).json({
          success: false,
          error: 'primaryTable es requerido',
          suggestion: 'Especifica la tabla principal en primaryTable'
        });
      }

      validateAllowedTable(searchParams.primaryTable);

      if (page < 1 || pageSize < 1 || pageSize > 1000) {
        return res.status(400).json({
          success: false,
          error: 'page debe ser >= 1, pageSize entre 1 y 1000'
        });
      }

      // Construir query
      const queryObj = await queryBuilder.buildQuery(searchParams);

      // Validar que query es segura (sin SQL injection)
      if (!queryBuilder.isSafeQuery(queryObj.query, queryObj.params)) {
        return res.status(400).json({
          success: false,
          error: 'Query sospechosa detectada',
          suggestion: 'Verifica tus parámetros'
        });
      }

      // Ejecutar con paginación
      const result = await queryExecutor.executeWithPagination(
        queryObj,
        page,
        pageSize
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error ejecutando búsqueda:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/search/validate
   * Valida query sin ejecutar
   * Útil para debugging y preview de SQL
   */
  router.post('/validate', async (req, res) => {
    try {
      const searchParams = req.body;
      validateAllowedTable(searchParams.primaryTable);

      // Construir query
      const queryObj = await queryBuilder.buildQuery(searchParams);

      // Validar seguridad
      const isSafe = queryBuilder.isSafeQuery(queryObj.query, queryObj.params);

      res.json({
        success: true,
        valid: true,
        safe: isSafe,
        query: queryObj.query,
        params: queryObj.params,
        explanation: queryObj.executionPlan,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        valid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/search/tables
   * Retorna solo lista de tablas disponibles
   */
  router.get('/tables', async (req, res) => {
    try {
      const schema = filterSchema(await schemaManager.getSchema());

      res.json({
        success: true,
        tables: schema.tables,
        count: schema.tables.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/search/table/:tableName/columns
   * Retorna columnas de una tabla específica
   */
  router.get('/table/:tableName/columns', async (req, res) => {
    try {
      const { tableName } = req.params;
      validateAllowedTable(tableName);

      // Verificar que tabla existe
      const exists = await schemaManager.tableExists(tableName);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: `Tabla no existe: ${tableName}`
        });
      }

      const schema = filterSchema(await schemaManager.getSchema());
      const columns = schema.schema[tableName];

      res.json({
        success: true,
        table: tableName,
        columns,
        columnCount: columns.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/search/table/:tableName/relationships
   * Retorna relaciones de una tabla
   */
  router.get('/table/:tableName/relationships', async (req, res) => {
    try {
      const { tableName } = req.params;
      validateAllowedTable(tableName);

      const relationships = await schemaManager.getTableRelationships(tableName);

      res.json({
        success: true,
        table: tableName,
        relationships,
        relationshipCount: relationships.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/search/explain
   * Genera EXPLAIN ANALYZE para debugging
   */
  router.post('/explain', async (req, res) => {
    try {
      const searchParams = req.body;
      validateAllowedTable(searchParams.primaryTable);

      // Construir query
      const queryObj = await queryBuilder.buildQuery(searchParams);

      // Ejecutar EXPLAIN
      const explanation = await queryExecutor.explainQuery(queryObj);

      res.json({
        success: true,
        explanationPlan: explanation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/search/stats
   * Retorna estadísticas de ejecución de queries
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = queryExecutor.getStats();

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/search/count
   * Retorna solo el conteo de resultados (sin datos)
   * Útil para verificar cantidad sin traer todas las filas
   */
  router.post('/count', async (req, res) => {
    try {
      const searchParams = req.body;
      validateAllowedTable(searchParams.primaryTable);

      // Construir query de conteo
      const queryObj = await queryBuilder.buildQuery(searchParams);
      const countQueryObj = await queryBuilder.buildCountQuery(searchParams);

      // Ejecutar
      const result = await queryExecutor.executeOne(countQueryObj);

      res.json({
        success: true,
        count: parseInt(result?.total || 0),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/search/export/csv
   * Exporta resultados a CSV
   */
  router.post('/export/csv', async (req, res) => {
    try {
      const searchParams = req.body;
      validateAllowedTable(searchParams.primaryTable);

      // Construir y ejecutar query
      const queryObj = await queryBuilder.buildQuery(searchParams);
      const data = await queryExecutor.execute(queryObj);

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay datos para exportar'
        });
      }

      // Convertir a CSV
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row =>
          headers.map(h => {
            const val = row[h];
            if (typeof val === 'string' && val.includes(',')) {
              return `"${val}"`;
            }
            return val;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      res.send(csv);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/search/export/json
   * Exporta resultados a JSON
   */
  router.post('/export/json', async (req, res) => {
    try {
      const searchParams = req.body;
      validateAllowedTable(searchParams.primaryTable);

      // Construir y ejecutar query
      const queryObj = await queryBuilder.buildQuery(searchParams);
      const data = await queryExecutor.execute(queryObj);

      res.json({
        success: true,
        data,
        count: data.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/search/cache
   * Invalida el cache de schema
   */
  router.delete('/cache', async (req, res) => {
    try {
      schemaManager.invalidateCache();

      res.json({
        success: true,
        message: 'Cache invalidado',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};
