#!/usr/bin/env python3
import argparse
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

import requests


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "article"


def normalize_text(text: str) -> str:
    replacements = {
        "\u00a0": " ",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2026": "...",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"\s+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text + "\n"


def extract_docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []
    for pnode in root.findall(".//w:p", ns):
        text = "".join((t.text or "") for t in pnode.findall(".//w:t", ns)).strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def read_env_key(repo_root: Path) -> str | None:
    key = os.getenv("OPENAI_API_KEY")
    if key:
        return key

    env_path = repo_root / "doc-review" / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        if k.strip() == "OPENAI_API_KEY":
            return v.strip().strip('"').strip("'")
    return None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate article text and static MP3 narration from .docx or .txt."
    )
    parser.add_argument("source", help="Path to .docx or .txt source.")
    parser.add_argument("--slug", help="Optional slug override.")
    parser.add_argument("--voice", default="alloy", help="TTS voice (default: alloy).")
    parser.add_argument(
        "--model", default="gpt-4o-mini-tts", help="TTS model (default: gpt-4o-mini-tts)."
    )
    args = parser.parse_args()

    script_path = Path(__file__).resolve()
    repo_root = script_path.parents[2]
    source = Path(args.source)
    if not source.is_absolute():
        source = (repo_root / source).resolve()

    if not source.exists():
        raise SystemExit(f"Source file not found: {source}")

    if source.suffix.lower() == ".docx":
        raw_text = extract_docx_text(source)
    elif source.suffix.lower() == ".txt":
        raw_text = source.read_text(encoding="utf-8")
    else:
        raise SystemExit("Source must be .docx or .txt")

    text = normalize_text(raw_text)

    slug = args.slug or slugify(source.stem)
    text_out = repo_root / "web" / "src" / "data" / "articles" / f"{slug}.txt"
    audio_out = repo_root / "web" / "public" / "audio" / f"{slug}.mp3"
    text_out.parent.mkdir(parents=True, exist_ok=True)
    audio_out.parent.mkdir(parents=True, exist_ok=True)
    text_out.write_text(text, encoding="utf-8")

    api_key = read_env_key(repo_root)
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not found (env var or doc-review/.env)")

    response = requests.post(
        "https://api.openai.com/v1/audio/speech",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": args.model,
            "voice": args.voice,
            "response_format": "mp3",
            "input": text,
        },
        timeout=300,
    )

    if response.status_code != 200:
        raise SystemExit(f"TTS failed: {response.status_code} {response.text[:800]}")

    audio_out.write_bytes(response.content)
    print(f"TEXT={text_out}")
    print(f"AUDIO={audio_out}")
    print(f"SLUG={slug}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
