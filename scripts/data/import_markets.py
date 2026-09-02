#!/usr/bin/env python3
"""Import market CSVs into markets or market_prices (--kind selects which).

Usage:
    python scripts/data/import_markets.py --file data/raw/markets/file.csv --kind markets
    python scripts/data/import_markets.py --file data/raw/market_prices/file.csv --kind market_prices
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from app.ingestion.cli import run_cli

if __name__ == "__main__":
    sys.exit(run_cli("markets"))
