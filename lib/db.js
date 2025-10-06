import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

export async function getConnection() {
  try {
    if (pool) {
      return pool;
    }
    pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}

/**
 * Query function that supports both parameter styles:
 * 1. Simple array: ['value1', 'value2'] -> creates @param0, @param1
 * 2. Named objects: [{name: 'userId', type: 'Int', value: 123}]
 */
export async function query(queryText, params = []) {
  try {
    const connection = await getConnection();
    const request = connection.request();
    
    // Check if params are objects with name/type/value or simple values
    if (params.length > 0) {
      if (typeof params[0] === 'object' && params[0].name) {
        // Named parameters with type info
        params.forEach(param => {
          const type = sql[param.type] || sql.NVarChar;
          request.input(param.name, type, param.value);
        });
      } else {
        // Simple positional parameters
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }
    }
    
    const result = await request.query(queryText);
    return result;
  } catch (err) {
    console.error('Query failed:', err);
    console.error('Query text:', queryText);
    console.error('Params:', params);
    throw err;
  }
}

export { sql };
