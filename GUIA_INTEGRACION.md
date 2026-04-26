/**
 * GuiaIntegracion.md
 * Pasos para integrar el sistema de búsqueda inteligente
 */

# 📋 GUÍA DE INTEGRACIÓN - BÚSQUEDA INTELIGENTE

## PASO 1: Backend - Actualizar server.js

En `backend/server.js`, agregar las rutas de búsqueda:

```javascript
// ... después de otros routes ...

const searchRoutes = require('./routes/search');

// Registrar rutas de búsqueda
app.use('/api/search', searchRoutes(pool, authenticateToken));

// ... resto del código ...
```

## PASO 2: Backend - Crear carpeta services

Crear `backend/services/` y copiar:
- `SchemaManager.js`
- `DynamicQueryBuilder.js`
- `QueryExecutor.js`

## PASO 3: Frontend - Crear componente SmartSearch

Crear `frontend/src/components/SmartSearch.vue` (código en siguiente sección)

## PASO 4: Frontend - Actualizar router

En `frontend/src/router/index.js`:

```javascript
import SmartSearch from '../components/SmartSearch.vue'

const routes = [
  // ... otras rutas ...
  {
    path: '/search',
    name: 'SmartSearch',
    component: SmartSearch,
    meta: { requiresAuth: true }
  }
]
```

## PASO 5: Frontend - Actualizar App.vue

En `frontend/src/App.vue`, agregar navegación:

```vue
<nav>
  <router-link to="/search">🔍 Búsqueda Inteligente</router-link>
</nav>
```

## PASO 6: Testing

```bash
# En una terminal
cd SISTEMA_DE_INF_ONG
npm start

# Acceder a http://localhost:5174 y navegar a "Búsqueda Inteligente"
```

---

# 📚 EJEMPLOS DE USO

## Ejemplo 1: Búsqueda simple
```bash
curl -X POST http://localhost:3001/api/search/execute \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "primaryTable": "beneficiario",
    "filters": [{"field": "genero", "operator": "=", "value": "M"}],
    "limit": 50
  }'
```

## Ejemplo 2: Búsqueda con BETWEEN
```bash
curl -X POST http://localhost:3001/api/search/execute \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "primaryTable": "donacion",
    "filters": [{
      "field": "fecha_donacion",
      "operator": "BETWEEN",
      "value": ["2024-01-01", "2024-12-31"]
    }],
    "orderBy": [{"field": "fecha_donacion", "direction": "DESC"}]
  }'
```

## Ejemplo 3: Búsqueda con múltiples filtros
```bash
curl -X POST http://localhost:3001/api/search/execute \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "primaryTable": "beneficiario",
    "filters": [
      {"field": "genero", "operator": "=", "value": "M"},
      {"field": "tiene_discapacidad", "operator": "=", "value": true},
      {"field": "apellido", "operator": "ILIKE", "value": "García"}
    ],
    "orderBy": [{"field": "apellido", "direction": "ASC"}],
    "limit": 100,
    "offset": 0
  }'
```

---

# 🚀 CARACTERÍSTICAS AVANZADAS

## Schema Caching
El sistema cachea el schema por 1 hora. Para invalidar:

```bash
curl -X DELETE http://localhost:3001/api/search/cache \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Validación sin Ejecutar
Para validar query sin ejecutar:

```bash
curl -X POST http://localhost:3001/api/search/validate \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "primaryTable": "beneficiario", ... }'
```

## EXPLAIN ANALYZE
Para analizar performance:

```bash
curl -X POST http://localhost:3001/api/search/explain \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "primaryTable": "beneficiario", ... }'
```

## Estadísticas
Ver estadísticas de ejecución:

```bash
curl -X GET http://localhost:3001/api/search/stats \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

# 📊 OPERADORES SOPORTADOS

| Operador | Tipo | Ejemplo |
|----------|------|---------|
| `=` | Igualdad | `{"field": "genero", "operator": "=", "value": "M"}` |
| `!=` | No igual | `{"field": "activo", "operator": "!=", "value": false}` |
| `<` | Menor que | `{"field": "edad", "operator": "<", "value": 18}` |
| `>` | Mayor que | `{"field": "edad", "operator": ">", "value": 65}` |
| `<=` | Menor o igual | `{"field": "fecha", "operator": "<=", "value": "2024-12-31"}` |
| `>=` | Mayor o igual | `{"field": "fecha", "operator": ">=", "value": "2024-01-01"}` |
| `LIKE` | Búsqueda textual (case sensitive) | `{"field": "nombre", "operator": "LIKE", "value": "Juan"}` |
| `ILIKE` | Búsqueda textual (case insensitive) | `{"field": "nombre", "operator": "ILIKE", "value": "juan"}` |
| `IN` | En lista | `{"field": "tipo", "operator": "IN", "value": ["A", "B", "C"]}` |
| `BETWEEN` | Rango | `{"field": "fecha", "operator": "BETWEEN", "value": ["2024-01-01", "2024-12-31"]}` |
| `IS NULL` | Nulo | `{"field": "fecha_fin", "operator": "IS NULL"}` |
| `IS NOT NULL` | No nulo | `{"field": "fecha_fin", "operator": "IS NOT NULL"}` |
| `STARTS_WITH` | Comienza con | `{"field": "nombre", "operator": "STARTS_WITH", "value": "Juan"}` |
| `ENDS_WITH` | Termina con | `{"field": "email", "operator": "ENDS_WITH", "value": "@gmail.com"}` |

---

# 🔒 SEGURIDAD

✅ **Parámetros Preparados**: Todas las queries usan `$1, $2, ...` para evitar SQL injection
✅ **Validación de campos**: Se validan contra schema de BD
✅ **Validación de operadores**: Solo operadores pre-aprobados
✅ **Rate limiting**: (Implementar si se necesita)
✅ **Logging**: Todas las queries se registran
✅ **Auditoría**: Se puede agregar bitácora de búsquedas

---

# 📈 MEJORAS FUTURAS

- [ ] Agregar filtros complejos (AND/OR anidados)
- [ ] Implementar búsqueda full-text
- [ ] Soporte para aggregations (COUNT, SUM, AVG, etc)
- [ ] Exportar a Excel
- [ ] Guardar búsquedas favoritas
- [ ] Historial de búsquedas
- [ ] Rate limiting
- [ ] Caching de resultados
- [ ] GraphQL endpoint
- [ ] Swagger documentation

---

**Última actualización**: 2026-04-15
**Versión**: 1.0.0
**Estado**: Producción

