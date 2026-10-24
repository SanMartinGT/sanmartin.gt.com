#!/usr/bin/env python3
"""Publica un sitio estático por FTP/FTPS sin borrar archivos ajenos.

FTPS explícito y certificado verificado son los valores predeterminados.
FTP sin cifrado requiere HOSTINGER_FTP_PROTOCOL=ftp de forma explícita.
Cada archivo se transfiere a un temporal y se renombra al terminar; el sitemap
se publica después del resto del sitio. El manifiesto se confirma al final.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import ftplib
import hashlib
import io
import json
import os
from pathlib import Path
import re
import ssl
import sys
import uuid

MANIFEST_NAME = ".hostinger-deploy-manifest.json"
MAX_MANIFEST_BYTES = 16 * 1024 * 1024
MAX_FILES = 50_000
GENERATED_PAGE = re.compile(r"(?:producto|categoria)/[a-z0-9]+(?:-[a-z0-9]+)*/index\.html\Z")
HASH = re.compile(r"[0-9a-f]{64}\Z")


class DeploymentError(Exception):
    """Error que puede mostrarse sin incluir credenciales ni respuestas FTP."""


@dataclass(frozen=True)
class Settings:
    host: str
    username: str
    password: str
    port: int
    remote_dir: str
    protocol: str

    @classmethod
    def from_env(cls) -> "Settings":
        required = ("HOSTINGER_FTP_SERVER", "HOSTINGER_FTP_USERNAME", "HOSTINGER_FTP_PASSWORD")
        missing = [name for name in required if not os.environ.get(name)]
        if missing:
            raise DeploymentError("Faltan secrets de GitHub Actions: " + ", ".join(missing))
        host = os.environ[required[0]].strip()
        username, password = (os.environ[name] for name in required[1:])
        if not host or re.search(r"[\s/\\:@]", host) or "\x00" in host:
            raise DeploymentError("HOSTINGER_FTP_SERVER debe ser un hostname o IPv4, sin protocolo ni puerto.")
        if any(c in username for c in "\r\n\x00") or any(c in password for c in "\r\n\x00"):
            raise DeploymentError("Las credenciales FTP contienen caracteres no permitidos.")
        protocol = (os.environ.get("HOSTINGER_FTP_PROTOCOL") or "ftps").strip().lower()
        if protocol not in {"ftp", "ftps"}:
            raise DeploymentError("HOSTINGER_FTP_PROTOCOL debe ser ftps o ftp; SFTP es un protocolo diferente.")
        try:
            port = int(os.environ.get("HOSTINGER_FTP_PORT") or "21")
        except ValueError as exc:
            raise DeploymentError("HOSTINGER_FTP_PORT debe ser un número.") from exc
        if not 1 <= port <= 65535:
            raise DeploymentError("HOSTINGER_FTP_PORT está fuera de rango.")
        remote_dir = validate_remote_dir(os.environ.get("HOSTINGER_FTP_DIR") or "/public_html/")
        return cls(host, username, password, port, remote_dir, protocol)


@dataclass(frozen=True)
class FileSpec:
    path: Path
    sha256: str
    size: int


def validate_relative_path(name: str) -> str:
    if not isinstance(name, str) or not name or "\\" in name or name.startswith("/"):
        raise DeploymentError("Se encontró una ruta de archivo insegura.")
    if any(ord(c) < 32 or ord(c) == 127 for c in name):
        raise DeploymentError("Una ruta de archivo contiene caracteres de control.")
    if any(part in {"", ".", ".."} for part in name.split("/")):
        raise DeploymentError("No se permiten rutas vacías ni rutas que salgan del sitio.")
    return name


def validate_remote_dir(value: str) -> str:
    if not value.startswith("/") or "\\" in value or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise DeploymentError("HOSTINGER_FTP_DIR debe ser una ruta absoluta terminada en /public_html/.")
    parts = value.rstrip("/").split("/")[1:]
    if not parts or parts[-1] != "public_html" or any(part in {"", ".", ".."} for part in parts):
        raise DeploymentError("HOSTINGER_FTP_DIR debe señalar explícitamente public_html, sin .. ni subcarpetas.")
    return "/" + "/".join(parts)


def collect_files(site_dir: Path) -> dict[str, FileSpec]:
    root = site_dir.resolve(strict=True)
    if not root.is_dir():
        raise DeploymentError("El directorio del sitio no existe.")
    result: dict[str, FileSpec] = {}
    for item in sorted(root.rglob("*")):
        if item.is_symlink() or not item.resolve().is_relative_to(root):
            raise DeploymentError("El sitio contiene un enlace que no se puede publicar de forma segura.")
        if item.is_dir():
            continue
        if not item.is_file():
            raise DeploymentError("El sitio contiene un archivo no regular.")
        name = validate_relative_path(item.relative_to(root).as_posix())
        if re.search(r"\.sql(?:$|\.)", name, re.IGNORECASE) or name.split("/", 1)[0].lower() in {"supabase", "scripts"}:
            raise DeploymentError("La salida contiene SQL o archivos privados de base de datos: " + name)
        if name == MANIFEST_NAME:
            raise DeploymentError("El sitio contiene el nombre reservado del manifiesto de despliegue.")
        digest = hashlib.sha256()
        size = 0
        with item.open("rb") as stream:
            for block in iter(lambda: stream.read(128 * 1024), b""):
                digest.update(block)
                size += len(block)
        result[name] = FileSpec(item, digest.hexdigest(), size)
        if len(result) > MAX_FILES:
            raise DeploymentError("El sitio supera el límite de archivos del despliegue.")
    if "index.html" not in result or "sitemap.xml" not in result:
        raise DeploymentError("El sitio debe contener index.html y sitemap.xml antes de publicarse.")
    return result


def is_missing(error: ftplib.error_perm) -> bool:
    message = str(error).lower()
    return message.startswith("550") and any(
        marker in message for marker in ("no such file", "not found", "does not exist", "cannot find")
    )


def read_manifest(ftp: ftplib.FTP) -> dict[str, dict[str, str | int]]:
    buffer = io.BytesIO()

    def receive(block: bytes) -> None:
        if buffer.tell() + len(block) > MAX_MANIFEST_BYTES:
            raise DeploymentError("El manifiesto remoto supera el límite permitido.")
        buffer.write(block)

    try:
        ftp.retrbinary("RETR " + MANIFEST_NAME, receive)
    except ftplib.error_perm as exc:
        if is_missing(exc):
            return {}
        raise
    try:
        manifest = json.loads(buffer.getvalue().decode("utf-8"))
        if not isinstance(manifest, dict) or manifest.get("version") != 1:
            raise ValueError("version")
        files = manifest["files"]
        if not isinstance(files, dict) or len(files) > MAX_FILES:
            raise ValueError("files")
        for name, record in files.items():
            validate_relative_path(name)
            if name == MANIFEST_NAME or not isinstance(record, dict):
                raise ValueError("record")
            if not isinstance(record.get("sha256"), str) or not HASH.fullmatch(record["sha256"]):
                raise ValueError("hash")
            if type(record.get("size")) is not int or record["size"] < 0:
                raise ValueError("size")
        return files
    except (ValueError, KeyError, TypeError, UnicodeError) as exc:
        raise DeploymentError("El manifiesto remoto no es válido; se detuvo la publicación antes de modificar archivos.") from exc


def ensure_parents(ftp: ftplib.FTP, name: str, remote_dir: str, known: set[str]) -> None:
    parts = name.split("/")[:-1]
    for index in range(1, len(parts) + 1):
        parent = "/".join(parts[:index])
        if parent in known:
            continue
        try:
            ftp.mkd(parent)
        except ftplib.error_perm as exc:
            if not str(exc).startswith("550"):
                raise
            # Un 550 también puede significar falta de permisos. Confirmar que
            # el directorio existe y es accesible antes de continuar.
            ftp.cwd(parent)
            ftp.cwd(remote_dir)
        known.add(parent)


def upload_atomic(ftp: ftplib.FTP, name: str, stream, expected: FileSpec | None = None) -> None:
    validate_relative_path(name)
    prefix, _, basename = name.rpartition("/")
    temp = (prefix + "/" if prefix else "") + "." + basename + ".upload-" + uuid.uuid4().hex
    digest = hashlib.sha256()
    transferred = 0

    def sent(block: bytes) -> None:
        nonlocal transferred
        digest.update(block)
        transferred += len(block)

    try:
        ftp.storbinary("STOR " + temp, stream, blocksize=128 * 1024, callback=sent)
        if expected is not None and (transferred != expected.size or digest.hexdigest() != expected.sha256):
            raise DeploymentError("Un archivo local cambió durante la transferencia; se conservó su versión remota anterior.")
        # Nunca borrar el destino para conseguir que rename funcione. Si el
        # servidor rechaza el reemplazo, fallar conservando el archivo anterior.
        ftp.rename(temp, name)
    except Exception:
        try:
            ftp.delete(temp)
        except ftplib.all_errors:
            pass
        raise


def remove_generated_page(ftp: ftplib.FTP, name: str, previous: dict[str, str | int]) -> bool:
    if not GENERATED_PAGE.fullmatch(name):
        raise DeploymentError("Se intentó eliminar una ruta que no es una ficha SEO controlada.")
    digest = hashlib.sha256()
    size = 0

    def receive(block: bytes) -> None:
        nonlocal size
        size += len(block)
        digest.update(block)

    try:
        ftp.retrbinary("RETR " + name, receive)
    except ftplib.error_perm as exc:
        if is_missing(exc):
            return False
        raise
    if size != previous["size"] or digest.hexdigest() != previous["sha256"]:
        # Leer hasta el final mantiene sincronizado el canal de control FTP.
        # No borrar una ficha sustituida manualmente por otro archivo.
        return False
    try:
        ftp.delete(name)
    except ftplib.error_perm as exc:
        if not is_missing(exc):
            raise
        return False
    return True


def deployment_order(name: str) -> tuple[int, str]:
    if name == "sitemap.xml":
        return (2, name)
    if re.fullmatch(r"sitemap[^/]*\.xml", name.rsplit("/", 1)[-1], flags=re.IGNORECASE):
        return (1, name)
    return (0, name)


def publish(ftp: ftplib.FTP, settings: Settings, files: dict[str, FileSpec]) -> dict[str, int]:
    ftp.cwd(settings.remote_dir)
    previous = read_manifest(ftp)
    known_dirs: set[str] = set()
    stats = {"subidos": 0, "sin_cambios": 0, "retirados": 0, "conservados": 0}
    for name in sorted(files, key=deployment_order):
        item = files[name]
        if previous.get(name) == {"sha256": item.sha256, "size": item.size}:
            stats["sin_cambios"] += 1
            continue
        ensure_parents(ftp, name, settings.remote_dir, known_dirs)
        with item.path.open("rb") as stream:
            upload_atomic(ftp, name, stream, item)
        stats["subidos"] += 1
    # Solo después de transferir todas las páginas y el sitemap se retiran
    # fichas presentes en el manifiesto anterior. No se borran directorios.
    for name in sorted(set(previous) - set(files)):
        if GENERATED_PAGE.fullmatch(name):
            if remove_generated_page(ftp, name, previous[name]):
                stats["retirados"] += 1
            else:
                stats["conservados"] += 1
    manifest = {"version": 1, "files": {name: {"sha256": item.sha256, "size": item.size} for name, item in sorted(files.items())}}
    content = json.dumps(manifest, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(content) > MAX_MANIFEST_BYTES:
        raise DeploymentError("El manifiesto nuevo supera el límite permitido.")
    upload_atomic(ftp, MANIFEST_NAME, io.BytesIO(content))
    return stats


def connect(settings: Settings) -> ftplib.FTP:
    if settings.protocol == "ftps":
        ftp = ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60, encoding="utf-8")
    else:
        ftp = ftplib.FTP(timeout=60, encoding="utf-8")
    try:
        ftp.connect(settings.host, settings.port)
        ftp.login(settings.username, settings.password)
        if settings.protocol == "ftps":
            ftp.prot_p()
        ftp.set_pasv(True)
        return ftp
    except Exception:
        ftp.close()
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-dir", default="_site", type=Path)
    args = parser.parse_args()
    ftp = None
    try:
        settings = Settings.from_env()
        files = collect_files(args.site_dir)
        print(f"Publicando {len(files)} archivos mediante {settings.protocol.upper()}.")
        ftp = connect(settings)
        stats = publish(ftp, settings, files)
        print("Publicación completa: " + ", ".join(f"{count} {label}" for label, count in stats.items()) + ".")
        return 0
    except DeploymentError as exc:
        print("ERROR: " + str(exc), file=sys.stderr)
        return 1
    except ssl.SSLCertVerificationError:
        print("ERROR: El certificado FTPS no es válido para el servidor configurado. Usa el hostname FTP que coincida con su certificado; no se intentó FTP sin cifrado.", file=sys.stderr)
        return 1
    except ftplib.all_errors as exc:
        # Las respuestas del servidor y mensajes de socket pueden incluir
        # datos privados. Imprimir solo el tipo de error, nunca su contenido.
        print(f"ERROR: La publicación falló ({type(exc).__name__}). Revisa conexión, credenciales, TLS y permisos de public_html. El manifiesto solo se confirma al completar el despliegue.", file=sys.stderr)
        return 1
    finally:
        if ftp is not None:
            try:
                ftp.quit()
            except ftplib.all_errors:
                ftp.close()


if __name__ == "__main__":
    raise SystemExit(main())
