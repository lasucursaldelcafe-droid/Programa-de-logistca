#!/usr/bin/env python3
"""
SPE Toolkit — Aplicación Windows (tkinter)
Automatiza Firebase, informes PDF, desarrollo y diagnóstico.
"""
from __future__ import annotations

import queue
import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext, ttk

# Asegurar import del paquete
TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from spe_automation.config import FIREBASE_KEYS, OPTIONAL_KEYS, ROOT, find_chrome  # noqa: E402
from spe_automation.env_manager import (  # noqa: E402
    apply_firebase_to_all_apps,
    github_secrets_template,
    parse_env,
)
from spe_automation.health import run_health_report  # noqa: E402
from spe_automation.pdf_export import generate_faltantes_pdf, generate_informe_pdf  # noqa: E402

REPO_ROOT = ROOT
FIREBASE_KEYS = [*FIREBASE_KEYS, *OPTIONAL_KEYS]


class SpeToolkitApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("SPE Toolkit — Programa de Logística")
        self.geometry("920x640")
        self.minsize(800, 520)

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.firebase_vars: dict[str, tk.StringVar] = {}

        self._build_ui()
        self._poll_log()

    def _build_ui(self) -> None:
        header = ttk.Frame(self, padding=10)
        header.pack(fill=tk.X)
        ttk.Label(
            header,
            text="SPE Toolkit",
            font=("Segoe UI", 16, "bold"),
        ).pack(side=tk.LEFT)
        ttk.Label(
            header,
            text=str(REPO_ROOT),
            font=("Segoe UI", 9),
            foreground="#555",
        ).pack(side=tk.LEFT, padx=(12, 0))

        notebook = ttk.Notebook(self)
        notebook.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

        self._tab_firebase(notebook)
        self._tab_informes(notebook)
        self._tab_dev(notebook)
        self._tab_health(notebook)

        log_frame = ttk.LabelFrame(self, text="Registro de actividad", padding=4)
        log_frame.pack(fill=tk.BOTH, expand=False, padx=8, pady=(0, 8))
        self.log_text = scrolledtext.ScrolledText(
            log_frame, height=8, font=("Consolas", 9), state=tk.DISABLED
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)

    def _tab_firebase(self, notebook: ttk.Notebook) -> None:
        frame = ttk.Frame(notebook, padding=12)
        notebook.add(frame, text="Firebase")

        ttk.Label(
            frame,
            text="Configura .env.local en admin, master y worker.\n"
            "Los mismos valores van a GitHub Secrets para producción.",
            wraplength=800,
        ).pack(anchor=tk.W, pady=(0, 8))

        form = ttk.Frame(frame)
        form.pack(fill=tk.X)

        existing = parse_env(REPO_ROOT / "apps" / "admin" / ".env.local")
        labels = {
            "VITE_FIREBASE_API_KEY": "API Key",
            "VITE_FIREBASE_AUTH_DOMAIN": "Auth Domain",
            "VITE_FIREBASE_PROJECT_ID": "Project ID",
            "VITE_FIREBASE_STORAGE_BUCKET": "Storage Bucket",
            "VITE_FIREBASE_MESSAGING_SENDER_ID": "Messaging Sender ID",
            "VITE_FIREBASE_APP_ID": "App ID",
            "VITE_FIREBASE_VAPID_KEY": "VAPID Key (opcional)",
        }

        for i, key in enumerate(FIREBASE_KEYS):
            ttk.Label(form, text=labels.get(key, key), width=22).grid(
                row=i, column=0, sticky=tk.W, pady=2
            )
            var = tk.StringVar(value=existing.get(key, ""))
            self.firebase_vars[key] = var
            entry = ttk.Entry(form, textvariable=var, width=70)
            entry.grid(row=i, column=1, sticky=tk.EW, pady=2, padx=(4, 0))
            if "API_KEY" in key:
                entry.config(show="*")

        form.columnconfigure(1, weight=1)

        btn_row = ttk.Frame(frame)
        btn_row.pack(fill=tk.X, pady=12)
        ttk.Button(btn_row, text="Guardar en apps", command=self._save_firebase).pack(
            side=tk.LEFT, padx=(0, 8)
        )
        ttk.Button(
            btn_row, text="Plantilla GitHub Secrets", command=self._show_github_template
        ).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(btn_row, text="Abrir Firebase Console", command=self._open_firebase).pack(
            side=tk.LEFT
        )

    def _tab_informes(self, notebook: ttk.Notebook) -> None:
        frame = ttk.Frame(notebook, padding=12)
        notebook.add(frame, text="Informes PDF")

        ttk.Label(
            frame,
            text="Genera PDFs de presentación desde los informes HTML del proyecto.",
        ).pack(anchor=tk.W, pady=(0, 12))

        ttk.Button(
            frame,
            text="Generar INFORME-REVISION-SPE.pdf",
            command=lambda: self._run_async(self._task_informe_pdf),
        ).pack(anchor=tk.W, pady=4)

        ttk.Button(
            frame,
            text="Generar REPORTE-FALTANTES-SPE.pdf",
            command=lambda: self._run_async(self._task_faltantes_pdf),
        ).pack(anchor=tk.W, pady=4)

        ttk.Button(
            frame,
            text="Abrir carpeta del proyecto",
            command=lambda: self._open_folder(REPO_ROOT),
        ).pack(anchor=tk.W, pady=12)

        chrome = find_chrome()
        status = f"Chrome: {chrome}" if chrome else "Chrome: no detectado (instala Google Chrome)"
        ttk.Label(frame, text=status, foreground="#666").pack(anchor=tk.W)

    def _tab_dev(self, notebook: ttk.Notebook) -> None:
        frame = ttk.Frame(notebook, padding=12)
        notebook.add(frame, text="Desarrollo")

        scripts = [
            ("npm install", "Instalar dependencias"),
            ("npm run dev:full", "Servidor desarrollo (admin+master+worker)"),
            ("npm run build", "Build producción"),
            ("npm run build:pages", "Build GitHub Pages"),
            ("npm run desktop", "App escritorio Electron"),
            ("npm run pdf:informe", "PDF informe (Node)"),
        ]

        for cmd, label in scripts:
            ttk.Button(
                frame,
                text=label,
                command=lambda c=cmd: self._run_async(lambda: self._run_npm(c)),
            ).pack(anchor=tk.W, pady=3, fill=tk.X)

        ttk.Separator(frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=12)
        ttk.Button(
            frame,
            text="Abrir apps/admin en explorador",
            command=lambda: self._open_folder(REPO_ROOT / "apps" / "admin"),
        ).pack(anchor=tk.W, pady=3)

    def _tab_health(self, notebook: ttk.Notebook) -> None:
        frame = ttk.Frame(notebook, padding=12)
        notebook.add(frame, text="Diagnóstico")

        ttk.Button(
            frame,
            text="Ejecutar diagnóstico completo",
            command=lambda: self._run_async(self._task_health),
        ).pack(anchor=tk.W, pady=4)

        self.health_text = scrolledtext.ScrolledText(
            frame, height=22, font=("Consolas", 9), state=tk.DISABLED
        )
        self.health_text.pack(fill=tk.BOTH, expand=True, pady=8)

    def _log(self, msg: str) -> None:
        self.log_queue.put(msg)

    def _poll_log(self) -> None:
        while True:
            try:
                msg = self.log_queue.get_nowait()
            except queue.Empty:
                break
            self.log_text.config(state=tk.NORMAL)
            self.log_text.insert(tk.END, msg + "\n")
            self.log_text.see(tk.END)
            self.log_text.config(state=tk.DISABLED)
        self.after(100, self._poll_log)

    def _run_async(self, fn) -> None:
        def worker() -> None:
            try:
                fn()
            except Exception as exc:
                self._log(f"ERROR: {exc}")
                self.after(0, lambda: messagebox.showerror("Error", str(exc)))

        threading.Thread(target=worker, daemon=True).start()

    def _save_firebase(self) -> None:
        values = {k: v.get().strip() for k, v in self.firebase_vars.items()}
        required = [k for k in FIREBASE_KEYS if k != "VITE_FIREBASE_VAPID_KEY"]
        missing = [k for k in required if not values.get(k)]
        if missing:
            messagebox.showwarning(
                "Campos vacíos",
                "Completa al menos:\n" + "\n".join(missing),
            )
            return
        paths = apply_firebase_to_all_apps(values)
        self._log("Firebase guardado en:")
        for p in paths:
            self._log(f"  {p}")
        messagebox.showinfo("Listo", "Credenciales guardadas en las 3 apps.")

    def _show_github_template(self) -> None:
        values = {k: v.get().strip() for k, v in self.firebase_vars.items()}
        tpl = github_secrets_template(values)
        win = tk.Toplevel(self)
        win.title("GitHub Secrets")
        win.geometry("700x400")
        txt = scrolledtext.ScrolledText(win, font=("Consolas", 9))
        txt.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        txt.insert(tk.END, tpl)
        ttk.Button(
            win,
            text="Copiar al portapapeles",
            command=lambda: (self.clipboard_clear(), self.clipboard_append(tpl)),
        ).pack(pady=4)

    def _open_firebase(self) -> None:
        import webbrowser

        webbrowser.open("https://console.firebase.google.com/")

    def _open_folder(self, path: Path) -> None:
        if sys.platform == "win32":
            subprocess.Popen(["explorer", str(path)])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(path)])
        else:
            subprocess.Popen(["xdg-open", str(path)])

    def _run_npm(self, cmd: str) -> None:
        self._log(f"> {cmd}")
        proc = subprocess.Popen(
            cmd,
            shell=True,
            cwd=str(REPO_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            self._log(line.rstrip())
        proc.wait()
        self._log(f"Exit code: {proc.returncode}")

    def _task_informe_pdf(self) -> None:
        self._log("Generando informe PDF...")
        ok, msg = generate_informe_pdf()
        self._log(msg)
        if ok:
            self.after(0, lambda: messagebox.showinfo("PDF listo", msg))
        else:
            self.after(0, lambda: messagebox.showerror("Error PDF", msg))

    def _task_faltantes_pdf(self) -> None:
        self._log("Generando reporte faltantes PDF...")
        ok, msg = generate_faltantes_pdf()
        self._log(msg)
        if ok:
            self.after(0, lambda: messagebox.showinfo("PDF listo", msg))
        else:
            self.after(0, lambda: messagebox.showerror("Error PDF", msg))

    def _task_health(self) -> None:
        self._log("Ejecutando diagnóstico...")
        report = run_health_report()
        lines = []
        for section in ("node", "firebase", "site", "chrome"):
            r = report[section]
            mark = "OK" if r["ok"] else "FAIL"
            lines.append(f"[{mark:4}] {section}: {r['message']}")
        lines.append("\nArtefactos:")
        for a in report["artifacts"]:
            mark = "OK" if a["ok"] else "MISS"
            lines.append(f"  [{mark}] {a['name']}")
        summary = "\n".join(lines)

        def update() -> None:
            self.health_text.config(state=tk.NORMAL)
            self.health_text.delete("1.0", tk.END)
            self.health_text.insert(tk.END, summary)
            self.health_text.config(state=tk.DISABLED)

        self.after(0, update)
        self._log("Diagnóstico completado.")


def main() -> int:
    app = SpeToolkitApp()
    app.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
