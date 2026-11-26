import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Plus, c as FlashlightOff, d as Check, f as Camera, i as ScanBarcode, l as Download, n as Trash2, o as Keyboard, p as CameraOff, r as ScanLine, s as Flashlight, u as Copy } from "../_libs/lucide-react.mjs";
import { n as SwitchThumb, t as Switch } from "../_libs/@radix-ui/react-switch+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-xGz6QilM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var MAX_ROWS = 2e3;
var ROWS_KEY = "leitor-barras.rows.v1";
var SKIP_KEY = "leitor-barras.skip-dupes.v1";
var LABELS = {
	AZTEC: "Aztec",
	CODABAR: "Codabar",
	CODE_39: "Code 39",
	CODE_93: "Code 93",
	CODE_128: "Code 128",
	DATA_MATRIX: "Data Matrix",
	EAN_8: "EAN-8",
	EAN_13: "EAN-13",
	ITF: "ITF",
	MAXICODE: "MaxiCode",
	PDF_417: "PDF417",
	QR_CODE: "QR",
	RSS_14: "RSS-14",
	RSS_EXPANDED: "RSS Expanded",
	UPC_A: "UPC-A",
	UPC_E: "UPC-E",
	UPC_EAN_EXTENSION: "Extensão",
	MICRO_QR_CODE: "Micro QR",
	MANUAL: "Digitado",
	CODIGO: "Código"
};
function formatLabel(raw) {
	return LABELS[raw.trim().toUpperCase().replace(/[\s-]+/g, "_")] ?? titleCase(raw.replaceAll("_", " "));
}
function titleCase(value) {
	if (!value) return "Código";
	return value.toLowerCase().split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function cleanCode(raw) {
	return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}
function makeRow(code, format) {
	return {
		id: crypto.randomUUID(),
		code,
		format: formatLabel(format),
		scannedAt: Date.now()
	};
}
function isRow(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return typeof row.id === "string" && typeof row.code === "string" && typeof row.format === "string" && typeof row.scannedAt === "number";
}
function loadRows() {
	try {
		const raw = localStorage.getItem(ROWS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isRow).slice(0, MAX_ROWS);
	} catch {
		return [];
	}
}
function saveRows(rows) {
	localStorage.setItem(ROWS_KEY, JSON.stringify(rows.slice(0, MAX_ROWS)));
}
function loadSkipDupes() {
	return localStorage.getItem(SKIP_KEY) === "1";
}
function saveSkipDupes(skip) {
	localStorage.setItem(SKIP_KEY, skip ? "1" : "0");
}
function formatClock(ts, now = Date.now()) {
	const date = new Date(ts);
	const time = new Intl.DateTimeFormat("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(date);
	if (new Date(now).toDateString() === date.toDateString()) return time;
	return `${new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit"
	}).format(date)} ${time}`;
}
function formatFull(ts) {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(new Date(ts));
}
function fileStamp(date = /* @__PURE__ */ new Date()) {
	const pad = (n) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}
var audioCtx = null;
function beep() {
	try {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		if (!Ctx) return;
		audioCtx ??= new Ctx();
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "sine";
		osc.frequency.value = 880;
		gain.gain.value = .045;
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		const now = audioCtx.currentTime;
		gain.gain.setValueAtTime(.045, now);
		gain.gain.exponentialRampToValueAtTime(1e-4, now + .12);
		osc.start(now);
		osc.stop(now + .13);
	} catch {}
}
var ZXING_NAMES = [
	"AZTEC",
	"CODABAR",
	"CODE_39",
	"CODE_93",
	"CODE_128",
	"DATA_MATRIX",
	"EAN_8",
	"EAN_13",
	"ITF",
	"MAXICODE",
	"PDF_417",
	"QR_CODE",
	"RSS_14",
	"RSS_EXPANDED",
	"UPC_A",
	"UPC_E",
	"UPC_EAN_EXTENSION",
	"MICRO_QR_CODE"
];
function inFrame() {
	try {
		return window.top !== window.self;
	} catch {
		return true;
	}
}
function preloadScanner() {
	if (typeof window === "undefined") return;
	if (!("BarcodeDetector" in window)) import("../_libs/@zxing/browser+[...].mjs").then((n) => n.t);
}
function cameraErrorMessage(err) {
	const name = err instanceof DOMException ? err.name : "";
	if (name === "NotAllowedError" || name === "PermissionDeniedError") {
		if (inFrame()) return "Aqui a câmera ao vivo fica bloqueada. Toque em Tirar foto — abre a câmera do celular. No app publicado, use o Safari ou o Chrome.";
		return "O navegador bloqueou a câmera. Toque em Tirar foto, ou permita a câmera nas configurações do site e tente de novo.";
	}
	if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Não achei uma câmera ao vivo. Toque em Tirar foto para usar a câmera do celular.";
	if (name === "NotReadableError" || name === "TrackStartError") return "A câmera está ocupada por outro aplicativo. Feche-o, ou toque em Tirar foto.";
	if (name === "SecurityError" || typeof window !== "undefined" && !window.isSecureContext) return "A câmera só abre numa página segura. Publique o app e abra o link no celular.";
	return "Não foi possível abrir a câmera ao vivo. Toque em Tirar foto para usar a câmera do celular.";
}
function detectorCtor() {
	return window.BarcodeDetector ?? null;
}
function formatFromZxing(format) {
	return typeof format === "number" ? ZXING_NAMES[format] ?? "CODIGO" : "CODIGO";
}
async function openCamera() {
	if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("Sem câmera", "NotFoundError");
	if (!window.isSecureContext) throw new DOMException("Insegura", "SecurityError");
	const attempts = [
		{ facingMode: { ideal: "environment" } },
		{ facingMode: "environment" },
		true
	];
	let last;
	for (const video of attempts) try {
		return await navigator.mediaDevices.getUserMedia({
			audio: false,
			video
		});
	} catch (err) {
		last = err;
		const name = err instanceof DOMException ? err.name : "";
		if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError" || name === "NotReadableError" || name === "TrackStartError") throw err;
	}
	throw last instanceof Error ? last : new DOMException("Sem câmera", "NotFoundError");
}
function stopStream(video) {
	const stream = video.srcObject;
	if (stream instanceof MediaStream) for (const track of stream.getTracks()) track.stop();
	video.srcObject = null;
}
async function playStream(video, stream) {
	video.setAttribute("playsinline", "true");
	video.setAttribute("webkit-playsinline", "true");
	video.muted = true;
	video.autoplay = true;
	video.srcObject = stream;
	try {
		await video.play();
	} catch (err) {
		await new Promise((resolve) => window.setTimeout(resolve, 60));
		try {
			await video.play();
		} catch {
			stopStream(video);
			throw err;
		}
	}
}
function torchCapable(track) {
	if (!track) return false;
	try {
		return "torch" in track.getCapabilities();
	} catch {
		return false;
	}
}
async function setTrackTorch(track, on) {
	if (!track || !torchCapable(track)) return false;
	const advanced = [{ torch: on }];
	await track.applyConstraints({ advanced });
	return true;
}
function startNativeLoop(video, onHit, Ctor, stream) {
	const detector = new Ctor();
	let stopped = false;
	let busy = false;
	const timer = window.setInterval(() => {
		if (stopped || busy || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
		busy = true;
		detector.detect(video).then((found) => {
			if (stopped) return;
			const hit = found.find((item) => item.rawValue);
			if (hit) onHit({
				code: hit.rawValue,
				format: hit.format
			});
		}).catch(() => {}).finally(() => {
			busy = false;
		});
	}, 180);
	return { stop: () => {
		stopped = true;
		window.clearInterval(timer);
		stopStream(video);
		for (const track of stream.getTracks()) track.stop();
	} };
}
async function startZxingOnVideo(video, onHit) {
	const { BrowserMultiFormatReader } = await import("../_libs/@zxing/browser+[...].mjs").then((n) => n.t);
	return new BrowserMultiFormatReader(void 0, {
		delayBetweenScanAttempts: 180,
		delayBetweenScanSuccess: 700
	}).decodeFromVideoElement(video, (result) => {
		if (!result) return;
		onHit({
			code: result.getText(),
			format: formatFromZxing(result.getBarcodeFormat())
		});
	});
}
async function startScanner(video, onHit) {
	const stream = await openCamera();
	await playStream(video, stream);
	const track = stream.getVideoTracks()[0];
	const canTorch = torchCapable(track);
	const native = detectorCtor();
	if (native) try {
		return {
			torchAvailable: canTorch,
			stop: startNativeLoop(video, onHit, native, stream).stop,
			setTorch: (on) => setTrackTorch(track, on)
		};
	} catch {}
	try {
		const controls = await startZxingOnVideo(video, onHit);
		return {
			torchAvailable: canTorch || typeof controls.switchTorch === "function",
			stop: () => {
				controls.stop();
				stopStream(video);
			},
			setTorch: async (on) => {
				if (canTorch) return setTrackTorch(track, on);
				if (!controls.switchTorch) return false;
				await controls.switchTorch(on);
				return true;
			}
		};
	} catch (err) {
		stopStream(video);
		throw err;
	}
}
async function decodePhoto(file) {
	const native = detectorCtor();
	if (native && typeof createImageBitmap === "function") try {
		const bitmap = await createImageBitmap(file);
		try {
			const hit = (await new native().detect(bitmap)).find((item) => item.rawValue);
			if (hit) return {
				code: hit.rawValue,
				format: hit.format
			};
		} finally {
			bitmap.close();
		}
	} catch {}
	const url = URL.createObjectURL(file);
	try {
		const { BrowserMultiFormatReader } = await import("../_libs/@zxing/browser+[...].mjs").then((n) => n.t);
		const result = await new BrowserMultiFormatReader().decodeFromImageUrl(url);
		return {
			code: result.getText(),
			format: formatFromZxing(result.getBarcodeFormat())
		};
	} catch {
		return null;
	} finally {
		URL.revokeObjectURL(url);
	}
}
var BARS = [
	2,
	1,
	1,
	3,
	1,
	2,
	1,
	1,
	4,
	1,
	2,
	1,
	3,
	1,
	1,
	2,
	4,
	1,
	2,
	1
];
function ReaderApp() {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [skipDupes, setSkipDupes] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("Aponte a câmera ou digite um código.");
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [torchOn, setTorchOn] = (0, import_react.useState)(false);
	const [torchOk, setTorchOk] = (0, import_react.useState)(false);
	const [cameraError, setCameraError] = (0, import_react.useState)(null);
	const [hitFlash, setHitFlash] = (0, import_react.useState)(false);
	const [freshId, setFreshId] = (0, import_react.useState)(null);
	const [busyExport, setBusyExport] = (0, import_react.useState)(false);
	const [confirmClear, setConfirmClear] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editValue, setEditValue] = (0, import_react.useState)("");
	const videoRef = (0, import_react.useRef)(null);
	const photoRef = (0, import_react.useRef)(null);
	const sessionRef = (0, import_react.useRef)(null);
	const generation = (0, import_react.useRef)(0);
	const rowsRef = (0, import_react.useRef)(rows);
	const skipRef = (0, import_react.useRef)(skipDupes);
	const lastCode = (0, import_react.useRef)("");
	const lastAt = (0, import_react.useRef)(0);
	const cooldownUntil = (0, import_react.useRef)(0);
	const endRef = (0, import_react.useRef)(null);
	const onHitRef = (0, import_react.useRef)(() => {});
	(0, import_react.useEffect)(() => {
		preloadScanner();
		const loaded = loadRows();
		rowsRef.current = loaded;
		setRows(loaded);
		setSkipDupes(loadSkipDupes());
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		saveRows(rows);
	}, [rows, hydrated]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		saveSkipDupes(skipDupes);
	}, [skipDupes, hydrated]);
	(0, import_react.useEffect)(() => {
		skipRef.current = skipDupes;
	}, [skipDupes]);
	(0, import_react.useEffect)(() => {
		if (!hydrated || rows.length === 0) return;
		endRef.current?.scrollIntoView({ block: "nearest" });
	}, [rows.length, hydrated]);
	(0, import_react.useEffect)(() => {
		return () => {
			generation.current += 1;
			sessionRef.current?.stop();
		};
	}, []);
	function updateRows(recipe) {
		setRows((prev) => {
			const next = recipe(prev);
			rowsRef.current = next;
			return next;
		});
	}
	onHitRef.current = (raw, format) => {
		const code = cleanCode(raw);
		if (!code || code.length > 2e3) return;
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
		if (rowsRef.current.length >= 2e3) {
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
	async function onPhoto(event) {
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
			if (await session.setTorch(next)) setTorchOn(next);
		} catch {
			setStatus("A lanterna não está disponível nesta câmera.");
			setTorchOk(false);
			setTorchOn(false);
		}
	}
	function addManual() {
		const parts = draft.split(/[\n,;]+/).map((part) => cleanCode(part)).filter((part) => part.length > 0 && part.length <= 2e3);
		if (parts.length === 0) {
			setStatus("Digite ou cole pelo menos um código.");
			return;
		}
		let added = 0;
		let skipped = 0;
		const next = [...rowsRef.current];
		for (const code of parts) {
			if (next.length >= 2e3) {
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
		const noun = added === 1 ? "linha adicionada" : "linhas adicionadas";
		setStatus(skipped > 0 ? `${added} ${noun}. ${skipped} ignorada(s).` : `${added} ${noun}.`);
	}
	function removeRow(id) {
		updateRows((prev) => prev.filter((row) => row.id !== id));
		if (editingId === id) setEditingId(null);
		setStatus("Linha apagada.");
	}
	function commitEdit(id) {
		const code = cleanCode(editValue);
		if (!code) {
			setStatus("O código não pode ficar vazio.");
			return;
		}
		if (skipDupes && rows.some((row) => row.id !== id && row.code === code)) {
			setStatus("Esse código já está na planilha.");
			return;
		}
		updateRows((prev) => prev.map((row) => row.id === id ? {
			...row,
			code
		} : row));
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
			const { exportDocx } = await import("./export-docx-CaHMCyvi.mjs");
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid w-full max-w-6xl gap-4 px-4 pt-5 pb-40 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:px-6 lg:pt-8 lg:pb-36",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "grid gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-11 items-center justify-center rounded-2xl bg-raised text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanBarcode, {
									className: "size-6",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-muted",
								children: "No celular"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-3xl font-semibold tracking-tight",
								children: "Leitor de Barras"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-md text-pretty text-muted",
							children: "Cada leitura entra numa linha. No fim, baixe a planilha em Word (.docx), com um código abaixo do outro."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `viewfinder relative overflow-hidden rounded-card border border-line bg-surface ${hitFlash ? "is-hit" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: videoRef,
							className: "finder w-full bg-bg object-cover",
							playsInline: true,
							muted: true,
							autoPlay: true
						}), phase !== "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface px-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-16 items-stretch gap-px",
								"aria-hidden": "true",
								children: BARS.map((weight, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `bg-fg/80 ${weight === 1 ? "w-px" : weight === 2 ? "w-0.5" : weight === 3 ? "w-1" : "w-1.5"}` }, index))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-sm text-muted",
								children: phase === "starting" ? "Pedindo acesso à câmera…" : "Câmera pronta para ligar"
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-none absolute inset-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute inset-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0 left-0 size-7 border-t-2 border-l-2 border-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0 right-0 size-7 border-t-2 border-r-2 border-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-0 left-0 size-7 border-b-2 border-l-2 border-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-0 bottom-0 size-7 border-r-2 border-b-2 border-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "laser-line" })
								]
							}), hitFlash ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Lido"]
							}) : null]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void toggleCamera(),
							className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-ink",
							children: [phase === "idle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
								className: "size-5",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraOff, {
								className: "size-5",
								"aria-hidden": "true"
							}), phase === "idle" ? "Ligar câmera" : phase === "starting" ? "Cancelar" : "Parar"]
						}), phase === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void toggleTorch(),
							disabled: !torchOk,
							className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-fg disabled:opacity-40",
							children: [torchOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlashlightOff, {
								className: "size-5",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flashlight, {
								className: "size-5",
								"aria-hidden": "true"
							}), "Lanterna"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => photoRef.current?.click(),
							className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanLine, {
								className: "size-5",
								"aria-hidden": "true"
							}), "Tirar foto"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: photoRef,
						type: "file",
						accept: "image/*",
						capture: "environment",
						className: "sr-only",
						onChange: (event) => void onPhoto(event)
					}),
					cameraError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-fg",
						role: "alert",
						children: cameraError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "grid gap-2 rounded-card border border-line bg-surface p-3",
						onSubmit: (event) => {
							event.preventDefault();
							addManual();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								htmlFor: "manual-code",
								className: "flex items-center gap-2 text-sm font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keyboard, {
									className: "size-4 text-muted",
									"aria-hidden": "true"
								}), "Digitar ou colar"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "manual-code",
								value: draft,
								onChange: (event) => setDraft(event.target.value),
								rows: 2,
								enterKeyHint: "done",
								autoCapitalize: "off",
								autoCorrect: "off",
								spellCheck: false,
								placeholder: "Um código, ou vários — um por linha",
								className: "min-h-16 w-full resize-y rounded-xl border border-line bg-bg px-3 py-2 font-mono text-base text-fg placeholder:text-muted"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									className: "size-5",
									"aria-hidden": "true"
								}), "Adicionar à planilha"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-medium",
								children: "Não repetir código"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: "Se estiver ligado, o mesmo código entra só uma vez."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: skipDupes,
							onCheckedChange: setSkipDupes,
							className: "relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors data-[state=checked]:bg-primary",
							"aria-label": "Não repetir código",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "absolute top-1 block size-5 translate-x-1 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary-ink" })
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-card border border-sheet-line bg-sheet text-sheet-ink shadow-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3 border-b border-sheet-line bg-sheet-head px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-semibold",
						children: "Planilha"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-sheet-muted",
						children: "Um código por linha, na ordem da leitura."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm font-semibold text-sheet-ink tabular-nums",
						children: countLabel
					})]
				}), !hydrated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 py-10 text-center text-sm text-sheet-muted",
					children: "Abrindo a planilha…"
				}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-2 px-4 py-12 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg font-semibold",
						children: "Nenhuma leitura ainda"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-pretty text-sheet-muted",
						children: "Ligue a câmera traseira ou digite o código. As linhas ficam salvas neste aparelho."
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sheet-scroll overflow-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full border-collapse text-left",
						"aria-label": "Planilha de códigos lidos",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-sheet-head text-xs font-semibold tracking-wide text-sheet-muted uppercase",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "w-12 px-3 py-2 font-medium",
									children: "Nº"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Código"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "w-24 px-3 py-2 font-medium",
									children: "Hora"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "w-12 px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Ações"
									})
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((row, index) => {
							const fresh = row.id === freshId;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `border-t border-sheet-line ${fresh ? "bg-sheet-fresh" : index % 2 === 1 ? "bg-sheet-head/60" : "bg-sheet"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-sm text-sheet-muted tabular-nums",
										children: index + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: editingId === row.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											className: "flex gap-2",
											onSubmit: (event) => {
												event.preventDefault();
												commitEdit(row.id);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: editValue,
												onChange: (event) => setEditValue(event.target.value),
												autoFocus: true,
												"aria-label": `Editar código ${row.code}`,
												className: "min-h-11 w-full rounded-lg border border-sheet-line bg-sheet px-2 font-mono text-base text-sheet-ink"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "submit",
												className: "inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-ink",
												children: "Ok"
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												setEditingId(row.id);
												setEditValue(row.code);
											},
											"aria-label": `Corrigir ${row.code}`,
											className: "block w-full text-left",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block font-mono text-sm font-medium break-all text-sheet-ink",
												children: row.code
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-sheet-muted",
												children: row.format
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-xs text-sheet-muted tabular-nums",
										children: formatClock(row.scannedAt)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-1 py-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => removeRow(row.id),
											"aria-label": `Apagar ${row.code}`,
											className: "inline-flex size-11 items-center justify-center rounded-lg text-sheet-danger",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
												className: "size-4",
												"aria-hidden": "true"
											})
										})
									})
								]
							}, row.id);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							ref: endRef,
							"aria-hidden": "true"
						})] })]
					})
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur-md",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-6xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-center text-sm text-muted lg:text-left",
						"aria-live": "polite",
						children: status
					}),
					confirmClear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/40 bg-surface px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [
								"Apagar todas as ",
								rows.length,
								" linhas?"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: clearAll,
								className: "inline-flex min-h-11 items-center rounded-xl bg-danger-strong px-4 text-sm font-semibold text-on-danger",
								children: "Apagar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setConfirmClear(false),
								className: "inline-flex min-h-11 items-center rounded-xl bg-raised px-4 text-sm font-semibold",
								children: "Cancelar"
							})]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void download(),
								disabled: rows.length === 0 || busyExport,
								className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-ink disabled:opacity-40 sm:col-span-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "size-5",
									"aria-hidden": "true"
								}), busyExport ? "Gerando…" : "Baixar .docx"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void copyList(),
								disabled: rows.length === 0,
								className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold disabled:opacity-40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
									className: "size-5",
									"aria-hidden": "true"
								}), "Copiar"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setConfirmClear(true),
								disabled: rows.length === 0 || confirmClear,
								className: "col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raised px-4 text-sm font-semibold text-danger disabled:opacity-40 sm:col-span-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "size-5",
									"aria-hidden": "true"
								}), "Limpar"]
							})
						]
					})
				]
			})
		})]
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReaderApp, {});
}
//#endregion
export { fileStamp as n, formatFull as r, routes_exports as t };
