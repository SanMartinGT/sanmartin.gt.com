#!/usr/bin/env python3
"""Aceptación aislada del guard: sin DNS, HTTPS real ni credenciales reales."""
from __future__ import annotations

import contextlib
import copy
import ftplib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import ssl
import sys
import unittest
from unittest.mock import Mock, patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("sanmartin_guard_destino_test", Path(__file__).with_name("comprobar-destino-hostinger.py"))
guard = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = guard
spec.loader.exec_module(guard)
SITE = "https://tienda.example"
INDEX = b"<!doctype html><title>Publicacion existente</title>"
NONCE = "sm-11111111-1111-4111-8111-111111111111"


def proof(**overrides):
    value = {
        "format_version": 1,
        "deployment_id": NONCE,
        "site": SITE,
        "files": [{"path": "index.html", "sha256": hashlib.sha256(INDEX).hexdigest(), "bytes": len(INDEX)}],
    }
    value.update(overrides)
    return json.dumps(value, indent=2).encode("utf-8") + b"\n"


class ReadOnlyFTP:
    def __init__(self, files):
        self.files = files
        self.calls = []

    def cwd(self, directory):
        self.calls.append(("CWD", directory))

    def retrbinary(self, command, receive, blocksize):
        self.calls.append(("RETR", command))
        name = command.removeprefix("RETR ")
        if name not in self.files:
            raise ftplib.error_perm("550 fixture private-server-detail")
        content = self.files[name]
        for offset in range(0, len(content), blocksize):
            receive(content[offset:offset + blocksize])

    def close(self):
        self.calls.append(("CLOSE",))

    def __getattr__(self, name):
        raise AssertionError("Operación FTP inesperada: " + name)


class Response(io.BytesIO):
    def __init__(self, data, status=200, url=SITE + "/publicacion.json", headers=None):
        super().__init__(data)
        self.status = status
        self.url = url
        self.headers = headers if headers is not None else {"Content-Type": "application/json"}

    def geturl(self):
        return self.url


class DestinationTests(unittest.TestCase):
    def setUp(self):
        self.settings = guard.publisher.Settings("srv-fixture.example", "fixture-user", "fixture-password", 21, "/public_html", "ftps")
        # Cualquier acceso accidental a la red convierte la prueba en fallo.
        self.network = patch("socket.create_connection", side_effect=AssertionError("Red real prohibida"))
        self.network.start()
        self.addCleanup(self.network.stop)

    def check(self, current=None, files=None, settings=None):
        current = current if current is not None else proof()
        ftp = ReadOnlyFTP(files if files is not None else {"publicacion.json": current, "index.html": INDEX})
        connector = Mock(return_value=ftp)
        guard.check_destination(settings or self.settings, SITE, lambda site: current, connector)
        return ftp, connector

    def test_current_https_identity_and_index_match_with_readonly_commands(self):
        ftp, connector = self.check()
        connector.assert_called_once_with(self.settings)
        self.assertEqual(ftp.calls, [("CWD", "/public_html"), ("RETR", "RETR publicacion.json"), ("RETR", "RETR index.html"), ("CLOSE",)])

    def test_accepts_current_actions_nonce_without_pinning_first_publication(self):
        current = proof(deployment_id="sm-123-aaaaaaaaaaaa-22222222-2222-4222-8222-222222222222")
        self.check(current=current)

    def test_same_homepage_with_other_publication_nonce_is_rejected(self):
        current = proof()
        old = proof(deployment_id="sm-22222222-2222-4222-8222-222222222222")
        with self.assertRaises(guard.DestinationError):
            self.check(current=current, files={"publicacion.json": old, "index.html": INDEX})

    def test_json_semantic_equality_does_not_replace_byte_identity(self):
        current = proof()
        compact = json.dumps(json.loads(current), separators=(",", ":")).encode()
        with self.assertRaises(guard.DestinationError):
            self.check(current=current, files={"publicacion.json": compact, "index.html": INDEX})

    def test_altered_or_short_homepage_is_rejected_even_with_matching_proof(self):
        for data in [b"X" * len(INDEX), INDEX[:-1]]:
            with self.subTest(length=len(data)), self.assertRaises(guard.DestinationError):
                self.check(files={"publicacion.json": proof(), "index.html": data})

    def test_missing_ftp_proof_or_homepage_closes_connection(self):
        for files in [{"index.html": INDEX}, {"publicacion.json": proof()}]:
            ftp = ReadOnlyFTP(files)
            with self.subTest(files=list(files)), self.assertRaises(ftplib.error_perm):
                guard.check_destination(self.settings, SITE, lambda _: proof(), lambda _: ftp)
            self.assertEqual(ftp.calls[-1], ("CLOSE",))

    def test_oversized_ftp_content_is_stopped_and_connection_closed(self):
        for files in [
            {"publicacion.json": b"x" * (guard.MAX_PROOF_BYTES + 1)},
            {"publicacion.json": proof(), "index.html": INDEX + b"x"},
        ]:
            ftp = ReadOnlyFTP(files)
            with self.subTest(files=list(files)), self.assertRaises(guard.DestinationError):
                guard.check_destination(self.settings, SITE, lambda _: proof(), lambda _: ftp)
            self.assertEqual(ftp.calls[-1], ("CLOSE",))

    def test_invalid_https_proof_never_connects_to_ftp(self):
        base = json.loads(proof())
        values = [b"", b"not-json", b"\xff", b"x" * (guard.MAX_PROOF_BYTES + 1)]
        for replacement in [
            {"site": "https://otro.example"}, {"deployment_id": "sm-no-nonce"},
            {"format_version": True}, {"files": []}, {"files": base["files"] * 2},
            {"files": [{"path": "index.html", "bytes": True, "sha256": "0" * 64}]},
            {"files": [{"path": "index.html", "bytes": guard.MAX_INDEX_BYTES + 1, "sha256": "0" * 64}]},
        ]:
            value = copy.deepcopy(base)
            value.update(replacement)
            values.append(json.dumps(value).encode())
        values.append(proof().replace(b'"format_version": 1', b'"format_version": 1, "format_version": 1'))
        for value in values:
            connector = Mock()
            with self.subTest(length=len(value)), self.assertRaises(guard.DestinationError):
                guard.check_destination(self.settings, SITE, lambda _: value, connector)
            connector.assert_not_called()

    def test_plain_ftp_is_rejected_before_any_network_or_credential_use(self):
        settings = guard.publisher.Settings("fixture.example", "user", "private", 21, "/public_html", "ftp")
        fetch = Mock()
        connector = Mock()
        with self.assertRaises(guard.DestinationError):
            guard.check_destination(settings, SITE, fetch, connector)
        fetch.assert_not_called()
        connector.assert_not_called()

    def test_https_response_requires_no_redirect_json_and_bounded_identity_encoding(self):
        cases = [
            dict(status=302), dict(status=404), dict(url="https://otro.example/publicacion.json"),
            dict(headers={"Content-Type": "text/html"}),
            dict(headers={"Content-Type": "application/json", "Content-Encoding": "gzip"}),
            dict(headers={"Content-Type": "application/json", "Content-Length": str(guard.MAX_PROOF_BYTES + 1)}),
            dict(headers={"Content-Type": "application/json", "Content-Length": "invalid"}),
        ]
        for options in cases:
            with self.subTest(options=options), self.assertRaises(guard.DestinationError):
                guard.fetch_current_proof(SITE, Mock(open=Mock(return_value=Response(proof(), **options))))
        with self.assertRaises(guard.DestinationError):
            guard.NoRedirects().redirect_request(None, None, 302, "private", {}, "https://otro.example/")

    def test_https_request_uses_current_site_timeout_and_no_cache(self):
        opener = Mock(open=Mock(return_value=Response(proof())))
        self.assertEqual(guard.fetch_current_proof(SITE, opener), proof())
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, SITE + "/publicacion.json")
        self.assertIn("no-cache", request.get_header("Cache-control"))
        self.assertEqual(opener.open.call_args.kwargs["timeout"], guard.TIMEOUT_SECONDS)

    def test_https_oversize_without_length_header_is_rejected(self):
        opener = Mock(open=Mock(return_value=Response(b"x" * (guard.MAX_PROOF_BYTES + 1))))
        with self.assertRaises(guard.DestinationError):
            guard.fetch_current_proof(SITE, opener)

    def test_site_url_rejects_credentials_http_redirect_origins_and_subdirectories(self):
        for value in ["http://tienda.example", "https://user:private@tienda.example", "https://tienda.example/a/", "https://tienda.example/?x=private", "https://tienda.example:443/", "https://tienda.example/#x", None]:
            with self.subTest(value=value), self.assertRaises(guard.DestinationError):
                guard.site_origin(value)

    def test_https_and_ftp_contexts_keep_hostname_and_ca_verification(self):
        with patch.object(guard, "build_opener", return_value=Mock(open=Mock(return_value=Response(proof())))) as builder:
            guard.fetch_current_proof(SITE)
        handler = builder.call_args.args[0]
        self.assertTrue(handler._context.check_hostname)
        self.assertEqual(handler._context.verify_mode, ssl.CERT_REQUIRED)
        with patch.object(guard.publisher.ftplib, "FTP_TLS") as tls:
            guard.publisher.connect(self.settings)
        context = tls.call_args.kwargs["context"]
        self.assertTrue(context.check_hostname)
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
        tls.return_value.connect.assert_called_once_with(self.settings.host, 21)
        tls.return_value.login.assert_called_once_with(self.settings.username, self.settings.password)
        tls.return_value.prot_p.assert_called_once_with()

    def test_main_uses_settings_and_never_exposes_transport_errors(self):
        for failure in [ftplib.error_perm("530 password=DO_NOT_PRINT"), ssl.SSLCertVerificationError("DO_NOT_PRINT"), OSError("DO_NOT_PRINT")]:
            output = io.StringIO()
            with patch.object(guard.publisher.Settings, "from_env", return_value=self.settings), patch.object(guard, "configured_site", return_value=SITE), patch.object(guard, "check_destination", side_effect=failure), contextlib.redirect_stderr(output):
                self.assertEqual(guard.main(), 1)
            self.assertNotIn("DO_NOT_PRINT", output.getvalue())
            self.assertNotIn(self.settings.password, output.getvalue())

    def test_main_success_reports_readonly_check_and_settings(self):
        output = io.StringIO()
        with patch.object(guard.publisher.Settings, "from_env", return_value=self.settings), patch.object(guard, "configured_site", return_value=SITE), patch.object(guard, "check_destination") as check, contextlib.redirect_stdout(output):
            self.assertEqual(guard.main(), 0)
        check.assert_called_once_with(self.settings, SITE)
        self.assertNotIn(self.settings.password, output.getvalue())

    def test_blank_site_url_uses_source_configuration_not_new_build(self):
        with patch.dict(os.environ, {"SITE_URL": ""}):
            self.assertEqual(guard.configured_site(), "https://sanmartingmca.com")


if __name__ == "__main__":
    unittest.main()
