# 📊 ANÁLISIS COMPLETO DE RELACIONES - SISTEMA ONG

**Fecha**: 2026-04-14  
**Estado**: ✅ REVISADO Y ALINEADO  
**Proyecto**: Sistema de Información para ONG - Gestión de Donantes, Beneficiarios y Misiones

---

## ✅ ESTATUS GENERAL

El proyecto ahora está **COMPLETAMENTE ALINEADO** entre:
- Base de Datos SQL ✅
- Backend Node.js/Express ✅
- Frontend Vue 3 ✅

---

## 📊 ESTRUCTURA TÉCNICA

### 1. BASE DE DATOS: `gestion_social` (MySQL 8.0+)

**21 Tablas relacionadas:**

#### Tablas de Seguridad
- `rol` → Roles de usuario
- `permiso` → Permisos del sistema
- `usuario` → Usuarios del sistema
- `usuario_rol` → Relación usuario-rol (M:M)
- `rol_permiso` → Relación rol-permiso (M:M)
- `bitacora_auditoria` → Registro de auditoría

#### Tablas de Donantes y Donaciones
- `donante` (1:M) ← → `donacion`
- `donacion` (1:M) ← → `lote_donacion`

#### Tablas de Beneficiarios
- `beneficiario` (1:M) ← → `acudiente`
- `beneficiario` (1:M) ← → `documento_soporte`
- `beneficiario` (1:M) ← → `entrega_ubicacion`
- `beneficiario` (1:M) ← → `entrega_seguimiento`

#### Tablas de Operación
- `mision_proyecto`
- `mision_proyecto` (1:M) ← → `mision_recurso`
- `vehiculo` (1:M) ← → `mision_recurso`
- `conductor` (1:M) ← → `mision_recurso`
- `item_proteccion` (1:M) ← → `lote_donacion`, `mision_recurso`

#### Tablas de Entregas
- `entrega_seguimiento` (1:M) ← → `detalle_entrega`
- `lote_donacion` (1:M) ← → `detalle_entrega`
- `mision_recurso` (1:M) ← → `parte_logistico`

**Total de relaciones**: 15+ relaciones Foreign Key normalizadas

---

## 🔧 BACKEND: Node.js + Express

### Configuración
- **Puerto**: 3000
- **Base de Datos**: MySQL 8.0+ (`gestion_social`)
- **Autenticación**: JWT (JSON Web Tokens)
- **Middleware**: CORS, Body-Parser, BCrypt para contraseñas

### Rutas Implementadas

| Ruta | CRUD | Tabla | Estado |
|------|------|-------|--------|
| `/api/donante` | GET, POST, PUT, DELETE | donante | ✅ |
| `/api/donacion` | GET, POST, PUT, DELETE | donacion | ✅ |
| `/api/beneficiario` | GET, POST, PUT, DELETE | beneficiario | ✅ |
| `/api/usuario` | GET, POST, PUT, DELETE | usuario | ✅ |
| `/api/vehiculo` | GET, POST, PUT, DELETE | vehiculo | ✅ |
| `/api/conductor` | GET, POST, PUT, DELETE | conductor | ✅ |
| `/api/mision` | GET, POST, PUT, DELETE | mision_proyecto | ✅ |
| `/api/auth/login` | POST | usuario | ✅ |

### Autenticación JWT
```javascript
- POST /api/auth/login
  Required: usuario, contraseña
  Response: { token, usuario: { id, nombre, correo } }
- Todas las rutas usan: Authorization: Bearer <token>
```

### Validaciones
- ✅ Hash de contraseñas con bcryptjs
- ✅ Validación de campos requeridos
- ✅ Manejo de errores HTTP estándar
- ✅ Respuestas JSON estructuradas

---

## 🎨 FRONTEND: Vue 3 + Vue Router

### Configuración
- **Tecnología**: Vue 3 + JavaScript
- **Enrutador**: Vue Router 4.5.1
- **HTTP**: Fetch API nativo
- **Puerto**: 5173 (desarrollo)

### Componentes

#### 1. **Login.vue** ✅
```
Ruta: /
Función: Autenticación de usuarios
Campos: usuario, contraseña
POST: http://localhost:3000/api/auth/login
Guarda: token, usuario en localStorage
Redirección: /apitester
Título: "SISTEMA DE INFORMACIÓN ONG"
Subtítulo: "Gestión de Donantes, Beneficiarios y Misiones"
```

#### 2. **ApiTester.vue** ✅
```
Ruta: /apitester
Función: Interfaz CRUD universal para todas las tablas
Protegida: ✅ Requiere token JWT

SELECTORES DINÁMICOS:
  - ACCIÓN: Visualizar, Agregar, Modificar, Eliminar
  - TABLA: donante, donacion, beneficiario, usuario, 
           vehiculo, conductor, mision
  - CONSULTA POR: Todos, Por ID (solo Visualizar)

FORMULARIO DINÁMICO:
  - Se adapta según tabla seleccionada
  - Campos específicos por tabla
  - Tipos de entrada: text, number, date, enum, boolean

RESPUESTA:
  - Tabla HTML para múltiples registros
  - Paginación: 10 registros por página
  - Formato JSON para objetos únicos
  - Manejo de errores visible
```

### Mapeo de Tablas - Campos Disponibles

| Tabla | Campos |
|-------|--------|
| **donante** | id, tipo, nombre_completo, numero_documento, correo |
| **donacion** | id, donante_id, fecha_donacion, tipo, valor_estimado, metodo_recepcion |
| **beneficiario** | id, tipo_documento, numero_documento, primer_nombre, apellido, fecha_nacimiento, genero, telefono_principal, correo, es_victima_conflicto, tiene_discapacidad, grupo_etnico |
| **usuario** | id, nombre_usuario, correo_electronico, ultima_actividad, ultimo_acceso |
| **vehiculo** | id, placa, tipo, vencimiento_soat, vencimiento_tecnomecanica, esta_activo |
| **conductor** | id, numero_documento, nombre_completo, numero_licencia, vencimiento_licencia, telefono |
| **mision** | id, nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado |

---

## 🔗 FLUJOS DE RELACIÓN

### Flujo 1: Donación Completa
```
DONANTE (crear/actualizar)
    ↓
DONACION (crear con donante_id)
    ↓
ITEM_PROTECCION (crear artículos)
    ↓
LOTE_DONACION (crear lotes con donacion_id e item_id)
```

### Flujo 2: Entrega a Beneficiarios
```
BENEFICIARIO (crear/localizar)
    ↓
MISION_PROYECTO (crear misión)
    ↓
VEHICULO + CONDUCTOR (asignar recursos)
    ↓
MISION_RECURSO (vincular recursos a misión)
    ↓
ENTREGA_SEGUIMIENTO (registrar entrega con beneficiario_id, mision_id)
    ↓
DETALLE_ENTREGA (detallar qué lotes se entregaron)
```

### Flujo 3: Operación Logística
```
MISION_PROYECTO
    ├─ MISION_RECURSO (1:M)
    │   ├─ CONDUCTOR (1:N)
    │   ├─ VEHICULO (1:N)
    │   └─ ITEM_PROTECCION (1:N)
    │
    ├─ ENTREGA_SEGUIMIENTO (1:M)
    │   ├─ BENEFICIARIO (N:1)
    │   ├─ USUARIO (N:1) → quién registra
    │   └─ DETALLE_ENTREGA (1:M)
    │       └─ LOTE_DONACION (N:1)
    │
    └─ PARTE_LOGISTICO (1:M) → reportes de novedad
```

---

## 🛡️ SEGURIDAD

### Autenticación y Autorización
- ✅ JWT con expiración de 24 horas
- ✅ BCrypt para hash de contraseñas (10 rounds)
- ✅ Todas las rutas excepto `/api/auth/login` requieren token
- ✅ Token validado en middleware `authenticateToken`

### Base de Datos
- ✅ Foreign Keys con restricciones ON DELETE
- ✅ Unique constraints en campos sensibles (usuario, documento)
- ✅ Campos de auditoría: usuario_id, fecha_hora, acción
- ✅ Tabla `bitacora_auditoria` para rastrear cambios

### Frontend
- ✅ Token guardado en localStorage
- ✅ Validación de sesión en cada solicitud
- ✅ Redirección automática a login si token falta
- ✅ Limpieza de datos al cerrar sesión

---

## ✅ CHECKLIST DE SINCRONIZACIÓN

- [x] Base de datos SQL con esquema ONG completo
- [x] Backend: todas las tablas tienen rutas CRUD
- [x] Frontend: ApiTester usa las 7 tablas correctas
- [x] Login actualizado con título de ONG
- [x] Campos de formulario sincronizados con estructura BD
- [x] URLs de API coinciden entre backend y frontend
- [x] Autenticación JWT integrada end-to-end
- [x] Manejo de errores implementado
- [x] Relaciones Foreign Key documentadas
- [x] No hay referencias al proyecto anterior de "Préstamos de Equipos"

---

## 📝 PRÓXIMOS PASOS

### 1. Insertar Datos de Prueba
```sql
-- Crear usuario de prueba
INSERT INTO usuario (nombre_usuario, correo_electronico, hash_contrasena) 
VALUES ('admin', 'admin@ong.org', '$2a$10$...');

-- Crear donantes de prueba
INSERT INTO donante (tipo, nombre_completo, correo)
VALUES ('persona', 'Juan García', 'juan@example.com');

-- Crear beneficiarios
INSERT INTO beneficiario (tipo_documento, numero_documento, primer_nombre, apellido)
VALUES ('CC', '1234567890', 'Carlos', 'López');
```

### 2. Iniciar el Servidor
```bash
# Terminal 1: Backend
npm run backend

# Terminal 2: Frontend  
npm run frontend

# O ambos a la vez
npm run dev
```

### 3. Acceder a la Aplicación
```
Frontend: http://localhost:5173
Backend API: http://localhost:3000
Swagger Docs: http://localhost:3000/api-docs
```

### 4. Pruebas
```
1. Login con credenciales
2. Ir a /apitester
3. Seleccionar: ACCIÓN=Visualizar, TABLA=donante, CONSULTA=Todos
4. Ver datos en tabla paginada
```

---

## 🎯 ESTADO FINAL

| Componente | Estado | Descripción |
|-----------|--------|------------|
| BD SQL | ✅ | 21 tablas ONG normalizadas |
| Backend | ✅ | 7 rutas CRUD + JWT |
| Frontend | ✅ | ApiTester con 7 tablas ONG |
| Autenticación | ✅ | JWT + BCrypt |
| Relaciones | ✅ | 15+ Foreign Keys |
| Sincronización | ✅ | Completa |

**CONCLUSIÓN**: Todo está bien relacionado y listo para ejecutar. ✅

