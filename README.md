# Sistema de Gestion Social ONG

Aplicacion web full-stack para consultar y administrar informacion base de una ONG: beneficiarios, donantes, donaciones, inventario, misiones operativas, entregas, gastos logisticos, usuarios, roles y auditoria.

## Stack

- Frontend: Vue 3 + Vite + Vue Router.
- Backend: Node.js + Express.
- Base de datos: PostgreSQL/Supabase mediante `pg`.
- Autenticacion: JWT con usuarios almacenados en base de datos.
- Documentacion API: Swagger en `/api-docs`.

## Estructura

```txt
SISTEMA_DE_INF_ONG/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── swagger.yaml
│   ├── config/entities.js
│   ├── routes/
│   │   ├── meta.js
│   │   ├── records.js
│   │   └── search.js
│   └── services/
│       ├── SchemaManager.js
│       ├── DynamicQueryBuilder.js
│       └── QueryExecutor.js
├── frontend/
│   ├── src/
│   │   ├── main.js
│   │   ├── router/index.js
│   │   └── components/
├── ong.sql
├── package.json
└── README.md
```

## Modelo De Datos

El esquema principal esta en `ong.sql`. El script recrea el modelo desde cero y conserva la compatibilidad de limpieza con nombres anteriores.

Tablas principales:

- Seguridad: `usuario`, `rol`, `permiso`, `usuario_rol`, `rol_permiso`, `bitacora_auditoria`.
- Beneficiarios: `beneficiario`, `acudiente`, `direccion_ubicacion`, `documento_soporte`.
- Donaciones: `donante`, `donacion`.
- Operacion: `mision_operativa`, `recurso_mision`, `vehiculo`, `conductor`, `gasto_logistico`.
- Inventario: `item_inventario`, `lote_inventario`.
- Entregas: `entrega_encabezado`, `entrega_detalle`.

Usuarios iniciales del script:

```txt
admin / admin123
gestor / admin123
```

## Conexion A Base De Datos

La conexion esta en `backend/db.js` y usa PostgreSQL/Supabase mediante `pg`.

Variables soportadas:

```txt
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Actualmente el archivo conserva la conexion Supabase existente del proyecto.

## Backend

El backend arranca desde `backend/server.js`.

Rutas activas:

- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/health`
- `GET /api/meta/app`
- `GET /api/records/:table`
- `GET /api/records/:table/:id`
- `POST /api/search/execute`
- `POST /api/search/validate`
- `GET /api/search/schema`
- `GET /api/search/tables`
- `GET /api/search/table/:tableName/columns`
- `GET /api/search/table/:tableName/relationships`

La aplicacion esta en modo solo consulta. Las rutas `POST`, `PUT` y `DELETE` de `/api/records` responden `403`.

## Frontend

El frontend usa Vue 3 y carga los metadatos desde el backend. La interfaz principal se adapta a las tablas definidas en `backend/config/entities.js`.

Rutas:

- `/`: login.
- `/app`: centro de consulta protegido por JWT.

El token se guarda en `localStorage` como `authToken`.

## Ejecucion

Instalar dependencias:

```bash
npm install
npm --prefix frontend install
```

Ejecutar backend y frontend:

```bash
npm run dev
```

Servicios esperados:

```txt
Backend: http://localhost:3001
Frontend: http://localhost:5174
Swagger: http://localhost:3001/api-docs
```

## Cargar Datos En Supabase

El proyecto incluye `seed-supabase.js`, que aplica `ong.sql` y carga datos realistas relacionados entre si.

```bash
node seed-supabase.js
```

La carga crea 1200 beneficiarios con ciudades y direcciones relacionadas, mas registros operativos de documentos, donantes, donaciones, misiones, vehiculos, conductores, inventario, lotes, entregas, detalles y gastos logisticos. Adicionalmente, el esquema crea registros base de seguridad: roles, permisos, usuarios y asignaciones.

Para completar una base existente hasta 1200 beneficiarios sin recrear todo el modelo:

```bash
node add-beneficiarios-1200.js
```

Advertencia: el seeder recrea las tablas con `DROP TABLE ... CASCADE`, por lo que reemplaza los datos existentes del modelo.

## Flujo Principal

1. El usuario inicia sesion con `admin / admin123`.
2. El frontend obtiene metadatos desde `/api/meta/app`.
3. La pantalla `/app` muestra entidades agrupadas por categoria.
4. El operador consulta registros mediante busqueda rapida o filtros avanzados.
5. Las consultas se ejecutan con `/api/records/:table` o `/api/search/execute`.

## Verificacion Rapida

```bash
node --check backend/server.js
node --check backend/config/entities.js
node --check backend/routes/meta.js
npm --prefix frontend run build
```
