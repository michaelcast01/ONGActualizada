# 📐 DIAGRAMA DE RELACIONES - SISTEMA ONG

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vue 3)                         │
│                    http://localhost:5174                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                            │
│  │  Login.vue   │──────> POST /api/auth/login               │
│  └──────────────┘                                            │
│       ↓ (token guardado)                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ApiTester.vue (CRUD Universal)          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │ACCIÓN ▼  │ │TABLA ▼   │ │CONSULTA▼ │             │   │
│  │  │ Vis/Agr  │ │Donante   │ │Todos/ID  │             │   │
│  │  │ Mod/Elim │ │Donación  │ │          │             │   │
│  │  │          │ │Benefic.  │ │          │             │   │
│  │  │          │ │Usuario   │ │          │             │   │
│  │  │          │ │Vehículo  │ │          │             │   │
│  │  │          │ │Conductor │ │          │             │   │
│  │  │          │ │Misión    │ │          │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘             │   │
│  │                                                        │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │ PUT/GET/POST/DELETE + JWT                │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    │ http://localhost:3001
                    │
┌───────────────────▼──────────────────────────────────────────┐
│                BACKEND (Node.js/Express)                     │
│              http://localhost:3001/api                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ JWT Verify   │  │ Body Parser  │  ┌─────────────────┐   │
│  │ Middleware   │  │ JSON         │  │ BCrypt Password │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  router.get  │  │  router.post │  │ router.put   │       │
│  │  router.del. │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│           ↓              ↓                  ↓                │
│  /api/donante   /api/donacion   /api/beneficiario           │
│  /api/usuario   /api/vehiculo   /api/conductor              │
│  /api/mision    /api/auth/login                             │
│                                                              │
└─────────────────────┬──────────────────────────────────────┘
                      │ pool.query() - mysql2/promise
                      │
┌─────────────────────▼──────────────────────────────────────┐
│          BASE DE DATOS: MySQL 8.0+ (gestion_social)        │
│                   localhost:3306                           │
├─────────────────────────────────────────────────────────────┤
│  [21 Tablas normalizadas con FK constraints]               │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │        TABLAS DE SEGURIDAD                       │      │
│  │  • rol         • permiso      • usuario           │      │
│  │  • usuario_rol • rol_permiso  • bitacora_audit   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │      TABLAS DE DONANTES Y DONACIONES             │      │
│  │  • donante ──(1:M)──> donacion                   │      │
│  │  • item_proteccion ──(1:M)──> lote_donacion     │      │
│  │  • donacion ──(1:M)──> lote_donacion             │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │       TABLAS DE BENEFICIARIOS                    │      │
│  │  • beneficiario ──(1:M)──> acudiente             │      │
│  │  • beneficiario ──(1:M)──> documento_soporte    │      │
│  │  • beneficiario ──(1:M)──> entrega_ubicacion    │      │
│  │  • beneficiario ──(1:M)──> entrega_seguimiento  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │          TABLAS DE OPERACIÓN                     │      │
│  │  • mision_proyecto ──(1:M)──> mision_recurso    │      │
│  │  • conductor ──(1:M)──> mision_recurso          │      │
│  │  • vehiculo ──(1:M)──> mision_recurso           │      │
│  │  • item_proteccion ──(1:M)──> mision_recurso   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │          TABLAS DE ENTREGAS                      │      │
│  │  • mision_proyecto ──(1:M)──> entrega_segui.   │      │
│  │  • usuario ──(1:M)──> entrega_seguimiento      │      │
│  │  • entrega_seguimiento ──(1:M)──> detalle_ent. │      │
│  │  • lote_donacion ──(1:M)──> detalle_entrega    │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujos de Datos CRUD

### Flujo 1: CREATE (Agregar Donante)
```
Frontend                          Backend                      Base de Datos
   │                               │                              │
   ├─ Input: nombre, tipo ─────────>                             │
   │                        POST /api/donante                      │
   │                        {nombre, tipo, ...}                    │
   │                               │                              │
   │                               ├─ Validar campos             │
   │                               ├─ SQL INSERT                 │
   │                               ├──────────────────────────>  INSERT INTO donante
   │                               │                              │
   │                               │  <──────────────────────   {id: 5, ...}
   │                               │                              │
   │  <────────Status 201──────────┤                             │
   │  {id, nombre, tipo}           │                              │
   │                               │                              │
   ├─ Muestra en table ───────────────────────────────────────────>
   │
```

### Flujo 2: READ (Visualizar Donantes)
```
Frontend                          Backend                      Base de Datos
   │                               │                              │
   ├─ Click: Visualizar ──────────>                             │
   │  TABLA=donante                POST /api/donante              │
   │                               │                              │
   │                               ├─ SQL SELECT *               │
   │                               ├──────────────────────────> SELECT * FROM donante
   │                               │                              │
   │                               │  <───────────────────────   [{id:1,...}, {id:2,...}]
   │                               │                              │
   │  <────[{id, nombre}...]───────┤                             │
   │                               │                              │
   ├─ Tabla HTML + Paginación     │                              │
   │  Página 1 de 3               │                              │
   │
```

### Flujo 3: UPDATE (Modificar Beneficiario)
```
Frontend                          Backend                      Base de Datos
   │                               │                              │
   ├─ Input ID: 42 ───────────────>                             │
   ├─ Campos: primer_nombre        PUT /api/beneficiario/42       │
   │                               {primer_nombre: "Juan"}        │
   │                               │                              │
   │                               ├─ Validar ID existe         │
   │                               ├─ SQL UPDATE                 │
   │                               ├──────────────────────────> UPDATE beneficiario
   │                               │                              SET primer_nombre='Juan'
   │                               │  <───────────────────────   WHERE id=42
   │                               │  {affectedRows: 1}           │
   │                               │                              │
   │  <────{message: actualizado}──┤                             │
   │                               │                              │
   ├─ Reset formulario             │                              │
   │
```

### Flujo 4: DELETE (Eliminar Conductor)
```
Frontend                          Backend                      Base de Datos
   │                               │                              │
   ├─ Input ID: 7 ────────────────>                             │
   ├─ Acción: Eliminar            DELETE /api/conductor/7        │
   │                               │                              │
   │                               ├─ Validar ID existe         │
   │                               ├─ SQL DELETE                 │
   │                               ├──────────────────────────> DELETE FROM conductor
   │                               │  <───────────────────────   WHERE id=7
   │                               │  {affectedRows: 1}           │
   │                               │                              │
   │  <────{message: eliminado}────┤                             │
   │                               │                              │
```

---

## Relaciones Entre Tablas (Diagrama ER Simplificado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO: DONACIONES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DONANTE (1) ──────────(1:M)──────────> DONACION               │
│    ├─ id ✓                              ├─ id ✓               │
│    ├─ tipo                              ├─ donante_id (FK)    │
│    ├─ nombre_completo                   ├─ fecha_donacion     │
│    ├─ numero_documento                  ├─ tipo               │
│    └─ correo                            ├─ valor_estimado     │
│                                         └─ metodo_recepcion   │
│                                              │                 │
│                                              └─(1:M)─> LOTE_DONACION
│                                                         ├─ id ✓
│  ITEM_PROTECCION (1) ◄─────(N:1)────────────────────┤ item_id (FK)
│    ├─ id ✓                                           ├─ donacion_id (FK)
│    ├─ codigo_sku                                     ├─ numero_lote
│    ├─ nombre                                         ├─ cantidad_inicial
│    ├─ categoria                                      └─ stock_actual
│    └─ unidad_medida                                      │
│                                                          └─(1:M)─> DETALLE_ENTREGA
│                                                                     ├─ id ✓
│                                                                     ├─ lote_id (FK)
│                                                                     ├─ entrega_id (FK)
│                                                                     └─ cantidad_entregada
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   MÓDULO: BENEFICIARIOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BENEFICIARIO (1) ─────────(1:M)────────> ACUDIENTE             │
│    ├─ id ✓                               ├─ id ✓              │
│    ├─ tipo_documento                     ├─ beneficiario_id   │
│    ├─ numero_documento                   │  (FK)              │
│    ├─ primer_nombre                      ├─ tipo_documento    │
│    ├─ apellido                           └─ nombre_completo   │
│    ├─ fecha_nacimiento                                         │
│    ├─ genero                         DOCUMENTO_SOPORTE         │
│    ├─ telefono                       ├─ id ✓                  │
│    ├─ correo                         ├─ beneficiario_id (FK)  │
│    ├─ es_victima_conflicto           ├─ tipo_documento       │
│    ├─ tiene_discapacidad             └─ url_archivo          │
│    └─ grupo_etnico                                             │
│         │                            ENTREGA_UBICACION         │
│         ├─(1:M)─> ENTREGA_SEGUIMIENTO  ├─ id ✓               │
│         │           ├─ id ✓            ├─ beneficiario_id    │
│         │           ├─ beneficiario_id │  (FK)               │
│         │           │  (FK)            ├─ direccion_meta     │
│         │           ├─ mision_id (FK)  └─ tipo_zona          │
│         │           ├─ usuario_id (FK)                        │
│         │           ├─ fecha_entrega                          │
│         │           └─ latitud_gps                            │
│         │                │                                     │
│         │                └─(1:M)─> DETALLE_ENTREGA           │
│         │                           ├─ id ✓                  │
│         │                           ├─ entrega_id (FK)       │
│         │                           ├─ lote_id (FK)          │
│         │                           └─ cantidad_entregada    │
│         │                                                     │
│         └─────────────────────────────────────────────────────
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO: MISIONES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MISION_PROYECTO (1) ────────(1:M)──────> MISION_RECURSO       │
│    ├─ id ✓                               ├─ id ✓              │
│    ├─ nombre_mision                      ├─ mision_id (FK)    │
│    ├─ tipo_mision                        ├─ conductor_id      │
│    ├─ fecha_inicio                       │  (FK) [opcional]   │
│    ├─ fecha_fin                          ├─ vehiculo_id       │
│    ├─ cod_municipio                      │  (FK) [opcional]   │
│    └─ estado                             ├─ canastilla_id     │
│         │                                │  (FK) [opcional]   │
│         │                                └─ fecha_asignacion  │
│         │                                     │
│         │         CONDUCTOR (1) ◄─(N:1)──────┤
│         │           ├─ id ✓
│         │           ├─ numero_documento
│         │           ├─ nombre_completo
│         │           ├─ numero_licencia
│         │           └─ vencimiento_licencia
│         │
│         │         VEHICULO (1) ◄─(N:1)────────┤
│         │           ├─ id ✓
│         │           ├─ placa
│         │           ├─ tipo
│         │           └─ vencimiento_soat
│         │
│         │         ITEM_PROTECCION (1) ◄─(N:1)
│         │           (ver MÓDULO: DONACIONES)
│         │                │
│         │                └─(1:M)─> PARTE_LOGISTICO
│         │                           ├─ id ✓
│         │                           ├─ recurso_mision_id
│         │                           │  (FK)
│         │                           ├─ tipo_parte
│         │                           └─ monto
│         │
│         └─(1:M)─> ENTREGA_SEGUIMIENTO
│                    (ver MÓDULO: BENEFICIARIOS)
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Tabla de Sincronización: Frontend ↔ Backend ↔ BD

| Tabla ONG | Frontend | Backend | BD SQL | Status |
|-----------|----------|---------|--------|--------|
| **donante** | `donante` | `/api/donante` | `donante` (8 cols) | ✅ |
| **donacion** | `donacion` | `/api/donacion` | `donacion` (6 cols) | ✅ |
| **beneficiario** | `beneficiario` | `/api/beneficiario` | `beneficiario` (12 cols) | ✅ |
| **usuario** | `usuario` | `/api/usuario` | `usuario` (7 cols) | ✅ |
| **vehiculo** | `vehiculo` | `/api/vehiculo` | `vehiculo` (6 cols) | ✅ |
| **conductor** | `conductor` | `/api/conductor` | `conductor` (6 cols) | ✅ |
| **mision_proyecto** | `mision` | `/api/mision` | `mision_proyecto` (7 cols) | ✅ |

---

## Resumen de Relaciones

```
Total de Tablas: 21
Total de Relaciones FK: 15+
Niveles de Profundidad: 4 (donante → donacion → lote → detalle)
Integridad Referencial: ✅ (Todos los FK con constraints)
Normalización: ✅ (Tercera Forma Normal - 3NF)
```

