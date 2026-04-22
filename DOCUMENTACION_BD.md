# 📊 DOCUMENTACIÓN - BASE DE DATOS DE GESTIÓN DE PRÉSTAMOS

## Sistema de Gestión Integral de Préstamos de Equipos para ONG

**Versión**: 2.0 Profesional  
**Base de Datos**: PostgreSQL 13+  
**Última Actualización**: 2024  
**Estado**: Listo para Producción

---

## 📋 TABLA DE CONTENIDOS

1. [Descripción General](#descripción-general)
2. [Arquitectura de Tablas](#arquitectura-de-tablas)
3. [Relaciones y Cardinalidad](#relaciones-y-cardinalidad)
4. [Índices y Optimización](#índices-y-optimización)
5. [Automatización con Triggers](#automatización-con-triggers)
6. [Vistas para Reportes](#vistas-para-reportes)
7. [Seguridad y Auditoría](#seguridad-y-auditoría)
8. [Guía de Implementación](#guía-de-implementación)

---

## 📌 Descripción General

Sistema completo de gestión de préstamos de equipos diseñado para instituciones educativas. Proporciona:

- **Gestión de inventario**: Control total de equipos con tracking de estado
- **Préstamos: Solicitud, autorización, entrega y devolución de equipos**
- **Incidencias**: Registro de problemas, daños y anomalías
- **Reportes**: Vistas preconstruidas para análisis instantáneo
- **Auditoría**: Rastreo completo de cambios y acciones de usuarios

### Características Técnicas

✅ **8 tablas principales** con relaciones normalizadas  
✅ **40+ índices estratégicos** para máximo rendimiento  
✅ **6 vistas preconstruidas** para reportes inmediatos  
✅ **4 funciones con triggers** para automatización de negocio  
✅ **Campos de auditoría completos** (usuario, fecha/hora)  
✅ **Validaciones robustas** (CHECK, UNIQUE, FK)  
✅ **Tipos ENUM** para integridad referencial  
✅ **Esquema dedicado** (prestamos) para aislamiento

---

## 🗂️ Arquitectura de Tablas

### 1. **SALON** - Espacios Físicos
```sql
Información: Salones, laboratorios, auditorios donde se utilizan equipos
Registros principales: Identificación, sede, bloque, nivel, capacidad
Índices clave: activo, sede, (activo, sede)
Relaciones: 1-a-N con PRESTAMO
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_salon` | SERIAL (PK) | Identificador único |
| `nombre_salon` | VARCHAR(100) | Ej: Aula 101, Lab A |
| `sede` | VARCHAR(100) | Campus o localización |
| `bloque` | VARCHAR(50) | Edificio dentro de la sede |
| `nivel` | VARCHAR(20) | PLANTA_BAJA, 1, 2... |
| `capacidad` | INT | Máximo de personas |
| `activo` | BOOLEAN | Disponible para préstamos |

---

### 2. **DOCENTE** - Personal Educativo
```sql
Información: Docentes con acceso a préstamos
Control: Habilitación, límite de préstamos simultáneos, contrato
Índices clave: identificacion, correo, (puede_hacer_prestamos)
Relaciones: 1-a-N con PRESTAMO, INCIDENCIA
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_docente` | SERIAL (PK) | Identificador único |
| `nombre_completo` | VARCHAR(150) | Nombre registrado |
| `identificacion` | VARCHAR(30) | Cédula/Pasaporte (UNIQUE) |
| `correo` | VARCHAR(150) | Correo institucional (UNIQUE) |
| `telefono` | VARCHAR(20) | Contacto opcional |
| `departamento` | VARCHAR(100) | Área académica |
| `estado_contrato` | VARCHAR(50) | ACTIVO, LICENCIA, SUSPENDIDO |
| `puede_hacer_prestamos` | BOOLEAN | Habilitación para préstamos |
| `limite_prestamos_simultaneos` | INT | Máximo permitido (>= 1) |
| `activo` | BOOLEAN | Registro activo |

---

### 3. **USUARIO_SISTEMA** - Operadores
```sql
Información: Usuarios operadores del sistema con roles diferenciados
Seguridad: Hash de contraseña, bloqueo por intentos, último login
Índices clave: nombre_usuario, (activo, rol), bloqueado
Relaciones: 1-a-N con PRESTAMO, INCIDENCIA
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | SERIAL (PK) | Identificador único |
| `nombre_usuario` | VARCHAR(80) | Login (UNIQUE) |
| `correo` | VARCHAR(150) | Correo (UNIQUE) |
| `nombre_completo` | VARCHAR(150) | Nombre completo |
| `rol` | ENUM | ADMINISTRADOR, OPERADOR, CONSULTA |
| `password_hash` | VARCHAR(255) | Hash bcrypt (mín $2a$10$) |
| `activo` | BOOLEAN | Usuario habilitado |
| `requerir_cambio_contraseña` | BOOLEAN | Forzar cambio al próximo login |
| `ultimo_login` | TIMESTAMPTZ | Auditoría de acceso |
| `intentos_fallidos` | INT | Contador de seguridad |
| `bloqueado_hasta` | TIMESTAMPTZ | Bloqueo temporario |

---

### 4. **CATEGORIA_EQUIPO** - Clasificación
```sql
Información: Taxonomía de equipos para consultas rápidas
Control: Tiempos máximos, autorización requerida
Índices clave: nombre_categoria, codigo_categoria
Relaciones: 1-a-N con EQUIPO
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_categoria` | SERIAL (PK) | Identificador único |
| `nombre_categoria` | VARCHAR(100) | Ej: Proyectores (UNIQUE) |
| `descripcion` | TEXT | Detalles de la categoría |
| `codigo_categoria` | VARCHAR(10) | Código corto (UNIQUE, NULLABLE) |
| `requiere_autorizacion` | BOOLEAN | Aprobación especial |
| `tiempo_maximo_prestamo_dias` | INT | Límite de días (NULL = sin límite) |
| `activo` | BOOLEAN | Categoría disponible |

---

### 5. **EQUIPO** - Inventario Central
```sql
Información: Bienes disponibles para préstamo
Control: Códigos de activo, serial técnico, mantenimiento
Stock: Desglose -disponible, en-préstamo, en-mantenimiento
Índices clave: codigo_activo, (categoria, activo), proxima_revision
Relaciones: N-a-1 con CATEGORIA_EQUIPO, 1-a-N con PRESTAMO_DETALLE
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_equipo` | SERIAL (PK) | Identificador único |
| `id_categoria` | INT (FK) | Referencia a CATEGORIA_EQUIPO |
| `codigo_activo` | VARCHAR(30) | Código de activo (UNIQUE) |
| `nombre_equipo` | VARCHAR(150) | Nombre descriptivo |
| `descripcion` | TEXT | Detalles técnicos |
| `marca_modelo` | VARCHAR(150) | Ej: Epson EB-X05 |
| `serial_tecnico` | VARCHAR(100) | Número de serie |
| `ubicacion_actual` | VARCHAR(150) | Localización física |
| `stock_total` | INT | Unidades en sistema |
| `stock_disponible` | INT | Listas para prestar (**ACTUALIZADO POR TRIGGERS**) |
| `stock_en_prestamo` | INT | En poder de docentes (**ACTUALIZADO POR TRIGGERS**) |
| `stock_en_mantenimiento` | INT | En reparación (**manual**) |
| `estado_general` | ENUM | BUENO, REGULAR, MALO, EN_MANTENIMIENTO, DE_BAJA |
| `valor_unitario` | NUMERIC(10,2) | Para reportes de valor de activos |
| `fecha_adquisicion` | DATE | Compra o incorporación |
| `fecha_ultimo_mantenimiento` | TIMESTAMPTZ | Último servicio |
| `proxima_revision` | DATE | Mantenimiento preventivo programado |
| `activo` | BOOLEAN | Equipo disponible |

**Validación de Stock**: `disponible + en_prestamo + en_mantenimiento <= total`

---

### 6. **PRESTAMO** - Encabezado de Solicitudes
```sql
Información: Solicitud maestra de préstamos
Control: Estados, fechas, vencimiento, observaciones
Relaciones: N-a-1 con DOCENTE, SALON, USUARIO_SISTEMA
Relaciones: 1-a-N con PRESTAMO_DETALLE, INCIDENCIA
Índices clave: (docente, estado, fecha), estado, (estado, fecha_vencimiento)
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_prestamo` | SERIAL (PK) | Identificador único |
| `id_docente` | INT (FK) | Docente solicitante |
| `id_salon` | INT (FK) | Salón donde se usará |
| `id_usuario_registra` | INT (FK) | Usuario que registró |
| `id_usuario_autoriza` | INT (FK) | Usuario que autorizó (NULLABLE) |
| `fecha_solicitud` | DATE | Fecha de registro |
| `hora_solicitud` | TIMETZ | Hora exacta |
| `fecha_entrega` | DATE | Entrega real (NULLABLE) |
| `fecha_devolucion_esperada` | DATE | Fecha límite pactada (NULLABLE) |
| `fecha_devolucion_real` | DATE | Devolución real (NULLABLE) |
| `hora_devolucion` | TIMETZ | Hora de devolución (NULLABLE) |
| `estado_prestamo` | ENUM | PENDIENTE, ENTREGADO, EN_CURSO, DEVUELTO, CANCELADO, VENCIDO |
| `tiene_observacion_activa` | BOOLEAN | (**ACTUALIZADO POR TRIGGER**: incidencias activas) |
| `dias_vencimiento` | INT | (**COLUMNA CALCULADA**: días de atraso si vencido) |
| `observacion_general` | TEXT | Notas generales |

---

### 7. **PRESTAMO_DETALLE** - Items Específicos
```sql
Información: Líneas de equipos dentro de un préstamo
Trazabilidad: Condiciones de entrega/devolución, cantidades
Relaciones: N-a-1 con PRESTAMO, EQUIPO
Índices clave: id_prestamo, (equipo, estado), (equipo, prestamo)
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_detalle` | SERIAL (PK) | Identificador único |
| `id_prestamo` | INT (FK) | Referencia a PRESTAMO |
| `id_equipo` | INT (FK) | Referencia a EQUIPO |
| `cantidad_solicitada` | INT | Unidades pedidas (> 0) |
| `cantidad_entregada` | INT | Unidades dadas (>= 0, <= solicitada) |
| `cantidad_devuelta` | INT | Unidades retornadas (>= 0, <= entregada) |
| `cantidad_con_incidencia` | INT | Devueltas con problemas (>= 0, <= entregada) |
| `estado_detalle` | ENUM | SOLICITADO, ENTREGADO, DEVUELTO_PARCIAL, DEVUELTO_COMPLETO, CON_INCIDENCIA, PENDIENTE_REPARACION |
| `condicion_entrega` | VARCHAR(50) | BUENO, REGULAR |
| `condicion_devolucion` | VARCHAR(50) | BUENO, REGULAR, MALO |
| `observacion_detalle` | TEXT | Detalles específicos |
| `fecha_entrega_real` | TIMESTAMPTZ | Timestamp de entrega |
| `fecha_devolucion_real` | TIMESTAMPTZ | Timestamp de devolución |

**Restricción UNIQUE**: Un equipo no puede aparecer 2 veces en mismo préstamo

---

### 8. **INCIDENCIA** - Registro de Problemas
```sql
Información: Problemas, daños, pérdidas, atrasos registrados
Gestión: Ciclo de vida completo con resolución
Relaciones: N-a-1 con PRESTAMO, DOCENTE, EQUIPO, USUARIO_SISTEMA
Índices clave: (equipo, activa), (tipo, fecha), activa, prioridad
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_incidencia` | SERIAL (PK) | Identificador único |
| `id_prestamo` | INT (FK) | Préstamo afectado |
| `id_prestamo_detalle` | INT (FK) | Item específico (NULLABLE) |
| `id_docente` | INT (FK) | Docente involucrado |
| `id_equipo` | INT (FK) | Equipo afectado |
| `id_usuario_reporta` | INT (FK) | Usuario que reportó |
| `id_usuario_resuelve` | INT (FK) | Usuario que resolvió (NULLABLE) |
| `tipo_incidencia` | ENUM | DAÑO_FISICO, FALLA_TECNICA, PERDIDA, ENTREGA_TARDIA, USO_INADECUADO, HURTO, OTRO |
| `descripcion` | TEXT | Detalles del problema |
| `descripcion_resolucion` | TEXT | Cómo se resolvió (NULLABLE) |
| `fecha_incidencia` | DATE | Fecha del evento |
| `hora_incidencia` | TIMETZ | Hora del evento |
| `estado_incidencia` | ENUM | ABIERTA, EN_PROCESO, RESUELTA, CERRADA |
| `activa` | BOOLEAN | (**ACTUALIZADO POR TRIGGER**: registra estado actual) |
| `prioridad` | VARCHAR(20) | URGENTE, ALTA, NORMAL, BAJA |
| `costo_reparacion` | NUMERIC(10,2) | Costo estimado/real |
| `fecha_resolucion` | DATE | Fecha de cierre (NULLABLE) |
| `hora_resolucion` | TIMETZ | Hora de cierre (NULLABLE) |

---

## 🔗 Relaciones y Cardinalidad

```
SALON (1) ─────────────────────► (N) PRESTAMO
           ╰─ FK: id_salon

DOCENTE (1) ─────────────────────► (N) PRESTAMO
           ├─ FK: id_docente
           └──────────────────► (N) INCIDENCIA

USUARIO_SISTEMA (1) ──────────────► (N) PRESTAMO (registra)
                  ├─────────────────► (N) PRESTAMO (autoriza)
                  └──────────────────► (N) INCIDENCIA (reporta/resuelve)

CATEGORIA_EQUIPO (1) ──────────────► (N) EQUIPO
                    ╰─ FK: id_categoria

EQUIPO (1) ──────────────────────────► (N) PRESTAMO_DETALLE
      ├─ FK: id_equipo
      └──────────────────────────────► (N) INCIDENCIA

PRESTAMO (1) ─────────────────────────► (N) PRESTAMO_DETALLE
        ├─ FK: id_prestamo (CASCADE)
        └────────────────────────────► (N) INCIDENCIA

PRESTAMO_DETALLE (1) ───────────────────► (N) INCIDENCIA (opcional)
                 ╰─ FK: id_prestamo_detalle (SET NULL)
```

---

## 🚀 Índices y Optimización

### Estrategia de Índices

Total: **40+ índices** distribuidos en busca de máximo rendimiento

#### SALON (4 índices)
```sql
- idx_salon_activo              -- Filtro: WHERE activo = TRUE
- idx_salon_sede                -- Búsqueda por sede
- idx_salon_sede_bloque         -- Compuesto: localización
- idx_salon_activo_sede         -- Parcial: activos por sede
```

#### DOCENTE (6 índices)
```sql
- idx_docente_activo            -- Estado
- idx_docente_identificacion    -- Búsqueda exacta por cédula
- idx_docente_correo            -- Búsqueda por correo
- idx_docente_activo_prestamos  -- Parcial: habilitados para prestar
- idx_docente_departamento      -- Agrupación por deparetamento
- idx_docente_estado_contrato   -- Filtro activos
```

#### USUARIO_SISTEMA (5 índices)
```sql
- idx_usuario_activo            -- Estado
- idx_usuario_rol               -- Filtro por rol
- idx_usuario_nombre            -- Búsqueda de login
- idx_usuario_activo_rol        -- Compuesto: usuarios por rol
- idx_usuario_bloqueado         -- Parcial: seguridad
```

#### EQUIPO (8 índices)
```sql
- idx_equipo_categoria          -- FK join
- idx_equipo_estado             -- Filtro por condición
- idx_equipo_activo             -- Disponibilidad
- idx_equipo_codigo_activo      -- Búsqueda de código
- idx_equipo_stock_disponible   -- Parcial: equipos prestables
- idx_equipo_categoria_activo   -- Compuesto: categoría
- idx_equipo_categoria_estado    -- Compuesto: estado por categoría
- idx_equipo_proxima_revision   -- Parcial: mantenimiento próximo
```

#### PRESTAMO (8 índices)
```sql
- idx_prestamo_docente          -- FK join
- idx_prestamo_salon            -- FK join
- idx_prestamo_usuario_registra -- FK join
- idx_prestamo_usuario_autoriza -- FK join
- idx_prestamo_estado           -- Filtro estado
- idx_prestamo_fecha_solicitud  -- Orden DESC
- idx_prestamo_observacion_activa -- Parcial: con problemas
- idx_prestamo_docente_estado_fecha      -- Compuesto: reportes docente
- idx_prestamo_estado_fecha_vencimiento  -- Compuesto: vencidos
- idx_prestamo_activos_docente           -- Parcial: activos de docente
```

#### PRESTAMO_DETALLE (6 índices)
```sql
- idx_detalle_prestamo          -- FK join
- idx_detalle_equipo            -- FK join
- idx_detalle_estado            -- Filtro estado
- idx_detalle_equipo_estado     -- Compuesto: trazabilidad
- idx_detalle_con_incidencia    -- Parcial: con problemas
- idx_detalle_equipo_prestamo_fecha -- Índice INCLUDE
```

#### INCIDENCIA (9 índices)
```sql
- idx_incidencia_prestamo       -- FK join
- idx_incidencia_docente        -- FK join
- idx_incidencia_equipo         -- FK join
- idx_incidencia_usuario_reporta -- FK join
- idx_incidencia_usuario_resuelve -- FK join
- idx_incidencia_tipo           -- Clasificación
- idx_incidencia_activa         -- Parcial: abiertas
- idx_incidencia_estado         -- Filtro estado
- idx_incidencia_fecha          -- Orden DESC
- idx_incidencia_prioridad      -- Parcial: por urgencia
- idx_incidencia_equipo_activa  -- Compuesto: dashboard
- idx_incidencia_abiertas_tipo_fecha -- Compuesto: reporte
```

### Ejemplos de Rendimiento

**Consulta**: Todos los préstamos activos de un docente
```sql
-- CON ÍNDICE: idx_prestamo_docente_estado_fecha
SELECT * FROM prestamo
WHERE id_docente = 5 AND estado_prestamo != 'DEVUELTO'
ORDER BY fecha_solicitud DESC;
-- Realizado en: O(log n)
```

**Consulta**: Equipos disponibles en categoría
```sql
-- CON ÍNDICE: idx_equipo_categoria_estado
SELECT * FROM equipo
WHERE id_categoria = 2 AND activo = TRUE AND estado_general = 'BUENO';
-- Realizado en: O(log n)
```

**Consulta**: Incidencias urgentes sin resolver
```sql
-- CON ÍNDICE: idx_incidencia_abiertas_tipo_fecha
SELECT * FROM incidencia
WHERE activa = TRUE AND prioridad = 'URGENTE'
ORDER BY fecha_incidencia DESC;
-- Realizado en: O(log n)
```

---

## ⚙️ Automatización con Triggers

### 1. **fn_set_actualizado_en()** - Timestamp Automático
Actualiza `actualizado_en` en TODAS las tablas al hacer UPDATE

```sql
TRIGGER: trg_[tabla]_actualizado_en
Se aplica a: salon, docente, usuario_sistema, categoria_equipo,
             equipo, prestamo, prestamo_detalle, incidencia
```

### 2. **fn_ajustar_stock_equipo()** - Control de Stock
Mantiene coherencia automática del stock:
- **INSERT detalle**: Descuenta `stock_disponible`, suma `stock_en_prestamo`
- **UPDATE detalle**: Ajusta diferencia de cantidad_solicitada
- **DELETE detalle**: Devuelve unidades

```sql
TRIGGER: trg_detalle_ajustar_stock
Evento: AFTER INSERT OR UPDATE OF cantidad_solicitada OR DELETE
Garantiza: disponible + en_prestamo + en_mantenimiento <= total
```

### 3. **fn_sync_observacion_activa()** - Sincronización de Incidencias
Actualiza automáticamente `tiene_observacion_activa` en PRESTAMO

```sql
TRIGGER: trg_incidencia_sync_prestamo
Evento: AFTER INSERT OR UPDATE OF activa OR DELETE
Cálculo: TRUE si EXISTS incidencia.activa = TRUE
```

### 4. **fn_validar_limite_prestamos()** - Control de Límites
Previene que docentes superen su límite de préstamos simultáneos

```sql
TRIGGER: trg_prestamo_validar_limite
Evento: BEFORE INSERT
Validación:
  - Docente tiene puede_hacer_prestamos = TRUE
  - Activos < limite_prestamos_simultaneos
  - Lanza EXCEPTION si no cumple
```

---

## 📊 Vistas para Reportes

### 1. **v_prestamos_activos**
Préstamos sin finalizar con contexto completo

**Campos principales**:
- Datos del préstamo (estado, fechas, observaciones)
- Datos del docente (nombre, correo, departamento)
- Datos del salón (nombre, sede, bloque)
- Cálculo de días de atraso si está vencido
- Contador de incidencias activas

**Uso Backend**: Dashboard de préstamos pendientes

```javascript
// Ejemplo en Express
app.get('/api/prestamos/activos', (req, res) => {
  const query = 'SELECT * FROM prestamos.v_prestamos_activos ORDER BY dias_atraso DESC';
  // Retorna préstamos ordenados por vencimiento
});
```

---

### 2. **v_detalle_prestamos_completo**
Desglose de equipos en cada préstamo con trazabilidad

**Campos principales**:
- Info de equipo (código, nombre, categoría, estado)
- Cantidades (solicitadas, entregadas, devueltas, con incidencia)
- Condiciones de entrega/devolución
- Cantidad pendiente de devolución (calculada)
- Descripción del estado

**Uso Backend**: Vista detallada de qué equipos se tienen en cada préstamo

---

### 3. **v_inventario_equipos**
Estado en tiempo real del inventario

**Campos principales**:
- Info técnica (código, marca, serial, ubicación)
- Stock desglosado (total, disponible, en-préstamo, en-mantenimiento)
- Estado del equipo
- Estado de mantenimiento (VENCIDO, PRÓXIMO, OK)
- % disponibilidad
- Valor total del activo

**Uso Backend**: Dashboard de inventario, reportes de disponibilidad

---

### 4. **v_incidencias_abiertas**
Incidencias activas priorizadas

**Campos principales**:
- Tipo, prioridad, estado
- Días desde que se abrió
- Info del equipo y docente
- Usuario que reportó/resolvió
- Descripción y descripción de resolución

**Uso Backend**: Sistema de alertas, dashboard de problemas

---

### 5. **v_estadisticas_docentes**
Resumen por docente

**Campos principales**:
- Info básica del docente
- Contadores: prestamos_activos, devueltos, totales
- Incidencias: activas, totales
- Último préstamo
- Capacidad utilizada vs límite

**Uso Backend**: Reportes administrativos, auditoría de desempeño

---

### 6. **v_equipos_mantenimiento_proximo**
Equipos que requieren mantenimiento

**Campos principales**:
- Info básica del equipo
- Fecha de último mantenimiento
- Próxima revisión
- Días para la revisión
- Urgencia (VENCIDO, PRÓXIMO, PLANIFICADO)

**Uso Backend**: Alertas de mantenimiento, planificación

---

## 🔒 Seguridad y Auditoría

### Control de Acceso

**Roles de Usuario**:
1. **ADMINISTRADOR**: Acceso total. Gestión de usuarios.
2. **OPERADOR**: CRUD de préstamos e incidencias. Sin gestión de usuarios.
3. **CONSULTA**: Solo lectura de vistas y reportes.

### Auditoría Completa

Cada tabla tiene:
```sql
- creado_en: TIMESTAMPTZ DEFAULT NOW()
- actualizado_en: TIMESTAMPTZ (actualizado por trigger)
- creado_por: VARCHAR(100) -- Debe ser llenado por backend
- actualizado_por: VARCHAR(100) -- Debe ser llenado por backend
```

### Seguridad de Contraseñas

```sql
usuario_sistema.password_hash: VARCHAR(255)
Formato esperado: bcrypt ($2a$10$...) o argon2
Mínimo: 10 rondas de sal (~60 caracteres resultado)
```

### Validaciones en Base de Datos

✅ Expresiones regulares para correos  
✅ Límites de cantidad (CHECK constraints)  
✅ Coherencia de fechas (fecha_devolución >= fecha_entrega)  
✅ Validación de stock (suma <= total)  
✅ Única instancia por relación (UNIQUEs)  
✅ Restricción de borrado (RESTRICT en FK críticas)

---

## 🛠️ Guía de Implementación

### Requisitos
- PostgreSQL 13 o superior
- Usuario con permisos CREATE SCHEMA, CREATE TABLE, etc.
- 10 MB de espacio (sin datos)

### Pasos de Instalación

1. **Conectarse a PostgreSQL**
```bash
psql -U postgres -d tu_base_datos
```

2. **Ejecutar el script completo**
```sql
-- Ejecutar: /ruta/a/ong.sql
\i /path/to/ong.sql
```

3. **Verificar instalación**
```sql
-- Confirmar esquema existe
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'prestamos';

-- Contar tablas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'prestamos';

-- Contar índices
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'prestamos';
```

4. **Insertar datos iniciales manualmente O usar el script**
```sql
-- Ya incluido: Usuario administrador michael
INSERT INTO prestamos.usuario_sistema (...) VALUES (...);
```

5. **Crear roles de acceso (opcional)**
```sql
-- Rol de lectura para reportes
CREATE ROLE prestamos_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA prestamos TO prestamos_readonly;
```

### Conexión desde Backend

**Node.js + pg**:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'tu_base_datos',
  user: 'postgres',
  password: 'tu_contraseña',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Usar esquema prestamos
const result = await pool.query('SELECT * FROM prestamos.v_prestamos_activos');
```

**Connection String**:
```
postgresql://usuario:contraseña@localhost:5432/base_datos?sslmode=prefer&search_path=prestamos
```

### Operaciones Comunes Recomendadas

**Crear un préstamo**:
```sql
BEGIN;
INSERT INTO prestamos.prestamo (...) VALUES (...) RETURNING id_prestamo;
INSERT INTO prestamos.prestamo_detalle (...) VALUES (...); -- Los índices/triggers manejan stock
COMMIT;
```

**Actualizar estado de préstamo**:
```sql
UPDATE prestamos.prestamo
SET estado_prestamo = 'DEVUELTO', 
    fecha_devolucion_real = CURRENT_DATE,
    actualizado_por = 'usuario_nombre'
WHERE id_prestamo = 123;
-- triggers: actualiza actualizado_en automáticamente
```

**Registrar incidencia**:
```sql
INSERT INTO prestamos.incidencia (
  id_prestamo, id_docente, id_equipo, id_usuario_reporta,
  tipo_incidencia, descripcion, prioridad
) VALUES (123, 5, 10, 1, 'DAÑO_FISICO', 'Pantalla rota', 'ALTA');
-- triggers: sincroniza tiene_observacion_activa en PRESTAMO
```

---

## 📈 Mantenimiento Recomendado

### Operaciones Periódicas

**Diariamente**:
- Ejecutar VACUUM: `VACUUM prestamos.prestamo;`
- Revisar logs de intentos de acceso bloqueados

**Semanalmente**:
- Revisar `v_incidencias_abiertas` sin asignar
- Verificar `v_equipos_mantenimiento_proximo`
- Analizar consultasllentas: `EXPLAIN ANALYZE SELECT ...`

**Mensualmente**:
- `REINDEX INDEX CONCURRENTLY idx_nombre;` en índices críticos
- `ANALYZE prestamos.prestamo;` (estadísticas de optimizador)
- Archivar incidencias cerradas > 6 meses

**Trimestralmente**:
- Revisar crecimiento de `incidencia` y `prestamo`
- Evaluar particionamiento si tabla > 1M registros
- Validar integridad referencial con consultas JOIN

### Monitoreo de Rendimiento

```sql
-- TOP 5 consultas lentas
SELECT query, calls, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 5;

-- Índices no utilizados
SELECT indexname FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Tamaño de tablas
SELECT 
  schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'prestamos'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] **Auditoría detallada**: Tabla `log_auditoria` con cambios históricos
- [ ] **Almacenamiento de archivos**: Anexos de fotos de incidencias
- [ ] **Particionamiento**: Si > 1M registros de prestamo/incidencia
- [ ] **Búsqueda Full-Text**: Extensión `pg_trgm` para búsquedas textuales
- [ ] **JSON flexible**: Campos JSON para datos dinámicos
- [ ] **Replicación**: Hot standby para alta disponibilidad
- [ ] **Caché**: Redis para datos de lectura frecuente
- [ ] **Notificaciones**: LISTEN/NOTIFY para eventos en tiempo real

---

## 📞 Soporte Técnico

**Script**: Totalmente funcional y tested  
**Documentación**: Completa con comments SQL  
**Índices**: Optimizados para >100k registros  
**Vistas**: Listas para producción  

Para preguntas de implementación, consultar el archivo `ong.sql` directamente.

---

**Última actualización**: Abril 2024  
**Versión**: 2.0 Profesional  
**Estado**: ✅ Listo para Producción
