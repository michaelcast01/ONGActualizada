/**
 * SchemaManager.js
 * Servicio para introspección automática de esquema PostgreSQL
 * 
 * Responsabilidades:
 * - Descubrir tablas, columnas y tipos de datos
 * - Detectar relaciones (Foreign Keys)
 * - Cachear información para performance
 * - Mapear tipos PostgreSQL a tipos de aplicación
 */

class SchemaManager {
  constructor(pool) {
    this.pool = pool;
    this.schemaCache = null;
    this.cacheTimestamp = null;
    this.cacheExpiry = 3600000; // 1 hora en ms
  }

  /**
   * Obtener esquema completo de la BD
   * Usa cache para evitar queries repetitivas
   */
  async getSchema() {
    // Verificar cache válido
    if (this.schemaCache && this.isCacheValid()) {
      console.log('📦 Schema desde cache');
      return this.schemaCache;
    }

    console.log('🔍 Descubriendo esquema de BD...');

    try {
      // Descubrir tablas disponibles
      const tables = await this.discoverTables();
      
      // Descubrir columnas y tipos para cada tabla
      const schema = {};
      for (const table of tables) {
        schema[table] = await this.discoverColumns(table);
      }

      // Descubrir relaciones (Foreign Keys)
      const relationships = await this.discoverRelationships();

      // Cachear resultado
      this.schemaCache = {
        tables,
        schema,
        relationships,
        timestamp: new Date().toISOString()
      };
      this.cacheTimestamp = Date.now();

      console.log(`✅ Schema descubierto: ${tables.length} tablas`);
      return this.schemaCache;
    } catch (error) {
      console.error('❌ Error descubriendo schema:', error);
      throw new Error(`Error en introspección de BD: ${error.message}`);
    }
  }

  /**
   * Descubrir todas las tablas en schema public
   */
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

  /**
   * Descubrir columnas de una tabla específica
   */
  async discoverColumns(tableName) {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        udt_name
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    const result = await this.pool.query(query, [tableName]);

    return result.rows.map(col => ({
      name: col.column_name,
      dataType: col.data_type,
      udt: col.udt_name,
      type: this.mapDataType(col.data_type),
      displayType: this.getDisplayType(col.data_type),
      nullable: col.is_nullable === 'YES',
      default: col.column_default,
      maxLength: col.character_maximum_length,
      precision: col.numeric_precision,
      scale: col.numeric_scale,
      operators: this.getOperatorsForType(this.mapDataType(col.data_type))
    }));
  }

  /**
   * Descubrir relaciones (Foreign Keys)
   */
  async discoverRelationships() {
    const query = `
      SELECT
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    `;

    const result = await this.pool.query(query);
    
    // Agrupar por tabla para fácil acceso
    const relationships = {};
    for (const rel of result.rows) {
      if (!relationships[rel.source_table]) {
        relationships[rel.source_table] = [];
      }
      relationships[rel.source_table].push({
        sourceColumn: rel.source_column,
        targetTable: rel.target_table,
        targetColumn: rel.target_column,
        updateRule: rel.update_rule,
        deleteRule: rel.delete_rule
      });
    }

    return relationships;
  }

  /**
   * Mapear tipos PostgreSQL a tipos de aplicación
   */
  mapDataType(pgType) {
    const typeMap = {
      'bigint': 'number',
      'integer': 'number',
      'smallint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'text': 'string',
      'character': 'string',
      'character varying': 'string',
      'varchar': 'string',
      'date': 'date',
      'time with time zone': 'time',
      'time without time zone': 'time',
      'timestamp with time zone': 'datetime',
      'timestamp without time zone': 'datetime',
      'boolean': 'boolean',
      'json': 'json',
      'jsonb': 'json',
      'uuid': 'string',
      'bytea': 'binary'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (pgType.includes(key)) {
        return value;
      }
    }

    return 'string'; // default
  }

  /**
   * Obtener tipo de input HTML para cada tipo de dato
   */
  getDisplayType(pgType) {
    if (pgType.includes('date')) return 'date';
    if (pgType.includes('time')) return 'time';
    if (pgType.includes('int')) return 'number';
    if (pgType.includes('numeric') || pgType.includes('decimal')) return 'number';
    if (pgType.includes('boolean')) return 'checkbox';
    if (pgType.includes('text') || pgType.includes('varchar')) return 'textarea';
    if (pgType.includes('json')) return 'json';
    return 'text';
  }

  /**
   * Obtener operadores válidos para cada tipo de dato
   */
  getOperatorsForType(dataType) {
    switch (dataType) {
      case 'string':
        return ['=', '!=', 'LIKE', 'ILIKE', 'IN', 'IS NULL', 'IS NOT NULL'];
      case 'number':
        return ['=', '!=', '<', '>', '<=', '>=', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
      case 'date':
      case 'datetime':
      case 'time':
        return ['=', '!=', '<', '>', '<=', '>=', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
      case 'boolean':
        return ['=', '!=', 'IS NULL', 'IS NOT NULL'];
      case 'json':
        return ['=', 'CONTAINS', 'IS NULL', 'IS NOT NULL'];
      default:
        return ['=', '!=', 'IS NULL', 'IS NOT NULL'];
    }
  }

  /**
   * Verificar si cache sigue siendo válido
   */
  isCacheValid() {
    if (!this.cacheTimestamp) return false;
    return Date.now() - this.cacheTimestamp < this.cacheExpiry;
  }

  /**
   * Invalidar cache (útil después de cambios en BD)
   */
  invalidateCache() {
    this.schemaCache = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Cache invalidado');
  }

  /**
   * Obtener solo tablas y columnas disponibles (sin relaciones)
   */
  async getSimplifiedSchema() {
    const schema = await this.getSchema();
    return {
      tables: schema.tables,
      schema: schema.schema
    };
  }

  /**
   * Verificar si una tabla existe
   */
  async tableExists(tableName) {
    const schema = await this.getSchema();
    return schema.tables.includes(tableName);
  }

  /**
   * Verificar si un campo existe en una tabla
   */
  async fieldExists(tableName, fieldName) {
    const schema = await this.getSchema();
    if (!schema.schema[tableName]) return false;
    return schema.schema[tableName].some(col => col.name === fieldName);
  }

  /**
   * Obtener metadatos de un campo específico
   */
  async getFieldMetadata(tableName, fieldName) {
    const schema = await this.getSchema();
    if (!schema.schema[tableName]) return null;
    return schema.schema[tableName].find(col => col.name === fieldName);
  }

  /**
   * Obtener relaciones de una tabla
   */
  async getTableRelationships(tableName) {
    const schema = await this.getSchema();
    return schema.relationships[tableName] || [];
  }
}

module.exports = SchemaManager;
