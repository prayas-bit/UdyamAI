#!/usr/bin/env python3
"""Unified ingestion runner — one file, or every CSV under data/raw/<domain>/.

Usage:
    python scripts/data/import_all.py --domain population --file data/raw/population/file.csv
    python scripts/data/import_all.py --all [--dry-run]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

try:
    from app.ingestion.cli import run_cli_all
except ImportError as exc:
    print(
        f"Error: Failed to import ingestion pipeline: {exc}\n"
        "Make sure you run this script from the project root and that\n"
        "backend/app/ingestion/cli.py exists with all dependencies."
    )
    sys.exit(1)

if __name__ == "__main__":
    sys.exit(run_cli_all())
