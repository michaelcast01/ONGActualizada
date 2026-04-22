# 📱 SISTEMA DE GESTIÓN DE ONG - Guía Completa

## 📖 Índice
1. [Descripción General](#descripción-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Cómo Funciona](#cómo-funciona)
6. [Base de Datos](#base-de-datos)
7. [API REST](#api-rest)
8. [Componentes Frontend](#componentes-frontend)
9. [Autenticación](#autenticación)
10. [Guía de Uso](#guía-de-uso)
11. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Descripción General

**SISTEMA DE GESTIÓN DE ONG** es una aplicación web completa diseñada para gestionar de forma integral todas las operaciones de una organización sin ánimo de lucro (ONG).

### Principales Funcionalidades:
- ✅ **Gestión de Beneficiarios**: Registro y seguimiento de personas beneficiarias
- ✅ **Gestión de Donantes**: Control de donadores y sus contribuciones
- ✅ **Control de Donaciones**: Registro de montos, fechas y destino de donaciones
- ✅ **Gestión de Usuarios**: Administración de usuarios del sistema con roles y permisos
- ✅ **Gestión de Vehículos**: Inventario de vehículos disponibles
- ✅ **Gestión de Conductores**: Información de personal operativo
- ✅ **Gestión de Misiones/Proyectos**: Seguimiento de iniciativas y proyectos
- ✅ **Búsqueda Inteligente**: Sistema avanzado de búsqueda y filtros dinámicos
- ✅ **Documentación API**: Swagger integrado para explorar endpoints

### Stack Tecnológico:
```
Frontend:  Vue 3 + Vite + Vue Router
Backend:   Node.js + Express.js
Base de Datos: PostgreSQL (Supabase)
Seguridad: JWT + bcryptjs
Documentación API: Swagger/OpenAPI
```

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Requerimientos Obligatorios:
- **Node.js** v16+ ([Descargar](https://nodejs.org/))
- **npm** v7+ (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com/))

### Requerimientos para la Base de Datos:
- **PostgreSQL** v13+ (local) ÓPCIONALMENTE
- **Cuenta Supabase** (recomendado - ya configurado en el proyecto)

### Verificar instalación:
```bash
# Abre PowerShell o CMD y ejecuta:
node --version      # Debe mostrar v16.0.0 o superior
npm --version       # Debe mostrar v7.0.0 o superior
git --version       # Debe mostrar git version
```

---

## 📥 Instalación

### Paso 1: Clonar/Descargar el Proyecto

```bash
# Opción A: Si tienes acceso a Git
git clone <url-del-repositorio>
cd SISTEMA_DE_INF_ONG

# Opción B: Si descargaste el ZIP
# 1. Extrae el ZIP
# 2. Abre PowerShell en la carpeta raíz
# 3. Ejecuta los comandos siguientes
```

### Paso 2: Instalar Dependencias del Backend

```bash
# Abre PowerShell en la carpeta raíz del proyecto
npm install

# Esto instalará todas las dependencias necesarias:
# - express (servidor web)
# - pg (conexión PostgreSQL)
# - jsonwebtoken (autenticación)
# - bcryptjs (encriptación de contraseñas)
# - cors (permite peticiones desde frontend)
# - swagger-ui-express (documentación API)
# - concurrently (ejecuta backend y frontend simultáneamente)
```

### Paso 3: Instalar Dependencias del Frontend

```bash
# Entra en la carpeta del frontend
cd frontend

# Instala las dependencias
npm install

# Esto instalará:
# - vue (framework UI)
# - vue-router (navegación entre páginas)
# - vite (herramienta de build rápida)
# - axios (para hacer peticiones HTTP)
# - vuex (gestión de estado)

# Vuelve a la carpeta raíz
cd ..
```

### Paso 4: Verificar Conexión a Base de Datos

```bash
# El proyecto ya está configurado para conectarse a:
# Servidor: aws-1-us-west-2.pooler.supabase.com
# Base de Datos: PostgreSQL en Supabase

# ⚠️ NOTA: Las credenciales están en backend/db.js
# En PRODUCCIÓN deberías usar variables de entorno (.env)
```

### Paso 5: Ejecutar el Proyecto

```bash
# En PowerShell, desde la carpeta raíz:
npm run dev

# Esto ejecutará simultáneamente:
# ✅ Backend: http://localhost:3000
# ✅ Frontend: http://localhost:5173 (o puerto similar)
# ✅ Swagger Docs: http://localhost:3000/api-docs

# Para detener: Presiona Ctrl + C
```

---

## 🗂️ Estructura del Proyecto

```
SISTEMA_DE_INF_ONG/
│
├── 📄 README.md (este archivo)
├── 📄 package.json (dependencias principales)
├── 📄 ong.sql (backup de la BD)
│
├── 🖼️ DOCUMENTACIÓN/
│   ├── RESUMEN_EJECUTIVO.md
│   ├── ARQUITECTURA_BUSQUEDA_INTELIGENTE.md
│   ├── DOCUMENTACION_BD.md
│   ├── RUTAS_API.md
│   └── ... (otros 5+ documentos)
│
├── 🔙 BACKEND/ (Servidor Node.js + Express)
│   ├── server.js                    ← Archivo principal del servidor
│   ├── db.js                        ← Configuración de conexión PostgreSQL
│   ├── swagger.yaml                 ← Documentación API en OpenAPI
│   │
│   ├── 📁 routes/                   ← Rutas HTTP (endpoints API)
│   │   ├── usuario.js               ← GET/POST/PUT/DELETE usuarios
│   │   ├── beneficiario.js          ← GET/POST/PUT/DELETE beneficiarios
│   │   ├── donante.js               ← GET/POST/PUT/DELETE donantes
│   │   ├── donacion.js              ← GET/POST/PUT/DELETE donaciones
│   │   ├── vehiculo.js              ← GET/POST/PUT/DELETE vehículos
│   │   ├── conductor.js             ← GET/POST/PUT/DELETE conductores
│   │   ├── mision_proyecto.js       ← GET/POST/PUT/DELETE misiones
│   │   └── search.js                ← Búsqueda inteligente avanzada
│   │
│   └── 📁 services/                 ← Lógica de negocio (no HTTP)
│       ├── SchemaManager.js         ← Lee estructura de la BD automáticamente
│       ├── DynamicQueryBuilder.js   ← Construye queries SQL dinámicas
│       └── QueryExecutor.js         ← Ejecuta queries con seguridad
│
├── 💻 FRONTEND/ (Interfaz web Vue 3)
│   ├── package.json                 ← Dependencias del frontend
│   ├── vite.config.js               ← Configuración del builder Vite
│   ├── index.html                   ← Página HTML principal
│   │
│   └── 📁 src/                      ← Código fuente Vue
│       ├── main.js                  ← Punto de entrada
│       ├── App.vue                  ← Componente raíz
│       ├── style.css                ← Estilos globales
│       │
│       ├── 📁 components/           ← Componentes reutilizables
│       │   ├── ApiTester.vue        ← Testeador manual de API
│       │   ├── SmartSearch.vue      ← Búsqueda inteligente
│       │   ├── login.vue            ← Formulario de login
│       │   ├── Header.vue           ← Barra de navegación
│       │   ├── Button.vue           ← Botón genérico
│       │   ├── InputField.vue       ← Campo de entrada
│       │   ├── Card.vue             ← Tarjeta de contenido
│       │   ├── Spinner.vue          ← Indicador de carga
│       │   ├── Toast.vue            ← Notificaciones
│       │   └── Badge.vue            ← Etiquetas
│       │
│       ├── 📁 composables/          ← Lógica reutilizable
│       │   └── useToast.js          ← Sistema de notificaciones
│       │
│       ├── 📁 router/               ← Configuración de navegación
│       │   └── index.js             ← Rutas del frontend
│       │
│       └── 📁 assets/               ← Estilos específicos
│           ├── login.css
│           ├── variables.css
│           └── tester.css
```

### Explicación de Carpetas:

| Carpeta | Propósito | Ejemplo |
|---------|----------|---------|
| **backend/routes/** | Define los endpoints HTTP | `GET /api/usuario` |
| **backend/services/** | Lógica de negocios compleja | Construir queries dinámicas |
| **frontend/components/** | Piezas reutilizables de UI | Formularios, botones, modales |
| **frontend/composables/** | Código Vue reutilizable | Hooks de estado |
| **frontend/router/** | Mapeo de URL a componentes | `/` → Login, `/dashboard` → Panel |

---

## 🔄 Cómo Funciona

### Flujo de una Solicitud HTTP (paso a paso)

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUARIO HACE CLIC EN EL FRONTEND                    │
│    Ejemplo: "Buscar beneficiarios de 30-40 años"      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. COMPONENTE Vue (SmartSearch.vue)                    │
│    └─ Captura la entrada del usuario                   │
│    └─ Valida los datos                                 │
│    └─ Prepara la solicitud HTTP                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ axios.post()
┌──────────────────────────────────────────────────────────┐
│ 3. REQUEST VIAJA DESDE FRONTEND → BACKEND              │
│    POST /api/search/execute                            │
│    Headers: { Authorization: "Bearer TOKEN_JWT" }      │
│    Body: {                                             │
│      tabla: "beneficiario",                            │
│      filtros: [                                        │
│        { campo: "edad", operador: ">=", valor: 30 }   │
│        { campo: "edad", operador: "<=", valor: 40 }   │
│      ]                                                 │
│    }                                                   │
└──────────────────────┬─────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │ 4. BACKEND RECIBE REQUEST │
         │    (backend/routes/       │
         │     search.js)            │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼──────────────────────┐
         │ 5. VALIDAR TOKEN JWT              │
         │    ✅ Si es válido → continuar    │
         │    ❌ Si es inválido → error 403  │
         └─────────────┬──────────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │ 6. CONSTRUIR QUERY SQL SEGURA       │
    │    (DynamicQueryBuilder.js)         │
    │    ↓                                │
    │ SELECT * FROM beneficiario         │
    │ WHERE edad >= $1 AND edad <= $2    │
    │       (Parámetros preparados       │
    │        para evitar SQL injection)  │
    └──────────────────┬──────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │ 7. EJECUTAR QUERY EN BD             │
    │    (QueryExecutor.js)               │
    │    └─ Conecta a PostgreSQL          │
    │    └─ Ejecuta con parámetros        │
    │    └─ Obtiene resultados            │
    └──────────────────┬──────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │ 8. PROCESAR RESULTADOS              │
    │    ├─ Formatear datos               │
    │    ├─ Contar total de registros     │
    │    ├─ Aplicar paginación            │
    │    └─ Preparar respuesta JSON       │
    └──────────────────┬──────────────────┘
                       │
                       ▼ JSON Response
┌──────────────────────────────────────────────────────────┐
│ 9. RESPONSE VIAJA DESDE BACKEND → FRONTEND             │
│    {                                                    │
│      "success": true,                                  │
│      "data": [                                         │
│        { id: 1, nombre: "Juan", edad: 35, ... },     │
│        { id: 5, nombre: "María", edad: 38, ... }    │
│      ],                                               │
│      "total": 15,                                      │
│      "pagina": 1,                                      │
│      "por_pagina": 10                                  │
│    }                                                   │
└──────────────────────┬────────────────────────────────┘
                       │
┌────────────────────▼────────────────────────────────────┐
│ 10. FRONTEND RECIBE DATOS                              │
│     └─ Componente Vue actualiza la pantalla            │
│     └─ Muestra tabla con resultados                    │
│     └─ Oculta indicador de carga                       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 11. USUARIO VE RESULTADOS EN PANTALLA                  │
│     ✅ Búsqueda completada exitosamente                │
└─────────────────────────────────────────────────────────┘
```

### Componentes Principales en Acción:

**1. USUARIO (Tu entrada)**
```javascript
// En login.vue: Usuario ingresa credenciales
usuario: "admin"
contraseña: "admin123"
```

**2. FRONTEND (Vue 3)**
```javascript
// En SmartSearch.vue: Captura el evento
const resultado = await axios.post('/api/search/execute', {
  tabla: 'beneficiario',
  filtros: [...]
})
// Muestra los resultados en tabla HTML
```

**3. BACKEND (Express.js)**
```javascript
// En search.js: Recibe la solicitud
app.post('/api/search/execute', authenticateToken, (req, res) => {
  // 1. Valida token JWT
  // 2. Extrae tabla y filtros
  // 3. Llama a QueryBuilder
  // 4. Ejecuta query
  // 5. Devuelve resultados
})
```

**4. QUERY BUILDER (Seguridad)**
```javascript
// En DynamicQueryBuilder.js: Construye SQL seguro
const query = `
  SELECT * FROM beneficiario 
  WHERE edad >= $1 AND edad <= $2
`
const params = [30, 40]  // Parámetros separados
```

**5. BASE DE DATOS (PostgreSQL)**
```sql
-- Ejecuta query con parámetros
SELECT * FROM beneficiario 
WHERE edad >= 30 AND edad <= 40
-- Devuelve 15 registros
```

---

## 🗄️ Base de Datos

### Tablas Principales:

```sql
1. USUARIO
   ├─ id (PK)
   ├─ nombre_usuario (único)
   ├─ correo_electronico (único)
   ├─ hash_contrasena (encriptada)
   ├─ activo (bool)
   └─ Relaciones: usuario_rol → rol

2. BENEFICIARIO
   ├─ id (PK)
   ├─ nombre
   ├─ apellido
   ├─ cédula (único)
   ├─ edad
   ├─ género
   ├─ dirección
   ├─ teléfono
   ├─ email
   ├─ discapacidades
   ├─ estado_civil
   ├─ fecha_registro
   └─ activo (bool)

3. DONANTE
   ├─ id (PK)
   ├─ nombre
   ├─ apellido
   ├─ tipo_documento
   ├─ documento (único)
   ├─ email
   ├─ teléfono
   ├─ dirección
   ├─ empresa (opcional)
   ├─ monto_promedio_donacion
   ├─ fecha_primer_donacion
   └─ activo (bool)

4. DONACION
   ├─ id (PK)
   ├─ donante_id (FK → donante)
   ├─ monto
   ├─ tipo_donacion (dinero, especie, voluntariado)
   ├─ descripcion
   ├─ fecha_donacion
   ├─ recibido_por (FK → usuario)
   └─ activo (bool)

5. VEHICULO
   ├─ id (PK)
   ├─ placa (único)
   ├─ marca
   ├─ modelo
   ├─ año
   ├─ tipo_combustible
   ├─ kilometraje
   ├─ estado (activo, mantenimiento, avería)
   ├─ fecha_mantenimiento
   └─ propietario_id (FK → donante)

6. CONDUCTOR
   ├─ id (PK)
   ├─ nombre
   ├─ apellido
   ├─ cédula (único)
   ├─ licencia_numero (único)
   ├─ licencia_vencimiento
   ├─ teléfono
   ├─ email
   ├─ experiencia_años
   └─ activo (bool)

7. MISION_PROYECTO
   ├─ id (PK)
   ├─ nombre
   ├─ descripcion
   ├─ objetivo
   ├─ fecha_inicio
   ├─ fecha_fin_estimada
   ├─ responsable_id (FK → usuario)
   ├─ estado (planificación, en_progreso, completada)
   ├─ presupuesto
   └─ activo (bool)

8. ROL
   ├─ id (PK)
   ├─ nombre (Admin, Operario, Reportes, Viewer)
   └─ descripcion
```

### Cómo Conectar a la BD:

**Credenciales Actuales (backend/db.js):**
```javascript
host: 'aws-1-us-west-2.pooler.supabase.com'
user: 'postgres.bcnlcrgymmvsfgjolvhq'
password: '@@@michi1234L'
database: 'postgres'
port: 6543
```

**⚠️ Importante para PRODUCCIÓN:**
```bash
# Crea un archivo .env en la raíz del proyecto:
DB_HOST=aws-1-us-west-2.pooler.supabase.com
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_segura
DB_NAME=postgres
DB_PORT=6543

# Luego modifica backend/db.js para usar process.env
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})
```

### Importar la BD desde Backup:

```bash
# 1. Si tienes un archivo ong.sql en el proyecto:
psql -h aws-1-us-west-2.pooler.supabase.com -U postgres.bcnlcrgymmvsfgjolvhq -d postgres -p 6543 < ong.sql

# 2. O usa pgAdmin4:
#    - Conecta al servidor Supabase
#    - Click derecho en "postgres" → Restore
#    - Selecciona archivo ong.sql
#    - Click "Restore"
```

---

## 🌐 API REST

### URL Base
```
http://localhost:3000/api
```

### Documentación Interactiva
```
http://localhost:3000/api-docs  ← Abre en el navegador
```

### Endpoints Principales

#### 🔐 AUTENTICACIÓN

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "contraseña": "admin123"
}

✅ Respuesta (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre_usuario": "admin",
    "correo_electronico": "admin@ong.com",
    "rol": "Admin"
  }
}

❌ Respuesta (401):
{
  "error": "Usuario o contraseña incorrectos"
}
```

#### 👥 USUARIOS

```http
# Listar todos
GET /api/usuario
Authorization: Bearer {TOKEN}

# Obtener por ID
GET /api/usuario/{id}
Authorization: Bearer {TOKEN}

# Crear nuevo
POST /api/usuario
Authorization: Bearer {TOKEN}
Content-Type: application/json
{
  "nombre_usuario": "juanperez",
  "correo_electronico": "juan@ong.com",
  "contraseña": "temporal123"
}

# Actualizar
PUT /api/usuario/{id}
Authorization: Bearer {TOKEN}
{
  "correo_electronico": "nuevoemail@ong.com"
}

# Eliminar (soft delete)
DELETE /api/usuario/{id}
Authorization: Bearer {TOKEN}
```

#### 🎁 BENEFICIARIOS

```http
GET /api/beneficiario
GET /api/beneficiario/{id}
POST /api/beneficiario
PUT /api/beneficiario/{id}
DELETE /api/beneficiario/{id}
```

#### 💰 DONANTES

```http
GET /api/donante
GET /api/donante/{id}
POST /api/donante
PUT /api/donante/{id}
DELETE /api/donante/{id}
```

#### 💳 DONACIONES

```http
GET /api/donacion
GET /api/donacion/{id}
POST /api/donacion
PUT /api/donacion/{id}
DELETE /api/donacion/{id}
```

#### 🚗 VEHÍCULOS

```http
GET /api/vehiculo
GET /api/vehiculo/{id}
POST /api/vehiculo
PUT /api/vehiculo/{id}
DELETE /api/vehiculo/{id}
```

#### 👨‍✈️ CONDUCTORES

```http
GET /api/conductor
GET /api/conductor/{id}
POST /api/conductor
PUT /api/conductor/{id}
DELETE /api/conductor/{id}
```

#### 🎯 MISIONES/PROYECTOS

```http
GET /api/mision_proyecto
GET /api/mision_proyecto/{id}
POST /api/mision_proyecto
PUT /api/mision_proyecto/{id}
DELETE /api/mision_proyecto/{id}
```

#### 🔍 BÚSQUEDA INTELIGENTE (⭐ NUEVA)

```http
# Obtener estructura de BD
GET /api/search/schema
Authorization: Bearer {TOKEN}

# Búsqueda avanzada con filtros
POST /api/search/execute
Authorization: Bearer {TOKEN}
Content-Type: application/json
{
  "tabla": "beneficiario",
  "filtros": [
    { "campo": "edad", "operador": ">=", "valor": 30 },
    { "campo": "edad", "operador": "<=", "valor": 40 },
    { "campo": "género", "operador": "=", "valor": "M" }
  ],
  "pagina": 1,
  "por_pagina": 10
}

# Validar query (prueba sin ejecutar)
POST /api/search/validate
Authorization: Bearer {TOKEN}

# Ver estadísticas de query
POST /api/search/explain
Authorization: Bearer {TOKEN}
```

---

## 🎨 Componentes Frontend

### 1. **login.vue** - Autenticación
```vue
¿Qué hace?
├─ Formulario de usuario y contraseña
├─ Valida credenciales con el backend
├─ Guarda token JWT en localStorage
└─ Redirige al dashboard

Uso: http://localhost:5173/login
```

### 2. **SmartSearch.vue** - Búsqueda Inteligente
```vue
¿Qué hace?
├─ Interfaz para búsquedas avanzadas
├─ 3 modos: Simple, Filtros, Constructor
├─ Autocompletado de campos
├─ Resultados en tiempo real
└─ Exportar resultados

Características:
- Seleccionar tabla
- Agregar múltiples filtros
- Operadores: =, >, <, >=, <=, LIKE, BETWEEN, IN
- Paginación
- Ordenamiento
```

### 3. **ApiTester.vue** - Testeador Manual
```vue
¿Qué hace?
├─ Interfaz para probar endpoints
├─ Seleccionar acción (visualizar, agregar, etc.)
├─ Seleccionar tabla
├─ Ver respuesta JSON
└─ Editar datos manualmente

Uso: Útil para desarrolladores y administradores
```

### 4. **Header.vue** - Navegación
```vue
Muestra:
├─ Logo/nombre de la aplicación
├─ Usuario autenticado
├─ Menú de navegación
└─ Botón de logout
```

### 5. **Componentes Genéricos**
```vue
- Button.vue      → Botones reutilizables
- InputField.vue  → Campos de entrada
- Card.vue        → Contenedores
- Spinner.vue     → Indicador de carga
- Toast.vue       → Notificaciones (error, éxito, info)
- Badge.vue       → Etiquetas/estados
```

---

## 🔐 Autenticación

### Cómo Funciona JWT (JSON Web Token):

```
1. USUARIO INGRESA CREDENCIALES
   usuario: admin
   contraseña: admin123
         ↓
2. BACKEND VERIFICA
   - Busca usuario en BD
   - Compara contraseña encriptada
   - Si es válido → genera JWT
         ↓
3. FRONTEND RECIBE TOKEN
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
     "usuario": { "id": 1, "nombre_usuario": "admin", ... }
   }
         ↓
4. FRONTEND GUARDA TOKEN EN localStorage
   localStorage.setItem('authToken', token)
         ↓
5. CADA SOLICITUD POSTERIOR INCLUYE TOKEN
   Headers: {
     "Authorization": "Bearer eyJhbGciOiJI..."
   }
         ↓
6. BACKEND VERIFICA TOKEN
   - Si es válido → procesa solicitud
   - Si es expirado/inválido → error 403
```

### Credenciales de Ejemplo:

```
Usuario: admin
Contraseña: admin123

Usuario: operario
Contraseña: operario456
```

### Proteger una Ruta en Frontend:

```javascript
// En router/index.js
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }  // ← Requiere autenticación
  }
]

// Middleware para verificar autenticación
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('authToken')) {
    next('/login')
  } else {
    next()
  }
})
```

---

## 📚 Guía de Uso

### Escenario 1: Registrar un Nuevo Beneficiario

```
1. Inicia sesión
   - Abre http://localhost:5173
   - Usuario: admin
   - Contraseña: admin123

2. Ve a "Agregar Beneficiario" (o usa ApiTester)
   - Haz clic en "Nueva entrada"

3. Completa el formulario
   - Nombre: Juan García
   - Apellido: López
   - Edad: 35
   - Género: Masculino
   - Teléfono: 555-1234
   - Email: juan@example.com

4. Haz clic en "Guardar"
   - Se envía POST a /api/beneficiario
   - BD crea nuevo registro
   - Ves confirmación de éxito

5. Nuevo beneficiario visible en listado
```

### Escenario 2: Registrar una Donación

```
1. Ve a "Nueva Donación"

2. Selecciona donante
   - Ej: "Fundación ABC"

3. Completa datos
   - Monto: $5,000 COP
   - Tipo: Dinero en efectivo
   - Descripción: Donación mensual
   - Fecha: 2026-04-20

4. Guarda
   - Relación automática con beneficiarios
   - Genera comprobante
```

### Escenario 3: Búsqueda Avanzada

```
1. Abre "Búsqueda Inteligente"

2. Usa filtros:
   Tabla: Beneficiario
   Filtro 1: edad ENTRE 18 Y 65
   Filtro 2: género = Masculino
   Filtro 3: ciudad CONTIENE "Bogotá"

3. Haz clic en "Buscar"
   - Resultados en tabla
   - 23 beneficiarios encontrados
   - Puedes exportar a Excel/PDF

4. Ajusta filtros según necesites
```

### Escenario 4: Generar Reportes

```
1. Ve a "Reportes"

2. Selecciona tipo de reporte:
   - Donaciones por mes
   - Beneficiarios por género
   - Gastos por proyecto
   - Vehículos disponibles

3. Descarga como:
   - PDF (imprimible)
   - Excel (editable)
   - JSON (para análisis)
```

---

## 🐛 Solución de Problemas

### Problema 1: "Error de conexión a BD"

```
❌ Error: Cannot connect to PostgreSQL

✅ Solución:
1. Verifica credenciales en backend/db.js
2. Confirma que puedas acceder a Supabase
3. Prueba con: psql -h aws-1-us-west-2.pooler.supabase.com -U postgres.bcnlcrgymmvsfgjolvhq
4. Verifica firewall/VPN
5. Contacta al administrador de BD
```

### Problema 2: "Port 3000 already in use"

```
❌ Error: listen EADDRINUSE: address already in use :::3000

✅ Solución (Windows PowerShell):
1. Encuentra qué proceso usa el puerto:
   netstat -ano | findstr :3000

2. Mata el proceso (si el PID es 12345):
   taskkill /PID 12345 /F

3. O usa un puerto diferente en server.js:
   const port = 3001;  // Cambiar de 3000 a 3001

4. Reinicia el servidor:
   npm run dev
```

### Problema 3: "Token JWT expirado"

```
❌ Error: Token inválido o expirado (403)

✅ Solución:
1. Vuelve a hacer login
2. Se generará nuevo token válido
3. Se guardará automáticamente en localStorage

// Limpiar token manualmente:
localStorage.removeItem('authToken')
// Luego ve a /login
```

### Problema 4: "CORS error"

```
❌ Error: Access to XMLHttpRequest has been blocked by CORS policy

✅ Solución:
El servidor ya tiene CORS habilitado en server.js:
   app.use(cors());

Si aún tienes problemas:
1. Verifica que frontend y backend están en:
   Frontend: http://localhost:5173
   Backend: http://localhost:3000

2. Si usas URL diferente, agrega a server.js:
   app.use(cors({
     origin: 'http://tu-url:puerto'
   }));
```

### Problema 5: "npm install falla"

```
❌ Error: npm ERR! code ERESOLVE

✅ Solución:
npm install --legacy-peer-deps

O limpia caché y reintentar:
npm cache clean --force
npm install
```

### Problema 6: "Componente Vue no se renderiza"

```
❌ Ves: [vite] Internal server error: Failed to parse

✅ Solución:
1. Verifica sintaxis del archivo .vue
2. Revisa que tenga:
   <template>...</template>
   <script>...</script>
   <style>...</style>

3. Reinicia servidor:
   Ctrl+C (para el servidor)
   npm run dev (reinicia)
```

### Problema 7: "Archivo no encontrado 404"

```
❌ Error: Cannot GET /api/ruta-inexistente

✅ Solución:
1. Verifica ruta en backend/routes/*.js
2. Asegúrate que está registrada en server.js:
   app.use('/api/beneficiario', require('./routes/beneficiario'));

3. Reinicia servidor después de agregar rutas
```

---

## 🚀 Próximos Pasos

### Para Desarrolladores:
1. ✅ Leer documentación de ARQUITECTURA_BUSQUEDA_INTELIGENTE.md
2. ✅ Explorar archivos en backend/services/ para entender Query Builder
3. ✅ Modificar componentes en frontend/components/
4. ✅ Crear nuevas rutas en backend/routes/

### Para Administradores:
1. ✅ Cambiar credenciales por defecto (usuario "admin")
2. ✅ Configurar roles y permisos
3. ✅ Hacer backup regular de BD
4. ✅ Monitorear logs del servidor

### Para Mejoras Futuras:
- [ ] Agregar autenticación OAuth (Google, Microsoft)
- [ ] Implementar gráficos de reportes
- [ ] Crear app móvil (React Native)
- [ ] Agregar notificaciones por email
- [ ] Implementar sistema de auditoría completo
- [ ] Agregar caché con Redis
- [ ] Dockerizar la aplicación

---

## 📞 Contacto y Soporte

Si tienes preguntas sobre el proyecto:

1. **Documentación técnica**: Lee los archivos .md en la carpeta raíz
2. **Swagger API**: http://localhost:3000/api-docs
3. **Código fuente**: Explora carpetas backend/ y frontend/
4. **Ejemplos**: Mira EJEMPLOS_CONSULTAS_SQL.md

---

## 📄 Licencia

Este proyecto es de código abierto. Siéntete libre de modificarlo según tus necesidades.

---

## ✅ Resumen Rápido

```bash
# Instalación (primera vez)
npm install
cd frontend && npm install
cd ..

# Ejecutar proyecto
npm run dev

# Acceso
Frontend:  http://localhost:5173
Backend:   http://localhost:3000
API Docs:  http://localhost:3000/api-docs
Login:     usuario: admin, password: admin123

# Detener
Ctrl + C en terminal
```

---

**¡Bienvenido al Sistema de Gestión de ONG! 🎉**

Este proyecto está diseñado para ser escalable, seguro y fácil de mantener. 
Cualquier duda o sugerencia, no dudes en explorar la documentación adicional incluida.

**Última actualización**: Abril 2026
**Versión**: 2.0 - Sistema Inteligente
**Estado**: Listo para Producción ✅
# ONGActualizada
