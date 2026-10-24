#!/usr/bin/env python3
"""Regresión H01: solo colecta fixtures locales; nunca conecta ni publica FTP."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("sanmartin_hostinger_h01", Path(__file__).with_name("publicar-hostinger.py"))
publisher = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = publisher
spec.loader.exec_module(publisher)


class SqlPublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="sanmartin-h01-publicacion-")
        self.root = Path(self.temp.name).resolve()
        if not self.root.is_relative_to(Path(tempfile.gettempdir()).resolve()):
            raise RuntimeError("Fixture fuera del directorio temporal.")
        (self.root / "index.html").write_text("<!doctype html><title>Ensayo</title>", encoding="utf-8")
        (self.root / "sitemap.xml").write_text("<urlset/>", encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def test_public_files_are_allowed(self):
        (self.root / "app.js").write_text("void 0;", encoding="utf-8")
        self.assertEqual(set(publisher.collect_files(self.root)), {"index.html", "sitemap.xml", "app.js"})

    def test_sql_and_archived_variants_are_rejected(self):
        for filename in ("old.sql", "OLD.SQL", "old.sql.historico", "old.sql.bak"):
            with self.subTest(filename=filename):
                path = self.root / filename
                path.write_text("-- contenido de prueba", encoding="utf-8")
                with self.assertRaisesRegex(publisher.DeploymentError, "SQL o archivos privados"):
                    publisher.collect_files(self.root)
                path.unlink()

    def test_private_database_directories_are_rejected(self):
        for filename in ("supabase/baseline/snapshot.json", "supabase/historico/manifest.json", "scripts/helper.py"):
            with self.subTest(filename=filename):
                path = self.root / filename
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("{}", encoding="utf-8")
                with self.assertRaisesRegex(publisher.DeploymentError, "SQL o archivos privados"):
                    publisher.collect_files(self.root)
                path.unlink()


if __name__ == "__main__":
    unittest.main()

