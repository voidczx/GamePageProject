#!/usr/bin/env python3
"""Extract an explicit allow-list from Owlcat's Zip64 blueprints archive."""

from __future__ import annotations

import argparse
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


def safe_entry(value: str) -> PurePosixPath:
    entry = PurePosixPath(value)
    if entry.is_absolute() or ".." in entry.parts or not entry.parts:
        raise ValueError(f"unsafe archive entry: {value}")
    return entry


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--request", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    entries = json.loads(Path(args.request).read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("request must be a JSON array")

    with ZipFile(args.archive, "r", allowZip64=True) as archive:
        names = set(archive.namelist())
        for value in entries:
            entry = safe_entry(value)
            normalized = entry.as_posix()
            if normalized not in names:
                raise KeyError(f"archive entry not found: {normalized}")
            destination = output.joinpath(*entry.parts).resolve()
            if output not in destination.parents:
                raise ValueError(f"entry escapes output directory: {normalized}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(archive.read(normalized))


if __name__ == "__main__":
    main()
