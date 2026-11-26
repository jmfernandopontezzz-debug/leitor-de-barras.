export type ScanHit = { code: string; format: string };

export type ScannerSession = {
  torchAvailable: boolean;
  stop: () => void;
  setTorch: (on: boolean) => Promise<boolean>;
};

const ZXING_NAMES = [
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
  "MICRO_QR_CODE",
] as const;

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<string[]>;
}

function inFrame(): boolean {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

export function preloadScanner() {
  if (typeof window === "undefined") return;
  if (!("BarcodeDetector" in window)) {
    void import("@zxing/browser");
  }
}

export function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    if (inFrame()) {
      return "Aqui a câmera ao vivo fica bloqueada. Toque em Tirar foto — abre a câmera do celular. No app publicado, use o Safari ou o Chrome.";
    }
    return "O navegador bloqueou a câmera. Toque em Tirar foto, ou permita a câmera nas configurações do site e tente de novo.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Não achei uma câmera ao vivo. Toque em Tirar foto para usar a câmera do celular.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "A câmera está ocupada por outro aplicativo. Feche-o, ou toque em Tirar foto.";
  }
  if (name === "SecurityError" || (typeof window !== "undefined" && !window.isSecureContext)) {
    return "A câmera só abre numa página segura. Publique o app e abra o link no celular.";
  }
  return "Não foi possível abrir a câmera ao vivo. Toque em Tirar foto para usar a câmera do celular.";
}

function detectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return ctor ?? null;
}

function formatFromZxing(format: unknown): string {
  return typeof format === "number" ? (ZXING_NAMES[format] ?? "CODIGO") : "CODIGO";
}

async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Sem câmera", "NotFoundError");
  }
  if (!window.isSecureContext) {
    throw new DOMException("Insegura", "SecurityError");
  }

  const attempts: Array<MediaTrackConstraints | boolean> = [
    { facingMode: { ideal: "environment" } },
    { facingMode: "environment" },
    true,
  ];
  let last: unknown;
  for (const video of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video });
    } catch (err) {
      last = err;
      const name = err instanceof DOMException ? err.name : "";
      if (
        name === "NotAllowedError" ||
        name === "PermissionDeniedError" ||
        name === "SecurityError" ||
        name === "NotReadableError" ||
        name === "TrackStartError"
      ) {
        throw err;
      }
    }
  }
  throw last instanceof Error ? last : new DOMException("Sem câmera", "NotFoundError");
}

function stopStream(video: HTMLVideoElement) {
  const stream = video.srcObject;
  if (stream instanceof MediaStream) {
    for (const track of stream.getTracks()) track.stop();
  }
  video.srcObject = null;
}

async function playStream(video: HTMLVideoElement, stream: MediaStream) {
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

function torchCapable(track: MediaStreamTrack | undefined): boolean {
  if (!track) return false;
  try {
    const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    return "torch" in caps;
  } catch {
    return false;
  }
}

async function setTrackTorch(track: MediaStreamTrack | undefined, on: boolean): Promise<boolean> {
  if (!track || !torchCapable(track)) return false;
  const advanced = [{ torch: on }] as unknown as MediaTrackConstraintSet[];
  await track.applyConstraints({ advanced });
  return true;
}

function startNativeLoop(
  video: HTMLVideoElement,
  onHit: (hit: ScanHit) => void,
  Ctor: BarcodeDetectorCtor,
  stream: MediaStream,
): { stop: () => void } {
  const detector = new Ctor();
  let stopped = false;
  let busy = false;
  const timer = window.setInterval(() => {
    if (stopped || busy || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    busy = true;
    void detector
      .detect(video)
      .then((found) => {
        if (stopped) return;
        const hit = found.find((item) => item.rawValue);
        if (hit) onHit({ code: hit.rawValue, format: hit.format });
      })
      .catch(() => {
        /* quadro sem leitura */
      })
      .finally(() => {
        busy = false;
      });
  }, 180);

  return {
    stop: () => {
      stopped = true;
      window.clearInterval(timer);
      stopStream(video);
      for (const track of stream.getTracks()) track.stop();
    },
  };
}

async function startZxingOnVideo(video: HTMLVideoElement, onHit: (hit: ScanHit) => void) {
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatReader(undefined, {
    delayBetweenScanAttempts: 180,
    delayBetweenScanSuccess: 700,
  });
  return reader.decodeFromVideoElement(video, (result) => {
    if (!result) return;
    onHit({
      code: result.getText(),
      format: formatFromZxing(result.getBarcodeFormat()),
    });
  });
}

export async function startScanner(
  video: HTMLVideoElement,
  onHit: (hit: ScanHit) => void,
): Promise<ScannerSession> {
  const stream = await openCamera();
  await playStream(video, stream);
  const track = stream.getVideoTracks()[0];
  const canTorch = torchCapable(track);
  const native = detectorCtor();
  if (native) {
    try {
      const loop = startNativeLoop(video, onHit, native, stream);
      return {
        torchAvailable: canTorch,
        stop: loop.stop,
        setTorch: (on) => setTrackTorch(track, on),
      };
    } catch {
      /* o leitor nativo falhou; segue com o outro */
    }
  }

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
      },
    };
  } catch (err) {
    stopStream(video);
    throw err;
  }
}

export async function decodePhoto(file: File): Promise<ScanHit | null> {
  const native = detectorCtor();
  if (native && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const found = await new native().detect(bitmap);
        const hit = found.find((item) => item.rawValue);
        if (hit) return { code: hit.rawValue, format: hit.format };
      } finally {
        bitmap.close();
      }
    } catch {
      /* tenta o leitor de imagem */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(url);
    return {
      code: result.getText(),
      format: formatFromZxing(result.getBarcodeFormat()),
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
