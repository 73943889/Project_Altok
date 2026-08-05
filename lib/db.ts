import { Pool } from 'pg';

// Instancia única del pool de conexiones optimizada para Neon Serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requerido para conexiones seguras en Neon
  },
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
 // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
};

export default pool;