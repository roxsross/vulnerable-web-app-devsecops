# Tests - Aplicación Vulnerable

## ⚠️ Atención

Estos tests son **únicos** porque verifican que las **vulnerabilidades EXISTAN**.

En una aplicación normal, estos tests deberían **FALLAR** si hay vulnerabilidades.
En esta aplicación educativa, estos tests deben **PASAR** para confirmar que las vulnerabilidades están presentes.

## 🎯 Propósito

Los tests verifican:

1. ✅ Que las vulnerabilidades estén implementadas correctamente
2. ✅ Que el código vulnerable sea funcional
3. ✅ Que la documentación esté completa
4. ✅ Que la estructura del proyecto sea correcta

## 🚀 Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con coverage (genera reporte HTML)
npm run test:coverage

# Ver reporte de coverage en el browser
npm run coverage

# Ejecutar con output detallado
VERBOSE=1 npm test

# Ejecutar en modo watch (requiere nodemon)
npm run test:watch
```

### 📊 Coverage

El coverage es **0% por diseño** - estos tests realizan análisis estático (leen archivos) en lugar de ejecutar código. Ver `../COVERAGE.md` para más detalles sobre por qué esto es correcto para este proyecto educativo.

## 📝 Archivos de Test

### `runner.js`
Test runner simple sin dependencias externas (no usa Jest/Mocha).

### `vulnerabilities.test.js`
Verifica que cada vulnerabilidad OWASP Top 10 esté presente:
- 🔴 SQL Injection
- 🔴 XSS (Cross-Site Scripting)
- 🔴 Broken Authentication
- 🔴 Sensitive Data Exposure
- 🔴 IDOR (Insecure Direct Object Reference)
- 🟠 Security Misconfiguration
- 🟠 Vulnerable Dependencies
- 🔴 Command Injection

### `structure.test.js`
Verifica la estructura del proyecto:
- Archivos de configuración
- Archivos del frontend
- Funciones serverless
- Documentación

## 📊 Interpretación de Resultados

### ✅ Tests Pasados = Bueno
Significa que las vulnerabilidades están presentes y funcionales para la clase.

### ❌ Tests Fallidos = Problema
Significa que falta alguna vulnerabilidad o la implementación no es correcta.

## 🔧 Agregar Nuevos Tests

Para agregar un nuevo test, crear un archivo `*.test.js`:

```javascript
module.exports = async ({ describe, it, runTest }) => {
    describe('Mi Suite de Tests', [
        it('debe verificar algo', async (assert) => {
            assert(true, 'Este test siempre pasa');
        })
    ]);

    // Ejecutar los tests
    for (const suite of [...]) {
        const tests = suite[1];
        for (const test of tests) {
            await runTest(test.name, test.fn);
        }
    }
};
```

## 🎓 Para Instructores

Estos tests pueden usarse para:

1. **Validar el setup inicial** antes de la clase
2. **Verificar que las correcciones rompan los tests** (los alumnos deben hacer que fallen)
3. **CI/CD** para asegurar que el repo educativo esté completo

## 🔄 Inversión de Tests (Ejercicio para Alumnos)

Como ejercicio, los alumnos pueden:

1. Corregir las vulnerabilidades
2. Ver cómo los tests **comienzan a fallar**
3. Invertir los tests para que verifiquen **ausencia** de vulnerabilidades
4. Ver cómo los tests **vuelven a pasar** con código seguro

Esto demuestra el concepto de **Test-Driven Security**.

## 📚 Referencias

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Security Testing Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Abuse_Case_Cheat_Sheet.html)
