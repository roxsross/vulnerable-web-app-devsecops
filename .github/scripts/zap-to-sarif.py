#!/usr/bin/env python3
"""
ZAP to SARIF Converter
======================
Convierte el reporte JSON de OWASP ZAP a formato SARIF 2.1.0 para integración
con GitHub Security Code Scanning.

SARIF (Static Analysis Results Interchange Format) es un formato estándar
para reportes de análisis de seguridad que permite visualizar resultados
en la pestaña "Security" de GitHub.

Autor: DevSecOps Team - Ekoparty 2025
Uso: python3 zap-to-sarif.py
Variables de entorno:
  - ZAP_JSON: Archivo JSON de entrada (default: report_json.json)
  - ZAP_SARIF: Archivo SARIF de salida (default: zap-results.sarif)
"""

import html
import json
import os
import re
import sys

# Configuración de archivos de entrada/salida
INPUT = os.getenv("ZAP_JSON", "report_json.json")
OUTPUT = os.getenv("ZAP_SARIF", "zap-results.sarif")

# Constante para archivo por defecto cuando no se puede determinar el path
DEFAULT_ARTIFACT_PATH = "public/index.html"

# Estructura base de SARIF 2.1.0
EMPTY_SARIF = {
    "version": "2.1.0",
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    "runs": [{"tool": {"driver": {"name": "OWASP ZAP", "version": "stable", "rules": []}}, "results": []}],
}


def write(data):
    """
    Escribe el diccionario SARIF al archivo de salida.

    Args:
        data: Diccionario con estructura SARIF 2.1.0
    """
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2)


def extract_first_url(raw: str) -> str:
    """
    Extrae la primera URL válida de un string que puede tener HTML encoded.

    ZAP incluye referencias HTML-encoded con posibles tags. Esta función:
    1. Decodifica HTML entities (&amp; → &, etc.)
    2. Remueve tags HTML (<a>, <p>, etc.)
    3. Extrae la primera URL encontrada
    4. Limpia caracteres de puntuación al final

    Args:
        raw: String raw del campo "reference" de ZAP

    Returns:
        URL limpia o string vacío si no se encuentra ninguna
    """
    decoded = html.unescape(raw)
    # Quitar tags HTML
    clean = re.sub(r"<[^>]+>", " ", decoded)
    # Buscar primera URL
    match = re.search(r"https?://[^\s\"'<>]+", clean)
    return match.group(0).rstrip(".,;") if match else ""


def uri_to_relative(full_uri: str, base_url: str) -> str:
    """
    Convierte una URL absoluta a path relativo para SARIF.

    Args:
        full_uri: URL completa de la vulnerabilidad detectada
        base_url: URL base del sitio escaneado

    Returns:
        Path relativo del archivo o DEFAULT_ARTIFACT_PATH si no se puede determinar
    """
    if base_url and full_uri.startswith(base_url):
        rel = full_uri[len(base_url):].lstrip("/")
        # Si tiene query params, extraer solo el path
        if "?" in rel:
            rel = rel.split("?")[0]
        return rel if rel else DEFAULT_ARTIFACT_PATH
    # Si es una URL externa o no matchea, retornar solo el path
    # Extrae el path sin query params usando [^?]+ (más eficiente que .+?)
    match = re.search(r"https?://[^/]+/([^?]+)", full_uri)
    if match:
        path = match.group(1)
        return path if path else DEFAULT_ARTIFACT_PATH
    return DEFAULT_ARTIFACT_PATH


# =============================================================================
# VALIDACIÓN DE ENTRADA
# =============================================================================
# Si no hay archivo de entrada o está vacío, genera SARIF vacío (válido)
# Esto permite que el workflow continúe incluso si ZAP no generó reporte
if not os.path.exists(INPUT) or os.path.getsize(INPUT) == 0:
    print(f"[zap-to-sarif] {INPUT} no encontrado o vacío — generando SARIF vacío")
    write(EMPTY_SARIF)
    sys.exit(0)

# Intentar parsear el JSON de ZAP
with open(INPUT) as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[zap-to-sarif] JSON inválido: {e} — generando SARIF vacío")
        write(EMPTY_SARIF)
        sys.exit(0)

# =============================================================================
# PROCESAMIENTO DE ALERTAS
# =============================================================================
# rules: Diccionario de reglas únicas (por pluginid)
# results: Lista de todas las instancias de vulnerabilidades encontradas
rules, results = {}, []

# Iterar sobre todos los sitios escaneados (normalmente uno solo)
for site in data.get("site", []):
    base_url = site.get("@name", "").rstrip("/")

    # Procesar cada alerta (tipo de vulnerabilidad) encontrada
    for alert in site.get("alerts", []):
        rid = alert.get("pluginid", "unknown")  # ID único de la regla/plugin
        risk = alert.get("riskdesc", "Informational")  # Ej: "High (Medium)"

        # Mapeo de severidad ZAP a niveles SARIF
        # SARIF levels: error (crítico), warning (medio), note (bajo/info)
        if "High" in risk or "Critical" in risk:
            level = "error"
        elif "Informational" in risk or "False" in risk:
            level = "note"
        else:
            level = "warning"

        # Crear regla si no existe (una regla puede tener múltiples instancias)
        if rid not in rules:
            help_uri = extract_first_url(alert.get("reference", ""))
            rules[rid] = {
                "id": rid,
                "name": alert.get("alert", rid),
                "shortDescription": {"text": alert.get("alert", rid)},
                "fullDescription": {"text": html.unescape(re.sub(r"<[^>]+>", "", alert.get("desc", "")))},
                "properties": {"security-severity": str(alert.get("riskcode", 0))},
            }
            # Solo agregar helpUri si es una URL válida (enlace a documentación)
            if help_uri and help_uri.startswith("http"):
                rules[rid]["helpUri"] = help_uri

        # Procesar cada instancia de esta vulnerabilidad
        # Una alerta puede aparecer en múltiples URLs/endpoints
        for inst in alert.get("instances", [{}]):
            abs_uri = inst.get("uri", base_url)
            rel_path = uri_to_relative(abs_uri, base_url)
            results.append({
                "ruleId": rid,
                "level": level,
                "message": {"text": inst.get("evidence", alert.get("alert", "")) or alert.get("alert", rid)},
                "locations": [{"physicalLocation": {
                    "artifactLocation": {"uri": rel_path, "uriBaseId": "%SRCROOT%"},
                    "region": {"startLine": 1},  # DAST no tiene línea específica
                }}],
            })

# =============================================================================
# GENERACIÓN DE SARIF FINAL
# =============================================================================
# Poblar la estructura SARIF con las reglas y resultados procesados
EMPTY_SARIF["runs"][0]["tool"]["driver"]["rules"] = list(rules.values())
EMPTY_SARIF["runs"][0]["results"] = results

# Escribir archivo SARIF final
write(EMPTY_SARIF)

# Log de resumen
print("[zap-to-sarif] SARIF generado exitosamente")
print(f"  → Reglas únicas: {len(rules)}")
print(f"  → Instancias totales: {len(results)}")
print(f"  → Archivo: {OUTPUT}")