#!/usr/bin/env node

/**
 * Test Runner Simple para Aplicación Vulnerable
 *
 * Este test runner NO usa Jest ni Mocha para mantener la simplicidad.
 * Los tests verifican que las vulnerabilidades funcionan correctamente.
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Estadísticas de tests
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

// Tests que fallaron
const failures = [];

/**
 * Función de assertion simple
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

/**
 * Ejecutar un test individual
 */
async function runTest(name, testFn) {
    stats.total++;
    process.stdout.write(`  ${name} ... `);

    try {
        await testFn(assert);
        console.log(`${colors.green}✓ PASS${colors.reset}`);
        stats.passed++;
    } catch (error) {
        console.log(`${colors.red}✗ FAIL${colors.reset}`);
        stats.failed++;
        failures.push({ name, error: error.message, stack: error.stack });
    }
}

/**
 * Suite de tests
 */
function describe(suiteName, tests) {
    console.log(`\n${colors.bold}${colors.blue}${suiteName}${colors.reset}`);
    return tests;
}

/**
 * Test individual
 */
function it(testName, testFn) {
    return { name: testName, fn: testFn };
}

/**
 * Cargar y ejecutar todos los archivos de test
 */
async function runAllTests() {
    console.log(`${colors.bold}${colors.blue}================================${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}  Vulnerable App - Test Suite  ${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}================================${colors.reset}\n`);
    console.log(`${colors.yellow}⚠️  Estos tests verifican que las vulnerabilidades funcionan${colors.reset}`);

    const testDir = __dirname;
    const testFiles = fs.readdirSync(testDir)
        .filter(file => file.endsWith('.test.js'))
        .sort();

    if (testFiles.length === 0) {
        console.log(`\n${colors.yellow}No se encontraron archivos de test${colors.reset}`);
        return;
    }

    const startTime = Date.now();

    for (const file of testFiles) {
        const testPath = path.join(testDir, file);

        try {
            // Cargar el módulo de test
            const testModule = require(testPath);

            // Ejecutar la función de test del módulo
            if (typeof testModule === 'function') {
                await testModule({ describe, it, runTest, assert });
            }
        } catch (error) {
            console.log(`\n${colors.red}Error cargando ${file}:${colors.reset}`);
            console.log(error.message);
        }
    }

    const duration = Date.now() - startTime;

    // Resumen
    console.log(`\n${colors.bold}================================${colors.reset}`);
    console.log(`${colors.bold}Test Summary${colors.reset}`);
    console.log(`${colors.bold}================================${colors.reset}`);
    console.log(`Total:   ${stats.total}`);
    console.log(`${colors.green}Passed:  ${stats.passed}${colors.reset}`);
    console.log(`${colors.red}Failed:  ${stats.failed}${colors.reset}`);
    console.log(`Duration: ${duration}ms\n`);

    // Mostrar fallos detallados
    if (failures.length > 0) {
        console.log(`${colors.bold}${colors.red}Failed Tests:${colors.reset}\n`);
        failures.forEach(({ name, error, stack }) => {
            console.log(`${colors.red}✗ ${name}${colors.reset}`);
            console.log(`  ${error}`);
            if (process.env.VERBOSE) {
                console.log(`  ${stack}\n`);
            }
        });
    }

    // Exit code
    if (stats.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

// Ejecutar tests
if (require.main === module) {
    runAllTests().catch(error => {
        console.error(`${colors.red}Fatal error:${colors.reset}`, error);
        process.exit(1);
    });
}

module.exports = { describe, it, runTest, assert };
