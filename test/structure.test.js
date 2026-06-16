/**
 * Tests de Estructura del Proyecto
 *
 * Verifica que todos los archivos necesarios existan
 */

module.exports = async ({ describe, it, runTest }) => {
    const fs = require('fs');
    const path = require('path');

    await describe('📁 Estructura de Archivos');

    await runTest('debe tener todos los archivos de configuración', async (assert) => {
        const files = [
            'package.json',
            'netlify.toml',
            '.gitignore',
            '.env.example',
            'README.md',
            'VULNERABILITIES.md',
            'CLAUDE.md'
        ];

        for (const file of files) {
            const filePath = path.join(__dirname, '..', file);
            assert(
                fs.existsSync(filePath),
                `Debe existir ${file}`
            );
        }
    });

    await runTest('debe tener archivos del frontend', async (assert) => {
        const files = [
            'public/index.html',
            'public/style.css',
            'public/app.js'
        ];

        for (const file of files) {
            const filePath = path.join(__dirname, '..', file);
            assert(
                fs.existsSync(filePath),
                `Debe existir ${file}`
            );
        }
    });

    await runTest('debe tener funciones de Netlify vulnerables', async (assert) => {
        const functions = [
            'netlify/functions/auth.js',
            'netlify/functions/search.js',
            'netlify/functions/user.js'
        ];

        for (const func of functions) {
            const funcPath = path.join(__dirname, '..', func);
            assert(
                fs.existsSync(funcPath),
                `Debe existir ${func}`
            );
        }
    });

    await describe('📄 Contenido de Documentación');

    await runTest('README.md debe contener advertencias de seguridad', async (assert) => {
        const readmePath = path.join(__dirname, '../README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');

        assert(
            content.includes('ADVERTENCIA') || content.includes('WARNING'),
            'README debe contener advertencia'
        );
        assert(
            content.includes('vulnerable') || content.includes('educativo'),
            'README debe mencionar que es educativo'
        );
        assert(
            content.includes('OWASP'),
            'README debe mencionar OWASP'
        );
    });

    await runTest('VULNERABILITIES.md debe documentar severidades', async (assert) => {
        const vulnPath = path.join(__dirname, '../VULNERABILITIES.md');
        const content = fs.readFileSync(vulnPath, 'utf-8');

        assert(
            content.includes('CRÍTICA') || content.includes('ALTA') || content.includes('CRITICAL'),
            'Debe documentar severidades'
        );
        assert(
            content.includes('CWE'),
            'Debe incluir referencias CWE'
        );
        assert(
            content.includes('CVSS') || content.includes('Score'),
            'Debe incluir scores CVSS'
        );
    });

    await runTest('CLAUDE.md debe tener contexto del proyecto', async (assert) => {
        const claudePath = path.join(__dirname, '../CLAUDE.md');
        const content = fs.readFileSync(claudePath, 'utf-8');

        assert(
            content.includes('vulnerable') || content.includes('educational'),
            'CLAUDE.md debe explicar el contexto'
        );
        assert(
            content.includes('Commands') || content.includes('Architecture'),
            'Debe documentar comandos o arquitectura'
        );
    });

    await describe('🔧 Configuración del Proyecto');

    await runTest('package.json debe tener scripts necesarios', async (assert) => {
        const pkgPath = path.join(__dirname, '../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        assert(pkg.scripts.dev, 'Debe tener script dev');
        assert(pkg.scripts.test, 'Debe tener script test');
        assert(pkg.scripts.deploy, 'Debe tener script deploy');
        assert(pkg.scripts.audit, 'Debe tener script audit');
    });

    await runTest('package.json debe tener metadata correcta', async (assert) => {
        const pkgPath = path.join(__dirname, '../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        assert(pkg.name, 'Debe tener nombre');
        assert(pkg.version, 'Debe tener versión');
        assert(pkg.description, 'Debe tener descripción');
        assert(
            pkg.description.includes('vulnerable') || pkg.description.includes('DevSecOps'),
            'Descripción debe mencionar el propósito'
        );
    });

    await runTest('.gitignore debe excluir archivos sensibles', async (assert) => {
        const gitignorePath = path.join(__dirname, '../.gitignore');
        const content = fs.readFileSync(gitignorePath, 'utf-8');

        assert(content.includes('node_modules'), 'Debe ignorar node_modules');
        assert(content.includes('.env'), 'Debe ignorar .env');
        assert(content.includes('.netlify'), 'Debe ignorar .netlify');
    });
};
