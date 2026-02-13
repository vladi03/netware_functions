#!/usr/bin/env python3
import argparse
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

import requests

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


@dataclass
class ParagraphBlock:
    text: str
    style: str


@dataclass
class DocMetadata:
    title: str = ""
    author: str = ""
    published: str = ""


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "article"


def normalize_text(text: str) -> str:
    try:
        repaired = text.encode("cp1252", errors="strict").decode("utf-8", errors="strict")
        if repaired.count("\ufffd") <= text.count("\ufffd"):
            text = repaired
    except UnicodeError:
        pass

    # Fix commonly observed mojibake before punctuation normalization.
    mojibake = {
        "Ã¢â‚¬â„¢": "'",
        "Ã¢â‚¬Å“": '"',
        "Ã¢â‚¬\x9d": '"',
        "ï¿½": "'",
        "Â·": "·",
        "â†’": "->",
    }
    for bad, good in mojibake.items():
        text = text.replace(bad, good)

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
    paragraphs = []
    for pnode in root.findall(".//w:p", NS):
        text = "".join((t.text or "") for t in pnode.findall(".//w:t", NS)).strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def extract_docx_paragraphs(path: Path) -> list[ParagraphBlock]:
    with zipfile.ZipFile(path) as zf:
        document_root = ET.fromstring(zf.read("word/document.xml"))
    body = document_root.find("w:body", NS)
    if body is None:
        return []

    paragraphs: list[ParagraphBlock] = []
    for pnode in body.findall("w:p", NS):
        style_node = pnode.find("./w:pPr/w:pStyle", NS)
        style = ""
        if style_node is not None:
            style = style_node.attrib.get(f"{{{NS['w']}}}val", "")

        runs: list[str] = []
        for child in list(pnode):
            if child.tag in {f"{{{NS['w']}}}r", f"{{{NS['w']}}}hyperlink"}:
                text = "".join((t.text or "") for t in child.findall(".//w:t", NS))
                if text:
                    runs.append(text)
                for footnote in child.findall(".//w:footnoteReference", NS):
                    fid = footnote.attrib.get(f"{{{NS['w']}}}id")
                    if fid and fid.isdigit() and int(fid) > 0:
                        runs.append(f"[^{fid}]")

        text = "".join(runs).strip()
        if text:
            paragraphs.append(ParagraphBlock(text=text, style=style))

    return paragraphs


def extract_docx_footnotes(path: Path) -> dict[str, str]:
    notes: dict[str, str] = {}
    with zipfile.ZipFile(path) as zf:
        try:
            footnotes_xml = zf.read("word/footnotes.xml")
        except KeyError:
            return notes

    root = ET.fromstring(footnotes_xml)
    for node in root.findall("w:footnote", NS):
        ftype = node.attrib.get(f"{{{NS['w']}}}type")
        if ftype:
            continue
        fid = node.attrib.get(f"{{{NS['w']}}}id")
        if not fid or not fid.isdigit() or int(fid) <= 0:
            continue
        text = "".join((t.text or "") for t in node.findall(".//w:t", NS)).strip()
        if text:
            notes[fid] = text
    return notes


def build_display_and_tts_from_docx(path: Path) -> tuple[str, str, DocMetadata]:
    paragraphs = extract_docx_paragraphs(path)
    footnotes = extract_docx_footnotes(path)
    metadata = extract_docx_metadata(paragraphs)

    display_lines: list[str] = []
    tts_lines: list[str] = []
    in_front_matter = True

    for block in paragraphs:
        text = block.text
        is_heading = block.style.lower().startswith("heading")
        is_bibliography = block.style.lower() == "bibliography"

        if in_front_matter and not is_heading:
            # Skip cover/title page content from published and TTS article body.
            continue
        in_front_matter = False

        if is_heading:
            display_line = f"## {text}"
            tts_line = text
        elif is_bibliography:
            display_line = f"- {text}"
            tts_line = text
        else:
            display_line = text
            tts_line = text

        # TTS should not include footnote markers.
        tts_line = re.sub(r"\[\^\d+\]", "", tts_line)
        tts_line = re.sub(r"\s{2,}", " ", tts_line).strip()

        display_lines.append(display_line)
        if tts_line:
            tts_lines.append(tts_line)

    if footnotes:
        display_lines.append("## Footnotes")
        for fid in sorted(footnotes, key=lambda x: int(x)):
            display_lines.append(f"[{fid}] {footnotes[fid]}")

    display_text = normalize_text("\n\n".join(display_lines))
    tts_text = normalize_text("\n\n".join(tts_lines))
    return display_text, tts_text, metadata


def extract_docx_metadata(paragraphs: list[ParagraphBlock]) -> DocMetadata:
    metadata = DocMetadata()
    date_pattern = re.compile(
        r"^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$",
        re.IGNORECASE,
    )

    for block in paragraphs:
        text = block.text.strip()
        if not text:
            continue

        if block.style.lower().startswith("heading"):
            break

        if not metadata.title:
            metadata.title = text
            continue
        if not metadata.published and date_pattern.match(text):
            metadata.published = text
            continue
        if not metadata.author and text.lower().startswith("by "):
            metadata.author = text[3:].strip()

    return metadata


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


def split_text_for_tts(text: str, max_chars: int = 6000) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        if para_len > max_chars:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                if current_len and current_len + len(sentence) + 2 > max_chars:
                    chunks.append("\n\n".join(current))
                    current = []
                    current_len = 0
                current.append(sentence)
                current_len += len(sentence) + 2
            continue

        if current_len and current_len + para_len + 2 > max_chars:
            chunks.append("\n\n".join(current))
            current = []
            current_len = 0

        current.append(para)
        current_len += para_len + 2

    if current:
        chunks.append("\n\n".join(current))

    return chunks or [text]


def synthesize_tts_mp3(
    text: str, api_key: str, model: str, voice: str, timeout: int = 300
) -> bytes:
    chunks = split_text_for_tts(text)
    audio_parts: list[bytes] = []

    for idx, chunk in enumerate(chunks, start=1):
        response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "voice": voice,
                "response_format": "mp3",
                "input": chunk,
            },
            timeout=timeout,
        )

        if response.status_code != 200:
            raise SystemExit(
                f"TTS failed on chunk {idx}/{len(chunks)}: {response.status_code} {response.text[:800]}"
            )
        audio_parts.append(response.content)

    return b"".join(audio_parts)


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

    tts_text = ""
    metadata = DocMetadata()
    if source.suffix.lower() == ".docx":
        display_text, tts_text, metadata = build_display_and_tts_from_docx(source)
    elif source.suffix.lower() == ".txt":
        raw_text = source.read_text(encoding="utf-8")
        display_text = normalize_text(raw_text)
        tts_text = display_text
    else:
        raise SystemExit("Source must be .docx or .txt")

    slug = args.slug or slugify(source.stem)
    text_out = repo_root / "web" / "src" / "data" / "articles" / f"{slug}.txt"
    tts_out = repo_root / "web" / "src" / "data" / "articles" / f"{slug}-tts.txt"
    audio_out = repo_root / "web" / "public" / "audio" / f"{slug}.mp3"
    text_out.parent.mkdir(parents=True, exist_ok=True)
    audio_out.parent.mkdir(parents=True, exist_ok=True)
    text_out.write_text(display_text, encoding="utf-8")
    tts_out.write_text(tts_text, encoding="utf-8")

    api_key = read_env_key(repo_root)
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not found (env var or doc-review/.env)")

    audio_bytes = synthesize_tts_mp3(
        text=tts_text, api_key=api_key, model=args.model, voice=args.voice
    )
    audio_out.write_bytes(audio_bytes)
    print(f"TEXT={text_out}")
    print(f"TTS_TEXT={tts_out}")
    print(f"AUDIO={audio_out}")
    print(f"SLUG={slug}")
    if metadata.title:
        print(f"TITLE={metadata.title}")
    if metadata.published:
        print(f"PUBLISHED={metadata.published}")
    if metadata.author:
        print(f"AUTHOR={metadata.author}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
