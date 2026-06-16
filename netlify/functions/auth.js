// [VULN-AUTH]: Broken Authentication - Múltiples vulnerabilidades de autenticación
// Este endpoint contiene credenciales hardcodeadas y JWT mal configurado

const jwt = require('jsonwebtoken');

// [VULN-SENSITIVE-DATA]: Credenciales hardcodeadas en el código fuente
// [FIX]: Usar variables de entorno, integrar con un proveedor de autenticación (Auth0, Cognito)
// [TOOL]: SAST: Semgrep, SonarQube, GitGuardian
const HARDCODED_USERS = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123', // [VULN]: Contraseña en texto plano
        role: 'admin',
        email: 'admin@vulnerable-app.com'
    },
    {
        id: 2,
        username: 'user',
        password: 'password', // [VULN]: Contraseña débil y en texto plano
        role: 'user',
        email: 'user@vulnerable-app.com'
    },
    {
        id: 3,
        username: 'test',
        password: '123456', // [VULN]: Contraseña extremadamente débil
        role: 'user',
        email: 'test@vulnerable-app.com'
    }
];

// [VULN-SENSITIVE-DATA]: JWT Secret hardcodeado
// [FIX]: Usar process.env.JWT_SECRET y rotarlo periódicamente
// [TOOL]: SAST: TruffleHog, GitGuardian, Semgrep
const JWT_SECRET = 'super_secret_key_that_should_not_be_here_123';

exports.handler = async (event, context) => {
    // [VULN-SECURITY-MISCONFIGURATION]: CORS abierto a todos los orígenes
    // [FIX]: Restringir CORS a dominios específicos y de confianza
    // [TOOL]: DAST: OWASP ZAP detectará CORS mal configurado
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { username, password } = JSON.parse(event.body);

        // [VULN-INJECTION]: Sin validación de input
        // [FIX]: Validar y sanitizar todos los inputs del usuario
        // [TOOL]: SAST: Semgrep, ESLint security plugin
        if (!username || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Username y password son requeridos' })
            };
        }

        // [VULN-AUTH]: Comparación de contraseñas en texto plano
        // [FIX]: Usar bcrypt o argon2 para hashear contraseñas, nunca compararlas en texto plano
        // [TOOL]: SAST: Semgrep, SonarQube
        const user = HARDCODED_USERS.find(
            u => u.username === username && u.password === password
        );

        if (!user) {
            // [VULN-INFO-DISCLOSURE]: Mensaje de error revela información
            // [FIX]: Usar mensajes genéricos como "Credenciales inválidas"
            // [TOOL]: DAST: OWASP ZAP, revisión manual
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: 'Usuario o contraseña incorrectos',
                    hint: 'Intenta admin/admin123 o user/password' // [VULN]: Hint expuesto
                })
            };
        }

        // [VULN-AUTH]: JWT sin expiración y con algoritmo débil
        // [FIX]: Agregar expiresIn (ej: '1h'), usar algoritmo RS256, implementar refresh tokens
        // [TOOL]: SAST: Semgrep (custom rules para JWT), Manual code review
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email // [VULN]: Incluir demasiada información en el JWT
            },
            JWT_SECRET
            // [VULN]: Sin expiresIn - el token nunca expira
            // [FIX]: { expiresIn: '1h' }
        );

        // [VULN-SENSITIVE-DATA]: Exponer información sensible en la response
        // [FIX]: Devolver solo el token, no información adicional del usuario
        // [TOOL]: DAST: OWASP ZAP, Burp Suite
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                // [VULN-INFO-DISCLOSURE]: Exponer detalles de implementación
                tokenDetails: {
                    algorithm: 'HS256',
                    secret: JWT_SECRET, // [VULN CRÍTICA]: Exponer el secret en la response
                    expiresIn: 'never'
                }
            })
        };

    } catch (error) {
        // [VULN-INFO-DISCLOSURE]: Exponer detalles del error al cliente
        // [FIX]: Loguear el error internamente pero devolver mensaje genérico al cliente
        // [TOOL]: DAST: OWASP ZAP, revisión manual de responses
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message, // [VULN]: Exponer stack trace/detalles
                stack: error.stack // [VULN CRÍTICA]: Exponer stack trace completo
            })
        };
    }
};

// [VULN-AUTH]: Sin rate limiting
// [FIX]: Implementar rate limiting (ej: 5 intentos por minuto por IP)
// [TOOL]: DAST: Herramientas de brute-force como Hydra, Burp Intruder

// [VULN-AUTH]: Sin 2FA/MFA
// [FIX]: Implementar autenticación de dos factores

// [VULN-SESSION]: Sin gestión de sesiones
// [FIX]: Implementar logout, revocación de tokens, blacklist de JWTs

// [TOOL SUMMARY]:
// - SAST: Semgrep, SonarQube, Checkmarx detectarán credenciales hardcodeadas
// - DAST: OWASP ZAP detectará CORS abierto y falta de rate limiting
// - SCA: npm audit detectará vulnerabilidades en jsonwebtoken (si hay)
// - Manual: Testing de brute-force y autenticación
