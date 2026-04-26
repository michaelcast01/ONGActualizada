const pool = require('./backend/db');

const TARGET_BENEFICIARIOS = 1200;

const firstNamesFemale = [
  'Valentina', 'Sofia', 'Isabella', 'Mariana', 'Gabriela', 'Daniela', 'Camila', 'Natalia',
  'Laura', 'Paula', 'Sara', 'Diana', 'Carolina', 'Luciana', 'Manuela', 'Juliana',
  'Andrea', 'Monica', 'Patricia', 'Claudia', 'Adriana', 'Marcela', 'Luisa', 'Alejandra'
];

const firstNamesMale = [
  'Santiago', 'Mateo', 'Sebastian', 'Nicolas', 'Daniel', 'Alejandro', 'Juan', 'Andres',
  'Miguel', 'Carlos', 'Jose', 'David', 'Felipe', 'Jorge', 'Diego', 'Luis', 'Fernando',
  'Ricardo', 'Oscar', 'Edwin', 'Javier', 'Mauricio', 'Cristian', 'Leonardo'
];

const lastNames = [
  'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez',
  'Torres', 'Diaz', 'Vargas', 'Castro', 'Rojas', 'Moreno', 'Jimenez', 'Munoz', 'Ortiz',
  'Gutierrez', 'Ruiz', 'Alvarez', 'Romero', 'Suarez', 'Herrera', 'Medina', 'Cortes',
  'Navarro', 'Mendoza', 'Bermudez', 'Cifuentes', 'Quintero'
];

const cities = [
  { name: 'Bogota, D.C.', dep: '11', mun: '11001' },
  { name: 'Soacha', dep: '25', mun: '25754' },
  { name: 'Chia', dep: '25', mun: '25175' },
  { name: 'Medellin', dep: '05', mun: '05001' },
  { name: 'Envigado', dep: '05', mun: '05266' },
  { name: 'Cali', dep: '76', mun: '76001' },
  { name: 'Palmira', dep: '76', mun: '76520' },
  { name: 'Barranquilla', dep: '08', mun: '08001' },
  { name: 'Bucaramanga', dep: '68', mun: '68001' },
  { name: 'Cartagena', dep: '13', mun: '13001' }
];

const neighborhoods = [
  'La Esperanza', 'San Jose', 'El Progreso', 'Villa Nueva', 'Los Pinos', 'Santa Clara',
  'El Carmen', 'La Victoria', 'Las Palmas', 'Buenos Aires', 'Centro', 'El Jardin',
  'San Miguel', 'Altos del Sol', 'La Floresta', 'Los Olivos', 'El Refugio', 'Santa Isabel'
];

function pick(list, index, offset = 0) {
  return list[(index + offset) % list.length];
}

function timestampDaysAgo(days, hour = 8) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 11) % 60, 0, 0);
  return date.toISOString();
}

function birthDateFromAge(age, index) {
  const year = new Date().getFullYear() - age;
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 27) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function documentTypeFromAge(age, index) {
  if (age < 7) return 'RC';
  if (age < 18) return 'TI';
  if (index % 19 === 0) return 'PPT';
  return 'CC';
}

function documentNumber(type, sequence) {
  if (type === 'PPT') return `PPT${900000 + sequence}`;
  if (type === 'TI') return String(1089000000 + sequence);
  if (type === 'RC') return String(1009000000 + sequence);
  return String(900000000 + sequence);
}

async function main() {
  const client = await pool.connect();

  try {
    const currentResult = await client.query('SELECT COUNT(*)::int AS total FROM beneficiario');
    const currentTotal = currentResult.rows[0].total;
    const missing = TARGET_BENEFICIARIOS - currentTotal;

    if (missing <= 0) {
      console.log(`La tabla beneficiario ya tiene ${currentTotal} registros.`);
      return;
    }

    console.log(`Beneficiarios actuales: ${currentTotal}`);
    console.log(`Insertando beneficiarios faltantes: ${missing}`);

    const beneficiaryRows = [];
    const addressRowsByDocument = new Map();

    for (let i = 1; i <= missing; i++) {
      const sequence = currentTotal + i;
      const gender = sequence % 2 === 0 ? 'Femenino' : 'Masculino';
      const firstName = gender === 'Femenino'
        ? pick(firstNamesFemale, sequence)
        : pick(firstNamesMale, sequence);
      const surnames = `${pick(lastNames, sequence)} ${pick(lastNames, sequence, 9)}`;
      const age = 3 + (sequence % 78);
      const type = documentTypeFromAge(age, sequence);
      const city = pick(cities, sequence);
      const email = `${firstName}.${surnames.split(' ')[0]}.${sequence}`.toLowerCase().replace(/\s+/g, '.');
      const phone = `3${10 + (sequence % 9)}${String(3000000 + sequence * 67).slice(0, 7)}`;

      const numeroDocumento = documentNumber(type, sequence);

      beneficiaryRows.push({
        tipo_documento: type,
        numero_documento: numeroDocumento,
        primer_nombre: firstName,
        apellidos: surnames,
        fecha_nacimiento: birthDateFromAge(age, sequence),
        edad_calculada: age,
        genero: gender,
        telefono_principal: phone,
        correo: `${email}@correo.local`,
        ciudad: city.name,
        es_victima_conflicto: sequence % 5 === 0,
        tiene_discapacidad: sequence % 13 === 0,
        grupo_sisben: pick(['A1', 'A2', 'A3', 'B1', 'B2', 'C1', 'C2'], sequence),
        pertenencia_etnica: pick(['Ninguna', 'Indigena', 'Afrocolombiana', 'Raizal', 'Campesina', 'Palenquera'], sequence),
        consentimiento_datos: sequence % 6 !== 0,
        fecha_registro: timestampDaysAgo(360 - (sequence % 300), 8 + (sequence % 8))
      });

      addressRowsByDocument.set(numeroDocumento, {
        cod_departamento_divipola: city.dep,
        cod_municipio_divipola: city.mun,
        direccion_fisica: `Carrera ${1 + (sequence % 95)} # ${3 + (sequence % 70)}-${10 + (sequence % 85)}, Barrio ${pick(neighborhoods, sequence)}`,
        tipo_zona: sequence % 5 === 0 ? 'Rural' : 'Urbana'
      });
    }

    await client.query('BEGIN');

    const insertedBeneficiaries = await client.query(
      `INSERT INTO beneficiario (
        tipo_documento, numero_documento, primer_nombre, apellidos, fecha_nacimiento, edad_calculada,
        genero, telefono_principal, correo, ciudad, es_victima_conflicto, tiene_discapacidad,
        grupo_sisben, pertenencia_etnica, consentimiento_datos, fecha_registro
      )
      SELECT
        tipo_documento, numero_documento, primer_nombre, apellidos, fecha_nacimiento, edad_calculada,
        genero, telefono_principal, correo, ciudad, es_victima_conflicto, tiene_discapacidad,
        grupo_sisben, pertenencia_etnica, consentimiento_datos, fecha_registro
      FROM jsonb_to_recordset($1::jsonb) AS x(
        tipo_documento varchar(20),
        numero_documento varchar(50),
        primer_nombre varchar(100),
        apellidos varchar(150),
        fecha_nacimiento date,
        edad_calculada int,
        genero varchar(30),
        telefono_principal varchar(30),
        correo varchar(150),
        ciudad varchar(100),
        es_victima_conflicto boolean,
        tiene_discapacidad boolean,
        grupo_sisben varchar(50),
        pertenencia_etnica varchar(100),
        consentimiento_datos boolean,
        fecha_registro timestamp
      )
      RETURNING id, numero_documento`,
      [JSON.stringify(beneficiaryRows)]
    );

    const addressRows = insertedBeneficiaries.rows.map((row) => ({
      beneficiario_id: row.id,
      ...addressRowsByDocument.get(row.numero_documento)
    }));

    await client.query(
      `INSERT INTO direccion_ubicacion (
        beneficiario_id, cod_departamento_divipola, cod_municipio_divipola, direccion_fisica, tipo_zona
      )
      SELECT beneficiario_id, cod_departamento_divipola, cod_municipio_divipola, direccion_fisica, tipo_zona
      FROM jsonb_to_recordset($1::jsonb) AS x(
        beneficiario_id bigint,
        cod_departamento_divipola varchar(20),
        cod_municipio_divipola varchar(20),
        direccion_fisica varchar(255),
        tipo_zona varchar(30)
      )`,
      [JSON.stringify(addressRows)]
    );

    await client.query('COMMIT');

    const finalResult = await client.query('SELECT COUNT(*)::int AS total FROM beneficiario');
    console.log(`Total final beneficiarios: ${finalResult.rows[0].total}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Error agregando beneficiarios:', error.message);
  process.exit(1);
});
