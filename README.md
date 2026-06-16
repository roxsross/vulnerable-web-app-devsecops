# 🔓 Vulnerable Web App - Proyecto Educativo DevSecOps

[![Tests](https://img.shields.io/badge/tests-25%20passing-brightgreen)](./test)
[![Coverage](https://img.shields.io/badge/coverage-see%20COVERAGE.md-blue)](./COVERAGE.md)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-8%20OWASP%20Top%2010-red)](./VULNERABILITIES.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

⚠️ **ADVERTENCIA: Esta aplicación contiene vulnerabilidades INTENCIONALES con fines educativos.**

**NO USAR EN PRODUCCIÓN. NO EXPONER A INTERNET SIN SUPERVISIÓN.**

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

## 🔍 Herramientas de Análisis Recomendadas

### SAST (Static Application Security Testing)
```bash
# Semgrep
semgrep --config=auto .

# ESLint con plugin de seguridad
npm install eslint-plugin-security --save-dev
npx eslint .
```

### SCA (Software Composition Analysis)
```bash
# npm audit
npm audit

# Retire.js
retire --path .

# Snyk
npm install -g snyk
snyk test
```

### DAST (Dynamic Application Security Testing)
```bash
# OWASP ZAP
# 1. Instalar OWASP ZAP
# 2. Configurar proxy en 127.0.0.1:8080
# 3. Navegar la aplicación
# 4. Ejecutar Active Scan

# Nikto
nikto -h http://localhost:8888
```

## 📋 Actividades para la Clase

1. **Reconocimiento**: Identificar todas las vulnerabilidades en el código
2. **Explotación**: Explotar cada vulnerabilidad manualmente
3. **Detección**: Ejecutar herramientas SAST/DAST/SCA y analizar reportes
4. **Remediación**: Corregir cada vulnerabilidad siguiendo los comentarios [FIX]
5. **Verificación**: Re-ejecutar las herramientas para confirmar las correcciones

## 📁 Estructura del Proyecto

```
vulnerable-app/
├── README.md                    ← Este archivo
├── VULNERABILITIES.md           ← Catálogo de vulnerabilidades
├── COVERAGE.md                  ← Explicación del coverage
├── CI-CD.md                     ← Documentación del pipeline
├── CLAUDE.md                    ← Guía para Claude Code
├── netlify.toml                 ← Configuración de Netlify
├── package.json                 ← Dependencias (incluyendo vulnerables)
├── .env.example                 ← Variables de entorno de ejemplo
├── .gitignore                   ← Archivos a ignorar
├── .github/
│   └── workflows/
│       └── ci-cd.yml           ← Pipeline DevSecOps completo
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

## 🎓 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)


## 📧 Contacto

Para preguntas sobre este material educativo, contactar al instructor del curso.

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026  
**Curso**: DevSecOps - Seguridad en Pipelines CI/CD  
**ekoparty University**
