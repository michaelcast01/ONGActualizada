-- =========================================================
-- SISTEMA DE GESTION SOCIAL ONG
-- Base de datos: PostgreSQL 12+
-- Modelo: tablas operativas del diagrama entidad-relacion
-- =========================================================

BEGIN;

-- =========================================================
-- LIMPIEZA DEL MODELO ANTERIOR
-- =========================================================

DROP TABLE IF EXISTS gasto_logistico CASCADE;
DROP TABLE IF EXISTS entrega_detalle CASCADE;
DROP TABLE IF EXISTS entrega_encabezado CASCADE;
DROP TABLE IF EXISTS lote_inventario CASCADE;
DROP TABLE IF EXISTS recurso_mision CASCADE;
DROP TABLE IF EXISTS documento_soporte CASCADE;
DROP TABLE IF EXISTS acudiente CASCADE;
DROP TABLE IF EXISTS direccion_ubicacion CASCADE;
DROP TABLE IF EXISTS donacion CASCADE;
DROP TABLE IF EXISTS donante CASCADE;
DROP TABLE IF EXISTS beneficiario CASCADE;
DROP TABLE IF EXISTS item_inventario CASCADE;
DROP TABLE IF EXISTS conductor CASCADE;
DROP TABLE IF EXISTS vehiculo CASCADE;
DROP TABLE IF EXISTS mision_operativa CASCADE;
DROP TABLE IF EXISTS bitacora_auditoria CASCADE;
DROP TABLE IF EXISTS rol_permiso CASCADE;
DROP TABLE IF EXISTS usuario_rol CASCADE;
DROP TABLE IF EXISTS permiso CASCADE;
DROP TABLE IF EXISTS rol CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Compatibilidad con nombres del modelo anterior.
DROP TABLE IF EXISTS detalle_entrega CASCADE;
DROP TABLE IF EXISTS entrega_seguimiento CASCADE;
DROP TABLE IF EXISTS lote_donacion CASCADE;
DROP TABLE IF EXISTS item_proteccion CASCADE;
DROP TABLE IF EXISTS parte_logistico CASCADE;
DROP TABLE IF EXISTS mision_recurso CASCADE;
DROP TABLE IF EXISTS mision_proyecto CASCADE;
DROP TABLE IF EXISTS entrega_ubicacion CASCADE;

-- =========================================================
-- SEGURIDAD
-- =========================================================

CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE permiso (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    modulo VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    hash_contrasena VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(150) NOT NULL UNIQUE,
    esta_activo BOOLEAN NOT NULL DEFAULT true,
    mfa_habilitado BOOLEAN NOT NULL DEFAULT false,
    ultimo_acceso TIMESTAMP
);

CREATE TABLE usuario_rol (
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

CREATE TABLE rol_permiso (
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

CREATE TABLE bitacora_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accion VARCHAR(50) NOT NULL,
    nombre_tabla VARCHAR(100) NOT NULL,
    id_registro_afectado VARCHAR(100),
    valor_anterior JSONB,
    valor_nuevo JSONB,
    direccion_ip VARCHAR(64),
    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        ON DELETE RESTRICT
);

-- =========================================================
-- CATALOGOS Y OPERACION
-- =========================================================

CREATE TABLE vehiculo (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR(50),
    vencimiento_soat DATE,
    vencimiento_tecnomecanica DATE,
    esta_activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE conductor (
    id SERIAL PRIMARY KEY,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    numero_licencia VARCHAR(50) NOT NULL UNIQUE,
    vencimiento_licencia DATE,
    telefono VARCHAR(30)
);

CREATE TABLE mision_operativa (
    id BIGSERIAL PRIMARY KEY,
    nombre_mision VARCHAR(150) NOT NULL,
    tipo_mision VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    cod_municipio_objetivo VARCHAR(20),
    estado VARCHAR(50) NOT NULL DEFAULT 'Planificada',
    CONSTRAINT ck_mision_tipo
        CHECK (tipo_mision IN ('Jornada', 'Campaña')),
    CONSTRAINT ck_mision_estado
        CHECK (estado IN ('Planificada', 'En Curso', 'Finalizada'))
);

CREATE TABLE item_inventario (
    id BIGSERIAL PRIMARY KEY,
    codigo_sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    unidad_medida VARCHAR(50) NOT NULL
);

-- =========================================================
-- PERSONAS Y DONACIONES
-- =========================================================

CREATE TABLE beneficiario (
    id BIGSERIAL PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    primer_nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    fecha_nacimiento DATE,
    edad_calculada INT,
    genero VARCHAR(30),
    telefono_principal VARCHAR(30),
    correo VARCHAR(150),
    es_victima_conflicto BOOLEAN NOT NULL DEFAULT false,
    tiene_discapacidad BOOLEAN NOT NULL DEFAULT false,
    grupo_sisben VARCHAR(50),
    pertenencia_etnica VARCHAR(100),
    consentimiento_datos BOOLEAN NOT NULL DEFAULT false,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_beneficiario_documento UNIQUE (tipo_documento, numero_documento),
    CONSTRAINT ck_beneficiario_tipo_documento
        CHECK (tipo_documento IN ('CC', 'TI', 'PPT', 'RC'))
);

CREATE TABLE acudiente (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(50),
    nombre_completo VARCHAR(150) NOT NULL,
    parentesco VARCHAR(100),
    telefono_contacto VARCHAR(30),
    CONSTRAINT fk_acudiente_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE CASCADE
);

CREATE TABLE documento_soporte (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    fecha_carga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validado_por_gestor BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_documento_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE CASCADE
);

CREATE TABLE direccion_ubicacion (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    cod_departamento_divipola VARCHAR(20),
    cod_municipio_divipola VARCHAR(20),
    direccion_fisica VARCHAR(255) NOT NULL,
    tipo_zona VARCHAR(30),
    CONSTRAINT fk_direccion_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE CASCADE,
    CONSTRAINT ck_direccion_tipo_zona
        CHECK (tipo_zona IS NULL OR tipo_zona IN ('Urbana', 'Rural'))
);

CREATE TABLE donante (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(200),
    numero_documento VARCHAR(50),
    correo VARCHAR(150),
    CONSTRAINT ck_donante_tipo
        CHECK (tipo IN ('Natural', 'Juridica', 'Anonimo'))
);

CREATE TABLE donacion (
    id BIGSERIAL PRIMARY KEY,
    donante_id BIGINT NOT NULL,
    fecha_donacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(50) NOT NULL,
    valor_estimado DECIMAL(12,2),
    ref_archivo_bancario VARCHAR(500),
    CONSTRAINT fk_donacion_donante
        FOREIGN KEY (donante_id) REFERENCES donante(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_donacion_tipo
        CHECK (tipo IN ('Monetaria', 'Fisica'))
);

-- =========================================================
-- RECURSOS, INVENTARIO Y ENTREGAS
-- =========================================================

CREATE TABLE recurso_mision (
    id BIGSERIAL PRIMARY KEY,
    mision_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    vehiculo_id INT,
    conductor_id INT,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recurso_mision
        FOREIGN KEY (mision_id) REFERENCES mision_operativa(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_recurso_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_recurso_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_recurso_conductor
        FOREIGN KEY (conductor_id) REFERENCES conductor(id)
        ON DELETE SET NULL
);

CREATE TABLE lote_inventario (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL,
    donacion_id BIGINT NOT NULL,
    numero_lote VARCHAR(100),
    fecha_vencimiento DATE,
    cantidad_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_actual DECIMAL(12,2) NOT NULL DEFAULT 0,
    ubicacion_bodega VARCHAR(255),
    CONSTRAINT fk_lote_item
        FOREIGN KEY (item_id) REFERENCES item_inventario(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_lote_donacion
        FOREIGN KEY (donacion_id) REFERENCES donacion(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_lote_cantidades
        CHECK (cantidad_inicial >= 0 AND stock_actual >= 0 AND stock_actual <= cantidad_inicial)
);

CREATE TABLE entrega_encabezado (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL,
    mision_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_entrega TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitud_gps DECIMAL(10,7),
    longitud_gps DECIMAL(10,7),
    url_foto_evidencia VARCHAR(500),
    url_firma_digital VARCHAR(500),
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente Sincronizacion',
    CONSTRAINT fk_entrega_beneficiario
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_entrega_mision
        FOREIGN KEY (mision_id) REFERENCES mision_operativa(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_entrega_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_entrega_estado
        CHECK (estado IN ('Completada', 'Pendiente Sincronizacion'))
);

CREATE TABLE entrega_detalle (
    id BIGSERIAL PRIMARY KEY,
    entrega_encabezado_id BIGINT NOT NULL,
    lote_inventario_id BIGINT NOT NULL,
    cantidad_entregada DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_detalle_entrega
        FOREIGN KEY (entrega_encabezado_id) REFERENCES entrega_encabezado(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_lote
        FOREIGN KEY (lote_inventario_id) REFERENCES lote_inventario(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_detalle_cantidad
        CHECK (cantidad_entregada > 0)
);

CREATE TABLE gasto_logistico (
    id BIGSERIAL PRIMARY KEY,
    recurso_mision_id BIGINT NOT NULL,
    tipo_gasto VARCHAR(100) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha_gasto TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_recibo VARCHAR(500),
    CONSTRAINT fk_gasto_recurso
        FOREIGN KEY (recurso_mision_id) REFERENCES recurso_mision(id)
        ON DELETE CASCADE,
    CONSTRAINT ck_gasto_monto
        CHECK (monto >= 0)
);

-- =========================================================
-- INDICES DE CONSULTA
-- =========================================================

CREATE INDEX idx_beneficiario_nombre ON beneficiario (primer_nombre, apellidos);
CREATE INDEX idx_beneficiario_documento ON beneficiario (numero_documento);
CREATE INDEX idx_donacion_donante ON donacion (donante_id);
CREATE INDEX idx_lote_item ON lote_inventario (item_id);
CREATE INDEX idx_entrega_beneficiario ON entrega_encabezado (beneficiario_id);
CREATE INDEX idx_entrega_mision ON entrega_encabezado (mision_id);
CREATE INDEX idx_entrega_fecha ON entrega_encabezado (fecha_entrega);
CREATE INDEX idx_bitacora_tabla ON bitacora_auditoria (nombre_tabla, id_registro_afectado);

-- =========================================================
-- DATOS INICIALES
-- =========================================================

INSERT INTO rol (nombre, descripcion) VALUES
('Admin', 'Administrador del sistema con acceso total'),
('Gestor', 'Gestiona beneficiarios, donaciones y entregas'),
('Operador', 'Consulta y registra operacion en territorio')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO permiso (codigo, modulo) VALUES
('LECTURA', 'GENERAL'),
('ESCRITURA', 'GENERAL'),
('ELIMINACION', 'GENERAL')
ON CONFLICT (codigo) DO NOTHING;

-- Password: admin123
INSERT INTO usuario (nombre_usuario, hash_contrasena, correo_electronico, esta_activo, mfa_habilitado) VALUES
('admin', '$2a$10$tLe.kIQ50Pb/oNgWuKR5TeITNxSqd7GiuEKntDTwQTiYGrsH6TrJW', 'admin@ong.local', true, false),
('gestor', '$2a$10$tLe.kIQ50Pb/oNgWuKR5TeITNxSqd7GiuEKntDTwQTiYGrsH6TrJW', 'gestor@ong.local', true, false)
ON CONFLICT (nombre_usuario) DO NOTHING;

INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuario u
JOIN rol r ON r.nombre = 'Admin'
WHERE u.nombre_usuario = 'admin'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuario u
JOIN rol r ON r.nombre = 'Gestor'
WHERE u.nombre_usuario = 'gestor'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'Admin'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo = 'LECTURA'
WHERE r.nombre IN ('Gestor', 'Operador')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

COMMIT;
