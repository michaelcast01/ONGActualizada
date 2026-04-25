const fs = require('fs');
const path = require('path');
const pool = require('./backend/db');

const TARGET_RECORDS = 1200;

const counts = {
  beneficiario: 220,
  direccion_ubicacion: 220,
  acudiente: 50,
  documento_soporte: 90,
  donante: 50,
  donacion: 70,
  mision_operativa: 15,
  vehiculo: 10,
  conductor: 10,
  item_inventario: 25,
  recurso_mision: 15,
  lote_inventario: 75,
  entrega_encabezado: 160,
  entrega_detalle: 170,
  gasto_logistico: 20
};

const firstNames = [
  'Santiago', 'Valentina', 'Mateo', 'Isabella', 'Sebastian', 'Camila', 'Nicolas', 'Sofia',
  'Daniel', 'Mariana', 'Alejandro', 'Luciana', 'Juan', 'Gabriela', 'Andres', 'Daniela',
  'Miguel', 'Paula', 'Carlos', 'Laura', 'Jose', 'Manuela', 'David', 'Natalia', 'Felipe',
  'Sara', 'Jorge', 'Carolina', 'Diego', 'Angie', 'Luis', 'Diana'
];

const lastNames = [
  'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez',
  'Torres', 'Diaz', 'Vargas', 'Castro', 'Rojas', 'Moreno', 'Jimenez', 'Munoz', 'Ortiz',
  'Gutierrez', 'Ruiz', 'Alvarez', 'Romero', 'Suarez', 'Herrera', 'Medina'
];

const barrios = [
  'La Esperanza', 'San Jose', 'El Progreso', 'Villa Nueva', 'Los Pinos', 'Santa Clara',
  'El Carmen', 'La Victoria', 'Las Palmas', 'Buenos Aires', 'Centro', 'El Jardin'
];

const municipios = [
  { dep: '05', mun: '05001', name: 'Medellin' },
  { dep: '08', mun: '08001', name: 'Barranquilla' },
  { dep: '11', mun: '11001', name: 'Bogota' },
  { dep: '13', mun: '13001', name: 'Cartagena' },
  { dep: '15', mun: '15001', name: 'Tunja' },
  { dep: '17', mun: '17001', name: 'Manizales' },
  { dep: '19', mun: '19001', name: 'Popayan' },
  { dep: '25', mun: '25754', name: 'Soacha' },
  { dep: '50', mun: '50001', name: 'Villavicencio' },
  { dep: '76', mun: '76001', name: 'Cali' }
];

const items = [
  ['ALI-001', 'Mercado familiar basico', 'Alimentos', 'kit'],
  ['ALI-002', 'Arroz por libra', 'Alimentos', 'libra'],
  ['ALI-003', 'Lenteja por libra', 'Alimentos', 'libra'],
  ['ALI-004', 'Aceite vegetal', 'Alimentos', 'botella'],
  ['ALI-005', 'Leche en polvo', 'Alimentos', 'bolsa'],
  ['VEST-001', 'Kit de abrigo adulto', 'Vestimenta', 'kit'],
  ['VEST-002', 'Kit de abrigo infantil', 'Vestimenta', 'kit'],
  ['ASEO-001', 'Kit de aseo personal', 'Aseo', 'kit'],
  ['ASEO-002', 'Panales paquete', 'Aseo', 'paquete'],
  ['SAL-001', 'Botiquin familiar', 'Salud', 'kit'],
  ['EDU-001', 'Kit escolar basico', 'Educacion', 'kit'],
  ['HOG-001', 'Cobija termica', 'Hogar', 'unidad'],
  ['HOG-002', 'Colchoneta', 'Hogar', 'unidad'],
  ['AGU-001', 'Filtro de agua', 'Agua', 'unidad'],
  ['BEB-001', 'Agua potable', 'Bebidas', 'paca']
];

function pick(list, index, offset = 0) {
  return list[(index + offset) % list.length];
}

function dateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function timestampDaysAgo(days, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

function documentNumber(index, type) {
  if (type === 'TI') return String(1080000000 + index).slice(0, 10);
  if (type === 'RC') return String(1000000000 + index).slice(0, 10);
  if (type === 'PPT') return `PPT${String(700000 + index)}`;
  return String(10000000 + index * 37);
}

async function insertReturning(client, sql, params) {
  const result = await client.query(sql, params);
  return result.rows[0];
}

async function resetSchema(client) {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'ong.sql'), 'utf8');
  await client.query(schemaSql);
}

async function seed() {
  const client = await pool.connect();
  const inserted = Object.fromEntries(Object.keys(counts).map((key) => [key, 0]));

  try {
    console.log('Aplicando esquema ong.sql en Supabase...');
    await resetSchema(client);
    console.log('Esquema creado correctamente. Insertando datos...');

    const users = (await client.query('SELECT id FROM usuario ORDER BY id')).rows.map((row) => row.id);

    const beneficiarios = [];
    for (let i = 1; i <= counts.beneficiario; i++) {
      const first = pick(firstNames, i);
      const last = `${pick(lastNames, i)} ${pick(lastNames, i, 5)}`;
      const age = 8 + (i % 70);
      const type = age < 8 ? 'RC' : age < 18 ? 'TI' : i % 13 === 0 ? 'PPT' : 'CC';
      const birthYear = new Date().getFullYear() - age;
      const birthDate = `${birthYear}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`;
      const emailName = `${first}.${last.split(' ')[0]}.${i}`.toLowerCase();

      const row = await insertReturning(
        client,
        `INSERT INTO beneficiario (
          tipo_documento, numero_documento, primer_nombre, apellidos, fecha_nacimiento, edad_calculada,
          genero, telefono_principal, correo, es_victima_conflicto, tiene_discapacidad, grupo_sisben,
          pertenencia_etnica, consentimiento_datos, fecha_registro
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [
          type,
          documentNumber(i, type),
          first,
          last,
          birthDate,
          age,
          i % 2 === 0 ? 'Femenino' : 'Masculino',
          `3${10 + (i % 9)}${String(2000000 + i * 91).slice(0, 7)}`,
          `${emailName}@correo.local`,
          i % 4 === 0,
          i % 11 === 0,
          pick(['A1', 'A2', 'A3', 'B1', 'B2', 'C1'], i),
          pick(['Ninguna', 'Indigena', 'Afrocolombiana', 'Raizal', 'Campesina'], i),
          i % 5 !== 0,
          timestampDaysAgo(260 - i, 8)
        ]
      );
      beneficiarios.push(row.id);
      inserted.beneficiario++;
    }

    for (let i = 0; i < counts.direccion_ubicacion; i++) {
      const city = pick(municipios, i);
      await client.query(
        `INSERT INTO direccion_ubicacion (
          beneficiario_id, cod_departamento_divipola, cod_municipio_divipola, direccion_fisica, tipo_zona
        ) VALUES ($1,$2,$3,$4,$5)`,
        [beneficiarios[i], city.dep, city.mun, `Calle ${12 + (i % 80)} # ${4 + (i % 60)}-${10 + (i % 89)}, Barrio ${pick(barrios, i)}`, i % 4 === 0 ? 'Rural' : 'Urbana']
      );
      inserted.direccion_ubicacion++;
    }

    for (let i = 0; i < counts.acudiente; i++) {
      const first = pick(firstNames, i, 3);
      const last = `${pick(lastNames, i, 7)} ${pick(lastNames, i, 9)}`;
      await client.query(
        `INSERT INTO acudiente (beneficiario_id, tipo_documento, numero_documento, nombre_completo, parentesco, telefono_contacto)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [beneficiarios[i], 'CC', String(52000000 + i * 113), `${first} ${last}`, pick(['Madre', 'Padre', 'Tia', 'Abuelo', 'Hermana'], i), `31${i % 10}${String(4000000 + i * 73).slice(0, 7)}`]
      );
      inserted.acudiente++;
    }

    for (let i = 0; i < counts.documento_soporte; i++) {
      await client.query(
        `INSERT INTO documento_soporte (beneficiario_id, tipo_documento, url_archivo, fecha_carga, validado_por_gestor)
         VALUES ($1,$2,$3,$4,$5)`,
        [beneficiarios[i % beneficiarios.length], pick(['SISBEN', 'RUV', 'Certificado Medico', 'Documento Identidad'], i), `supabase://documentos/beneficiario_${beneficiarios[i % beneficiarios.length]}_${i + 1}.pdf`, timestampDaysAgo(140 - i, 10), i % 3 !== 0]
      );
      inserted.documento_soporte++;
    }

    const donantes = [];
    for (let i = 1; i <= counts.donante; i++) {
      const type = pick(['Natural', 'Juridica', 'Anonimo'], i);
      const name = type === 'Anonimo' ? `Donante Anonimo ${i}` : type === 'Juridica' ? `${pick(['Fundacion', 'Empresa', 'Cooperativa', 'Alimentos'], i)} ${pick(lastNames, i)}` : `${pick(firstNames, i)} ${pick(lastNames, i)} ${pick(lastNames, i, 4)}`;
      const row = await insertReturning(
        client,
        'INSERT INTO donante (tipo, nombre_completo, numero_documento, correo) VALUES ($1,$2,$3,$4) RETURNING id',
        [type, name, type === 'Anonimo' ? null : String(800000000 + i * 191), type === 'Anonimo' ? null : `donante${i}@apoyo.local`]
      );
      donantes.push(row.id);
      inserted.donante++;
    }

    const donaciones = [];
    for (let i = 1; i <= counts.donacion; i++) {
      const type = i % 3 === 0 ? 'Monetaria' : 'Fisica';
      const row = await insertReturning(
        client,
        `INSERT INTO donacion (donante_id, fecha_donacion, tipo, valor_estimado, ref_archivo_bancario)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [pick(donantes, i), timestampDaysAgo(190 - i, 11), type, type === 'Monetaria' ? 150000 + i * 25000 : 80000 + i * 12000, type === 'Monetaria' ? `supabase://conciliacion/donacion_${i}.pdf` : null]
      );
      donaciones.push(row.id);
      inserted.donacion++;
    }

    const misiones = [];
    for (let i = 1; i <= counts.mision_operativa; i++) {
      const city = pick(municipios, i);
      const row = await insertReturning(
        client,
        `INSERT INTO mision_operativa (nombre_mision, tipo_mision, fecha_inicio, fecha_fin, cod_municipio_objetivo, estado)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [`${i % 2 === 0 ? 'Jornada' : 'Campaña'} social ${city.name} ${2025 + (i % 2)}`, i % 2 === 0 ? 'Jornada' : 'Campaña', timestampDaysAgo(120 - i * 4, 7), timestampDaysAgo(119 - i * 4, 17), city.mun, pick(['Planificada', 'En Curso', 'Finalizada'], i)]
      );
      misiones.push(row.id);
      inserted.mision_operativa++;
    }

    const vehiculos = [];
    for (let i = 1; i <= counts.vehiculo; i++) {
      const row = await insertReturning(
        client,
        'INSERT INTO vehiculo (placa, tipo, vencimiento_soat, vencimiento_tecnomecanica, esta_activo) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [`ONG${String(i).padStart(3, '0')}`, pick(['Camioneta', 'Furgon', 'Camion', 'Moto'], i), dateDaysAgo(-120 - i * 8), dateDaysAgo(-180 - i * 7), i % 9 !== 0]
      );
      vehiculos.push(row.id);
      inserted.vehiculo++;
    }

    const conductores = [];
    for (let i = 1; i <= counts.conductor; i++) {
      const row = await insertReturning(
        client,
        'INSERT INTO conductor (numero_documento, nombre_completo, numero_licencia, vencimiento_licencia, telefono) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [String(79000000 + i * 281), `${pick(firstNames, i)} ${pick(lastNames, i)} ${pick(lastNames, i, 6)}`, `LIC-${String(40000 + i)}`, dateDaysAgo(-220 - i * 10), `32${i % 10}${String(6000000 + i * 57).slice(0, 7)}`]
      );
      conductores.push(row.id);
      inserted.conductor++;
    }

    const inventario = [];
    for (let i = 1; i <= counts.item_inventario; i++) {
      const item = pick(items, i);
      const row = await insertReturning(
        client,
        'INSERT INTO item_inventario (codigo_sku, nombre, categoria, unidad_medida) VALUES ($1,$2,$3,$4) RETURNING id',
        [`${item[0]}-${String(i).padStart(2, '0')}`, item[1], item[2], item[3]]
      );
      inventario.push(row.id);
      inserted.item_inventario++;
    }

    const recursos = [];
    for (let i = 1; i <= counts.recurso_mision; i++) {
      const row = await insertReturning(
        client,
        'INSERT INTO recurso_mision (mision_id, usuario_id, vehiculo_id, conductor_id, fecha_asignacion) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [pick(misiones, i), pick(users, i), pick(vehiculos, i), pick(conductores, i), timestampDaysAgo(100 - i * 2, 6)]
      );
      recursos.push(row.id);
      inserted.recurso_mision++;
    }

    const lotes = [];
    for (let i = 1; i <= counts.lote_inventario; i++) {
      const qty = 40 + (i % 11) * 10;
      const row = await insertReturning(
        client,
        `INSERT INTO lote_inventario (item_id, donacion_id, numero_lote, fecha_vencimiento, cantidad_inicial, stock_actual, ubicacion_bodega)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, stock_actual`,
        [pick(inventario, i), pick(donaciones, i), `LOTE-${String(i).padStart(4, '0')}`, dateDaysAgo(-280 - i * 3), qty, qty, `Bodega ${pick(['Norte', 'Sur', 'Centro', 'Occidente'], i)} - Estante ${1 + (i % 12)}`]
      );
      lotes.push({ id: row.id, stock: Number(row.stock_actual) });
      inserted.lote_inventario++;
    }

    const entregas = [];
    for (let i = 1; i <= counts.entrega_encabezado; i++) {
      const row = await insertReturning(
        client,
        `INSERT INTO entrega_encabezado (
          beneficiario_id, mision_id, usuario_id, fecha_entrega, latitud_gps, longitud_gps,
          url_foto_evidencia, url_firma_digital, estado
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [
          pick(beneficiarios, i),
          pick(misiones, i),
          pick(users, i),
          timestampDaysAgo(80 - (i % 70), 9 + (i % 7)),
          (4.5 + (i % 80) / 100).toFixed(7),
          (-74.2 - (i % 60) / 100).toFixed(7),
          `supabase://evidencias/foto_entrega_${i}.jpg`,
          `supabase://firmas/firma_entrega_${i}.png`,
          i % 9 === 0 ? 'Pendiente Sincronizacion' : 'Completada'
        ]
      );
      entregas.push(row.id);
      inserted.entrega_encabezado++;
    }

    for (let i = 1; i <= counts.entrega_detalle; i++) {
      const lote = lotes.find((item) => item.stock >= 2) || lotes[i % lotes.length];
      const qty = Math.min(1 + (i % 3), lote.stock);
      if (qty <= 0) continue;
      await client.query(
        'INSERT INTO entrega_detalle (entrega_encabezado_id, lote_inventario_id, cantidad_entregada) VALUES ($1,$2,$3)',
        [pick(entregas, i), lote.id, qty]
      );
      lote.stock -= qty;
      await client.query('UPDATE lote_inventario SET stock_actual = $1 WHERE id = $2', [lote.stock, lote.id]);
      inserted.entrega_detalle++;
    }

    for (let i = 1; i <= counts.gasto_logistico; i++) {
      await client.query(
        'INSERT INTO gasto_logistico (recurso_mision_id, tipo_gasto, monto, fecha_gasto, url_recibo) VALUES ($1,$2,$3,$4,$5)',
        [pick(recursos, i), pick(['Combustible', 'Peaje', 'Parqueadero', 'Mantenimiento', 'Alimentacion equipo'], i), 18000 + i * 9500, timestampDaysAgo(70 - i, 18), `supabase://recibos/gasto_${i}.pdf`]
      );
      inserted.gasto_logistico++;
    }

    const totalInserted = Object.values(inserted).reduce((sum, value) => sum + value, 0);
    console.table(inserted);
    console.log(`Registros operativos insertados: ${totalInserted}/${TARGET_RECORDS}`);

    if (totalInserted !== TARGET_RECORDS) {
      throw new Error(`La carga no alcanzo exactamente ${TARGET_RECORDS} registros operativos`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Error cargando datos:', error.message);
  process.exit(1);
});
