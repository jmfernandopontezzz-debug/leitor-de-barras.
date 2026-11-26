import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as Switch from "@radix-ui/react-switch";
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Download,
  Flashlight,
  FlashlightOff,
  Keyboard,
  Plus,
  ScanBarcode,
  ScanLine,
  Trash2,
} from "lucide-react";
import { beep, unlockBeep } from "@/lib/beep";
import { cameraErrorMessage, decodePhoto, preloadScanner, startScanner, type ScannerSession } from "@/lib/scanner";
import {
  MAX_ROWS,
  cleanCode,
  formatClock,
  loadRows,
  loadSkipDupes,
  makeRow,
  saveRows,
  saveSkipDupes,
  type ScanRow,
} from "@/lib/scans";

const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 4, 1, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1];

export function ReaderApp() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [skipDupes, setSkipDupes] = useState(false);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Aponte a câmera ou digite um código.");
  const [phase, setPhase] = useState<"idle" | "starting" | "live">("idle");
  const [torchOn, setTorchOn] = useState(false);
  const [torchOk, setTorchOk] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hitFlash, setHitFlash] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [busyExport, setBusyExport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<ScannerSession | null>(null);
  const generation = useRef(0);
  const rowsRef = useRef(rows);
  const skipRef = useRef(skipDupes);
  const lastCode = useRef("");
  const lastAt = useRef(0);
  const cooldownUntil = useRef(0);
  const endRef = useRef<HTMLTableRowElement>(null);
  const onHitRef = useRef<(code: string, format: string) => void>(() => {});

  useEffect(() => {
    const unlock = () => unlockBeep();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    preloadScanner();
    const loaded = loadRows();
    rowsRef.current = loaded;
    setRows(loaded);
    setSkipDupes(loadSkipDupes());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveRows(rows);
  }, [rows, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSkipDupes(skipDupes);
  }, [skipDupes, hydrated]);

  useEffect(() => {
    skipRef.current = skipDupes;
  }, [skipDupes]);

  useEffect(() => {
    if (!hydrated || rows.length === 0) return;
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [rows.length, hydrated]);

  useEffect(() => {
    return () => {
      generation.current += 1;
      sessionRef.current?.stop();
    };
  }, []);

  function updateRows(recipe: (prev: ScanRow[]) => ScanRow[]) {
    setRows((prev) => {
      const next = recipe(prev);
      rowsRef.current = next;
      return next;
    });
  }

  onHitRef.current = (raw, format) => {
    const code = cleanCode(raw);
    if (!code || code.length > 2000) return;
    const now = Date.now();
    if (now < cooldownUntil.current) return;
    if (code === lastCode.current && now - lastAt.current < 2200) return;
    lastCode.current = code;
    lastAt.current = now;
    if (skipRef.current && rowsRef.current.some((row) => row.code === code)) {
      cooldownUntil.current = now + 900;
      setStatus("Esse código já está na planilha.");
      return;
    }
    if (rowsRef.current.length >= MAX_ROWS) {
      cooldownUntil.current = now + 1500;
      setStatus("A planilha chegou a 2.000 linhas. Baixe o .docx e limpe para continuar.");
      return;
    }
    const row = makeRow(code, format);
    cooldownUntil.current = now + 900;
    const next = [...rowsRef.current, row];
    rowsRef.current = next;
    setRows(next);
    setFreshId(row.id);
    setStatus(`Linha adicionada: ${code}`);
    setHitFlash(true);
    window.setTimeout(() => setHitFlash(false), 360);
    beep();
    navigator.vibrate?.(28);
  };

  async function toggleCamera() {
    unlockBeep();
    if (phase !== "idle") {
      generation.current += 1;
      sessionRef.current?.stop();
      sessionRef.current = null;
      setPhase("idle");
      setTorchOn(false);
      setTorchOk(false);
      setStatus("Câmera desligada.");
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    const gen = ++generation.current;
    setCameraError(null);
    setPhase("starting");
    setStatus("Abrindo a câmera…");
    try {
      const session = await startScanner(video, (hit) => onHitRef.current(hit.code, hit.format));
      if (generation.current !== gen) {
        session.stop();
        return;
      }
      sessionRef.current = session;
      setTorchOk(session.torchAvailable);
      setPhase("live");
      setStatus("Aponte para o código. Cada leitura entra numa linha.");
    } catch (err) {
      if (generation.current !== gen) return;
      sessionRef.current = null;
      setPhase("idle");
      setTorchOk(false);
      const message = cameraErrorMessage(err);
      setCameraError(message);
      setStatus(message);
    }
  }

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    unlockBeep();
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCameraError(null);
    setStatus("Lendo a foto…");
    try {
      const hit = await decodePhoto(file);
      if (!hit) {
        const message = "Não achei um código nessa foto. Aproxime e tente de novo.";
        setCameraError(message);
        setStatus(message);
        return;
      }
      onHitRef.current(hit.code, hit.format);
    } catch {
      const message = "Não consegui ler essa foto. Tente outra vez.";
      setCameraError(message);
      setStatus(message);
    }
  }

  async function toggleTorch() {
    const session = sessionRef.current;
    if (!session?.torchAvailable) return;
    const next = !torchOn;
    try {
      const ok = await session.setTorch(next);
      if (ok) setTorchOn(next);
    } catch {
      setStatus("A lanterna não está disponível nesta câmera.");
      setTorchOk(false);
      setTorchOn(false);
    }
  }

  function addManual() {
    const parts = draft
      .split(/[\n,;]+/)
      .map((part) => cleanCode(part))
      .filter((part) => part.length > 0 && part.length <= 2000);
    if (parts.length === 0) {
      setStatus("Digite ou cole pelo menos um código.");
      return;
    }
    let added = 0;
    let skipped = 0;
    const next = [...rowsRef.current];
    for (const code of parts) {
      if (next.length >= MAX_ROWS) {
        skipped += 1;
        continue;
      }
      if (skipDupes && next.some((row) => row.code === code)) {
        skipped += 1;
        continue;
      }
      next.push(makeRow(code, "manual"));
      added += 1;
    }
    rowsRef.current = next;
    setRows(next);
    setDraft("");
    setConfirmClear(false);
    if (added === 0) {
      setStatus(skipped > 0 ? "Nada novo para adicionar." : "Não deu para adicionar.");
      return;
    }
    beep();
    const noun = added === 1 ? "linha adicionada" : "linhas adicionadas";
    setStatus(skipped > 0 ? `${added} ${noun}. ${skipped} ignorada(s).` : `${added} ${noun}.`);
  }

  function removeRow(id: string) {
    updateRows((prev) => prev.filter((row) => row.id !== id));
    if (editingId === id) setEditingId(null);
    setStatus("Linha apagada.");
  }

  function commitEdit(id: string) {
    const code = cleanCode(editValue);
    if (!code) {
      setStatus("O código não pode ficar vazio.");
      return;
    }
    if (skipDupes && rows.some((row) => row.id !== id && row.code === code)) {
      setStatus("Esse código já está na planilha.");
      return;
    }
    updateRows((prev) => prev.map((row) => (row.id === id ? { ...row, code } : row)));
    setEditingId(null);
    setStatus("Código atualizado.");
  }

  async function copyList() {
    if (rows.length === 0) return;
    try {
      await navigator.clipboard.writeText(rows.map((row) => row.code).join("\n"));
      setStatus("Códigos copiados, um por linha.");
    } catch {
      setStatus("Não foi possível copiar. Baixe o .docx.");
    }
  }

  async function download() {
    if (rows.length === 0 || busyExport) return;
    setBusyExport(true);
    try {
      const { exportDocx } = await import("@/lib/export-docx");
      const result = await exportDocx(rows);
      if (result === "cancelled") setStatus("Exportação cancelada.");
      else if (result === "shared") setStatus("Planilha .docx pronta para salvar ou enviar.");
      else setStatus("Download da planilha .docx iniciado.");
    } catch {
      setStatus("Não foi possível gerar o documento.");
    } finally {
      setBusyExport(false);
    }
  }

  function clearAll() {
    updateRows(() => []);
    setConfirmClear(false);
    setEditingId(null);
    setFreshId(null);
    setStatus("Planilha limpa.");
  }

  const countLabel = rows.length === 1 ? "1 linha" : `${rows.length} linhas`;

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 pt-5 pb-40 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:px-6 lg:pt-8 lg:pb-36">
        <section className="grid gap-4">
          <header className="grid gap-2">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-raised text-primary">
                <ScanBarcode className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted">No celular</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight">Leitor de Barras</h1>
              </div>
            </div>
            <p className="max-w-md text-pretty text-muted">
              Cada leitura entra numa linha. No fim, baixe a planilha em Word (.docx), com um código
              abaixo do outro.
            </p>
          </header>

          <div
            className={`viewfinder relative overflow-hidden rounded-card border border-line bg-surface ${hitFlash ? "is-hit" : ""}`}
          >
            <video
              ref={videoRef}
              className="finder w-full bg-bg object-cover"
              playsInline
              muted
              autoPlay
            />
            {phase !== "live" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface px-6">
                <div className="flex h-16 items-stretch gap-px" aria-hidden="true">
                  {BARS.map((weight, index) => (
                    <span
                      key={index}
                      className={`bg-fg/80 ${weight === 1 ? "w-px" : weight === 2 ? "w-0.5" : weight === 3 ? "w-1" : "w-1.5"}`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-muted">
                  {phase === "starting" ? "Pedindo acesso à câmera…" : "Câmera pronta para ligar"}
                </p>
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-8">
                  <span className="absolute top-0 left-0 size-7 border-t-2 border-l-2 border-primary" />
                  <span className="absolute top-0 right-0 size-7 border-t-2 border-r-2 border-primary" />
                  <span className="absolute bottom-0 left-0 size-7 border-b-2 border-l-2 border-primary" />
                  <span className="absolute right-0 bottom-0 size-7 border-r-2 border-b-2 border-primary" />
                  <span className="laser-line" />
                </div>
                {hitFlash ? (
                  <span className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-ink">
                    <Check className="size-4" aria-hidden="true" />
                    Lido
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void toggleCamera()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-ink"
            >
              {phase === "idle" ? (
                <Camera className="size-5" aria-hidden="true" />
              ) : (
                <CameraOff className="size-5" aria-hidden="true" />
              )}
              {phase === "idle" ? "Ligar câmera" : phase === "starting" ? "Cancelar" : "Parar"}
            </button>
            {phase === "live" ? (
              <button
                type="button"
                onClick={() => void toggleTorch()}
                disabled={!torchOk}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-fg disabled:opacity-40"
              >
                {torchOn ? (
                  <FlashlightOff className="size-5" aria-hidden="true" />
                ) : (
                  <Flashlight className="size-5" aria-hidden="true" />
                )}
                Lanterna
              </button>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-fg"
              >
                <ScanLine className="size-5" aria-hidden="true" />
                Tirar foto
              </button>
            )}
          </div>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void onPhoto(event)}
          />

          {cameraError ? (
            <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-fg" role="alert">
              {cameraError}
            </p>
          ) : null}

          <form
            className="grid gap-2 rounded-card border border-line bg-surface p-3"
            onSubmit={(event) => {
              event.preventDefault();
              addManual();
            }}
          >
            <label htmlFor="manual-code" className="flex items-center gap-2 text-sm font-medium">
              <Keyboard className="size-4 text-muted" aria-hidden="true" />
              Digitar ou colar
            </label>
            <textarea
              id="manual-code"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              enterKeyHint="done"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Um código, ou vários — um por linha"
              className="min-h-16 w-full resize-y rounded-xl border border-line bg-bg px-3 py-2 font-mono text-base text-fg placeholder:text-muted"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-fg"
            >
              <Plus className="size-5" aria-hidden="true" />
              Adicionar à planilha
            </button>
          </form>

          <label className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3 py-3">
            <span className="text-sm">
              <span className="block font-medium">Não repetir código</span>
              <span className="text-muted">Se estiver ligado, o mesmo código entra só uma vez.</span>
            </span>
            <Switch.Root
              checked={skipDupes}
              onCheckedChange={setSkipDupes}
              className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors data-[state=checked]:bg-primary"
              aria-label="Não repetir código"
            >
              <Switch.Thumb className="absolute top-1 block size-5 translate-x-1 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary-ink" />
            </Switch.Root>
          </label>
        </section>

        <section className="overflow-hidden rounded-card border border-sheet-line bg-sheet text-sheet-ink shadow-lg">
          <div className="flex items-end justify-between gap-3 border-b border-sheet-line bg-sheet-head px-4 py-3">
            <div>
              <h2 className="font-display text-xl font-semibold">Planilha</h2>
              <p className="text-sm text-sheet-muted">Um código por linha, na ordem da leitura.</p>
            </div>
            <p className="font-mono text-sm font-semibold text-sheet-ink tabular-nums">{countLabel}</p>
          </div>
          {!hydrated ? (
            <p className="px-4 py-10 text-center text-sm text-sheet-muted">Abrindo a planilha…</p>
          ) : rows.length === 0 ? (
            <div className="grid gap-2 px-4 py-12 text-center">
              <p className="font-display text-lg font-semibold">Nenhuma leitura ainda</p>
              <p className="text-sm text-pretty text-sheet-muted">
                Ligue a câmera traseira ou digite o código. As linhas ficam salvas neste aparelho.
              </p>
            </div>
          ) : (
            <div className="sheet-scroll overflow-auto">
              <table className="w-full border-collapse text-left" aria-label="Planilha de códigos lidos">
                <thead className="sticky top-0 bg-sheet-head text-xs font-semibold tracking-wide text-sheet-muted uppercase">
                  <tr>
                    <th className="w-12 px-3 py-2 font-medium">Nº</th>
                    <th className="px-3 py-2 font-medium">Código</th>
                    <th className="w-24 px-3 py-2 font-medium">Hora</th>
                    <th className="w-12 px-2 py-2">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const fresh = row.id === freshId;
                    return (
                      <tr
                        key={row.id}
                        className={`border-t border-sheet-line ${fresh ? "bg-sheet-fresh" : index % 2 === 1 ? "bg-sheet-head/60" : "bg-sheet"}`}
                      >
                        <td className="px-3 py-2 font-mono text-sm text-sheet-muted tabular-nums">{index + 1}</td>
                        <td className="px-3 py-2">
                          {editingId === row.id ? (
                            <form
                              className="flex gap-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                commitEdit(row.id);
                              }}
                            >
                              <input
                                value={editValue}
                                onChange={(event) => setEditValue(event.target.value)}
                                autoFocus
                                aria-label={`Editar código ${row.code}`}
                                className="min-h-11 w-full rounded-lg border border-sheet-line bg-sheet px-2 font-mono text-base text-sheet-ink"
                              />
                              <button
                                type="submit"
                                className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-ink"
                              >
                                Ok
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(row.id);
                                setEditValue(row.code);
                              }}
                              aria-label={`Corrigir ${row.code}`}
                              className="block w-full text-left"
                            >
                              <span className="block font-mono text-sm font-medium break-all text-sheet-ink">
                                {row.code}
                              </span>
                              <span className="text-xs text-sheet-muted">{row.format}</span>
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-sheet-muted tabular-nums">
                          {formatClock(row.scannedAt)}
                        </td>
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            aria-label={`Apagar ${row.code}`}
                            className="inline-flex size-11 items-center justify-center rounded-lg text-sheet-danger"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr ref={endRef} aria-hidden="true" />
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl">
          <p className="mb-2 text-center text-sm text-muted lg:text-left" aria-live="polite">
            {status}
          </p>
          {confirmClear ? (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/40 bg-surface px-3 py-2">
              <p className="text-sm">Apagar todas as {rows.length} linhas?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex min-h-11 items-center rounded-xl bg-danger-strong px-4 text-sm font-semibold text-on-danger"
                >
                  Apagar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="inline-flex min-h-11 items-center rounded-xl bg-raised px-4 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void download()}
              disabled={rows.length === 0 || busyExport}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-ink disabled:opacity-40 sm:col-span-1"
            >
              <Download className="size-5" aria-hidden="true" />
              {busyExport ? "Gerando…" : "Baixar .docx"}
            </button>
            <button
              type="button"
              onClick={() => void copyList()}
              disabled={rows.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold disabled:opacity-40"
            >
              <Copy className="size-5" aria-hidden="true" />
              Copiar
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={rows.length === 0 || confirmClear}
              className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-danger disabled:opacity-40 sm:col-span-1"
            >
              <Trash2 className="size-5" aria-hidden="true" />
              Limpar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
