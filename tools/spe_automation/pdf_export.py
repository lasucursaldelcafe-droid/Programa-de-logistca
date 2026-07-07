from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from .config import FALTANTES_MD, INFORME_HTML, INFORME_PDF, ROOT, find_chrome, is_windows


def generate_pdf_from_html(html_path: Path, pdf_path: Path) -> tuple[bool, str]:
    if not html_path.is_file():
        return False, f"No existe: {html_path}"

    chrome = find_chrome()
    if not chrome:
        return False, "Instala Google Chrome o Microsoft Edge para generar PDF."

    user_data = Path(tempfile.mkdtemp(prefix="spe-pdf-"))
    url = html_path.resolve().as_uri()

    cmd = [
        str(chrome),
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox" if not is_windows() else "--disable-features=Translate",
        f"--user-data-dir={user_data}",
        f"--print-to-pdf={pdf_path.resolve()}",
        "--no-pdf-header-footer",
        url,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if pdf_path.is_file() and pdf_path.stat().st_size > 1000:
            return True, f"PDF generado: {pdf_path}"
        err = (result.stderr or result.stdout or "").strip()
        return False, err or "Chrome no generó el PDF."
    except subprocess.TimeoutExpired:
        return False, "Tiempo agotado generando PDF."
    except OSError as e:
        return False, str(e)


def generate_informe_pdf() -> tuple[bool, str]:
    return generate_pdf_from_html(INFORME_HTML, INFORME_PDF)


def generate_faltantes_html() -> tuple[bool, str]:
    if not FALTANTES_MD.is_file():
        return False, f"No existe: {FALTANTES_MD}"

    md = FALTANTES_MD.read_text(encoding="utf-8")
    body = _md_to_simple_html(md)
    out = ROOT / "REPORTE-FALTANTES-SPE.html"
    html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Reporte de faltantes — SPE</title>
<style>
body{{font-family:Segoe UI,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#1e293b;line-height:1.55}}
h1{{color:#b45309;border-bottom:3px solid #f59e0b;padding-bottom:.5rem}}
h2{{color:#0f172a;margin-top:1.5rem;border-left:4px solid #f59e0b;padding-left:.5rem}}
h3{{color:#d97706}}
table{{border-collapse:collapse;width:100%;margin:1rem 0;font-size:.9rem}}
th,td{{border:1px solid #e2e8f0;padding:.45rem .6rem;text-align:left}}
th{{background:#0f172a;color:#fff}}
tr:nth-child(even) td{{background:#f8fafc}}
code{{background:#f1f5f9;padding:.1rem .3rem;border-radius:3px;color:#b45309}}
pre{{background:#f1f5f9;border-left:3px solid #f59e0b;padding:.75rem;white-space:pre-wrap}}
ul{{padding-left:1.25rem}}
</style></head><body>{body}</body></html>"""
    out.write_text(html, encoding="utf-8")
    return True, f"HTML generado: {out}"


def generate_faltantes_pdf() -> tuple[bool, str]:
    ok, msg = generate_faltantes_html()
    if not ok:
        return ok, msg
    html = ROOT / "REPORTE-FALTANTES-SPE.html"
    pdf = ROOT / "REPORTE-FALTANTES-SPE.pdf"
    return generate_pdf_from_html(html, pdf)


def _md_to_simple_html(md: str) -> str:
    lines = md.splitlines()
    out: list[str] = []
    in_table = False
    in_code = False
    in_ul = False

    for line in lines:
        if line.strip().startswith("```"):
            if in_code:
                out.append("</pre>")
                in_code = False
            else:
                if in_ul:
                    out.append("</ul>")
                    in_ul = False
                out.append("<pre>")
                in_code = True
            continue
        if in_code:
            out.append(line.replace("&", "&amp;").replace("<", "&lt;"))
            continue

        if "|" in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(set(c) <= {"-", ":", " "} for c in cells):
                continue
            if not in_table:
                if in_ul:
                    out.append("</ul>")
                    in_ul = False
                out.append("<table>")
                tag = "th"
                in_table = True
            else:
                tag = "td"
            row = "".join(f"<{tag}>{_esc(c)}</{tag}>" for c in cells)
            out.append(f"<tr>{row}</tr>")
            continue
        elif in_table:
            out.append("</table>")
            in_table = False

        if line.startswith("# "):
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<h1>{_esc(line[2:].strip())}</h1>")
        elif line.startswith("## "):
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<h2>{_esc(line[3:].strip())}</h2>")
        elif line.startswith("### "):
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<h3>{_esc(line[4:].strip())}</h3>")
        elif line.strip().startswith("- "):
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            text = _inline_md(line.strip()[2:])
            out.append(f"<li>{text}</li>")
        elif line.strip().startswith("[ ]") or line.strip().startswith("[x]"):
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            mark = "✓" if "[x]" in line[:4] else "○"
            text = _inline_md(line.strip()[4:].strip())
            out.append(f"<li>{mark} {text}</li>")
        elif line.strip() == "---":
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append("<hr/>")
        elif line.strip():
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<p>{_inline_md(line.strip())}</p>")

    if in_table:
        out.append("</table>")
    if in_ul:
        out.append("</ul>")
    if in_code:
        out.append("</pre>")
    return "\n".join(out)


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _inline_md(s: str) -> str:
    s = _esc(s)
    s = re_sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re_sub(r"`([^`]+)`", r"<code>\1</code>", s)
    return s


def re_sub(pattern: str, repl: str, s: str) -> str:
    import re
    return re.sub(pattern, repl, s)
