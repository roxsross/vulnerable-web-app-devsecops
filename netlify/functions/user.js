// [VULN-IDOR]: Insecure Direct Object Reference
// Este endpoint permite acceder a cualquier perfil de usuario sin validación de autorización

// Base de datos simulada con información sensible
// [EDUCATIONAL] Estas NO son keys reales, son ejemplos para demostración
const USERS_DB = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@vulnerable-app.com',
        role: 'admin',
        // [VULN-SENSITIVE-DATA]: Almacenar y exponer información sensible
        passwordHash: 'e10adc3949ba59abbe56e057f20f883e', // MD5 de "123456" (algoritmo débil)
        apiKey: 'sk_test_FAKE_admin_EDUCATIONAL_123',
        ssn: '123-45-6789',
        creditCard: '**** **** **** 1234',
        salary: '$150,000',
        createdAt: '2020-01-15'
    },
    {
        id: 2,
        username: 'user',
        email: 'user@vulnerable-app.com',
        role: 'user',
        passwordHash: '5f4dcc3b5aa765d61d8327deb882cf99', // MD5 de "password"
        apiKey: 'sk_test_FAKE_user_EDUCATIONAL_987',
        ssn: '987-65-4321',
        creditCard: '**** **** **** 5678',
        salary: '$75,000',
        createdAt: '2021-03-20'
    },
    {
        id: 3,
        username: 'test',
        email: 'test@vulnerable-app.com',
        role: 'user',
        passwordHash: 'e10adc3949ba59abbe56e057f20f883e', // MD5 de "123456"
        apiKey: 'sk_test_FAKE_test_EDUCATIONAL_555',
        ssn: '555-66-7777',
        creditCard: '**** **** **** 9012',
        salary: '$60,000',
        createdAt: '2022-06-10'
    },
    {
        id: 4,
        username: 'alice',
        email: 'alice@vulnerable-app.com',
        role: 'user',
        passwordHash: '482c811da5d5b4bc6d497ffa98491e38', // MD5 de "alice123"
        apiKey: 'sk_test_FAKE_alice_EDUCATIONAL_111',
        ssn: '111-22-3333',
        creditCard: '**** **** **** 4444',
        salary: '$85,000',
        createdAt: '2022-09-05'
    },
    {
        id: 5,
        username: 'bob',
        email: 'bob@vulnerable-app.com',
        role: 'user',
        passwordHash: '9f9d51bc70ef21ca5c14f307980a29d8', // MD5 de "bob456"
        apiKey: 'sk_test_FAKE_bob_EDUCATIONAL_444',
        ssn: '444-55-6666',
        creditCard: '**** **** **** 7777',
        salary: '$90,000',
        createdAt: '2023-01-12'
    }
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
        // Extraer el ID del usuario de los query parameters
        const userId = event.queryStringParameters?.id;

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'User ID es requerido' })
            };
        }

        // [VULN-IDOR]: Acceso directo al recurso sin validar autorización
        // [FIX]: Verificar que el usuario autenticado tenga permiso para acceder a este perfil
        // Ejemplo de fix:
        /*
        const token = event.headers.authorization?.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verificar que el usuario solo puede ver su propio perfil O es admin
        if (decoded.id !== parseInt(userId) && decoded.role !== 'admin') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'No tienes permiso para acceder a este perfil' })
            };
        }
        */

        // [TOOL]: DAST: OWASP ZAP, Burp Suite - testing de autorización
        // [TOOL]: Manual: Cambiar IDs en la URL para acceder a otros perfiles

        // Buscar el usuario sin ninguna validación de autorización
        const user = USERS_DB.find(u => u.id === parseInt(userId));

        if (!user) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Usuario no encontrado' })
            };
        }

        // [VULN-SENSITIVE-DATA]: Exponer TODOS los datos sensibles sin filtrar
        // [FIX]: Devolver solo los campos necesarios, excluir passwordHash, apiKey, ssn, etc.
        // [TOOL]: DAST: OWASP ZAP detectará exposición de datos sensibles
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                // ⚠️ CRÍTICO: Devolver TODO, incluyendo datos ultra sensibles
                ...user,
                // [VULN-INFO-DISCLOSURE]: Agregar información adicional que ayuda al atacante
                vulnerabilities: [
                    'IDOR: Puedes cambiar el ID para ver otros perfiles',
                    'Sensitive Data Exposure: Todos los campos sensibles están expuestos',
                    'Weak Password Hash: MD5 es fácilmente crackeable'
                ],
                hint: 'Intenta cambiar ?id=1, ?id=2, ?id=3, etc.'
            })
        };

    } catch (error) {
        // [VULN-INFO-DISCLOSURE]: Exponer detalles del error
        console.error('[ERROR]', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error al obtener el perfil',
                details: error.message,
                stack: error.stack
            })
        };
    }
};

// ============================================
// EJEMPLOS DE EXPLOTACIÓN DE IDOR
// ============================================
/*
1. Enumeración de usuarios:
   GET /api/user?id=1
   GET /api/user?id=2
   GET /api/user?id=3
   ... continuar hasta encontrar todos los usuarios

2. Acceso a datos sensibles:
   GET /api/user?id=1  -> Obtener SSN, API keys, password hashes

3. Modificación (si hubiera endpoints PUT/DELETE sin validación):
   PUT /api/user?id=1 { "role": "admin" }
   DELETE /api/user?id=2

4. Ataque automatizado:
   for i in {1..1000}; do
       curl "http://vulnerable-app.com/api/user?id=$i"
   done
*/

// [VULN-CRYPTO]: Uso de MD5 para hashear contraseñas
// [FIX]: Usar bcrypt, argon2, o scrypt con salt aleatorio
// [TOOL]: SAST: Semgrep, SonarQube detectarán uso de algoritmos débiles
/*
Correcto:
const bcrypt = require('bcrypt');
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);
*/

// [VULN-MASS-ASSIGNMENT]: Si hubiera un endpoint POST/PUT, podría permitir modificar campos no autorizados
// [FIX]: Usar whitelisting de campos permitidos, no permitir actualización directa de role, permissions, etc.

// [TOOL SUMMARY]:
// - SAST: Semgrep para detectar falta de checks de autorización
// - DAST: OWASP ZAP, Burp Suite - Authorization testing
// - Manual: Probar acceso a diferentes IDs con diferentes usuarios
// - Prevention: Implementar RBAC (Role-Based Access Control), validar ownership de recursos
