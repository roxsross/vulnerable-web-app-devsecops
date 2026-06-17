# 🔓 Vulnerable Web App - Proyecto Educativo DevSecOps

[![Tests](https://img.shields.io/badge/tests-25%20passing-brightgreen)](./test)
[![Coverage](https://img.shields.io/badge/coverage-see%20COVERAGE.md-blue)](./COVERAGE.md)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-8%20OWASP%20Top%2010-red)](./VULNERABILITIES.md)
[![Security](https://img.shields.io/badge/security-5%20tools%20integrated-success)](./security.md)
[![Pipeline](https://img.shields.io/badge/pipeline-DevSecOps-blueviolet)](./.github/workflows/main.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## 🔗 Acceso Rápido a Documentación

| 📖 Documento | 📝 Descripción |
|--------------|----------------|
| **[security.md](security.md)** | 🔐 **Documentación completa de seguridad** - Guía exhaustiva de todas las herramientas del pipeline (Betterleaks, CodeQL, Semgrep, Snyk, OWASP ZAP), configuraciones, recomendaciones y mejoras |
| **[main.yml](.github/workflows/main.yml)** | ⚙️ **Pipeline DevSecOps documentado** - Workflow de GitHub Actions con comentarios inline explicando cada job, herramienta y configuración |
| **[zap-to-sarif.py](.github/scripts/zap-to-sarif.py)** | 🔧 **Script conversor ZAP** - Convierte reportes JSON de OWASP ZAP a formato SARIF para GitHub Security |
| **[VULNERABILITIES.md](VULNERABILITIES.md)** | 🐛 **Catálogo de vulnerabilidades** - Detalle de las 8 vulnerabilidades OWASP Top 10 incluidas |
| **[COVERAGE.md](COVERAGE.md)** | 📊 **Reporte de coverage** - Explicación del coverage de tests |

⚠️ **ADVERTENCIA: Esta aplicación contiene vulnerabilidades INTENCIONALES con fines educativos.**

**NO USAR EN PRODUCCIÓN. NO EXPONER A INTERNET SIN SUPERVISIÓN.**

---

## 📑 Tabla de Contenidos

- [🔗 Acceso Rápido a Documentación](#-acceso-rápido-a-documentación)
- [📚 Propósito](#-propósito)
- [🎯 Vulnerabilidades Incluidas](#-vulnerabilidades-incluidas)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [🔍 Pipeline DevSecOps Automatizado](#-pipeline-devsecops-automatizado)
- [🚀 Deploy en Netlify](#-deploy-en-netlify)
- [💻 Desarrollo Local](#-desarrollo-local)
- [🧪 Testing de Vulnerabilidades](#-testing-de-vulnerabilidades)
- [📋 Actividades para la Clase](#-actividades-para-la-clase)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🎓 Recursos Adicionales](#-recursos-adicionales)

---

## 📚 Propósito

Esta aplicación vulnerable está diseñada para:
- Enseñar conceptos de seguridad en aplicaciones web
- Demostrar cómo las herramientas SAST/DAST/SCA detectan vulnerabilidades
- Practicar la explotación y remediación de vulnerabilidades comunes
- Entender el OWASP Top 10 en un contexto práctico

## 🎯 Vulnerabilidades Incluidas

Esta app contiene las siguientes vulnerabilidades del OWASP Top 10:

1. **SQL Injection** (simulada)
2. **Cross-Site Scripting (XSS)**
3. **Broken Authentication**
4. **Sensitive Data Exposure**
5. **Insecure Direct Object Reference (IDOR)**
6. **Security Misconfiguration**
7. **Vulnerable Dependencies**
8. **Command Injection** (simulada)

Ver `VULNERABILITIES.md` para detalles completos de cada vulnerabilidad.

## 🛠️ Stack Tecnológico

- **Frontend**: HTML + CSS + Vanilla JavaScript
- **Backend**: Node.js + Express (Netlify Functions)
- **Deploy**: Netlify
- **Base de datos**: Simulada en memoria (sin DB real)

## 🚀 Deploy en Netlify

### Opción 1: Deploy desde GitHub

1. **Subir el proyecto a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Vulnerable app para DevSecOps"
   git branch -M main
   git remote add origin <tu-repo-url>
   git push -u origin main
   ```

2. **Conectar con Netlify:**
   - Ve a https://app.netlify.com
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu repositorio de GitHub
   - Configuración automática (detecta netlify.toml)
   - Click en "Deploy site"

## 💻 Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar tests:**
   ```bash
   npm test
   ```
   Los tests verifican que todas las vulnerabilidades estén presentes y funcionales.

3. **Ejecutar tests con coverage:**
   ```bash
   npm run test:coverage
   ```
   Genera reporte de cobertura en `coverage/index.html`. Ver `COVERAGE.md` para más detalles.

4. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Abrir en el browser:**
   ```
   http://localhost:8888
   ```

## 🧪 Testing de Vulnerabilidades

### 1. SQL Injection (simulada)
```bash
# Inyectar comando SQL en el search
curl "http://localhost:8888/api/search?q=admin'+OR+'1'='1"
```

### 2. XSS
- En el formulario de búsqueda, ingresar: `<img src=x onerror=alert('XSS')>`
- El script se ejecutará sin sanitización

### 3. Broken Authentication
```bash
# Login con credenciales hardcodeadas
curl -X POST http://localhost:8888/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. IDOR
```bash
# Acceder a datos de otros usuarios sin validación
curl "http://localhost:8888/api/user?id=1"
curl "http://localhost:8888/api/user?id=2"
curl "http://localhost:8888/api/user?id=999"
```

### 5. Sensitive Data Exposure
- Revisar el código fuente (index.html) para ver API keys expuestas
- Revisar las responses de la API que exponen datos sensibles

## 🔍 Pipeline DevSecOps Automatizado

Este proyecto incluye un **pipeline completo de DevSecOps** configurado en GitHub Actions que ejecuta múltiples herramientas de análisis de seguridad automáticamente en cada push.

### 🛡️ Herramientas Integradas en el Pipeline

| Herramienta | Tipo | Propósito | Documentación |
|------------|------|-----------|---------------|
| **Betterleaks** | Secret Scan | Detecta credenciales hardcodeadas | [security.md](security.md#1-betterleaks---secret-scanning) |
| **CodeQL** | SAST | Análisis semántico profundo | [security.md](security.md#2-codeql---sast-static-application-security-testing) |
| **Semgrep** | SAST | Patrones de OWASP Top 10 | [security.md](security.md#3-semgrep---sast-avanzado) |
| **Snyk** | SCA | Dependencias vulnerables | [security.md](security.md#4-snyk---sca-software-composition-analysis) |
| **OWASP ZAP** | DAST | Testing dinámico post-deploy | [security.md](security.md#7-owasp-zap---dast-dynamic-application-security-testing) |

📖 **Ver documentación completa**: [security.md](security.md) - Guía exhaustiva de todas las herramientas, configuraciones y recomendaciones.

### 🔄 Flujo del Pipeline

```
1. Secret Scan (Betterleaks)
   ↓
2. Tests Unitarios + Coverage
   ↓
3. Análisis Paralelo:
   ├─ SAST (CodeQL)
   ├─ SAST (Semgrep)
   └─ SCA (Snyk)
   ↓
4. Deploy a Netlify
   ↓
5. DAST (OWASP ZAP)
```

Ver configuración completa en [.github/workflows/main.yml](.github/workflows/main.yml)

### 🎯 Resultados de Seguridad

Todos los resultados se integran en **GitHub Security** (formato SARIF):
- 🔍 Ver en: `Security → Code scanning alerts`
- 📊 Reportes organizados por categoría (betterleaks, codeql, semgrep, snyk-sca, owasp-zap)
- 📥 Artifacts descargables: Reportes HTML de ZAP (30 días de retención)

### 🔧 Herramientas Locales (Desarrollo)

Para ejecutar las herramientas localmente antes de hacer push:

#### SAST (Static Application Security Testing)
```bash
# Semgrep (incluido en el pipeline)
docker run --rm -v "$(pwd):/src" semgrep/semgrep:latest \
  semgrep scan --config=p/owasp-top-ten --config=p/nodejs

# ESLint con plugin de seguridad
npm install eslint-plugin-security --save-dev
npx eslint .
```

#### SCA (Software Composition Analysis)
```bash
# npm audit (rápido)
npm audit

# Snyk (incluido en el pipeline - requiere token)
npm install -g snyk
snyk auth
snyk test

# Retire.js
retire --path .
```

#### DAST (Dynamic Application Security Testing)
```bash
# OWASP ZAP Baseline (mismo comando del pipeline)
docker run --rm -v "$(pwd):/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://localhost:8888

# Nikto
nikto -h http://localhost:8888
```

## 📋 Actividades para la Clase

### Módulo 1: Reconocimiento de Vulnerabilidades
1. **Identificar vulnerabilidades** en el código manualmente
2. **Revisar resultados del pipeline** en GitHub Security tab
3. **Comparar hallazgos** entre diferentes herramientas (CodeQL vs Semgrep vs ZAP)

### Módulo 2: Explotación
1. **Explotar cada vulnerabilidad** usando los ejemplos de la sección "🧪 Testing de Vulnerabilidades"
2. **Documentar el impacto** de cada vulnerabilidad explotada
3. **Capturar evidencia** (screenshots, payloads, responses)

### Módulo 3: Análisis del Pipeline DevSecOps
1. **Estudiar el pipeline** completo en [.github/workflows/main.yml](.github/workflows/main.yml)
2. **Revisar security.md** para entender qué detecta cada herramienta
3. **Analizar reportes SARIF** en GitHub Security
4. **Descargar artifacts** de OWASP ZAP y revisar el HTML report

### Módulo 4: Remediación
1. **Corregir vulnerabilidades** siguiendo los comentarios `[FIX]` en el código
2. **Implementar controles** de seguridad apropiados
3. **Agregar headers de seguridad** en `netlify.toml` (ver [security.md](security.md#6-deployment-a-netlify))
4. **Actualizar dependencias** vulnerables detectadas por Snyk

### Módulo 5: Verificación
1. **Hacer push** de las correcciones y esperar que el pipeline se ejecute
2. **Verificar que los escaneos** no reporten las vulnerabilidades corregidas
3. **Confirmar que los tests** siguen pasando
4. **Validar manualmente** que las vulnerabilidades ya no son explotables

### 🎓 Ejercicios Avanzados
- **Optimizar el pipeline**: Implementar las mejoras sugeridas en [security.md](security.md#mejoras-futuras-recomendadas)
- **Agregar reglas custom**: Crear `.semgrep.yml` con reglas específicas del proyecto
- **Configurar staging**: Implementar environment de staging y ejecutar DAST antes de producción
- **Branch protection**: Configurar reglas de protección según [security.md](security.md#configuración-de-branch-protection)

## 📁 Estructura del Proyecto

```
vulnerable-web-app-devsecops/
├── README.md                    ← Este archivo
├── security.md                  ← 📘 DOCUMENTACIÓN DE SEGURIDAD (NUEVO)
├── VULNERABILITIES.md           ← Catálogo de vulnerabilidades
├── COVERAGE.md                  ← Explicación del coverage
├── CI-CD.md                     ← Documentación del pipeline
├── CLAUDE.md                    ← Guía para Claude Code
├── netlify.toml                 ← Configuración de Netlify
├── package.json                 ← Dependencias (incluyendo vulnerables)
├── .env.example                 ← Variables de entorno de ejemplo
├── .gitignore                   ← Archivos a ignorar
├── .github/
│   ├── workflows/
│   │   └── main.yml            ← 🔐 Pipeline DevSecOps (DOCUMENTADO)
│   └── scripts/
│       └── zap-to-sarif.py     ← 🔧 Conversor ZAP → SARIF (DOCUMENTADO)
├── public/
│   ├── index.html              ← Frontend con formularios vulnerables
│   ├── style.css               ← Estilos
│   └── app.js                  ← Lógica frontend con XSS
├── netlify/
│   └── functions/
│       ├── auth.js             ← Login vulnerable
│       ├── search.js           ← SQL Injection simulada
│       ├── user.js             ← IDOR vulnerable
│       └── ping.js             ← Command Injection
└── test/
    ├── runner.js               ← Test runner custom
    ├── vulnerabilities.test.js ← Tests de vulnerabilidades
    └── structure.test.js       ← Tests de estructura
```

### 📚 Archivos de Documentación

| Archivo | Descripción |
|---------|-------------|
| **[security.md](security.md)** | 🔐 **Documentación completa de seguridad**: Detalla cada herramienta del pipeline, qué detecta, configuraciones, recomendaciones y mejores prácticas |
| **[.github/workflows/main.yml](.github/workflows/main.yml)** | Pipeline DevSecOps con comentarios inline explicando cada job, herramienta y configuración |
| **[.github/scripts/zap-to-sarif.py](.github/scripts/zap-to-sarif.py)** | Script documentado que convierte reportes de ZAP a formato SARIF para GitHub Security |

## 🎓 Recursos Adicionales

### 📖 Documentación del Proyecto
- **[security.md](security.md)** - 📘 Guía completa de seguridad del pipeline DevSecOps
- **[.github/workflows/main.yml](.github/workflows/main.yml)** - Pipeline con documentación inline
- **[VULNERABILITIES.md](VULNERABILITIES.md)** - Catálogo de vulnerabilidades
- **[COVERAGE.md](COVERAGE.md)** - Explicación del coverage

### 🔗 Referencias Externas
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)

### 🛠️ Herramientas Documentadas
- [GitHub CodeQL](https://codeql.github.com/docs/)
- [Semgrep Rules](https://semgrep.dev/explore)
- [Snyk Vulnerability Database](https://security.snyk.io/)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/)
- [Betterleaks Documentation](https://betterleaks.io)

### 📊 GitHub Security
Una vez que hagas push a GitHub, podrás ver los resultados de seguridad en:
- `Security → Code scanning alerts` - Ver hallazgos de todas las herramientas
- `Actions → Workflows` - Revisar ejecuciones del pipeline
- `Actions → Artifacts` - Descargar reportes HTML de OWASP ZAP

## 📧 Contacto

Para preguntas sobre este material educativo, contactar al instructor del curso.

---

**Versión**: 2.0.0  
**Última actualización**: Junio 2026  
**Curso**: DevSecOps - Seguridad en Pipelines CI/CD  
**ekoparty University**

## 🏆 Cambios en v2.0.0

✨ **Nueva documentación completa de seguridad**:
- Agregado [security.md](security.md) con guía exhaustiva de todas las herramientas
- Pipeline [main.yml](.github/workflows/main.yml) completamente documentado
- Script [zap-to-sarif.py](.github/scripts/zap-to-sarif.py) con explicaciones detalladas
- README actualizado con referencias cruzadas a la documentación
- Tabla de herramientas del pipeline con enlaces directos
- Actividades de clase reorganizadas en 5 módulos
- Sección de ejercicios avanzados agregada
