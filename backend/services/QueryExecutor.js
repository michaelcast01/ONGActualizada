/**
 * QueryExecutor.js
 * Ejecutor seguro de queries con manejo de errores y paginación
 * 
 * Responsabilidades:
 * - Ejecutar queries con parámetros seguros
 * - Manejo de errores de BD
 * - Paginación automática
 * - Logging y monitoring
 */

class QueryExecutor {
  constructor(pool) {
    this.pool = pool;
    this.executionStats = {
      totalQueries: 0,
      totalErrors: 0,
      averageTime: 0,
      slowQueries: []
    };
  }

  /**
   * Ejecutar query simple
   */
  async execute(queryObj, options = {}) {
    const { timeout = 30000, returnCount = false } = options;

    const startTime = Date.now();
    const { query, params } = queryObj;

    try {
      console.log(`📤 Ejecutando query: ${query.substring(0, 80)}...`);
      console.log(`📦 Parámetros: ${JSON.stringify(params).substring(0, 100)}...`);

      // Ejecutar con timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      );

      const result = await Promise.race([
        this.pool.query(query, params),
        timeoutPromise
      ]);

      const executionTime = Date.now() - startTime;
      this.recordExecution(query, executionTime, null);

      console.log(`✅ Query ejecutada en ${executionTime}ms (${result.rows.length} filas)`);

      if (returnCount) {
        return {
          data: result.rows,
          count: result.rows.length,
          executionTime,
          timestamp: new Date().toISOString()
        };
      }

      return result.rows;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordExecution(query, executionTime, error);

      console.error(`❌ Error ejecutando query: ${error.message}`);

      throw new Error(
        `Error en ejecución de query: ${this.formatPgError(error)}`
      );
    }
  }

  /**
   * Ejecutar query con paginación automática
   */
  async executeWithPagination(queryObj, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    try {
      // 1. Contar total de filas
      const countQuery = this.buildCountQuery(queryObj.query, queryObj.params);
      const countResult = await this.pool.query(countQuery.query, countQuery.params);
      const total = parseInt(countResult.rows[0]?.total || 0);

      // 2. Ejecutar query con LIMIT y OFFSET
      const paginatedQuery = `${queryObj.query} LIMIT $${queryObj.params.length + 1} OFFSET $${queryObj.params.length + 2}`;
      const paginatedParams = [...queryObj.params, pageSize, offset];

      const dataResult = await this.pool.query(paginatedQuery, paginatedParams);

      const totalPages = Math.ceil(total / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: dataResult.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          startRecord: offset + 1,
          endRecord: Math.min(offset + pageSize, total)
        },
        executionTime: Date.now(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error en paginación: ${error.message}`);
      throw new Error(`Error en paginación: ${this.formatPgError(error)}`);
    }
  }

  /**
   * Ejecutar múltiples queries en transacción
   */
  async executeTransaction(queries) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const queryObj of queries) {
        const result = await client.query(queryObj.query, queryObj.params);
        results.push(result.rows);
      }

      await client.query('COMMIT');

      console.log(`✅ Transacción completada (${queries.length} queries)`);
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error en transacción: ${error.message}`);
      throw new Error(`Error en transacción: ${this.formatPgError(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Ejecutar query y retornar solo primera fila
   */
  async executeOne(queryObj) {
    const result = await this.execute(queryObj);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Ejecutar query y retornar solo primer campo de primera fila
   */
  async executeScalar(queryObj) {
    const result = await this.executeOne(queryObj);
    if (!result) return null;

    const firstKey = Object.keys(result)[0];
    return result[firstKey];
  }

  /**
   * Ejecutar EXPLAIN para analizar query
   */
  async explainQuery(queryObj) {
    try {
      const explainQuery = `EXPLAIN ANALYZE ${queryObj.query}`;
      const result = await this.pool.query(explainQuery, queryObj.params);

      return {
        plan: result.rows,
        original: queryObj.query,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error en EXPLAIN: ${error.message}`);
    }
  }

  /**
   * Ejecutar búsqueda full-text
   */
  async executeFulltextSearch(query, fields, searchTerm, limit = 20) {
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(' || ');
    const searchQuery = `
      SELECT 
        *,
        ts_rank(to_tsvector('spanish', ${placeholders}), plainto_tsquery('spanish', $${fields.length + 1})) AS relevance
      FROM ${query}
      WHERE to_tsvector('spanish', ${placeholders}) @@ plainto_tsquery('spanish', $${fields.length + 1})
      ORDER BY relevance DESC
      LIMIT ${limit}
    `;

    const params = [...fields, searchTerm];
    return await this.execute({ query: searchQuery, params });
  }

  /**
   * Obtener statistiques de la tabla
   */
  async getTableStats(tableName) {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_live_tup AS live_rows,
        n_dead_tup AS dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE tablename = $1
    `;

    return await this.executeOne({ query, params: [tableName] });
  }

  /**
   * Construir query COUNT sobre la consulta original.
   */
  buildCountQuery(originalQuery, params) {
    const cleanQuery = originalQuery.replace(/;\s*$/, '');
    const countQuery = `SELECT COUNT(*)::int AS total FROM (${cleanQuery}) AS count_source`;

    return { query: countQuery, params };
  }

  /**
   * Formatear errores de PostgreSQL
   */
  formatPgError(error) {
    const errorMap = {
      'relation does not exist': 'Tabla no existe',
      'column does not exist': 'Columna no existe',
      'syntax error': 'Error de sintaxis SQL',
      'division by zero': 'División por cero',
      'unique violation': 'Violación de constraint único',
      'foreign key violation': 'Violación de clave foránea',
      'not null violation': 'Campo no puede ser NULL',
      'value too long': 'Valor demasiado largo',
      'permission denied': 'Permiso denegado',
      'connection refused': 'No hay conexión a BD'
    };

    const message = error.message || error.detail || '';

    for (const [pgError, userError] of Object.entries(errorMap)) {
      if (message.toLowerCase().includes(pgError)) {
        return userError;
      }
    }

    return message || 'Error desconocido en BD';
  }

  /**
   * Registrar estadísticas de ejecución
   */
  recordExecution(query, executionTime, error) {
    this.executionStats.totalQueries++;

    if (error) {
      this.executionStats.totalErrors++;
    }

    // Trackear queries lentas (> 1 segundo)
    if (executionTime > 1000) {
      this.executionStats.slowQueries.push({
        query: query.substring(0, 100),
        time: executionTime,
        timestamp: new Date().toISOString()
      });

      // Mantener solo últimas 100
      if (this.executionStats.slowQueries.length > 100) {
        this.executionStats.slowQueries.shift();
      }
    }

    // Actualizar promedio
    const totalTime = this.executionStats.averageTime * (this.executionStats.totalQueries - 1) + executionTime;
    this.executionStats.averageTime = totalTime / this.executionStats.totalQueries;
  }

  /**
   * Obtener estadísticas de ejecución
   */
  getStats() {
    return {
      ...this.executionStats,
      averageTime: Math.round(this.executionStats.averageTime),
      slowQueriesCount: this.executionStats.slowQueries.length,
      errorRate: this.executionStats.totalQueries > 0
        ? (this.executionStats.totalErrors / this.executionStats.totalQueries * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Resetear estadísticas
   */
  resetStats() {
    this.executionStats = {
      totalQueries: 0,
      totalErrors: 0,
      averageTime: 0,
      slowQueries: []
    };
  }
}

module.exports = QueryExecutor;
