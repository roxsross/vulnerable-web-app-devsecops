// [VULN-XSS]: Este archivo contiene vulnerabilidades de Cross-Site Scripting
// El uso de innerHTML sin sanitización permite la ejecución de scripts maliciosos

// API Base URL
const API_BASE = '/api';

// [VULN-SENSITIVE-DATA]: Token de API expuesto en el código JavaScript del frontend
// [FIX]: Nunca incluir tokens o secrets en el frontend. Manejar autenticación en el backend
// [TOOL]: SAST: TruffleHog, GitGuardian, Semgrep
// [EDUCATIONAL] Esta NO es una key real, es un ejemplo para demostración
const HARDCODED_API_TOKEN = 'Bearer sk_test_FAKE_not_real_EDUCATIONAL_example_12345';

// ============================================
// LOGIN FORM - Broken Authentication
// ============================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const resultDiv = document.getElementById('loginResult');

    try {
        const response = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': HARDCODED_API_TOKEN // [VULN]: Token expuesto
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        resultDiv.className = 'result show ' + (response.ok ? 'success' : 'error');

        if (response.ok) {
            // [VULN-SENSITIVE-DATA]: Almacenar JWT en localStorage sin encriptar
            // [FIX]: Usar httpOnly cookies para almacenar tokens
            // [TOOL]: SAST: Semgrep, SonarQube
            localStorage.setItem('jwt_token', data.token);

            resultDiv.innerHTML = `
                <strong>✅ Login exitoso!</strong><br>
                Token JWT: ${data.token}<br>
                <small>Token guardado en localStorage (inseguro)</small>
            `;
        } else {
            resultDiv.innerHTML = `<strong>❌ Error:</strong> ${data.error}`;
        }
    } catch (error) {
        resultDiv.className = 'result show error';
        resultDiv.innerHTML = `<strong>❌ Error:</strong> ${error.message}`;
    }
});

// ============================================
// SEARCH FORM - SQL Injection
// ============================================
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = document.getElementById('searchQuery').value;
    const resultDiv = document.getElementById('searchResult');

    try {
        // [VULN-SQLI]: El query se pasa directamente sin sanitización
        // [FIX]: Usar parámetros preparados o un ORM con escape automático
        // [TOOL]: SAST: Semgrep, CodeQL | DAST: SQLMap, OWASP ZAP
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        resultDiv.className = 'result show info';

        if (data.results && data.results.length > 0) {
            let html = '<strong>🔍 Resultados encontrados:</strong><br><br>';
            data.results.forEach(user => {
                html += `
                    <div class="user-profile">
                        <strong>Usuario:</strong> ${user.username}<br>
                        <strong>Email:</strong> ${user.email}<br>
                        <strong>Role:</strong> ${user.role}
                    </div>
                `;
            });
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = '<strong>ℹ️ No se encontraron resultados</strong>';
        }

        // Mostrar el query ejecutado (vulnerable)
        if (data.executedQuery) {
            resultDiv.innerHTML += `<br><br><small><strong>Query ejecutado:</strong> <code>${data.executedQuery}</code></small>`;
        }
    } catch (error) {
        resultDiv.className = 'result show error';
        resultDiv.innerHTML = `<strong>❌ Error:</strong> ${error.message}`;
    }
});

// ============================================
// COMMENT FORM - XSS (Cross-Site Scripting)
// ============================================
let comments = [];

document.getElementById('commentForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const comment = document.getElementById('comment').value;
    const commentsDiv = document.getElementById('comments');

    // [VULN-XSS]: Usar innerHTML permite la ejecución de scripts inyectados
    // [FIX]: Usar textContent en lugar de innerHTML, o sanitizar con DOMPurify
    // [TOOL]: SAST: Semgrep, ESLint security plugin | DAST: OWASP ZAP, Burp Suite
    comments.push(comment);

    commentsDiv.className = 'result show info';
    commentsDiv.innerHTML = '<strong>💬 Comentarios:</strong><br><br>';

    comments.forEach((c, index) => {
        // ⚠️ VULNERABILIDAD CRÍTICA: innerHTML sin sanitización
        commentsDiv.innerHTML += `
            <div class="comment-item">
                <strong>Comentario #${index + 1}:</strong><br>
                ${c}
            </div>
        `;
    });

    document.getElementById('comment').value = '';
});

// ============================================
// USER PROFILE - IDOR (Insecure Direct Object Reference)
// ============================================
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const resultDiv = document.getElementById('userResult');

    try {
        // [VULN-IDOR]: Acceso directo a recursos sin validación de autorización
        // [FIX]: Verificar en el backend que el usuario autenticado tenga permiso para ver este perfil
        // [TOOL]: DAST: OWASP ZAP, Burp Suite | Manual: Testing de autorización
        const response = await fetch(`${API_BASE}/user?id=${userId}`);
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result show success';
            resultDiv.innerHTML = `
                <strong>👤 Perfil de Usuario:</strong><br><br>
                <div class="user-profile">
                    <strong>ID:</strong> ${data.id}<br>
                    <strong>Username:</strong> ${data.username}<br>
                    <strong>Email:</strong> ${data.email}<br>
                    <strong>Role:</strong> ${data.role}<br>
                    <strong>Password Hash:</strong> ${data.passwordHash}<br>
                    <strong>API Key:</strong> ${data.apiKey}<br>
                    <strong>SSN:</strong> ${data.ssn}
                </div>
                <br>
                <small>⚠️ Nota: Todos estos datos sensibles están expuestos sin validación de autorización</small>
            `;
        } else {
            resultDiv.className = 'result show error';
            resultDiv.innerHTML = `<strong>❌ Error:</strong> ${data.error}`;
        }
    } catch (error) {
        resultDiv.className = 'result show error';
        resultDiv.innerHTML = `<strong>❌ Error:</strong> ${error.message}`;
    }
});

// ============================================
// PING FORM - Command Injection
// ============================================
document.getElementById('pingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const hostname = document.getElementById('hostname').value;
    const resultDiv = document.getElementById('pingResult');

    try {
        // [VULN-COMMAND-INJECTION]: El hostname se pasa al backend sin validación
        // [FIX]: Validar y sanitizar el input, usar librerías seguras, evitar exec/eval
        // [TOOL]: SAST: Semgrep, Bandit (Python), ShellCheck | DAST: Comandos inyectados manualmente
        const response = await fetch(`${API_BASE}/ping?host=${encodeURIComponent(hostname)}`);
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result show success';
            resultDiv.innerHTML = `
                <strong>🖥️ Resultado del Ping:</strong><br><br>
                <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto;">${data.output}</pre>
                ${data.executedCommand ? `<br><small><strong>Comando ejecutado:</strong> <code>${data.executedCommand}</code></small>` : ''}
            `;
        } else {
            resultDiv.className = 'result show error';
            resultDiv.innerHTML = `<strong>❌ Error:</strong> ${data.error}`;
        }
    } catch (error) {
        resultDiv.className = 'result show error';
        resultDiv.innerHTML = `<strong>❌ Error:</strong> ${error.message}`;
    }
});

// ============================================
// Utilidades (también vulnerables)
// ============================================

// [VULN-SENSITIVE-DATA]: Logging de información sensible en la consola
// [FIX]: No loguear información sensible, especialmente en producción
// [TOOL]: SAST: Code review manual, Semgrep custom rules
console.log('App initialized');
console.log('API Token:', HARDCODED_API_TOKEN);
console.log('Environment:', window.location.hostname);

// [VULN-XSS]: Función insegura para renderizar HTML
// Esta función es vulnerable a XSS y podría ser usada en más lugares del código
function unsafeRenderHTML(elementId, htmlContent) {
    document.getElementById(elementId).innerHTML = htmlContent;
}

// [VULN-PROTOTYPE-POLLUTION]: Uso de lodash vulnerable (si se importara)
// El package.json incluye lodash@4.17.15 que tiene CVE-2019-10744 y CVE-2020-8203
// [FIX]: Actualizar a lodash@4.17.21 o superior
// [TOOL]: SCA: npm audit, Snyk, OWASP Dependency-Check

// [VULN-INSECURE-RANDOMNESS]: Math.random() no es criptográficamente seguro
// [FIX]: Usar crypto.getRandomValues() para generación de tokens/IDs
// [TOOL]: SAST: Semgrep, SonarQube
function generateInsecureToken() {
    return Math.random().toString(36).substring(2);
}

// Event listener para debugging (expone información)
window.addEventListener('error', (e) => {
    console.error('Error details:', e); // [VULN]: Expone detalles de errores
});
