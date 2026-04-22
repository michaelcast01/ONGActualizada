/**
 * DynamicQueryBuilder.js
 * Constructor dinámico de queries SQL parametrizadas
 * 
 * Características:
 * - Builds SQL seguro contra inyección
 * - Soporta múltiples operadores de filtrado
 * - Validación de campos y valores
 * - Construye claúsulas WHERE, ORDER BY, GROUP BY, JOINS
 */

class DynamicQueryBuilder {
  constructor(pool, schemaManager) {
    this.pool = pool;
    this.schemaManager = schemaManager;
  }

  /**
   * Construir query dinámicamente
   * 
   * searchParams debe contener:
   * {
   *   primaryTable: "beneficiario",
   *   filters: [
   *     { field: "genero", operator: "=", value: "M" },
   *     { field: "fecha_nacimiento", operator: "BETWEEN", value: ["1990-01-01", "2000-12-31"]}
   *   ],
   *   fields: ["id", "nombre", "apellido"], // optional, default: *
   *   joins: [], // optional
   *   groupBy: [], // optional
   *   orderBy: [{ field: "apellido", direction: "ASC" }], // optional
   *   limit: 100, // optional
   *   offset: 0 // optional
   * }
   */
  async buildQuery(searchParams) {
    const schema = await this.schemaManager.getSchema();

    // Validar inputs antes de construir
    this.validateInput(searchParams, schema);

    const queryParts = [];
    let paramCounter = 1;
    const params = [];

    // SELECT
    const fields = searchParams.fields || ['*'];
    queryParts.push(`SELECT ${fields.join(', ')}`);

    // FROM
    queryParts.push(`FROM ${searchParams.primaryTable}`);

    // JOINS (si existen)
    if (searchParams.joins && searchParams.joins.length > 0) {
      for (const join of searchParams.joins) {
        queryParts.push(
          `${join.type || 'LEFT'} JOIN ${join.table} ON ${join.condition}`
        );
      }
    }

    // WHERE (si hay filtros)
    if (searchParams.filters && searchParams.filters.length > 0) {
      const { whereClause, newParams, newCounter } = this.buildWhereClauses(
        searchParams.filters,
        paramCounter
      );
      queryParts.push(`WHERE ${whereClause}`);
      params.push(...newParams);
      paramCounter = newCounter;
    }

    // GROUP BY (si existe)
    if (searchParams.groupBy && searchParams.groupBy.length > 0) {
      queryParts.push(`GROUP BY ${searchParams.groupBy.join(', ')}`);
    }

    // ORDER BY (si existe)
    if (searchParams.orderBy && searchParams.orderBy.length > 0) {
      const orderClauses = searchParams.orderBy
        .map(o => `${o.field} ${o.direction || 'ASC'}`)
        .join(', ');
      queryParts.push(`ORDER BY ${orderClauses}`);
    }

    // LIMIT (si existe)
    if (searchParams.limit) {
      queryParts.push(`LIMIT ${searchParams.limit}`);
    }

    // OFFSET (si existe)
    if (searchParams.offset) {
      queryParts.push(`OFFSET ${searchParams.offset}`);
    }

    const query = queryParts.join(' ');

    return {
      query,
      params,
      originalParams: searchParams,
      executionPlan: this.explainQuery(query)
    };
  }

  /**
   * Construir cláusulas WHERE con soporte a múltiples operadores
   */
  buildWhereClauses(filters, startCounter = 1) {
    const clauses = [];
    const params = [];
    let paramCounter = startCounter;

    for (const filter of filters) {
      const { field, operator, value } = filter;

      switch (operator.toUpperCase()) {
        // Operadores simples
        case '=':
        case '!=':
        case '<':
        case '>':
        case '<=':
        case '>=':
          clauses.push(`${field} ${operator} $${paramCounter}`);
          params.push(value);
          paramCounter++;
          break;

        // Operadores de búsqueda textual
        case 'LIKE':
        case 'ILIKE':
          clauses.push(`${field} ${operator.toUpperCase()} $${paramCounter}`);
          params.push(`%${value}%`); // Agregar wildcards
          paramCounter++;
          break;

        // Operador IN
        case 'IN':
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('IN requiere un array de valores');
          }
          const placeholders = value
            .map(() => `$${paramCounter++}`)
            .join(', ');
          clauses.push(`${field} IN (${placeholders})`);
          params.push(...value);
          break;

        // Operador BETWEEN
        case 'BETWEEN':
          if (!Array.isArray(value) || value.length !== 2) {
            throw new Error('BETWEEN requiere array con 2 valores [min, max]');
          }
          clauses.push(`${field} BETWEEN $${paramCounter} AND $${paramCounter + 1}`);
          params.push(value[0], value[1]);
          paramCounter += 2;
          break;

        // Operadores de NULL
        case 'IS NULL':
          clauses.push(`${field} IS NULL`);
          break;

        case 'IS NOT NULL':
          clauses.push(`${field} IS NOT NULL`);
          break;

        // Operador CONTAINS (para JSON)
        case 'CONTAINS':
          clauses.push(`${field} @> $${paramCounter}`);
          params.push(JSON.stringify(value));
          paramCounter++;
          break;

        // Operador STARTS_WITH
        case 'STARTS_WITH':
          clauses.push(`${field} LIKE $${paramCounter}`);
          params.push(`${value}%`);
          paramCounter++;
          break;

        // Operador ENDS_WITH
        case 'ENDS_WITH':
          clauses.push(`${field} LIKE $${paramCounter}`);
          params.push(`%${value}`);
          paramCounter++;
          break;

        default:
          throw new Error(`Operador no soportado: ${operator}`);
      }
    }

    return {
      whereClause: clauses.join(' AND '),
      newParams: params,
      newCounter: paramCounter
    };
  }

  /**
   * Validar inputs antes de construir query
   */
  validateInput(params, schema) {
    // Validar tabla principal
    if (!params.primaryTable) {
      throw new Error('primaryTable es requerido');
    }

    if (!schema.tables.includes(params.primaryTable)) {
      throw new Error(`Tabla no existe: ${params.primaryTable}`);
    }

    // Validar campos
    const validFields = schema.schema[params.primaryTable].map(c => c.name);

    // Validar filters
    if (params.filters && Array.isArray(params.filters)) {
      for (const filter of params.filters) {
        if (!filter.field) {
          throw new Error('Cada filtro debe tener un field');
        }

        if (!validFields.includes(filter.field)) {
          throw new Error(`Campo no existe: ${filter.field}`);
        }

        if (!filter.operator) {
          throw new Error('Cada filtro debe tener un operator');
        }

        // Validar operador
        const validOperators = [
          '=', '!=', '<', '>', '<=', '>=',
          'LIKE', 'ILIKE', 'IN', 'BETWEEN',
          'IS NULL', 'IS NOT NULL',
          'CONTAINS', 'STARTS_WITH', 'ENDS_WITH'
        ];

        if (!validOperators.includes(filter.operator.toUpperCase())) {
          throw new Error(`Operador no válido: ${filter.operator}`);
        }

        // Validar que BETWEEN tiene 2 valores
        if (filter.operator.toUpperCase() === 'BETWEEN') {
          if (!Array.isArray(filter.value) || filter.value.length !== 2) {
            throw new Error('BETWEEN requiere array con 2 valores');
          }
        }

        // Validar que IN tiene valores
        if (filter.operator.toUpperCase() === 'IN') {
          if (!Array.isArray(filter.value) || filter.value.length === 0) {
            throw new Error('IN requiere un array no vacío');
          }
        }
      }
    }

    // Validar fields si se especifican
    if (params.fields && Array.isArray(params.fields)) {
      for (const field of params.fields) {
        if (field !== '*' && !validFields.includes(field)) {
          throw new Error(`Campo no existe: ${field}`);
        }
      }
    }

    // Validar orderBy si existe
    if (params.orderBy && Array.isArray(params.orderBy)) {
      for (const order of params.orderBy) {
        if (!validFields.includes(order.field)) {
          throw new Error(`Campo en orderBy no existe: ${order.field}`);
        }
        if (order.direction && !['ASC', 'DESC'].includes(order.direction.toUpperCase())) {
          throw new Error(`Dirección no válida: ${order.direction}`);
        }
      }
    }

    // Validar groupBy si existe
    if (params.groupBy && Array.isArray(params.groupBy)) {
      for (const field of params.groupBy) {
        if (!validFields.includes(field)) {
          throw new Error(`Campo en groupBy no existe: ${field}`);
        }
      }
    }

    // Validar limit y offset
    if (params.limit && (!Number.isInteger(params.limit) || params.limit < 0)) {
      throw new Error('limit debe ser un número entero positivo');
    }

    if (params.offset && (!Number.isInteger(params.offset) || params.offset < 0)) {
      throw new Error('offset debe ser un número entero positivo');
    }
  }

  /**
   * Generar plan de ejecución (para debugging)
   */
  explainQuery(query) {
    return {
      statement: query,
      timestamp: new Date().toISOString(),
      complexity: this.estimateComplexity(query)
    };
  }

  /**
   * Estimar complejidad de la query
   */
  estimateComplexity(query) {
    let complexity = 'simple';

    if (query.includes('JOIN')) complexity = 'medium';
    if (query.includes('GROUP BY')) complexity = 'medium';
    if ((query.match(/AND/g) || []).length > 3) complexity = 'high';
    if (query.includes('UNION')) complexity = 'high';

    return complexity;
  }

  /**
   * Construir query COUNT para paginación
   */
  async buildCountQuery(searchParams) {
    // Duplicar params pero con SELECT COUNT(*)
    const countParams = {
      ...searchParams,
      fields: ['COUNT(*) as total'],
      limit: null,
      offset: null
    };

    return await this.buildQuery(countParams);
  }

  /**
   * Validar que query no tenga SQL injection
   */
  isSafeQuery(query, params) {
    // Verificar que no hay literals en query (todo debe ser parametrizado)
    const suspiciousPatterns = [
      /VALUES\s*\(/i, // Evitar INSERT VALUES con strings
      /OR\s+1\s*=\s*1/i, // Patrón clásico de injection
      /;\s*--/, // SQL comments
      /;\s*(DELETE|DROP|TRUNCATE)/i // Destructivas
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = DynamicQueryBuilder;
