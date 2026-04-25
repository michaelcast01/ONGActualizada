const entities = {
  beneficiario: {
    label: 'Beneficiarios',
    category: 'Beneficiarios',
    description: 'Personas registradas para recibir ayudas sociales.',
    titleField: 'primer_nombre',
    listFields: ['id', 'tipo_documento', 'numero_documento', 'primer_nombre', 'apellidos', 'grupo_sisben', 'fecha_registro'],
    searchFields: ['tipo_documento', 'numero_documento', 'primer_nombre', 'apellidos', 'correo', 'grupo_sisben', 'pertenencia_etnica']
  },
  acudiente: {
    label: 'Acudientes',
    category: 'Beneficiarios',
    description: 'Responsables o contactos asociados a beneficiarios menores o dependientes.',
    titleField: 'nombre_completo',
    listFields: ['id', 'beneficiario_id', 'tipo_documento', 'numero_documento', 'nombre_completo', 'parentesco', 'telefono_contacto'],
    searchFields: ['tipo_documento', 'numero_documento', 'nombre_completo', 'parentesco', 'telefono_contacto']
  },
  direccion_ubicacion: {
    label: 'Direcciones y ubicaciones',
    category: 'Beneficiarios',
    description: 'Ubicaciones de residencia o atencion asociadas a beneficiarios.',
    titleField: 'direccion_fisica',
    listFields: ['id', 'beneficiario_id', 'cod_departamento_divipola', 'cod_municipio_divipola', 'direccion_fisica', 'tipo_zona'],
    searchFields: ['cod_departamento_divipola', 'cod_municipio_divipola', 'direccion_fisica', 'tipo_zona']
  },
  documento_soporte: {
    label: 'Documentos soporte',
    category: 'Beneficiarios',
    description: 'Archivos de soporte, validaciones y evidencias documentales.',
    titleField: 'tipo_documento',
    listFields: ['id', 'beneficiario_id', 'tipo_documento', 'url_archivo', 'fecha_carga', 'validado_por_gestor'],
    searchFields: ['tipo_documento', 'url_archivo']
  },

  donante: {
    label: 'Donantes',
    category: 'Donaciones',
    description: 'Personas naturales, juridicas o anonimas que realizan aportes.',
    titleField: 'nombre_completo',
    listFields: ['id', 'tipo', 'nombre_completo', 'numero_documento', 'correo'],
    searchFields: ['tipo', 'nombre_completo', 'numero_documento', 'correo']
  },
  donacion: {
    label: 'Donaciones',
    category: 'Donaciones',
    description: 'Registro de aportes monetarios o fisicos recibidos por la ONG.',
    titleField: 'tipo',
    listFields: ['id', 'donante_id', 'fecha_donacion', 'tipo', 'valor_estimado', 'ref_archivo_bancario'],
    searchFields: ['tipo', 'ref_archivo_bancario']
  },

  mision_operativa: {
    label: 'Misiones operativas',
    category: 'Operacion',
    description: 'Jornadas y campanas planificadas para entregar ayudas en territorio.',
    titleField: 'nombre_mision',
    listFields: ['id', 'nombre_mision', 'tipo_mision', 'fecha_inicio', 'fecha_fin', 'cod_municipio_objetivo', 'estado'],
    searchFields: ['nombre_mision', 'tipo_mision', 'cod_municipio_objetivo', 'estado']
  },
  recurso_mision: {
    label: 'Recursos de mision',
    category: 'Operacion',
    description: 'Asignacion de gestores, vehiculos y conductores a misiones.',
    titleField: 'id',
    listFields: ['id', 'mision_id', 'usuario_id', 'vehiculo_id', 'conductor_id', 'fecha_asignacion'],
    searchFields: ['mision_id', 'usuario_id', 'vehiculo_id', 'conductor_id']
  },
  vehiculo: {
    label: 'Vehiculos',
    category: 'Operacion',
    description: 'Parque automotor utilizado para las misiones y entregas.',
    titleField: 'placa',
    listFields: ['id', 'placa', 'tipo', 'vencimiento_soat', 'vencimiento_tecnomecanica', 'esta_activo'],
    searchFields: ['placa', 'tipo']
  },
  conductor: {
    label: 'Conductores',
    category: 'Operacion',
    description: 'Personal habilitado para conducir durante las misiones.',
    titleField: 'nombre_completo',
    listFields: ['id', 'numero_documento', 'nombre_completo', 'numero_licencia', 'vencimiento_licencia', 'telefono'],
    searchFields: ['numero_documento', 'nombre_completo', 'numero_licencia', 'telefono']
  },
  gasto_logistico: {
    label: 'Gastos logisticos',
    category: 'Operacion',
    description: 'Gastos asociados a recursos de mision como combustible, peajes u otros.',
    titleField: 'tipo_gasto',
    listFields: ['id', 'recurso_mision_id', 'tipo_gasto', 'monto', 'fecha_gasto', 'url_recibo'],
    searchFields: ['tipo_gasto', 'url_recibo']
  },

  item_inventario: {
    label: 'Items de inventario',
    category: 'Inventario',
    description: 'Catalogo de bienes, kits y ayudas disponibles para entregar.',
    titleField: 'nombre',
    listFields: ['id', 'codigo_sku', 'nombre', 'categoria', 'unidad_medida'],
    searchFields: ['codigo_sku', 'nombre', 'categoria', 'unidad_medida']
  },
  lote_inventario: {
    label: 'Lotes de inventario',
    category: 'Inventario',
    description: 'Trazabilidad de stock por lote, donacion y ubicacion de bodega.',
    titleField: 'numero_lote',
    listFields: ['id', 'item_id', 'donacion_id', 'numero_lote', 'fecha_vencimiento', 'cantidad_inicial', 'stock_actual'],
    searchFields: ['numero_lote', 'ubicacion_bodega']
  },

  entrega_encabezado: {
    label: 'Entregas',
    category: 'Entregas',
    description: 'Encabezado de cada entrega realizada a beneficiarios durante una mision.',
    titleField: 'estado',
    listFields: ['id', 'beneficiario_id', 'mision_id', 'usuario_id', 'fecha_entrega', 'estado'],
    searchFields: ['estado', 'url_foto_evidencia', 'url_firma_digital']
  },
  entrega_detalle: {
    label: 'Detalle de entregas',
    category: 'Entregas',
    description: 'Items y cantidades entregadas, descontadas de lotes especificos.',
    titleField: 'id',
    listFields: ['id', 'entrega_encabezado_id', 'lote_inventario_id', 'cantidad_entregada'],
    searchFields: ['entrega_encabezado_id', 'lote_inventario_id']
  },

  usuario: {
    label: 'Usuarios',
    category: 'Seguridad',
    description: 'Cuentas de acceso al sistema.',
    titleField: 'nombre_usuario',
    listFields: ['id', 'nombre_usuario', 'correo_electronico', 'esta_activo', 'mfa_habilitado', 'ultimo_acceso'],
    searchFields: ['nombre_usuario', 'correo_electronico']
  },
  rol: {
    label: 'Roles',
    category: 'Seguridad',
    description: 'Roles funcionales asignables a usuarios.',
    titleField: 'nombre',
    listFields: ['id', 'nombre', 'descripcion'],
    searchFields: ['nombre', 'descripcion']
  },
  permiso: {
    label: 'Permisos',
    category: 'Seguridad',
    description: 'Permisos disponibles por modulo.',
    titleField: 'codigo',
    listFields: ['id', 'codigo', 'modulo'],
    searchFields: ['codigo', 'modulo']
  },
  usuario_rol: {
    label: 'Usuarios por rol',
    category: 'Seguridad',
    description: 'Asignacion de roles a usuarios.',
    titleField: 'usuario_id',
    listFields: ['usuario_id', 'rol_id'],
    searchFields: ['usuario_id', 'rol_id'],
    allowUpdate: false
  },
  rol_permiso: {
    label: 'Roles por permiso',
    category: 'Seguridad',
    description: 'Asignacion de permisos a roles.',
    titleField: 'rol_id',
    listFields: ['rol_id', 'permiso_id'],
    searchFields: ['rol_id', 'permiso_id'],
    allowUpdate: false
  },
  bitacora_auditoria: {
    label: 'Bitacora de auditoria',
    category: 'Auditoria',
    description: 'Trazabilidad de acciones realizadas en el sistema.',
    titleField: 'accion',
    listFields: ['id', 'usuario_id', 'fecha_hora', 'accion', 'nombre_tabla', 'id_registro_afectado', 'direccion_ip'],
    searchFields: ['accion', 'nombre_tabla', 'id_registro_afectado', 'direccion_ip'],
    allowCreate: false,
    allowUpdate: false,
    allowDelete: false
  }
};

module.exports = entities;
