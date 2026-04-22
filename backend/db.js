const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'aws-1-us-west-2.pooler.supabase.com',
  user: process.env.DB_USER || 'postgres.bcnlcrgymmvsfgjolvhq',
  password: process.env.DB_PASSWORD || '@@@michi1234L',
  database: process.env.DB_NAME || 'postgres',
  port: Number(process.env.DB_PORT || 6543),
  family: 4,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.connect()
  .then(client => {
    console.log('Conectado a PostgreSQL Supabase');
    client.release();
  })
  .catch(err => console.error('Error de conexion a PostgreSQL:', err.message));

module.exports = pool;
