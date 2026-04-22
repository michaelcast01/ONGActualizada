# 📝 EJEMPLOS DE CONSULTAS SQL PARA BACKEND

## Guía de Consultas Recomendadas para Operaciones Frecuentes

---

## 1️⃣ PRÉSTAMOS - Consultas de Gestión

### Obtener todos los préstamos activos
```sql
SELECT * FROM prestamos.v_prestamos_activos
ORDER BY dias_atraso DESC NULLS LAST, fecha_solicitud DESC;
```

### Préstamos vencidos (en atraso)
```sql
SELECT * FROM prestamos.v_prestamos_activos
WHERE dias_atraso IS NOT NULL AND dias_atraso > 0
ORDER BY dias_atraso DESC;
```

### Préstamos de un docente específico
```sql
SELECT p.*, 
       COUNT(i.id_incidencia) AS incidencias_activas
FROM prestamos.prestamo p
LEFT JOIN prestamos.incidencia i ON i.id_prestamo = p.id_prestamo AND i.activa = TRUE
WHERE p.id_docente = $1
  AND p.estado_prestamo NOT IN ('DEVUELTO', 'CANCELADO')
GROUP BY p.id_prestamo
ORDER BY p.fecha_solicitud DESC;
```

### Préstamos por registrar en el día
```sql
SELECT p.id_prestamo, p.id_docente, d.nombre_completo,
       COUNT(pd.id_detalle) AS cantidad_equipos
FROM prestamos.prestamo p
JOIN prestamos.docente d ON d.id_docente = p.id_docente
LEFT JOIN prestamos.prestamo_detalle pd ON pd.id_prestamo = p.id_prestamo
WHERE DATE(p.creado_en) = CURRENT_DATE
  AND p.estado_prestamo = 'PENDIENTE'
GROUP BY p.id_prestamo, d.id_docente
ORDER BY p.hora_solicitud DESC;
```

### Registrar un préstamo (con detalles)
```sql
-- 1. Insertar préstamo
INSERT INTO prestamos.prestamo (
  id_docente, id_salon, id_usuario_registra,
  fecha_solicitud, fecha_devolucion_esperada, estado_prestamo
) VALUES (
  $1, $2, $3,
  CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'PENDIENTE'
) RETURNING id_prestamo;

-- 2. Insertar detalles (por cada equipo)
INSERT INTO prestamos.prestamo_detalle (
  id_prestamo, id_equipo, cantidad_solicitada
) VALUES (
  $1, $2, $3
);
-- NOTA: TRIGGERS automáticamente ajustarán stock_disponible
```

### Actualizar estado de préstamo a entregado
```sql
UPDATE prestamos.prestamo
SET estado_prestamo = 'ENTREGADO',
    fecha_entrega = CURRENT_DATE,
    id_usuario_autoriza = $1,
    actualizado_por = $2
WHERE id_prestamo = $3;
```

### Marcar préstamo como devuelto
```sql
UPDATE prestamos.prestamo
SET estado_prestamo = 'DEVUELTO',
    fecha_devolucion_real = CURRENT_DATE,
    actualizado_por = $1
WHERE id_prestamo = $2;

-- Actualizar cantidades en detalles
UPDATE prestamos.prestamo_detalle
SET estado_detalle = 'DEVUELTO_COMPLETO',
    cantidad_devuelta = cantidad_entregada,
    fecha_devolucion_real = NOW(),
    condicion_devolucion = $1  -- 'BUENO', 'REGULAR', 'MALO'
WHERE id_prestamo = $2
  AND cantidad_devuelta = 0;
```

---

## 2️⃣ EQUIPOS - Consultas de Inventario

### Inventario completo con disponibilidad
```sql
SELECT * FROM prestamos.v_inventario_equipos
ORDER BY pct_disponibilidad DESC, nombre_categoria, nombre_equipo;
```

### Equipos con bajo stock disponible
```sql
SELECT * FROM prestamos.v_inventario_equipos
WHERE stock_disponible = 0
  OR pct_disponibilidad < 25
ORDER BY pct_disponibilidad ASC;
```

### Equipos por categoría con details
```sql
SELECT 
  c.nombre_categoria,
  COUNT(e.id_equipo) AS cantidad_equipos,
  SUM(e.stock_total) AS stock_total,
  SUM(e.stock_disponible) AS stock_disponible,
  SUM(e.stock_en_prestamo) AS stock_en_prestamo,
  AVG(ROUND((e.stock_disponible::FLOAT / NULLIF(e.stock_total, 0)) * 100, 2)) AS pct_promedio_disponibilidad
FROM prestamos.equipo e
JOIN prestamos.categoria_equipo c ON c.id_categoria = e.id_categoria
WHERE e.activo = TRUE
GROUP BY c.id_categoria, c.nombre_categoria
ORDER BY stock_disponible DESC;
```

### Buscar equipo por código
```sql
SELECT e.*, c.nombre_categoria
FROM prestamos.equipo e
JOIN prestamos.categoria_equipo c ON c.id_categoria = e.id_categoria
WHERE e.codigo_activo = $1
  AND e.activo = TRUE;
```

### Equipos próximos a vencer mantenimiento
```sql
SELECT * FROM prestamos.v_equipos_mantenimiento_proximo
WHERE urgencia IN ('VENCIDO - URGENTE', 'PRÓXIMO - ESTA SEMANA')
ORDER BY proxima_revision ASC;
```

### Programar mantenimiento
```sql
UPDATE prestamos.equipo
SET estado_general = 'EN_MANTENIMIENTO',
    stock_en_mantenimiento = stock_en_mantenimiento + $1,
    stock_disponible = stock_disponible - $1,
    actualizado_por = $2
WHERE id_equipo = $3;

-- Después de mantenimiento:
UPDATE prestamos.equipo
SET estado_general = 'BUENO',
    stock_en_mantenimiento = stock_en_mantenimiento - $1,
    stock_disponible = stock_disponible + $1,
    fecha_ultimo_mantenimiento = NOW(),
    proxima_revision = CURRENT_DATE + INTERVAL '6 months',
    actualizado_por = $1
WHERE id_equipo = $2;
```

### Valor total del activo por categoría
```sql
SELECT 
  c.nombre_categoria,
  COUNT(e.id_equipo) AS cantidad,
  SUM(e.stock_total) AS unidades_total,
  SUM(e.valor_unitario) AS valor_unitario_promedio,
  SUM(e.stock_total * COALESCE(e.valor_unitario, 0)) AS valor_total_categoria
FROM prestamos.equipo e
JOIN prestamos.categoria_equipo c ON c.id_categoria = e.id_categoria
WHERE e.activo = TRUE
GROUP BY c.id_categoria, c.nombre_categoria
ORDER BY valor_total_categoria DESC;
```

---

## 3️⃣ INCIDENCIAS - Gestión de Problemas

### Ver incidencias abiertas
```sql
SELECT * FROM prestamos.v_incidencias_abiertas
ORDER BY prioridad, dias_abierta DESC;
```

### Incidencias por urgencia
```sql
SELECT 
  prioridad,
  COUNT(*) AS cantidad,
  COUNT(*) FILTER (WHERE estado_incidencia = 'ABIERTA') AS sin_asignar,
  COUNT(*) FILTER (WHERE estado_incidencia = 'EN_PROCESO') AS en_proceso
FROM prestamos.v_incidencias_abiertas
GROUP BY prioridad
ORDER BY CASE prioridad
  WHEN 'URGENTE' THEN 1
  WHEN 'ALTA' THEN 2
  WHEN 'NORMAL' THEN 3
  WHEN 'BAJA' THEN 4
  ELSE 5
END;
```

### Registrar una incidencia
```sql
INSERT INTO prestamos.incidencia (
  id_prestamo, id_docente, id_equipo, id_usuario_reporta,
  tipo_incidencia, descripcion, prioridad, costo_reparacion
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7, $8
) RETURNING id_incidencia;

-- NOTA: TRIGGER automáticamente:
-- 1. Sincroni za tiene_observacion_activa en PRESTAMO
-- 2. Cambia estado_equipo si es daño/pérdida
```

### Asignar incidencia a usuario
```sql
UPDATE prestamos.incidencia
SET estado_incidencia = 'EN_PROCESO',
    id_usuario_resuelve = $1,
    actualizado_por = $2
WHERE id_incidencia = $3;
```

### Resolver incidencia
```sql
UPDATE prestamos.incidencia
SET estado_incidencia = 'RESUELTA',
    activa = FALSE,
    descripcion_resolucion = $1,
    fecha_resolucion = CURRENT_DATE,
    hora_resolucion = NOW()::TIME WITH TIME ZONE,
    id_usuario_resuelve = $2,
    actualizado_por = $2
WHERE id_incidencia = $3;

-- NOTA: TRIGGER actualiza automáticamente tiene_observacion_activa en PRESTAMO
```

### Incidencias por equipo (historial)
```sql
SELECT 
  e.codigo_activo,
  e.nombre_equipo,
  COUNT(*) AS total_incidencias,
  COUNT(*) FILTER (WHERE i.activa = TRUE) AS abiertas,
  SUM(COALESCE(i.costo_reparacion, 0)) AS costo_total_reparaciones,
  MAX(i.fecha_incidencia) AS ultima_incidencia
FROM prestamos.incidencia i
JOIN prestamos.equipo e ON e.id_equipo = i.id_equipo
WHERE e.activo = TRUE
GROUP BY e.id_equipo, e.codigo_activo, e.nombre_equipo
HAVING COUNT(*) > 0
ORDER BY COUNT(*) DESC;
```

### Incidencias por docente (comportamiento)
```sql
SELECT 
  d.nombre_completo,
  d.correo,
  COUNT(i.id_incidencia) AS total_incidencias,
  COUNT(i.id_incidencia) FILTER (WHERE i.tipo_incidencia = 'DAÑO_FISICO') AS daños,
  COUNT(i.id_incidencia) FILTER (WHERE i.tipo_incidencia = 'PERDIDA') AS perdidas,
  COUNT(i.id_incidencia) FILTER (WHERE i.tipo_incidencia = 'ENTREGA_TARDIA') AS atrasos
FROM prestamos.docente d
LEFT JOIN prestamos.incidencia i ON i.id_docente = d.id_docente
WHERE d.activo = TRUE
GROUP BY d.id_docente, d.nombre_completo
HAVING COUNT(i.id_incidencia) > 0
ORDER BY COUNT(i.id_incidencia) DESC;
```

---

## 4️⃣ DOCENTES - Gestión y Reportes

### Ver estadísticas por docente
```sql
SELECT * FROM prestamos.v_estadisticas_docentes
ORDER BY prestamos_activos DESC;
```

### Docentes con límite alcanzado
```sql
SELECT 
  d.id_docente,
  d.nombre_completo,
  d.limite_prestamos_simultaneos,
  COUNT(p.id_prestamo) AS prestamos_activos,
  (d.limite_prestamos_simultaneos - COUNT(p.id_prestamo)) AS disponibles
FROM prestamos.docente d
LEFT JOIN prestamos.prestamo p 
  ON p.id_docente = d.id_docente 
  AND p.estado_prestamo NOT IN ('DEVUELTO', 'CANCELADO')
WHERE d.activo = TRUE AND d.puede_hacer_prestamos = TRUE
GROUP BY d.id_docente
HAVING COUNT(p.id_prestamo) >= d.limite_prestamos_simultaneos
ORDER BY prestamos_activos DESC;
```

### Registrar nuevo docente
```sql
INSERT INTO prestamos.docente (
  nombre_completo, identificacion, correo, telefono,
  departamento, estado_contrato, puede_hacer_prestamos
) VALUES (
  $1, $2, $3, $4,
  $5, 'ACTIVO', true
) RETURNING id_docente;
```

### Suspender préstamos de un docente
```sql
UPDATE prestamos.docente
SET puede_hacer_prestamos = FALSE,
    observacion_general = CONCAT(
      observacion_general,
      '; Suspendido el ',
      CURRENT_DATE::TEXT,
      ' por: ', $1
    ),
    actualizado_por = $2
WHERE id_docente = $3;
```

---

## 5️⃣ USUARIOS - Seguridad y Control

### Login (verificar credenciales)
```sql
SELECT id_usuario, nombre_usuario, rol, activo, bloqueado_hasta
FROM prestamos.usuario_sistema
WHERE nombre_usuario = $1
  AND activo = TRUE
  AND (bloqueado_hasta IS NULL OR bloqueado_hasta < NOW());
```

### Registrar intento fallido
```sql
UPDATE prestamos.usuario_sistema
SET intentos_fallidos = intentos_fallidos + 1,
    bloqueado_hasta = CASE
      WHEN intentos_fallidos >= 4 THEN NOW() + INTERVAL '15 minutes'
      ELSE bloqueado_hasta
    END
WHERE id_usuario = $1;
```

### Login exitoso
```sql
UPDATE prestamos.usuario_sistema
SET ultimo_login = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE id_usuario = $1;
```

### Crear nuevo usuario
```sql
INSERT INTO prestamos.usuario_sistema (
  nombre_usuario, correo, nombre_completo, rol, password_hash
) VALUES (
  $1, $2, $3, $4, $5  -- hash bcrypt de contraseña
) RETURNING id_usuario;
```

### Forzar cambio de contraseña
```sql
UPDATE prestamos.usuario_sistema
SET requerir_cambio_contraseña = TRUE,
    actualizado_por = $1
WHERE id_usuario = $2;
```

### Cambiar contraseña
```sql
UPDATE prestamos.usuario_sistema
SET password_hash = $1,
    requerir_cambio_contraseña = FALSE,
    actualizado_por = $2
WHERE id_usuario = $3
  AND nombre_usuario = $4;  -- Seguridad adicional
```

---

## 6️⃣ REPORTES - Análisis y Métricas

### Resumen diario de actividad
```sql
SELECT
  DATE(p.fecha_solicitud) AS fecha,
  COUNT(p.id_prestamo) FILTER (WHERE p.estado_prestamo = 'PENDIENTE') AS pendientes,
  COUNT(p.id_prestamo) FILTER (WHERE p.estado_prestamo = 'ENTREGADO') AS entregados,
  COUNT(p.id_prestamo) FILTER (WHERE p.estado_prestamo = 'DEVUELTO') AS devueltos,
  COUNT(i.id_incidencia) AS incidencias,
  COUNT(DISTINCT p.id_docente) AS docentes_activos
FROM prestamos.prestamo p
LEFT JOIN prestamos.incidencia i ON i.id_prestamo = p.id_prestamo
WHERE DATE(p.fecha_solicitud) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(p.fecha_solicitud)
ORDER BY DATE(p.fecha_solicitud) DESC;
```

### Préstamos por mes del año
```sql
SELECT
  TO_CHAR(p.fecha_solicitud, 'Month') AS mes,
  EXTRACT(MONTH FROM p.fecha_solicitud)::INT AS mes_numero,
  COUNT(*) AS total_prestamos,
  COUNT(*) FILTER (WHERE p.estado_prestamo = 'DEVUELTO') AS entregados,
  ROUND(
    COUNT(*) FILTER (WHERE p.estado_prestamo = 'DEVUELTO')::FLOAT / COUNT(*) * 100,
    2
  ) AS pct_completados
FROM prestamos.prestamo p
WHERE EXTRACT(YEAR FROM p.fecha_solicitud) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY EXTRACT(MONTH FROM p.fecha_solicitud), TO_CHAR(p.fecha_solicitud, 'Month')
ORDER BY mes_numero;
```

### Picos de uso por hora
```sql
SELECT
  EXTRACT(HOUR FROM p.hora_solicitud)::INT AS hora,
  COUNT(*) AS prestamos,
  COUNT(DISTINCT p.id_docente) AS docentes,
  COUNT(DISTINCT p.id_usuario_registra) AS operadores
FROM prestamos.prestamo p
WHERE DATE(p.fecha_solicitud) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM p.hora_solicitud)
ORDER BY hora;
```

### Tasa de devolución (KPI)
```sql
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE estado_prestamo = 'DEVUELTO')::FLOAT / 
    COUNT(*) * 100,
    2
  ) AS tasa_devolucion_pct,
  COUNT(*) FILTER (WHERE estado_prestamo = 'DEVUELTO') AS devueltos,
  COUNT(*) AS total,
  COUNT(*) - COUNT(*) FILTER (WHERE estado_prestamo = 'DEVUELTO') AS pendientes
FROM prestamos.prestamo
WHERE fecha_solicitud >= CURRENT_DATE - INTERVAL '90 days';
```

### Ranking de equipos más prestados
```sql
SELECT
  e.codigo_activo,
  e.nombre_equipo,
  c.nombre_categoria,
  COUNT(pd.id_detalle) AS veces_prestado,
  SUM(pd.cantidad_entregada) AS unidades_prestadas,
  COUNT(i.id_incidencia) AS incidencias_totales
FROM prestamos.equipo e
JOIN prestamos.categoria_equipo c ON c.id_categoria = e.id_categoria
LEFT JOIN prestamos.prestamo_detalle pd ON pd.id_equipo = e.id_equipo
LEFT JOIN prestamos.incidencia i ON i.id_equipo = e.id_equipo
WHERE e.activo = TRUE
GROUP BY e.id_equipo, c.id_categoria
ORDER BY COUNT(pd.id_detalle) DESC
LIMIT 20;
```

---

## 🎯 PATRONES DE BACKEND RECOMENDADOS

### Transacción: Crear préstamo completo
```javascript
async function crearPrestamoCompleto(docente, detalles, usuario) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Insertar préstamo
    const prestamo = await client.query(
      `INSERT INTO prestamos.prestamo 
       (id_docente, id_salon, id_usuario_registra, 
        fecha_devolucion_esperada, estado_prestamo)
       VALUES ($1, $2, $3, $4, 'PENDIENTE')
       RETURNING id_prestamo`,
      [docente, detalles[0].salon, usuario.id, 
       new Date(Date.now() + 7*24*60*60*1000)]
    );
    
    // 2. Insertar detalles (triggers manejan stock)
    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO prestamos.prestamo_detalle
         (id_prestamo, id_equipo, cantidad_solicitada)
         VALUES ($1, $2, $3)`,
        [prestamo.rows[0].id_prestamo, detalle.equipo, detalle.cantidad]
      );
    }
    
    await client.query('COMMIT');
    return prestamo.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### Error Handling: Validar stock suficiente
```javascript
async function verificarStockDisponible(equipoId, cantidad) {
  const result = await pool.query(
    `SELECT id_equipo, stock_disponible, nombre_equipo
     FROM prestamos.equipo
     WHERE id_equipo = $1 AND activo = TRUE`,
    [equipoId]
  );
  
  if (!result.rows.length) {
    throw new Error('Equipo no encontrado o inactivo');
  }
  
  const { stock_disponible, nombre_equipo } = result.rows[0];
  if (stock_disponible < cantidad) {
    throw new Error(
      `Stock insuficiente de ${nombre_equipo}. ` +
      `Disponibles: ${stock_disponible}, Solicitado: ${cantidad}`
    );
  }
}
```

---

**Nota**: Todos los ejemplos usan parámetros preparados ($1, $2, etc.) para evitar inyección SQL.
