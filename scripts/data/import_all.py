#!/usr/bin/env python3
"""Unified ingestion runner — one file, or every CSV under data/raw/<domain>/.

Usage:
    python scripts/data/import_all.py --domain population --file data/raw/population/file.csv
    python scripts/data/import_all.py --all [--dry-run]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from app.ingestion.cli import run_cli_all

if __name__ == "__main__":
    sys.exit(run_cli_all())
