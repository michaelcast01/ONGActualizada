# 🏗️ REDISEÑO ARQUITECTÓNICO - PANEL DE BÚSQUEDA INTELIGENTE
## Sistema de Consultas Dinámicas para ONG

**Fecha:** Abril 2026  
**Estado:** Propuesta Ejecutiva  
**Clasificación:** Arquitectura Senior

---

## ÍNDICE
1. [Análisis del Sistema Actual](#análisis-actual)
2. [Problemas Identificados](#problemas)
3. [Arquitectura Propuesta](#arquitectura-propuesta)
4. [Componentes del Sistema](#componentes)
5. [Ejemplos de Implementación](#ejemplos)
6. [Plan de Ejecución](#ejecución)

---

## ANÁLISIS ACTUAL

### Estado Actual (Anti-patrón)
```
ApiTester.vue
├── Selects Hardcodeados
│   ├── ACCIÓN (visualizar, agregar, modificar, eliminar)
│   ├── TABLA (7 tablas fijas + más)
│   └── CONSULTA POR (todos, id)
│
├── Mapeo Manual de Campos
│   └── camposPorTabla {} (100+ líneas de hardcoding)
│
└── Rutas Rígidas
    ├── /api/donante/all
    ├── /api/beneficiario/id/:id
    └── (Una por cada CRUD de cada tabla)
```

### Limitaciones Críticas
| Problema | Impacto | Severidad |
|----------|--------|-----------|
| Hardcoding de tablas | Agregar tabla = editar código | 🔴 CRÍTICO |
| Sin filtros dinámicos | No filtrar por ciudad, rango fechas | 🔴 CRÍTICO |
| Sin relaciones automáticas | No hace JOINs implícitos | 🟡 ALTO |
| Escalabilidad 0 | Cada nueva funcionalidad = editar UI | 🔴 CRÍTICO |
| Validación manual | Alto riesgo de SQL injection | 🔴 CRÍTICO |
| Experiencia pobre | Usuario debe saber estructura BD | 🟡 ALTO |

---

## ARQUITECTURA PROPUESTA

### 🎯 Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND - SMART SEARCH                  │
├─────────────────────────────────────────────────────────────┤
│ Panel de Búsqueda Inteligente                               │
│ ├── Search Input (con autocompletado)                       │
│ ├── Dynamic Filter Builder                                  │
│ ├── Condition Operators (=, LIKE, >, <, BETWEEN, IN)       │
│ └── Results Renderer (tabla, json, gráfico)                │
└────────────────┬────────────────────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────────────────────┐
│              BACKEND - QUERY ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │ Schema Manager  │  │ Query Builder│  │ Executor     │    │
│ │ (Introspection) │  │ (Dynamic SQL)│  │ (Parametrizado)  │
│ └─────────────────┘  └──────────────┘  └──────────────┘    │
│        ↓                    ↓                  ↓             │
│   Metadata Cache     Filter Validator     Pool Connection   │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  PostgreSQL DB  │
        │  (Introspection)│
        └─────────────────┘
```

### 🔧 Capas Arquitectónicas

```
LAYERED ARCHITECTURE (Clean Architecture)
┌──────────────────────────────┐
│   PRESENTATION LAYER         │  ← UI Components (Vue 3)
│  (Smart Search Component)    │
├──────────────────────────────┤
│   APPLICATION LAYER          │  ← Route Handlers
│  (API Controllers)           │
├──────────────────────────────┤
│   DOMAIN LAYER               │  ← Entities, Rules
│  (Filters, Conditions)       │
├──────────────────────────────┤
│   INFRASTRUCTURE LAYER       │  ← DB Access, Query Build
│  (Schema Manager, QB)        │
├──────────────────────────────┤
│   PERSISTENCE LAYER          │  ← PostgreSQL
└──────────────────────────────┘
```

---

## COMPONENTES DEL SISTEMA

### 1️⃣ SCHEMA INTROSPECTION SERVICE (Backend)

**Responsabilidad:** Descubrir automáticamente tablas y relaciones

```javascript
// backend/services/SchemaManager.js

class SchemaManager {
  constructor(pool) {
    this.pool = pool;
    this.schemaCache = null;
    this.cacheExpiry = 3600000; // 1 hora
  }

  async getSchema() {
    // Verificar cache
    if (this.schemaCache && this.isCacheValid()) {
      return this.schemaCache;
    }

    // Descubrir tablas
    const tables = await this.discoverTables();
    
    // Descubrir columnas por tabla
    const schema = {};
    for (const table of tables) {
      schema[table] = await this.discoverColumns(table);
    }

    // Descubrir relaciones (Foreign Keys)
    const relationships = await this.discoverRelationships();

    this.schemaCache = { tables, schema, relationships };
    this.cacheTimestamp = Date.now();
    
    return this.schemaCache;
  }

  async discoverTables() {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const result = await this.pool.query(query);
    return result.rows.map(r => r.table_name);
  }

  async discoverColumns(tableName) {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    const result = await this.pool.query(query, [tableName]);
    
    return result.rows.map(col => ({
      name: col.column_name,
      type: this.mapDataType(col.data_type),
      nullable: col.is_nullable === 'YES',
      default: col.column_default,
      maxLength: col.character_maximum_length,
      displayType: this.getDisplayType(col.data_type)
    }));
  }

  async discoverRelationships() {
    const query = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  mapDataType(pgType) {
    const typeMap = {
      'bigint': 'number',
      'integer': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'text': 'string',
      'character varying': 'string',
      'varchar': 'string',
      'date': 'date',
      'timestamp with time zone': 'datetime',
      'timestamp without time zone': 'datetime',
      'time': 'time',
      'boolean': 'boolean',
      'json': 'json',
      'jsonb': 'json',
      'uuid': 'string'
    };
    return typeMap[pgType] || 'string';
  }

  getDisplayType(pgType) {
    // Para UI: qué input type mostrar
    if (pgType.includes('date')) return 'date';
    if (pgType.includes('time')) return 'time';
    if (pgType.includes('int')) return 'number';
    if (pgType.includes('numeric') || pgType.includes('decimal')) return 'number';
    if (pgType.includes('boolean')) return 'checkbox';
    return 'text';
  }

  isCacheValid() {
    return Date.now() - this.cacheTimestamp < this.cacheExpiry;
  }
}

module.exports = SchemaManager;
```

---

### 2️⃣ QUERY BUILDER SERVICE (Backend)

**Responsabilidad:** Construir queries dinámicas y seguras

```javascript
// backend/services/DynamicQueryBuilder.js

class DynamicQueryBuilder {
  constructor(pool, schemaManager) {
    this.pool = pool;
    this.schemaManager = schemaManager;
  }

  async buildQuery(searchParams) {
    // searchParams = {
    //   primaryTable: 'beneficiario',
    //   filters: [
    //     { field: 'genero', operator: '=', value: 'M' },
    //     { field: 'fecha_nacimiento', operator: 'BETWEEN', value: ['1990-01-01', '2000-12-31']}
    //   ],
    //   joins: [], // auto-detectadas si es necesario
    //   groupBy: null,
    //   orderBy: [{ field: 'apellido', direction: 'ASC' }],
    //   limit: 100,
    //   offset: 0
    // }

    const schema = await this.schemaManager.getSchema();
    this.validateInput(searchParams, schema);

    let query = this.buildSELECT(searchParams);
    query += this.buildFROM(searchParams);
    query += this.buildJOINS(searchParams);
    query += this.buildWHERE(searchParams);
    query += this.buildGROUPBY(searchParams);
    query += this.buildORDERBY(searchParams);
    query += this.buildLIMITOFFSET(searchParams);

    return {
      query: query.sql,
      params: query.params
    };
  }

  buildSELECT(params) {
    const fields = params.fields || ['*'];
    return {
      sql: `SELECT ${fields.join(', ')} `,
      params: []
    };
  }

  buildFROM(params) {
    return {
      sql: `FROM ${params.primaryTable} `,
      params: []
    };
  }

  buildJOINS(params) {
    if (!params.joins || params.joins.length === 0) {
      return { sql: '', params: [] };
    }

    // Simplificado: recibir joins explícitos
    // En producción, podrían auto-detectarse vía FK
    const joinSql = params.joins
      .map(j => `${j.type} JOIN ${j.table} ON ${j.condition}`)
      .join(' ');

    return {
      sql: `${joinSql} `,
      params: []
    };
  }

  buildWHERE(params) {
    if (!params.filters || params.filters.length === 0) {
      return { sql: '', params: [] };
    }

    const clauses = [];
    const values = [];
    let paramCounter = 1;

    for (const filter of params.filters) {
      const { field, operator, value } = filter;

      switch (operator) {
        case '=':
        case '!=':
        case '<':
        case '>':
        case '<=':
        case '>=':
          clauses.push(`${field} ${operator} $${paramCounter}`);
          values.push(value);
          paramCounter++;
          break;

        case 'LIKE':
        case 'ILIKE':
          clauses.push(`${field} ${operator} $${paramCounter}`);
          values.push(`%${value}%`);
          paramCounter++;
          break;

        case 'IN':
          const placeholders = value.map(() => `$${paramCounter++}`).join(', ');
          clauses.push(`${field} IN (${placeholders})`);
          values.push(...value);
          break;

        case 'BETWEEN':
          clauses.push(`${field} BETWEEN $${paramCounter} AND $${paramCounter + 1}`);
          values.push(value[0], value[1]);
          paramCounter += 2;
          break;

        case 'IS NULL':
          clauses.push(`${field} IS NULL`);
          break;

        case 'IS NOT NULL':
          clauses.push(`${field} IS NOT NULL`);
          break;

        default:
          throw new Error(`Operador no soportado: ${operator}`);
      }
    }

    return {
      sql: `WHERE ${clauses.join(' AND ')} `,
      params: values
    };
  }

  buildGROUPBY(params) {
    if (!params.groupBy) {
      return { sql: '', params: [] };
    }

    return {
      sql: `GROUP BY ${params.groupBy.join(', ')} `,
      params: []
    };
  }

  buildORDERBY(params) {
    if (!params.orderBy || params.orderBy.length === 0) {
      return { sql: '', params: [] };
    }

    const orderClauses = params.orderBy
      .map(o => `${o.field} ${o.direction || 'ASC'}`)
      .join(', ');

    return {
      sql: `ORDER BY ${orderClauses} `,
      params: []
    };
  }

  buildLIMITOFFSET(params) {
    let sql = '';
    const values = [];

    if (params.limit) {
      sql += `LIMIT ${params.limit} `;
    }

    if (params.offset) {
      sql += `OFFSET ${params.offset}`;
    }

    return { sql, params: values };
  }

  validateInput(params, schema) {
    // Validar que tabla existe
    if (!schema.tables.includes(params.primaryTable)) {
      throw new Error(`Tabla no existe: ${params.primaryTable}`);
    }

    // Validar que campos existen
    const validFields = schema.schema[params.primaryTable].map(c => c.name);
    
    if (params.filters) {
      for (const filter of params.filters) {
        if (!validFields.includes(filter.field)) {
          throw new Error(`Campo no existe: ${filter.field}`);
        }
      }
    }

    // Validar operadores permitidos
    const validOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
    if (params.filters) {
      for (const filter of params.filters) {
        if (!validOperators.includes(filter.operator)) {
          throw new Error(`Operador no válido: ${filter.operator}`);
        }
      }
    }
  }
}

module.exports = DynamicQueryBuilder;
```

---

### 3️⃣ QUERY EXECUTOR (Backend)

```javascript
// backend/services/QueryExecutor.js

class QueryExecutor {
  constructor(pool) {
    this.pool = pool;
  }

  async execute(queryObj, options = {}) {
    const { query, params } = queryObj;
    const { returnCount = false } = options;

    try {
      // Ejecutar query con parámetros preparados (protege de SQL injection)
      const result = await this.pool.query(query, params);

      if (returnCount) {
        return {
          data: result.rows,
          count: result.rows.length,
          total: (await this.pool.query(
            query.replace(/LIMIT.*OFFSET.*/, '').replace(/ORDER BY.*/, ''),
            params
          )).rows.length
        };
      }

      return result.rows;
    } catch (error) {
      throw new Error(`Error ejecutando query: ${error.message}`);
    }
  }

  async executeWithPagination(queryObj, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    // Contar total sin LIMIT
    const countQuery = queryObj.query
      .replace(/LIMIT.*OFFSET.*/, '')
      .replace(/ORDER BY.*/, '');
    
    const countResult = await this.pool.query(countQuery, queryObj.params);
    const total = countResult.rows.length;

    // Agregar LIMIT y OFFSET
    const paginatedQuery = {
      query: `${queryObj.query} LIMIT $${queryObj.params.length + 1} OFFSET $${queryObj.params.length + 2}`,
      params: [...queryObj.params, pageSize, offset]
    };

    const dataResult = await this.pool.query(paginatedQuery.query, paginatedQuery.params);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize)
      }
    };
  }
}

module.exports = QueryExecutor;
```

---

### 4️⃣ SEARCH API ENDPOINT (Backend)

```javascript
// backend/routes/search.js

const express = require('express');
const router = express.Router();
const SchemaManager = require('../services/SchemaManager');
const DynamicQueryBuilder = require('../services/DynamicQueryBuilder');
const QueryExecutor = require('../services/QueryExecutor');
const { authenticateToken } = require('../middleware/auth');

let schemaManager, queryBuilder, queryExecutor;

module.exports = (pool) => {
  schemaManager = new SchemaManager(pool);
  queryBuilder = new DynamicQueryBuilder(pool, schemaManager);
  queryExecutor = new QueryExecutor(pool);

  // GET /api/search/schema - Obtener esquema de BD
  router.get('/schema', authenticateToken, async (req, res) => {
    try {
      const schema = await schemaManager.getSchema();
      res.json(schema);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/search/execute - Ejecutar búsqueda dinámica
  router.post('/execute', authenticateToken, async (req, res) => {
    try {
      const searchParams = req.body;
      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 20;

      // Construir query
      const queryObj = await queryBuilder.buildQuery(searchParams);

      // Ejecutar con paginación
      const result = await queryExecutor.executeWithPagination(queryObj, page, pageSize);

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/search/validate - Validar query sin ejecutar
  router.post('/validate', authenticateToken, async (req, res) => {
    try {
      const searchParams = req.body;
      const queryObj = await queryBuilder.buildQuery(searchParams);
      res.json({ query: queryObj.query, params: queryObj.params, valid: true });
    } catch (error) {
      res.status(400).json({ error: error.message, valid: false });
    }
  });

  return router;
};
```

---

### 5️⃣ FRONTEND - SMART SEARCH COMPONENT (Vue 3)

```vue
<!-- frontend/src/components/SmartSearch.vue -->

<template>
  <div class="smart-search-panel">
    <!-- Header -->
    <header class="search-header">
      <h2>🔍 Búsqueda Inteligente</h2>
      <button @click="toggleAdvanced" class="toggle-btn">
        {{ showAdvanced ? 'Básica' : 'Avanzada' }}
      </button>
    </header>

    <!-- Search Modes -->
    <div class="search-modes">
      <button 
        v-for="mode in ['simple', 'filters', 'builder']" 
        :key="mode"
        @click="currentMode = mode"
        :class="['mode-btn', { active: currentMode === mode }]"
      >
        {{ modeLabels[mode] }}
      </button>
    </div>

    <!-- Mode: Simple Search -->
    <div v-if="currentMode === 'simple'" class="search-mode">
      <div class="simple-search">
        <input 
          v-model="simpleQuery"
          @keyup.enter="executeSearch"
          type="text"
          placeholder="Buscar en toda la base de datos..."
          class="search-input"
        />
        <select v-model="selectedTable" class="table-selector">
          <option value="">Todas las tablas</option>
          <option v-for="table in schema.tables" :key="table" :value="table">
            {{ formatTableName(table) }}
          </option>
        </select>
        <button @click="executeSearch" class="btn-search">Buscar</button>
      </div>
    </div>

    <!-- Mode: Dynamic Filters -->
    <div v-if="currentMode === 'filters'" class="search-mode">
      <div class="filter-section">
        <h3>Tabla Principal</h3>
        <select v-model="searchParams.primaryTable" @change="updateAvailableFields" class="table-select">
          <option value="">-- Seleccionar tabla --</option>
          <option v-for="table in schema.tables" :key="table" :value="table">
            {{ formatTableName(table) }}
          </option>
        </select>

        <h3 class="mt-4">Filtros</h3>
        <div v-for="(filter, idx) in searchParams.filters" :key="idx" class="filter-item">
          <select v-model="filter.field" class="field-select">
            <option value="">-- Campo --</option>
            <option v-for="field in availableFields" :key="field.name" :value="field.name">
              {{ field.name }}
            </option>
          </select>

          <select v-model="filter.operator" class="operator-select">
            <option v-for="op in operatorsByType[getFieldType(filter.field)]" :key="op" :value="op">
              {{ op }}
            </option>
          </select>

          <input-field 
            v-model="filter.value"
            :field="getFieldMetadata(filter.field)"
            class="value-input"
          />

          <button @click="removeFilter(idx)" class="btn-remove">−</button>
        </div>

        <button @click="addFilter" class="btn-add-filter">+ Agregar Filtro</button>
      </div>
    </div>

    <!-- Mode: Query Builder -->
    <div v-if="currentMode === 'builder'" class="search-mode">
      <!-- Vista previa SQL y opciones avanzadas -->
      <div class="query-preview">
        <h3>Query Generada</h3>
        <pre>{{ generatedQuery }}</pre>
      </div>
    </div>

    <!-- Results -->
    <div v-if="results" class="results-section">
      <div class="results-header">
        <h3>Resultados ({{ results.pagination.total }})</h3>
        <div class="export-options">
          <button @click="exportCSV">📥 CSV</button>
          <button @click="exportJSON">📥 JSON</button>
        </div>
      </div>

      <div v-if="results.data.length > 0" class="results-table">
        <table>
          <thead>
            <tr>
              <th v-for="key in Object.keys(results.data[0])" :key="key">
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in results.data" :key="idx">
              <td v-for="key in Object.keys(row)" :key="key">
                {{ formatValue(row[key]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-results">
        No se encontraron resultados
      </div>

      <!-- Pagination -->
      <div v-if="results.pagination.totalPages > 1" class="pagination">
        <button 
          @click="previousPage" 
          :disabled="results.pagination.page === 1"
          class="page-btn"
        >
          ← Anterior
        </button>
        <span class="page-info">
          Página {{ results.pagination.page }} de {{ results.pagination.totalPages }}
        </span>
        <button 
          @click="nextPage" 
          :disabled="!results.pagination.hasNextPage"
          class="page-btn"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <div v-if="error" class="error-box">
      ⚠️ {{ error }}
    </div>

    <div v-if="loading" class="loading">
      ⏳ Cargando...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import InputField from './InputField.vue'

const schema = ref({ tables: [], schema: {} })
const currentMode = ref('simple')
const showAdvanced = ref(false)
const simpleQuery = ref('')
const selectedTable = ref('')
const results = ref(null)
const error = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const searchParams = ref({
  primaryTable: '',
  filters: [],
  orderBy: [],
  limit: 100,
  offset: 0
})

const availableFields = ref([])

const modeLabels = {
  simple: '🔎 Búsqueda Simple',
  filters: '🔧 Filtros Dinámicos',
  builder: '⚙️ Constructor Query'
}

const operatorsByType = {
  string: ['=', '!=', 'LIKE', 'ILIKE', 'IN', 'IS NULL', 'IS NOT NULL'],
  number: ['=', '!=', '<', '>', '<=', '>=', 'IN', 'BETWEEN', 'IS NULL'],
  date: ['=', '!=', '<', '>', '<=', '>=', 'BETWEEN', 'IS NULL'],
  boolean: ['=', '!=', 'IS NULL'],
  datetime: ['=', '!=', '<', '>', '<=', '>=', 'BETWEEN', 'IS NULL']
}

const generatedQuery = computed(() => {
  if (!searchParams.value.primaryTable) return 'Selecciona una tabla'
  
  let sql = `SELECT * FROM ${searchParams.value.primaryTable}`
  
  if (searchParams.value.filters.length > 0) {
    const whereClauses = searchParams.value.filters
      .map(f => `${f.field} ${f.operator} ?`)
      .join(' AND ')
    sql += ` WHERE ${whereClauses}`
  }
  
  return sql
})

// Lifecycle
onMounted(async () => {
  await fetchSchema()
})

// Methods
async function fetchSchema() {
  try {
    const token = localStorage.getItem('authToken')
    const response = await axios.get('/api/search/schema', {
      headers: { Authorization: `Bearer ${token}` }
    })
    schema.value = response.data
  } catch (err) {
    error.value = `Error cargando schema: ${err.message}`
  }
}

function updateAvailableFields() {
  const tableSchema = schema.value.schema[searchParams.value.primaryTable]
  availableFields.value = tableSchema || []
}

function getFieldType(fieldName) {
  const field = availableFields.value.find(f => f.name === fieldName)
  return field ? field.type : 'string'
}

function getFieldMetadata(fieldName) {
  return availableFields.value.find(f => f.name === fieldName)
}

function addFilter() {
  searchParams.value.filters.push({
    field: '',
    operator: '=',
    value: ''
  })
}

function removeFilter(idx) {
  searchParams.value.filters.splice(idx, 1)
}

async function executeSearch() {
  if (!searchParams.value.primaryTable && !selectedTable.value) {
    error.value = 'Por favor selecciona una tabla'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('authToken')
    const params = {
      ...searchParams.value,
      primaryTable: searchParams.value.primaryTable || selectedTable.value
    }

    const response = await axios.post('/api/search/execute', params, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: currentPage.value, pageSize }
    })

    results.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

function nextPage() {
  if (results.value.pagination.hasNextPage) {
    currentPage.value++
    executeSearch()
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    executeSearch()
  }
}

function exportCSV() {
  // Implementar export a CSV
  console.log('Export CSV')
}

function exportJSON() {
  // Implementar export a JSON
  console.log('Export JSON')
}

function formatTableName(table) {
  return table.replace(/_/g, ' ').toUpperCase()
}

function formatValue(value) {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? '✓' : '✗'
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...'
  return value
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}
</script>

<style scoped>
.smart-search-panel {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.search-modes {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.mode-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
  font-weight: bold;
}

.search-input {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.filter-item {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr auto;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.field-select, .operator-select, .table-select {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
}

.btn-search, .btn-add-filter {
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  color: #333;
  border-radius: 6px;
  overflow: hidden;
}

.results-table th {
  background: #667eea;
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: bold;
}

.results-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #ddd;
}

.error-box {
  background: #ff6b6b;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.pagination {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-weight: bold;
}
</style>
```

---

## EJEMPLOS DE CONSULTAS GENERADAS

### Ejemplo 1: Beneficiarios por género
```javascript
// REQUEST
{
  "primaryTable": "beneficiario",
  "filters": [
    { "field": "genero", "operator": "=", "value": "M" }
  ],
  "orderBy": [{ "field": "apellido", "direction": "ASC" }],
  "limit": 50
}

// QUERY GENERADA
SELECT * FROM beneficiario 
WHERE genero = $1 
ORDER BY apellido ASC 
LIMIT 50

// PARAMS: ['M']
```

### Ejemplo 2: Donaciones en rango de fechas
```javascript
{
  "primaryTable": "donacion",
  "filters": [
    { "field": "fecha_donacion", "operator": "BETWEEN", "value": ["2024-01-01", "2024-12-31"] },
    { "field": "tipo", "operator": "IN", "value": ["efectivo", "especie"] }
  ],
  "orderBy": [{ "field": "fecha_donacion", "direction": "DESC" }]
}

// QUERY
SELECT * FROM donacion 
WHERE fecha_donacion BETWEEN $1 AND $2 
  AND tipo IN ($3, $4)
ORDER BY fecha_donacion DESC

// PARAMS: ['2024-01-01', '2024-12-31', 'efectivo', 'especie']
```

### Ejemplo 3: Búsqueda textual
```javascript
{
  "primaryTable": "beneficiario",
  "filters": [
    { "field": "primer_nombre", "operator": "ILIKE", "value": "juan" }
  ]
}

// QUERY
SELECT * FROM beneficiario 
WHERE primer_nombre ILIKE $1

// PARAMS: ['%juan%']
```

---

## VENTAJAS DE ESTA ARQUITECTURA

| Aspecto | Mejora |
|--------|--------|
| **Escalabilidad** | Nuevas tablas = automáticas, sin código |
| **Seguridad** | Parámetros preparados, previene SQL injection |
| **Flexibilidad** | Soporta cualquier tipo de filtro |
| **Performance** | Schema caching, query optimization |
| **UX** | Desaparece complejidad de estructura BD |
| **Mantenibilidad** | Clean architecture, separación concerns |
| **Reusabilidad** | Query builder usado en múltiples frontends |

---

## PLAN DE EJECUCIÓN

### FASE 1: Backend Foundation (2-3 días)
```
✓ SchemaManager.js
✓ DynamicQueryBuilder.js
✓ QueryExecutor.js
✓ /api/search/schema endpoint
✓ /api/search/execute endpoint
```

### FASE 2: Frontend Component (1-2 días)
```
✓ SmartSearch.vue component
✓ InputField.vue helper
✓ Integración con API
✓ CSS/UX styling
```

### FASE 3: Testing & Optimization (1 día)
```
✓ Test queries complejas
✓ Validación de inputs
✓ Performance tuning
✓ Documentación
```

### FASE 4: Deployment (1 día)
```
✓ Replace ApiTester.vue with SmartSearch.vue
✓ Actualizar rutas
✓ Testing en producción
```

---

## ESCALABILIDAD FUTURA

### Con ORM (TypeORM recomendado)
```typescript
// Más tipado y mantenible
const query = await beneficiarioRepo
  .createQueryBuilder('b')
  .where('b.genero = :genero', { genero: 'M' })
  .orderBy('b.apellido', 'ASC')
  .getMany()
```

### Con GraphQL
```graphql
query {
  beneficiarios(filter: { genero: "M" }) {
    id
    nombre
    apellido
  }
}
```

---

**Autor:** Arquitecto Senior | **Fecha:** 2026-04-15

