# Rutas API

Base URL local:

```txt
http://localhost:3001
```

## Autenticacion

### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "usuario": "admin",
  "contraseña": "admin123"
}
```

Respuesta:

```json
{
  "token": "jwt",
  "usuario": {
    "id": 1,
    "nombre": "admin",
    "correo": "admin@ong.local",
    "rol": "Admin"
  }
}
```

### Perfil

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## Salud

```http
GET /api/health
```

No requiere token.

## Metadatos Del Aplicativo

```http
GET /api/meta/app
Authorization: Bearer <token>
```

Retorna:

- Nombre del aplicativo.
- Entidades permitidas.
- Columnas por tabla.
- Llaves primarias.
- Totales por tabla.
- Campos usados por la interfaz dinamica.

## Registros

### Listar Registros

```http
GET /api/records/{table}?page=1&pageSize=15&q=texto&sortField=id&sortDirection=ASC
Authorization: Bearer <token>
```

Ejemplo:

```http
GET /api/records/beneficiario?page=1&pageSize=15&q=perez
```

Respuesta:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 0,
    "totalPages": 1
  }
}
```

### Obtener Por ID

```http
GET /api/records/{table}/{id}
Authorization: Bearer <token>
```

Ejemplo:

```http
GET /api/records/donante/1
```

### Escritura

La aplicacion esta en modo solo consulta.

Estas rutas existen, pero responden `403`:

```http
POST /api/records/{table}
PUT /api/records/{table}/{id}
DELETE /api/records/{table}/{id}
```

## Busqueda Avanzada

### Ejecutar Busqueda

```http
POST /api/search/execute?page=1&pageSize=20
Authorization: Bearer <token>
```

Body:

```json
{
  "primaryTable": "beneficiario",
  "filters": [
    {
      "field": "numero_documento",
      "operator": "ILIKE",
      "value": "123"
    }
  ],
  "orderBy": [
    {
      "field": "id",
      "direction": "ASC"
    }
  ]
}
```

Operadores soportados:

```txt
=, !=, <, >, <=, >=, LIKE, ILIKE, IN, BETWEEN, IS NULL, IS NOT NULL, CONTAINS, STARTS_WITH, ENDS_WITH
```

### Validar Busqueda

```http
POST /api/search/validate
Authorization: Bearer <token>
```

Construye y valida la consulta sin ejecutarla.

### Esquema

```http
GET /api/search/schema
Authorization: Bearer <token>
```

### Tablas Permitidas

```http
GET /api/search/tables
Authorization: Bearer <token>
```

### Columnas De Una Tabla

```http
GET /api/search/table/{tableName}/columns
Authorization: Bearer <token>
```

### Relaciones De Una Tabla

```http
GET /api/search/table/{tableName}/relationships
Authorization: Bearer <token>
```

## Tablas Permitidas

- `beneficiario`
- `acudiente`
- `direccion_ubicacion`
- `documento_soporte`
- `donante`
- `donacion`
- `mision_operativa`
- `recurso_mision`
- `vehiculo`
- `conductor`
- `gasto_logistico`
- `item_inventario`
- `lote_inventario`
- `entrega_encabezado`
- `entrega_detalle`
- `usuario`
- `rol`
- `permiso`
- `usuario_rol`
- `rol_permiso`
- `bitacora_auditoria`

## Auditoria Automatica

El backend registra acciones en `bitacora_auditoria` sin intervencion manual.

Acciones auditadas:

- `LOGIN` en `POST /api/auth/login` cuando el acceso es exitoso.
- `CONSULTAR` en `GET /api/records/{table}`.
- `CONSULTAR` en `GET /api/records/{table}/{id}`.
- `CONSULTAR` en `POST /api/search/execute`.
- `ELIMINAR` en eliminaciones por llave compuesta.

La bitacora puede consultarse como cualquier entidad permitida:

```http
GET /api/records/bitacora_auditoria?page=1&pageSize=15&sortField=id&sortDirection=DESC
Authorization: Bearer <token>
```
