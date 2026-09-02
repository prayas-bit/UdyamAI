#!/usr/bin/env python3
"""Import location hierarchy CSVs (District → Taluka → GP → Village).

Usage:
    python scripts/data/import_locations.py --file data/raw/locations/file.csv [--dry-run]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from app.ingestion.cli import run_cli

if __name__ == "__main__":
    sys.exit(run_cli("locations"))
