#!/usr/bin/env python3
"""Convierte el reporte JSON de OWASP ZAP a formato SARIF 2.1.0."""

import html
import json
import os
import re
import sys

INPUT = os.getenv("ZAP_JSON", "report_json.json")
OUTPUT = os.getenv("ZAP_SARIF", "zap-results.sarif")

EMPTY_SARIF = {
    "version": "2.1.0",
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    "runs": [{"tool": {"driver": {"name": "OWASP ZAP", "version": "stable", "rules": []}}, "results": []}],
}


def write(data):
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2)


def extract_first_url(raw: str) -> str:
    """Extrae la primera URL válida de un string que puede tener HTML encoded."""
    decoded = html.unescape(raw)
    # Quitar tags HTML
    clean = re.sub(r"<[^>]+>", " ", decoded)
    # Buscar primera URL
    match = re.search(r"https?://[^\s\"'<>]+", clean)
    return match.group(0).rstrip(".,;") if match else ""


def uri_to_relative(full_uri: str, base_url: str) -> str:
    """Convierte una URL absoluta a path relativo para SARIF."""
    if base_url and full_uri.startswith(base_url):
        rel = full_uri[len(base_url):].lstrip("/")
        # Si tiene query params, extraer solo el path
        if "?" in rel:
            rel = rel.split("?")[0]
        return rel if rel else "public/index.html"
    # Si es una URL externa o no matchea, retornar solo el path
    match = re.search(r"https?://[^/]+/(.*?)(?:\?|$)", full_uri)
    if match:
        path = match.group(1)
        return path if path else "public/index.html"
    return "public/index.html"


if not os.path.exists(INPUT) or os.path.getsize(INPUT) == 0:
    print(f"[zap-to-sarif] {INPUT} no encontrado o vacío — generando SARIF vacío")
    write(EMPTY_SARIF)
    sys.exit(0)

with open(INPUT) as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[zap-to-sarif] JSON inválido: {e} — generando SARIF vacío")
        write(EMPTY_SARIF)
        sys.exit(0)

rules, results = {}, []

for site in data.get("site", []):
    base_url = site.get("@name", "").rstrip("/")

    for alert in site.get("alerts", []):
        rid = alert.get("pluginid", "unknown")
        risk = alert.get("riskdesc", "Informational")

        if "High" in risk or "Critical" in risk:
            level = "error"
        elif "Informational" in risk or "False" in risk:
            level = "note"
        else:
            level = "warning"

        if rid not in rules:
            help_uri = extract_first_url(alert.get("reference", ""))
            rules[rid] = {
                "id": rid,
                "name": alert.get("alert", rid),
                "shortDescription": {"text": alert.get("alert", rid)},
                "fullDescription": {"text": html.unescape(re.sub(r"<[^>]+>", "", alert.get("desc", "")))},
                "properties": {"security-severity": str(alert.get("riskcode", 0))},
            }
            # Solo agregar helpUri si es una URL válida
            if help_uri and help_uri.startswith("http"):
                rules[rid]["helpUri"] = help_uri

        for inst in alert.get("instances", [{}]):
            abs_uri = inst.get("uri", base_url)
            rel_path = uri_to_relative(abs_uri, base_url)
            results.append({
                "ruleId": rid,
                "level": level,
                "message": {"text": inst.get("evidence", alert.get("alert", "")) or alert.get("alert", rid)},
                "locations": [{"physicalLocation": {
                    "artifactLocation": {"uri": rel_path, "uriBaseId": "%SRCROOT%"},
                    "region": {"startLine": 1},
                }}],
            })

EMPTY_SARIF["runs"][0]["tool"]["driver"]["rules"] = list(rules.values())
EMPTY_SARIF["runs"][0]["results"] = results
write(EMPTY_SARIF)
print(f"[zap-to-sarif] SARIF generado: {len(results)} resultados → {OUTPUT}")