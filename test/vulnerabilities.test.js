/**
 * Tests de Vulnerabilidades
 *
 * Estos tests verifican que las vulnerabilidades estén presentes y funcionales.
 * En una app normal, estos serían los tests que DEBERÍAN FALLAR.
 * En esta app educativa, estos tests DEBEN PASAR (las vulnerabilidades deben existir).
 */

module.exports = async ({ describe, it, runTest }) => {
    const fs = require('fs');
    const path = require('path');

    // Suite 1: Verificar Credenciales Hardcodeadas
    await describe('🔴 Broken Authentication - Credenciales Hardcodeadas');

    await runTest('debe tener credenciales hardcodeadas en auth.js', async (assert) => {
        const authPath = path.join(__dirname, '../netlify/functions/auth.js');
        const content = fs.readFileSync(authPath, 'utf-8');

        assert(
            content.includes('HARDCODED_USERS'),
            'auth.js debe contener HARDCODED_USERS'
        );
        assert(
            content.includes("password: 'admin123'") || content.includes('password: "admin123"'),
            'Debe contener contraseña hardcodeada admin123'
        );
        assert(
            content.includes('JWT_SECRET'),
            'Debe contener JWT_SECRET hardcodeado'
        );
    });

    await runTest('debe tener JWT sin expiración', async (assert) => {
        const authPath = path.join(__dirname, '../netlify/functions/auth.js');
        const content = fs.readFileSync(authPath, 'utf-8');

        // Buscar jwt.sign y verificar que se menciona que NO tiene expiresIn
        assert(content.includes('jwt.sign'), 'Debe tener llamada a jwt.sign');
        assert(
            content.includes('Sin expiresIn') || content.includes('sin expiración') || content.includes('nunca expira'),
            'Debe documentar que el JWT no expira'
        );
    });

    // Suite 2: Verificar SQL Injection
    await describe('🔴 SQL Injection - Query Concatenation');

    await runTest('debe tener concatenación directa de queries en search.js', async (assert) => {
        const searchPath = path.join(__dirname, '../netlify/functions/search.js');
        const content = fs.readFileSync(searchPath, 'utf-8');

        assert(
            content.includes('${searchQuery}') || (content.includes('${') && content.includes('searchQuery')),
            'search.js debe usar template literals con searchQuery sin sanitización'
        );
        assert(
            content.includes('SELECT') || content.includes('sqlQuery'),
            'Debe simular queries SQL'
        );
    });

    await runTest('NO debe usar prepared statements', async (assert) => {
        const searchPath = path.join(__dirname, '../netlify/functions/search.js');
        const content = fs.readFileSync(searchPath, 'utf-8');

        // Verificar que usa concatenación directa documentada como vulnerabilidad
        assert(
            content.includes('[VULN') && content.includes('${searchQuery}'),
            'Debe usar concatenación directa vulnerable'
        );
    });

    // Suite 3: Verificar XSS
    await describe('🔴 Cross-Site Scripting (XSS)');

    await runTest('debe usar innerHTML en app.js', async (assert) => {
        const appPath = path.join(__dirname, '../public/app.js');
        const content = fs.readFileSync(appPath, 'utf-8');

        assert(
            content.includes('innerHTML'),
            'app.js debe usar innerHTML (vulnerable a XSS)'
        );
        assert(
            content.includes('innerHTML +=') || content.includes('innerHTML='),
            'Debe asignar contenido con innerHTML'
        );
    });

    await runTest('NO debe sanitizar el input del usuario', async (assert) => {
        const appPath = path.join(__dirname, '../public/app.js');
        const content = fs.readFileSync(appPath, 'utf-8');

        // Verificar que usa innerHTML directamente
        assert(content.includes('innerHTML'), 'Debe usar innerHTML');

        // Verificar que NO importa DOMPurify (puede estar en comentarios)
        assert(
            !content.includes('import') && !content.includes('require(') || !content.includes('dompurify'),
            'No debe importar DOMPurify'
        );
    });

    // Suite 4: Verificar Sensitive Data Exposure
    await describe('🔴 Sensitive Data Exposure');

    await runTest('debe tener API keys en comentarios HTML', async (assert) => {
        const indexPath = path.join(__dirname, '../public/index.html');
        const content = fs.readFileSync(indexPath, 'utf-8');

        assert(
            content.includes('API_KEY') || content.includes('sk_test') || content.includes('sk_live'),
            'index.html debe contener API keys en comentarios'
        );
    });

    await runTest('debe tener tokens hardcodeados en app.js', async (assert) => {
        const appPath = path.join(__dirname, '../public/app.js');
        const content = fs.readFileSync(appPath, 'utf-8');

        assert(
            content.includes('HARDCODED') || content.includes('Bearer sk_'),
            'app.js debe contener tokens hardcodeados'
        );
    });

    await runTest('debe exponer datos sensibles en user.js', async (assert) => {
        const userPath = path.join(__dirname, '../netlify/functions/user.js');
        const content = fs.readFileSync(userPath, 'utf-8');

        assert(
            content.includes('passwordHash') && content.includes('ssn'),
            'user.js debe exponer passwordHash y ssn'
        );
        assert(
            content.includes('apiKey'),
            'user.js debe exponer apiKey'
        );
    });

    // Suite 5: Verificar IDOR
    await describe('🔴 Insecure Direct Object Reference (IDOR)');

    await runTest('debe permitir acceso directo por ID sin validación', async (assert) => {
        const userPath = path.join(__dirname, '../netlify/functions/user.js');
        const content = fs.readFileSync(userPath, 'utf-8');

        assert(
            content.includes('queryStringParameters') && content.includes('id'),
            'user.js debe leer ID de query params'
        );

        // Verificar que está documentado como IDOR
        assert(
            content.includes('[VULN-IDOR]') || content.includes('IDOR'),
            'Debe estar documentado como vulnerabilidad IDOR'
        );
    });

    // Suite 6: Verificar Security Misconfiguration
    await describe('🟠 Security Misconfiguration');

    await runTest('debe tener CORS abierto en netlify.toml', async (assert) => {
        const tomlPath = path.join(__dirname, '../netlify.toml');
        const content = fs.readFileSync(tomlPath, 'utf-8');

        assert(
            content.includes('Access-Control-Allow-Origin = "*"'),
            'netlify.toml debe tener CORS abierto con *'
        );
    });

    await runTest('NO debe tener headers de seguridad configurados', async (assert) => {
        const tomlPath = path.join(__dirname, '../netlify.toml');
        const content = fs.readFileSync(tomlPath, 'utf-8');

        // Verificar que NO hay headers de seguridad CONFIGURADOS (no comentados)
        // Pueden estar mencionados en comentarios como ejemplos
        const lines = content.split('\n').filter(line => !line.trim().startsWith('#'));
        const activeConfig = lines.join('\n');

        const hasSecurityHeaders =
            activeConfig.includes('Content-Security-Policy = ') ||
            activeConfig.includes('X-Frame-Options = ');

        assert(
            !hasSecurityHeaders,
            'No debe tener headers de seguridad configurados (mantener misconfiguration)'
        );
    });

    // Suite 7: Verificar Vulnerable Dependencies
    await describe('🟠 Vulnerable and Outdated Components');

    await runTest('debe tener dependencias vulnerables en package.json', async (assert) => {
        const pkgPath = path.join(__dirname, '../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        assert(
            pkg.dependencies.lodash === '4.17.15',
            'Debe usar lodash@4.17.15 (vulnerable)'
        );
        assert(
            pkg.dependencies.axios === '0.21.1',
            'Debe usar axios@0.21.1 (vulnerable)'
        );
        assert(
            pkg.dependencies.express === '4.17.1',
            'Debe usar express@4.17.1 (vulnerable)'
        );
    });

    // Suite 8: Verificar Command Injection
    await describe('🔴 Command Injection');

    await runTest('debe tener ejecución de comandos sin sanitización en ping.js', async (assert) => {
        const pingPath = path.join(__dirname, '../netlify/functions/ping.js');

        if (!fs.existsSync(pingPath)) {
            console.log('  ⚠️  ping.js no encontrado - saltando test');
            return;
        }

        const content = fs.readFileSync(pingPath, 'utf-8');

        assert(
            content.includes('exec') || content.includes('execPromise'),
            'ping.js debe usar exec para ejecutar comandos'
        );
        assert(
            content.includes('${hostname}') || content.includes('${host}'),
            'Debe concatenar hostname directamente en el comando'
        );
    });

    // Suite 9: Verificar Documentación de Vulnerabilidades
    await describe('📚 Documentación');

    await runTest('debe tener VULNERABILITIES.md documentado', async (assert) => {
        const vulnPath = path.join(__dirname, '../VULNERABILITIES.md');
        assert(
            fs.existsSync(vulnPath),
            'Debe existir VULNERABILITIES.md'
        );

        const content = fs.readFileSync(vulnPath, 'utf-8');
        assert(
            content.includes('SQL Injection') &&
            content.includes('XSS') &&
            content.includes('IDOR'),
            'VULNERABILITIES.md debe documentar las vulnerabilidades principales'
        );
    });

    await runTest('debe tener comentarios [VULN] en el código', async (assert) => {
        const authPath = path.join(__dirname, '../netlify/functions/auth.js');
        const content = fs.readFileSync(authPath, 'utf-8');

        assert(
            content.includes('[VULN') || content.includes('[FIX]'),
            'Los archivos deben tener comentarios educativos [VULN] o [FIX]'
        );
    });
};
