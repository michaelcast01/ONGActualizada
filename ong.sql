-- =========================================================
-- SISTEMA DE GESTIÓN SOCIAL - ONG
-- Base de datos: PostgreSQL 12+ (pgAdmin4)
-- Versión: 1.0
-- Descripción: Sistema integral de gestión de donantes,
--              beneficiarios, misiones y entregas
-- =========================================================

-- =========================================================
-- TABLAS MAESTRAS DE SEGURIDAD
-- =========================================================


CREATE TABLE IF NOT EXISTS rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS permiso (
    id SERIAL PRIMARY KEY,
    cod_op VARCHAR(100) NOT NULL,
    modulo VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS usuario (
    id BIGSERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    hash_contrasena VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(150) NOT NULL UNIQUE,
    ultima_actividad TIMESTAMP NULL,
    mfa_token VARCHAR(255) NULL,
    ultimo_acceso TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS usuario_rol (
    usuario_id BIGINT NOT NULL,
    rol_id INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuario_rol_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_usuario_rol_rol
        FOREIGN KEY (rol_id) REFERENCES rol(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rol_permiso (
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rol_permiso_rol
        FOREIGN KEY (rol_id) REFERENCES rol(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso
        FOREIGN KEY (permiso_id) REFERENCES permiso(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(100) NULL,
    id_registro_afectado VARCHAR(100) NULL,
    valor_anterior JSON NULL,
    valor_nuevo JSON NULL,
    direccion_ip VARCHAR(64) NULL,
    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- DONANTES / DONACIONES
-- =========================================================
CREATE TABLE IF NOT EXISTS donante (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(200) NULL,
    numero_documento VARCHAR(50) NULL,
    correo VARCHAR(150) NULL
);

CREATE TABLE IF NOT EXISTS donacion (
    id BIGSERIAL PRIMARY KEY,
    donante_id BIGINT NOT NULL,
    fecha_donacion TIMESTAMP NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    valor_estimado DECIMAL(12,2) NULL,
    metodo_recepcion VARCHAR(100) NULL,
    CONSTRAINT fk_donacion_donante
        FOREIGN KEY (donante_id) REFERENCES donante(id)
        ON DELETE RESTRICT
);

-- =========================================================
-- BENEFICIARIOS
-- =========================================================
CREATE TABLE IF NOT EXISTS beneficiario (
    id BIGSERIAL PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    primer_nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NULL,
    edad_calculada INT NULL,
    genero VARCHAR(30) NULL,
    telefono_principal VARCHAR(30) NULL,
    correo VARCHAR(150) NULL,
    es_victima_conflicto BOOLEAN NOT NULL DEFAULT false,
    tiene_discapacidad BOOLEAN NOT NULL DEFAULT false,
    grupo_etnico VARCHAR(100) NULL,
    pertenencia_etnica VARCHAR(100) NULL,
    reconocimiento_legal BOOLEAN NOT NULL DEFAULT false,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS acudiente (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    tipo_documento VARCHAR(20) NULL,
    numero_documento VARCHAR(50) NULL,
    nombre_completo VARCHAR(150) NULL,
    parentesco VARCHAR(100) NULL,
    telefono_contacto VARCHAR(30) NULL,
    CONSTRAINT fk_acudiente_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documento_soporte (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    hash_carga VARCHAR(128) NULL,
    validado_por_gestion BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_documento_soporte_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entrega_ubicacion (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    cod_departamento_ciudad VARCHAR(20) NULL,
    cod_municipio_ciudad VARCHAR(20) NULL,
    direccion_meta VARCHAR(255) NULL,
    tipo_zona VARCHAR(30) NULL,
    CONSTRAINT fk_entrega_ubicacion_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE CASCADE
);


-- =========================================================
-- MISIONES / OPERACIÓN
-- =========================================================
CREATE TABLE IF NOT EXISTS mision_proyecto (
    id BIGSERIAL PRIMARY KEY,
    nombre_mision VARCHAR(150) NOT NULL,
    tipo_mision VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMP NULL,
    fecha_fin TIMESTAMP NULL,
    cod_municipio_objetivo VARCHAR(20) NULL,
    estado VARCHAR(50) NULL
);

CREATE TABLE IF NOT EXISTS vehiculo (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR(50) NULL,
    vencimiento_soat DATE NULL,
    vencimiento_tecnomecanica DATE NULL,
    esta_activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS conductor (
    id SERIAL PRIMARY KEY,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    numero_licencia VARCHAR(50) NOT NULL UNIQUE,
    vencimiento_licencia DATE NULL,
    telefono VARCHAR(30) NULL
);

CREATE TABLE IF NOT EXISTS item_proteccion (
    id BIGSERIAL PRIMARY KEY,
    codigo_sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NULL,
    unidad_medida VARCHAR(50) NULL
);

CREATE TABLE IF NOT EXISTS mision_recurso (
    id BIGSERIAL PRIMARY KEY,
    mision_id BIGINT NOT NULL,
    conductor_id INT NULL,
    vehiculo_id INT NULL,
    canastilla_id BIGINT NULL,
    fecha_asignacion TIMESTAMP NULL,
    CONSTRAINT fk_mision_recurso_mision
        FOREIGN KEY (mision_id) REFERENCES mision_proyecto(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_mision_recurso_conductor
        FOREIGN KEY (conductor_id) REFERENCES conductor(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_mision_recurso_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_mision_recurso_canastilla
        FOREIGN KEY (canastilla_id) REFERENCES item_proteccion(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS parte_logistico (
    id BIGSERIAL PRIMARY KEY,
    recurso_mision_id BIGINT NOT NULL,
    tipo_parte VARCHAR(100) NULL,
    monto DECIMAL(12,2) NULL,
    fecha_reporte TIMESTAMP NULL,
    url_novedad VARCHAR(500) NULL,
    CONSTRAINT fk_parte_logistico_recurso
        FOREIGN KEY (recurso_mision_id) REFERENCES mision_recurso(id)
        ON DELETE CASCADE
);


-- =========================================================
-- INVENTARIO / LOTES
-- =========================================================
CREATE TABLE IF NOT EXISTS lote_donacion (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL,
    donacion_id BIGINT NOT NULL,
    numero_lote VARCHAR(100) NULL,
    fecha_vencimiento DATE NULL,
    cantidad_inicial DECIMAL(12,2) NULL,
    stock_actual DECIMAL(12,2) NULL,
    ubicacion_bodega VARCHAR(255) NULL,
    CONSTRAINT fk_lote_donacion_item
        FOREIGN KEY (item_id) REFERENCES item_proteccion(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_lote_donacion_donacion
        FOREIGN KEY (donacion_id) REFERENCES donacion(id)
        ON DELETE RESTRICT
);

-- =========================================================
-- ENTREGAS
-- =========================================================
CREATE TABLE IF NOT EXISTS entrega_seguimiento (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    mision_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_entrega TIMESTAMP NOT NULL,
    latitud_gps DECIMAL(10,7) NULL,
    longitud_gps DECIMAL(10,7) NULL,
    url_foto_evidencia VARCHAR(500) NULL,
    url_firma_digital VARCHAR(500) NULL,
    estado VARCHAR(50) NULL,
    CONSTRAINT fk_entrega_seguimiento_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_entrega_seguimiento_mision
        FOREIGN KEY (mision_id) REFERENCES mision_proyecto(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_entrega_seguimiento_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalle_entrega (
    id BIGSERIAL PRIMARY KEY,
    entrega_seguimiento_id BIGINT NOT NULL,
    lote_inventario_id BIGINT NOT NULL,
    cantidad_entregada DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_detalle_entrega_entrega
        FOREIGN KEY (entrega_seguimiento_id) REFERENCES entrega_seguimiento(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_entrega_lote
        FOREIGN KEY (lote_inventario_id) REFERENCES lote_donacion(id)
        ON DELETE RESTRICT
);

-- =============================================================================
-- DATOS DE EJEMPLO - ROLES Y USUARIOS
-- =============================================================================

-- Insertar Roles
INSERT INTO rol (nombre, descripcion) VALUES
('Admin', 'Administrador del sistema con acceso total'),
('Usuario', 'Usuario regular con acceso limitado')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar usuario Admin
-- Password: admin123 (bcryptjs hash)
INSERT INTO usuario (nombre_usuario, hash_contrasena, correo_electronico) VALUES
('admin', '$2a$10$YOvVaA/r4bXJJvD8vTPLe.KRRXCRbqLSXXe0KM8MsNrCzXHEqMEpK', 'admin@ong.local')
ON CONFLICT (nombre_usuario) DO NOTHING;

-- Insertar usuario Gestor
-- Password: admin123 (bcryptjs hash)
INSERT INTO usuario (nombre_usuario, hash_contrasena, correo_electronico) VALUES
('gestor', '$2a$10$YOvVaA/r4bXJJvD8vTPLe.KRRXCRbqLSXXe0KM8MsNrCzXHEqMEpK', 'gestor@ong.local')
ON CONFLICT (nombre_usuario) DO NOTHING;

-- Asignar rol Admin al usuario admin
INSERT INTO usuario_rol (usuario_id, rol_id) 
VALUES ((SELECT id FROM usuario WHERE nombre_usuario = 'admin'), 
        (SELECT id FROM rol WHERE nombre = 'Admin'))
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Asignar rol Usuario al usuario gestor
INSERT INTO usuario_rol (usuario_id, rol_id) 
VALUES ((SELECT id FROM usuario WHERE nombre_usuario = 'gestor'), 
        (SELECT id FROM rol WHERE nombre = 'Usuario'))
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- =============================================================================
-- FIN DEL SCRIPT - ESTRUCTURA LISTA PARA PGADMIN4
-- =============================================================================
-- Base de datos completamente migrada a PostgreSQL 12+
-- 21 tablas con relaciones, constraints e índices optimizados
-- Sistema completo de Gestión Social (Donantes, Beneficiarios, Misiones, Entregas)
-- Compatible con pgAdmin4
-- 
-- Usuarios de ejemplo:
--   Admin: admin / admin123
--   Usuario: gestor / admin123
-- =============================================================================
