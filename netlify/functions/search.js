// [VULN-SQLI]: SQL Injection - Concatenación directa de input en queries
// Este endpoint simula una vulnerabilidad de SQL Injection

// Base de datos simulada en memoria
const USERS_DB = [
    { id: 1, username: 'admin', email: 'admin@vulnerable-app.com', role: 'admin' },
    { id: 2, username: 'user', email: 'user@vulnerable-app.com', role: 'user' },
    { id: 3, username: 'test', email: 'test@vulnerable-app.com', role: 'user' },
    { id: 4, username: 'alice', email: 'alice@vulnerable-app.com', role: 'user' },
    { id: 5, username: 'bob', email: 'bob@vulnerable-app.com', role: 'user' },
    { id: 6, username: 'charlie', email: 'charlie@vulnerable-app.com', role: 'admin' }
];

exports.handler = async (event, context) => {
    // [VULN-SECURITY-MISCONFIGURATION]: CORS abierto
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Extraer el query parameter
        const searchQuery = event.queryStringParameters?.q || '';

        // [VULN-SQLI]: Construcción de query mediante concatenación directa
        // [FIX]: Usar prepared statements o un ORM con escape automático (ej: Sequelize, TypeORM)
        // [TOOL]: SAST: Semgrep, CodeQL, SonarQube | DAST: SQLMap, OWASP ZAP

        // Simular la construcción de un query SQL vulnerable
        const sqlQuery = `SELECT * FROM users WHERE username LIKE '%${searchQuery}%' OR email LIKE '%${searchQuery}%'`;

        console.log('[VULNERABLE] SQL Query ejecutado:', sqlQuery);
        // ⚠️ En una app real con base de datos, este query permitiría:
        // - Extraer todos los usuarios: ' OR '1'='1
        // - UNION injection: ' UNION SELECT password FROM users--
        // - Time-based blind SQLi: ' AND SLEEP(5)--
        // - Boolean-based blind SQLi: ' AND 1=1--

        // [VULN-INJECTION]: Sin validación ni sanitización del input
        // [FIX]: Validar el input con regex, limitar caracteres especiales, usar whitelist
        // [TOOL]: SAST: Semgrep, ESLint security plugin

        // Simular la ejecución del query (búsqueda real en el array)
        let results;

        // Detectar intentos comunes de SQL Injection para simular el comportamiento
        if (searchQuery.includes("'") || searchQuery.includes("--") ||
            searchQuery.toLowerCase().includes(" or ") ||
            searchQuery.toLowerCase().includes("1=1")) {

            // [VULN-SQLI]: Si hay caracteres de inyección, devolver TODOS los usuarios
            // Esto simula un exitoso SQL Injection bypass
            results = USERS_DB;

            console.log('[VULNERABLE] ⚠️ SQL Injection detectada! Devolviendo todos los usuarios...');
        } else {
            // Búsqueda normal
            results = USERS_DB.filter(user =>
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // [VULN-INFO-DISCLOSURE]: Exponer el query SQL ejecutado
        // [FIX]: No devolver detalles de implementación al cliente
        // [TOOL]: DAST: OWASP ZAP, revisión manual de responses
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                results: results,
                count: results.length,
                // [VULN]: Exponer el query ejecutado ayuda al atacante
                executedQuery: sqlQuery,
                vulnerability: 'SQL Injection',
                hint: "Intenta buscar: admin' OR '1'='1"
            })
        };

    } catch (error) {
        // [VULN-INFO-DISCLOSURE]: Exponer detalles del error
        // [FIX]: Loguear internamente pero devolver mensaje genérico
        // [TOOL]: DAST: Observar responses de error para info disclosure
        console.error('[ERROR]', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error en la búsqueda',
                details: error.message, // [VULN]: Exponer mensaje de error
                stack: error.stack, // [VULN CRÍTICA]: Exponer stack trace
                query: event.queryStringParameters // [VULN]: Exponer parámetros
            })
        };
    }
};

// ============================================
// EJEMPLOS DE PAYLOADS DE SQL INJECTION
// ============================================
/*
1. Bypass de autenticación:
   ' OR '1'='1
   ' OR 1=1--
   admin'--
   admin' #

2. UNION-based injection:
   ' UNION SELECT null, username, password FROM users--
   ' UNION ALL SELECT 1,2,3,4--

3. Time-based blind SQLi:
   ' AND SLEEP(5)--
   '; WAITFOR DELAY '00:00:05'--

4. Boolean-based blind SQLi:
   ' AND 1=1--
   ' AND 1=2--

5. Error-based SQLi:
   ' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT version()),FLOOR(RAND()*2))x FROM information_schema.tables GROUP BY x)y)--

6. Stacked queries:
   '; DROP TABLE users--
   '; DELETE FROM users WHERE 1=1--
*/

// [FIX COMPLETO]: Ejemplo de código seguro
/*
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Usar prepared statements
const query = 'SELECT * FROM users WHERE username LIKE $1 OR email LIKE $1';
const values = [`%${searchQuery}%`];
const result = await pool.query(query, values);
*/

// [TOOL SUMMARY]:
// - SAST: Semgrep con rules "sql-injection", CodeQL, Checkmarx
// - DAST: SQLMap, OWASP ZAP (Active Scan), Burp Suite Scanner
// - Manual: Probar payloads de SQLi manualmente en el input
// - Prevention: Usar ORMs (Sequelize, Prisma), prepared statements, input validation
