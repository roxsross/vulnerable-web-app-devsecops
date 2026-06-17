# Documentación de Seguridad - Pipeline DevSecOps

## Índice
- [Descripción General](#descripción-general)
- [Arquitectura del Pipeline](#arquitectura-del-pipeline)
- [Herramientas de Seguridad](#herramientas-de-seguridad)
- [Configuración y Recomendaciones](#configuración-y-recomendaciones)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Gestión de Secretos](#gestión-de-secretos)
- [Reportes y Artefactos](#reportes-y-artefactos)

---

## Descripción General

Este proyecto implementa un pipeline completo de **DevSecOps** en GitHub Actions que integra múltiples herramientas de análisis de seguridad a lo largo del ciclo de vida del desarrollo de software (SDLC). El pipeline está configurado en `.github/workflows/main.yml` y se ejecuta automáticamente en cada push a la rama `master`.

### Filosofía de Seguridad

- **Shift Left Security**: Las pruebas de seguridad se realizan lo más temprano posible en el ciclo de desarrollo.
- **Múltiples Capas de Defensa**: Combinación de diferentes herramientas para detectar diferentes tipos de vulnerabilidades.
- **Integración Continua**: Todos los escaneos se ejecutan automáticamente en cada commit.
- **Reporte Centralizado**: Los resultados se integran en GitHub Security (formato SARIF).

---

## Arquitectura del Pipeline

El pipeline está organizado en **7 jobs principales** que se ejecutan en el siguiente orden:

```
secret-scan (Betterleaks)
    ↓
test (Node.js Tests + Coverage)
    ↓
┌───────────────┬─────────────────┬──────────────┐
│  sast-codeql  │  sast-semgrep   │  sca-snyk    │
└───────────────┴─────────────────┴──────────────┘
    ↓
DeploytoNetlify
    ↓
Dast (OWASP ZAP)
```

---

## Herramientas de Seguridad

### 1. **Betterleaks** - Secret Scanning

#### ¿Qué hace?
Escanea el repositorio Git en busca de **credenciales, tokens, API keys y secretos hardcodeados** en el código fuente, incluyendo el historial completo de Git.

#### Configuración Actual
```yaml
job: secret-scan
tool: ghcr.io/betterleaks/betterleaks:latest
formato: SARIF
exit-code: 0 (no bloquea el pipeline)
```

#### ¿Qué detecta?
- API keys (AWS, Google Cloud, Azure, etc.)
- Tokens de autenticación (GitHub, GitLab, Slack, etc.)
- Credenciales de bases de datos
- Contraseñas en texto plano
- Certificados y claves privadas
- Patrones personalizados de secretos

#### Recomendaciones
✅ **Qué hacer:**
- Revisar y remediar TODOS los secretos detectados inmediatamente
- Rotar inmediatamente cualquier credencial expuesta
- Usar GitHub Secrets o variables de entorno para credenciales
- Agregar archivos sensibles a `.gitignore`
- Considerar usar herramientas como `git-filter-repo` para limpiar el historial si hay secretos antiguos

⚠️ **Qué tomar en cuenta:**
- Este escaneo analiza TODO el historial de Git, no solo el último commit
- Los secretos en commits antiguos siguen siendo válidos hasta que se roten
- El `exit-code: 0` permite que el pipeline continúe incluso si encuentra secretos (evaluar cambiar a `1` para bloquear)

❌ **Qué evitar:**
- Commitear archivos `.env` o similares
- Hardcodear credenciales "temporales" (nunca son temporales)
- Usar contraseñas débiles o de ejemplo en producción

---

### 2. **CodeQL** - SAST (Static Application Security Testing)

#### ¿Qué hace?
Realiza **análisis estático de código** para detectar vulnerabilidades de seguridad mediante análisis semántico profundo del código fuente.

#### Configuración Actual
```yaml
job: sast-codeql
tool: github/codeql-action
lenguajes: javascript-typescript
build-mode: none (no requiere compilación)
```

#### ¿Qué detecta?
- **Inyecciones SQL** (SQL Injection)
- **Cross-Site Scripting (XSS)**
- **Path Traversal**
- **Command Injection**
- **Uso inseguro de APIs**
- **Vulnerabilidades de deserialización**
- **Race conditions**
- **Uso de funciones deprecadas o inseguras**

#### Recomendaciones
✅ **Qué hacer:**
- Revisar y priorizar los hallazgos por severidad (Critical > High > Medium)
- Implementar las correcciones sugeridas por CodeQL
- Agregar queries personalizadas para patrones específicos del proyecto
- Configurar Code Scanning alerts en GitHub

⚠️ **Qué tomar en cuenta:**
- CodeQL es excelente para encontrar patrones complejos de vulnerabilidades
- Puede generar falsos positivos; validar cada hallazgo
- Es una herramienta gratuita para repositorios públicos
- El análisis puede tardar varios minutos en proyectos grandes

🔧 **Mejoras sugeridas:**
```yaml
# Agregar configuración de queries personalizadas
- name: Initialize CodeQL
  uses: github/codeql-action/init@v4
  with:
    languages: javascript-typescript
    queries: security-extended  # Agrega queries adicionales
    config-file: ./.github/codeql-config.yml
```

---

### 3. **Semgrep** - SAST Avanzado

#### ¿Qué hace?
Realiza **análisis estático de código** basado en patrones para detectar vulnerabilidades de seguridad, bugs y anti-patrones.

#### Configuración Actual
```yaml
job: sast-semgrep
tool: semgrep/semgrep:latest
configuraciones:
  - p/security-audit (auditoría general de seguridad)
  - p/nodejs (patrones específicos de Node.js)
  - p/owasp-top-ten (OWASP Top 10)
  - p/javascript
  - p/typescript
  - p/expressjs (específico para Express.js)
```

#### ¿Qué detecta?
- **OWASP Top 10** completo
- **Uso inseguro de dependencias**
- **Hardcoded secrets** (complementa a Betterleaks)
- **Configuraciones inseguras**
- **Patrones de código vulnerable**
- **Bugs de seguridad en frameworks (Express, React, etc.)**
- **Inyecciones (SQL, NoSQL, Command, LDAP, etc.)**
- **Validación insuficiente de inputs**

#### Recomendaciones
✅ **Qué hacer:**
- Priorizar remediación de hallazgos de `p/owasp-top-ten`
- Revisar las reglas específicas de Express.js para tu API
- Considerar agregar reglas personalizadas (`.semgrep.yml`)
- Integrar Semgrep en tu IDE para feedback en tiempo real

⚠️ **Qué tomar en cuenta:**
- Semgrep es más rápido que CodeQL pero puede ser menos preciso
- La combinación de múltiples rulesets puede generar duplicados
- Excelente para detectar patrones específicos del framework

🔧 **Mejoras sugeridas:**
```yaml
# Agregar reglas personalizadas
--config=/src/.semgrep/custom-rules.yml
# Excluir archivos de prueba si generan ruido
--exclude='**/*.test.js' --exclude='**/*.spec.ts'
```

❌ **Qué evitar:**
- No ignorar warnings sin revisión previa
- No desactivar reglas sin documentar el motivo

---

### 4. **Snyk** - SCA (Software Composition Analysis)

#### ¿Qué hace?
Analiza las **dependencias del proyecto** (paquetes npm) en busca de vulnerabilidades conocidas (CVEs).

#### Configuración Actual
```yaml
job: sca-snyk
tool: snyk/actions/node@master
threshold: high (solo bloquea vulnerabilidades High/Critical)
formato: SARIF
continue-on-error: true
```

#### ¿Qué detecta?
- **CVEs conocidos** en dependencias directas e indirectas
- **Vulnerabilidades de licencias**
- **Dependencias obsoletas**
- **Parches de seguridad disponibles**
- **Malware en dependencias**

#### Recomendaciones
✅ **Qué hacer:**
- Revisar y actualizar dependencias vulnerables regularmente
- Usar `npm audit fix` para parches automáticos cuando sea posible
- Configurar políticas de Snyk para ignorar falsos positivos justificados
- Monitorear el dashboard de Snyk para nuevas vulnerabilidades
- Considerar habilitar Snyk PR checks para prevenir nuevas vulnerabilidades

⚠️ **Qué tomar en cuenta:**
- Requiere token de API (`SNYK_TOKEN` en GitHub Secrets)
- El `continue-on-error: true` permite deployments con vulnerabilidades
- Algunas vulnerabilidades pueden no tener fix disponible
- La actualización de dependencias puede introducir breaking changes

🔧 **Mejoras sugeridas:**
```yaml
# Bajar el threshold para ser más estricto
args: >
  --severity-threshold=medium  # En lugar de high
  --fail-on=all
```

❌ **Qué evitar:**
- No postponer actualizaciones de seguridad críticas
- No usar `npm audit fix --force` sin revisar los cambios
- No ignorar vulnerabilidades sin justificación documentada

---

### 5. **Tests Unitarios y Coverage**

#### ¿Qué hace?
Ejecuta las **pruebas unitarias** del proyecto y genera reportes de **cobertura de código**.

#### Configuración Actual
```yaml
job: test
commands:
  - npm ci (instalación limpia de dependencias)
  - npm run test (ejecuta tests)
  - npm run test:coverage (genera cobertura)
continue-on-error: true
```

#### Recomendaciones
✅ **Qué hacer:**
- Mantener cobertura mínima del 80% (configurar umbral)
- Escribir tests para funciones críticas de seguridad
- Incluir tests de casos edge y negativos
- Revisar por qué fallan los tests antes de mergear

⚠️ **Qué tomar en cuenta:**
- El `continue-on-error: true` permite que el pipeline continúe si fallan tests
- Los tests que pasan NO garantizan ausencia de vulnerabilidades

🔧 **Mejoras sugeridas:**
```yaml
# Bloquear el pipeline si los tests fallan
- name: Run test
  run: npm run test
  # Remover continue-on-error para deployments

# Agregar verificación de umbral de cobertura
- name: Coverage threshold check
  run: |
    coverage=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    if (( $(echo "$coverage < 80" | bc -l) )); then
      echo "Coverage $coverage% is below 80% threshold"
      exit 1
    fi
```

---

### 6. **Deployment a Netlify**

#### ¿Qué hace?
Despliega la aplicación a **Netlify** en el ambiente de producción.

#### Configuración Actual
```yaml
job: DeploytoNetlify
environment: production
url: https://eclectic-sprinkles-185299.netlify.app
publish-dir: ./public
```

#### Recomendaciones
✅ **Qué hacer:**
- Configurar entornos de staging y production separados
- Usar Netlify Deploy Previews para PRs
- Configurar headers de seguridad en `netlify.toml`
- Habilitar HTTPS y HSTS

⚠️ **Qué tomar en cuenta:**
- El deployment solo ocurre si TODOS los jobs anteriores tienen éxito
- Requiere tokens: `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID`

🔧 **Mejoras sugeridas:**
Crear un archivo `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
```

---

### 7. **OWASP ZAP** - DAST (Dynamic Application Security Testing)

#### ¿Qué hace?
Realiza **análisis dinámico de seguridad** atacando la aplicación desplegada como lo haría un pentester automático.

#### Configuración Actual
```yaml
job: Dast
tool: ghcr.io/zaproxy/zaproxy:stable
scan-type: zap-baseline.py (escaneo básico no intrusivo)
target: ${{ secrets.NETLIFY_SITE_URL }}
reportes: HTML, JSON, XML, SARIF
```

#### ¿Qué detecta?
- **Vulnerabilidades en tiempo de ejecución**
- **Configuraciones inseguras del servidor**
- **Headers de seguridad faltantes**
- **XSS reflejado y DOM-based**
- **SQL Injection activo**
- **Exposición de información sensible**
- **Cookies inseguras**
- **Vulnerabilidades de autenticación/autorización**
- **CSRF vulnerabilities**
- **Clickjacking**

#### Scripts de Soporte

##### `zap-to-sarif.py`
Script Python que convierte los reportes JSON de ZAP al formato SARIF para integración con GitHub Security.

**Funcionalidades:**
- Parsea el JSON de ZAP y extrae alertas
- Mapea niveles de severidad (High/Critical → error, Medium → warning, Low → note)
- Extrae URLs de referencia para cada vulnerabilidad
- Convierte URLs absolutas a paths relativos
- Genera SARIF 2.1.0 compatible con GitHub

#### Recomendaciones
✅ **Qué hacer:**
- Revisar TODOS los reportes HTML generados (artifacts de 30 días)
- Priorizar remediación de High/Critical antes de deploy
- Considerar usar `zap-full-scan.py` en pipelines nocturnos
- Implementar autenticación en ZAP para escanear rutas protegidas
- Configurar ZAP context para mejorar precisión

⚠️ **Qué tomar en cuenta:**
- ZAP Baseline es NO intrusivo (no intenta exploits)
- El escaneo se realiza DESPUÉS del deploy (vulnerabilidades ya están en producción)
- El `continue-on-error: true` permite que el pipeline complete incluso con hallazgos críticos
- ZAP puede generar tráfico considerable hacia la aplicación

🔧 **Mejoras sugeridas:**

1. **Agregar autenticación para rutas protegidas:**
```yaml
- name: Run OWASP ZAP Full Scan
  run: |
    docker run --rm \
      -v "$(pwd):/zap/wrk:rw" \
      ghcr.io/zaproxy/zaproxy:stable \
      zap-full-scan.py \
      -t "${{ secrets.NETLIFY_SITE_URL }}" \
      -z "-config api.key=${{ secrets.ZAP_API_KEY }}" \
      -r zap-report.html
```

2. **Agregar configuración ZAP personalizada:**
Crear `.github/zap/zap-config.conf`:
```
# Excluir endpoints externos
-config globalexcludeurl.url_list.url(0).regex=true
-config globalexcludeurl.url_list.url(0).url=https://.*google.com.*
```

3. **Ejecutar escaneo completo en entorno de staging primero:**
```yaml
# Agregar job intermedio
Dast-Staging:
  runs-on: ubuntu-latest
  needs: [test, sast-codeql, sast-semgrep, sca-snyk]
  steps:
    # Escanear staging antes de producción
```

❌ **Qué evitar:**
- No ejecutar `zap-full-scan.py` contra producción sin autorización
- No ignorar warnings de ZAP sin análisis
- No escanear aplicaciones de terceros sin permiso

---

## Configuración y Recomendaciones

### Secretos Requeridos (GitHub Secrets)

```bash
# Snyk
SNYK_TOKEN           # Token de API de Snyk (obtener en snyk.io)

# Netlify
NETLIFY_AUTH_TOKEN   # Token de autenticación de Netlify
NETLIFY_SITE_ID      # ID del sitio en Netlify
NETLIFY_SITE_URL     # URL del sitio desplegado (para DAST)

# GitHub (auto-generado)
GITHUB_TOKEN         # Token automático de GitHub Actions
```

### Permisos Requeridos

Los jobs requieren los siguientes permisos de GitHub Actions:

```yaml
permissions:
  actions: read              # Leer estado de workflows
  contents: read            # Leer código del repositorio
  security-events: write    # Escribir en Security tab (SARIF)
  pull-requests: write      # Comentar en PRs (Snyk, Netlify)
```

### Configuración de Branch Protection

Recomendaciones para configurar protecciones en GitHub:

```
Settings → Branches → Branch protection rules (master):
✅ Require status checks to pass before merging
  ✅ secret-scan
  ✅ test
  ✅ sast-codeql
  ✅ sast-semgrep
  ✅ sca-snyk
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Do not allow bypassing the above settings
```

---

## Flujo de Trabajo

### 1. Developer Push

```
git push origin master
    ↓
GitHub Actions triggered
```

### 2. Security Gates

```
[Gate 1] Secret Scan
    ↓ PASS
[Gate 2] Tests
    ↓ PASS
[Gate 3] SAST + SCA (parallel)
    ↓ ALL PASS
```

### 3. Deployment

```
Deploy to Netlify
    ↓
[Gate 4] DAST (post-deploy verification)
```

### 4. Artifacts y Reportes

Todos los reportes se suben a:
- **GitHub Security Tab** (SARIF format)
- **GitHub Actions Artifacts** (HTML, JSON, XML reports - 30 días)

---

## Gestión de Secretos

### ¿Dónde NO almacenar secretos?

❌ Código fuente (JavaScript, TypeScript, etc.)
❌ Archivos de configuración commiteados (`.env`, `config.json`)
❌ Comentarios en el código
❌ Variables hardcodeadas
❌ Scripts de base de datos
❌ Logs o mensajes de error

### ¿Dónde SÍ almacenar secretos?

✅ **GitHub Secrets** (Settings → Secrets and variables → Actions)
✅ **Variables de entorno** en el servidor
✅ **Servicios de gestión de secretos** (AWS Secrets Manager, HashiCorp Vault, etc.)
✅ **Archivos `.env`** locales (incluidos en `.gitignore`)

### Mejores Prácticas

1. **Rotación de Secretos**
   - Rotar credenciales cada 90 días
   - Rotar inmediatamente si se exponen
   - Usar diferentes credenciales para cada entorno

2. **Principio de Menor Privilegio**
   - Dar solo los permisos mínimos necesarios
   - Usar service accounts en lugar de cuentas personales
   - Separar credenciales por servicio

3. **Auditoría**
   - Registrar acceso a secretos
   - Monitorear uso anómalo
   - Revocar acceso cuando ya no es necesario

---

## Reportes y Artefactos

### GitHub Security Tab

Todos los escaneos suben resultados en formato SARIF a GitHub Security:

- **Betterleaks** → `betterleaks` category
- **CodeQL** → `/language:javascript-typescript` category
- **Semgrep** → `semgrep` category
- **Snyk** → `snyk-sca` category
- **OWASP ZAP** → `owasp-zap` category

**Cómo acceder:**
```
Repository → Security → Code scanning alerts
```

### Artifacts de GitHub Actions

El job DAST genera artifacts descargables:

```
Artifacts (30 días de retención):
  - zap-report.html     # Reporte visual detallado
  - zap-report.json     # Datos estructurados
  - zap-report.xml      # Formato compatible con herramientas
  - zap-results.sarif   # Formato para GitHub Security
```

**Cómo descargar:**
```
Actions → Workflow run → Artifacts section
```

---

## Matriz de Herramientas vs Vulnerabilidades

| Vulnerabilidad | Betterleaks | CodeQL | Semgrep | Snyk | ZAP |
|---------------|:-----------:|:------:|:-------:|:----:|:---:|
| Secrets Hardcoded | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| SQL Injection | ❌ | ✅ | ✅ | ❌ | ✅ |
| XSS | ❌ | ✅ | ✅ | ❌ | ✅ |
| Dependencias Vulnerables | ❌ | ❌ | ❌ | ✅ | ❌ |
| Command Injection | ❌ | ✅ | ✅ | ❌ | ✅ |
| Path Traversal | ❌ | ✅ | ✅ | ❌ | ✅ |
| CSRF | ❌ | ⚠️ | ✅ | ❌ | ✅ |
| Configuración Insegura | ❌ | ⚠️ | ✅ | ❌ | ✅ |
| Headers de Seguridad | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cookies Inseguras | ❌ | ❌ | ❌ | ❌ | ✅ |

**Leyenda:**
- ✅ Detecta efectivamente
- ⚠️ Detecta parcialmente
- ❌ No detecta

---

## Checklist de Seguridad Pre-Deployment

Antes de hacer push a `master`, verificar:

- [ ] No hay credenciales hardcodeadas en el código
- [ ] Archivos `.env` están en `.gitignore`
- [ ] Todas las dependencias están actualizadas (`npm audit`)
- [ ] Los tests unitarios pasan localmente
- [ ] Se revisaron los warnings de linters de seguridad
- [ ] Las nuevas APIs validan y sanitizan inputs
- [ ] Se implementaron headers de seguridad apropiados
- [ ] Se documentaron decisiones de seguridad importantes

---

## Mejoras Futuras Recomendadas

### Prioridad Alta
1. **Cambiar `exit-code: 0` a `1`** en secret-scan para bloquear pipeline si se detectan secretos
2. **Remover `continue-on-error: true`** de los jobs de tests
3. **Configurar threshold más estricto** en Snyk (medium en lugar de high)
4. **Implementar escaneo DAST en staging** antes de producción

### Prioridad Media
5. **Agregar Dependency Review** de GitHub para PRs
6. **Configurar reglas personalizadas** de Semgrep para patrones específicos del proyecto
7. **Implementar escaneo de contenedores** si se usan Docker images
8. **Agregar autenticación a ZAP** para escanear rutas protegidas

### Prioridad Baja
9. **Configurar notificaciones** (Slack, email) para hallazgos críticos
10. **Implementar IAST** (Interactive Application Security Testing)
11. **Agregar fuzzing** para APIs críticas
12. **Implementar monitoreo de runtime** (RASP - Runtime Application Self-Protection)

---

## Recursos y Referencias

### Herramientas
- [Betterleaks Documentation](https://betterleaks.io)
- [GitHub CodeQL](https://codeql.github.com/docs/)
- [Semgrep Rules](https://semgrep.dev/explore)
- [Snyk Vulnerability Database](https://security.snyk.io/)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/)

### Estándares
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SARIF Format](https://sarifweb.azurewebsites.net/)

### Mejores Prácticas
- [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)

---


