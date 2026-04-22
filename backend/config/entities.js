const entities = {
  beneficiario: {
    label: 'Beneficiarios',
    category: 'Poblacion',
    description: 'Personas atendidas por la organizacion.',
    titleField: 'primer_nombre',
    listFields: ['id', 'tipo_documento', 'numero_documento', 'primer_nombre', 'apellido', 'genero', 'correo'],
    searchFields: ['numero_documento', 'primer_nombre', 'apellido', 'correo']
  },
  acudiente: {
    label: 'Acudientes',
    category: 'Poblacion',
    description: 'Contactos responsables asociados a beneficiarios.',
    titleField: 'nombre_completo',
    listFields: ['id', 'beneficiario_id', 'nombre_completo', 'parentesco', 'telefono_contacto'],
    searchFields: ['numero_documento', 'nombre_completo', 'parentesco', 'telefono_contacto']
  },
  documento_soporte: {
    label: 'Documentos soporte',
    category: 'Poblacion',
    description: 'Archivos y validaciones asociadas al beneficiario.',
    titleField: 'tipo_documento',
    listFields: ['id', 'beneficiario_id', 'tipo_documento', 'validado_por_gestion', 'url_archivo'],
    searchFields: ['tipo_documento', 'url_archivo', 'hash_carga']
  },
  entrega_ubicacion: {
    label: 'Ubicaciones de entrega',
    category: 'Poblacion',
    description: 'Direcciones y zonas de atencion para las entregas.',
    titleField: 'direccion_meta',
    listFields: ['id', 'beneficiario_id', 'cod_municipio_ciudad', 'direccion_meta', 'tipo_zona'],
    searchFields: ['cod_municipio_ciudad', 'direccion_meta', 'tipo_zona']
  },
  entrega_seguimiento: {
    label: 'Seguimiento de entregas',
    category: 'Operaciones',
    description: 'Registro operativo de entregas y evidencia.',
    titleField: 'estado',
    listFields: ['id', 'beneficiario_id', 'mision_id', 'usuario_id', 'fecha_entrega', 'estado'],
    searchFields: ['estado', 'url_foto_evidencia', 'url_firma_digital']
  },
  detalle_entrega: {
    label: 'Detalle de entrega',
    category: 'Operaciones',
    description: 'Cantidades entregadas por lote en cada seguimiento.',
    titleField: 'id',
    listFields: ['id', 'entrega_seguimiento_id', 'lote_inventario_id', 'cantidad_entregada'],
    searchFields: ['entrega_seguimiento_id', 'lote_inventario_id']
  },
  donante: {
    label: 'Donantes',
    category: 'Donaciones',
    description: 'Personas, empresas y organizaciones aportantes.',
    titleField: 'nombre_completo',
    listFields: ['id', 'tipo', 'nombre_completo', 'numero_documento', 'correo'],
    searchFields: ['tipo', 'nombre_completo', 'numero_documento', 'correo']
  },
  donacion: {
    label: 'Donaciones',
    category: 'Donaciones',
    description: 'Aportes monetarios, en especie o mixtos.',
    titleField: 'tipo',
    listFields: ['id', 'donante_id', 'fecha_donacion', 'tipo', 'valor_estimado', 'metodo_recepcion'],
    searchFields: ['tipo', 'metodo_recepcion']
  },
  item_proteccion: {
    label: 'Items de proteccion',
    category: 'Inventario',
    description: 'Catalogo de elementos y kits disponibles.',
    titleField: 'nombre',
    listFields: ['id', 'codigo_sku', 'nombre', 'categoria', 'unidad_medida'],
    searchFields: ['codigo_sku', 'nombre', 'categoria', 'unidad_medida']
  },
  lote_donacion: {
    label: 'Lotes de donacion',
    category: 'Inventario',
    description: 'Control de stock y trazabilidad por lote.',
    titleField: 'numero_lote',
    listFields: ['id', 'donacion_id', 'item_id', 'numero_lote', 'stock_actual', 'ubicacion_bodega'],
    searchFields: ['numero_lote', 'ubicacion_bodega']
  },
  mision_proyecto: {
    label: 'Misiones y proyectos',
    category: 'Misiones',
    description: 'Planeacion y ejecucion de misiones en territorio.',
    titleField: 'nombre_mision',
    listFields: ['id', 'nombre_mision', 'tipo_mision', 'fecha_inicio', 'fecha_fin', 'estado'],
    searchFields: ['nombre_mision', 'tipo_mision', 'cod_municipio_objetivo', 'estado']
  },
  mision_recurso: {
    label: 'Recursos de mision',
    category: 'Misiones',
    description: 'Asignacion de recursos logisticos a una mision.',
    titleField: 'id',
    listFields: ['id', 'mision_id', 'conductor_id', 'vehiculo_id', 'canastilla_id', 'fecha_asignacion'],
    searchFields: ['mision_id', 'conductor_id', 'vehiculo_id']
  },
  parte_logistico: {
    label: 'Partes logisticos',
    category: 'Misiones',
    description: 'Novedades y costos operativos asociados a recursos.',
    titleField: 'tipo_parte',
    listFields: ['id', 'recurso_mision_id', 'tipo_parte', 'monto', 'fecha_reporte'],
    searchFields: ['tipo_parte', 'url_novedad']
  },
  vehiculo: {
    label: 'Vehiculos',
    category: 'Logistica',
    description: 'Parque automotor usado por la operacion.',
    titleField: 'placa',
    listFields: ['id', 'placa', 'tipo', 'vencimiento_soat', 'vencimiento_tecnomecanica', 'esta_activo'],
    searchFields: ['placa', 'tipo']
  },
  conductor: {
    label: 'Conductores',
    category: 'Logistica',
    description: 'Personal habilitado para la movilizacion.',
    titleField: 'nombre_completo',
    listFields: ['id', 'numero_documento', 'nombre_completo', 'numero_licencia', 'vencimiento_licencia', 'telefono'],
    searchFields: ['numero_documento', 'nombre_completo', 'numero_licencia', 'telefono']
  },
  usuario: {
    label: 'Usuarios',
    category: 'Seguridad',
    description: 'Cuentas de acceso a la plataforma.',
    titleField: 'nombre_usuario',
    listFields: ['id', 'nombre_usuario', 'correo_electronico', 'ultima_actividad', 'ultimo_acceso'],
    searchFields: ['nombre_usuario', 'correo_electronico']
  },
  rol: {
    label: 'Roles',
    category: 'Seguridad',
    description: 'Roles funcionales del sistema.',
    titleField: 'nombre',
    listFields: ['id', 'nombre', 'descripcion'],
    searchFields: ['nombre', 'descripcion']
  },
  permiso: {
    label: 'Permisos',
    category: 'Seguridad',
    description: 'Operaciones y modulos habilitados.',
    titleField: 'cod_op',
    listFields: ['id', 'cod_op', 'modulo'],
    searchFields: ['cod_op', 'modulo']
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
    description: 'Trazabilidad de acciones del sistema.',
    titleField: 'accion',
    listFields: ['id', 'usuario_id', 'fecha_hora', 'accion', 'tabla_afectada', 'direccion_ip'],
    searchFields: ['accion', 'tabla_afectada', 'id_registro_afectado', 'direccion_ip'],
    allowCreate: false,
    allowUpdate: false,
    allowDelete: false
  }
};

module.exports = entities;
