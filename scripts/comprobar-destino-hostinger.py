#!/usr/bin/env python3
"""Comprueba el destino existente por HTTPS y FTPS sin escribir archivos.

La identidad procede de la publicación que sirve SITE_URL, nunca de _site/.
Falla cerrada si falta esa evidencia o si el directorio FTP contiene otro sitio.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import ssl
import sys
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, HTTPSHandler, Request, build_opener

sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location(
    "sanmartin_hostinger_destino_publicador", Path(__file__).with_name("publicar-hostinger.py")
)
publisher = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = publisher
_spec.loader.exec_module(publisher)

MAX_PROOF_BYTES = 512 * 1024
MAX_INDEX_BYTES = 2 * 1024 * 1024
MAX_CONFIG_BYTES = 16 * 1024
TIMEOUT_SECONDS = 15
HASH = re.compile(r"[0-9a-f]{64}\Z")
DEPLOYMENT_ID = re.compile(
    r"sm-(?:[1-9][0-9]{0,19}-[0-9a-f]{12}-)?"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z"
)


class DestinationError(Exception):
    """Solo mensajes constantes: nunca incorporar respuestas o credenciales."""


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise DestinationError("La evidencia HTTPS redirige; no se confirmó el destino.")


def site_origin(value: str) -> str:
    try:
        parsed = urlsplit(value)
        if (
            not isinstance(value, str)
            or re.search(r"\s", value)
            or parsed.scheme != "https"
            or parsed.username is not None
            or parsed.password is not None
            or parsed.port is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
            or not parsed.hostname
            or not re.fullmatch(r"[a-z0-9.-]+", parsed.hostname)
            or parsed.hostname.endswith(".github.io")
        ):
            raise ValueError
        return "https://" + parsed.hostname
    except (AttributeError, TypeError, ValueError):
        raise DestinationError("SITE_URL debe ser la raíz de un dominio HTTPS sin credenciales.") from None


def configured_site() -> str:
    value = os.environ.get("SITE_URL")
    if not value:
        data = Path(__file__).resolve().parent.parent.joinpath("entorno.json").read_bytes()
        if len(data) > MAX_CONFIG_BYTES:
            raise DestinationError("La configuración del dominio es inválida.")
        value = json.loads(data)["siteUrl"]
    return site_origin(value)


def fetch_current_proof(site: str, opener=None) -> bytes:
    url = site_origin(site) + "/publicacion.json"
    request = Request(url, headers={
        "Accept": "application/json",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache, no-store, max-age=0",
        "Pragma": "no-cache",
        "User-Agent": "SanMartin-Destination-Check/1",
    })
    if opener is None:
        opener = build_opener(HTTPSHandler(context=ssl.create_default_context()), NoRedirects())
    with opener.open(request, timeout=TIMEOUT_SECONDS) as response:
        if response.status != 200 or response.geturl() != url:
            raise DestinationError("No se obtuvo la evidencia HTTPS actual sin redirecciones.")
        if response.headers.get("Content-Encoding", "identity").lower() != "identity":
            raise DestinationError("La evidencia HTTPS tiene una codificación no admitida.")
        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            raise DestinationError("El sitio HTTPS no devolvió una evidencia JSON.")
        content_length = response.headers.get("Content-Length")
        if content_length is not None and (
            not re.fullmatch(r"[0-9]+", content_length) or int(content_length) > MAX_PROOF_BYTES
        ):
            raise DestinationError("La evidencia HTTPS supera el límite permitido.")
        data = response.read(MAX_PROOF_BYTES + 1)
    if not data or len(data) > MAX_PROOF_BYTES:
        raise DestinationError("La evidencia HTTPS está vacía o supera el límite permitido.")
    return data


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise DestinationError("La evidencia pública contiene claves duplicadas.")
        result[key] = value
    return result


def index_identity(data: bytes, site: str) -> dict:
    if not data or len(data) > MAX_PROOF_BYTES:
        raise DestinationError("La evidencia pública está vacía o supera el límite permitido.")
    try:
        proof = json.loads(data.decode("utf-8"), object_pairs_hook=unique_object)
        if (
            not isinstance(proof, dict)
            or type(proof.get("format_version")) is not int
            or proof["format_version"] != 1
            or not isinstance(proof.get("deployment_id"), str)
            or not DEPLOYMENT_ID.fullmatch(proof["deployment_id"])
            or proof.get("site") != site_origin(site)
            or not isinstance(proof.get("files"), list)
            or not 1 <= len(proof["files"]) <= 4096
        ):
            raise ValueError
        indexes = [f for f in proof["files"] if isinstance(f, dict) and f.get("path") == "index.html"]
        if len(indexes) != 1:
            raise ValueError
        index = indexes[0]
        if (
            not isinstance(index.get("sha256"), str)
            or not HASH.fullmatch(index["sha256"])
            or type(index.get("bytes")) is not int
            or not 1 <= index["bytes"] <= MAX_INDEX_BYTES
        ):
            raise ValueError
        return index
    except (UnicodeError, ValueError, TypeError, KeyError):
        raise DestinationError("La evidencia pública no identifica el dominio, la publicación y su inicio.") from None


def retrieve(ftp, name: str, maximum: int) -> bytes:
    if name not in {"publicacion.json", "index.html"}:
        raise DestinationError("La comprobación solo permite leer evidencia e inicio.")
    result = bytearray()

    def receive(block):
        if len(result) + len(block) > maximum:
            raise DestinationError("Un archivo del destino supera el tamaño esperado.")
        result.extend(block)

    ftp.retrbinary("RETR " + name, receive, blocksize=64 * 1024)
    return bytes(result)


def check_destination(settings, site: str, fetch_proof=None, connector=None) -> None:
    if settings.protocol != "ftps":
        raise DestinationError("La comprobación del destino exige FTPS con certificado verificado.")
    site = site_origin(site)
    current = (fetch_proof or fetch_current_proof)(site)
    index = index_identity(current, site)
    ftp = None
    try:
        # Reutiliza Settings/connect: TLS de control y datos con el contexto
        # verificado del publicador. No se aceptan credenciales antes del TLS.
        ftp = (connector or publisher.connect)(settings)
        ftp.cwd(settings.remote_dir)
        remote = retrieve(ftp, "publicacion.json", MAX_PROOF_BYTES)
        if remote != current:
            raise DestinationError("La evidencia del directorio FTPS no coincide con la publicación HTTPS actual.")
        # La igualdad de bytes conserva también el nonce deployment_id vigente.
        # No se compara contra el artefacto nuevo que se pretende publicar.
        homepage = retrieve(ftp, "index.html", index["bytes"])
        if len(homepage) != index["bytes"] or hashlib.sha256(homepage).hexdigest() != index["sha256"]:
            raise DestinationError("El inicio del directorio FTPS no coincide con la evidencia HTTPS actual.")
    finally:
        if ftp is not None:
            ftp.close()


def main() -> int:
    try:
        settings = publisher.Settings.from_env()
        check_destination(settings, configured_site())
        print("Destino comprobado por FTPS contra la publicación HTTPS actual; no se modificaron archivos.")
        return 0
    except DestinationError as exc:
        print("ERROR: " + str(exc), file=sys.stderr)
    except Exception:
        # Incluye TLS, HTTP, credenciales, rutas ausentes y errores FTP.
        # Nunca imprimir sus mensajes ni respuestas: pueden contener secretos.
        print("ERROR: No se confirmó el destino existente. Revisa dominio, FTPS, credenciales y evidencia pública; no se autorizó la publicación.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
