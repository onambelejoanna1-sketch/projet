import { useCallback, useEffect, useRef, useState } from 'react';

function probeInitialStatus() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'idle';
  const isLocalhost =
    window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1';
  if (!window.isSecureContext && !isLocalhost) return 'unsupported';
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
  return 'idle';
}

function mapErrorName(name) {
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      status: 'denied',
      message:
        "Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur, puis réessayez.",
    };
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return {
      status: 'unsupported',
      message: "Aucune caméra disponible sur cet appareil.",
    };
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return {
      status: 'error',
      message:
        "Caméra indisponible. Fermez les autres applications qui l'utilisent puis réessayez.",
    };
  }
  return { status: 'error', message: "Impossible d'activer la caméra." };
}

export default function useCamera({ facingMode = 'environment', maxWidth = 1280 } = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState(probeInitialStatus);
  const [error, setError] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (status === 'unsupported') return;
    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      // L'élément <video> n'est monté dans le DOM qu'après le passage à 'streaming'.
      // On déclenche le changement d'état : le useEffect ci-dessous fera l'attachement
      // une fois que React aura monté la vidéo et que videoRef.current sera disponible.
      setStatus('streaming');
    } catch (err) {
      const mapped = mapErrorName(err?.name);
      setStatus(mapped.status);
      setError(mapped.message);
      stop();
    }
  }, [facingMode, status, stop]);

  // Attache le stream à la balise <video> dès que le statut passe à 'streaming'
  // (et donc que la vidéo est rendue dans le DOM).
  useEffect(() => {
    if (status !== 'streaming') return undefined;
    let cancelled = false;

    function attach() {
      if (cancelled) return;
      const video = videoRef.current;
      const stream = streamRef.current;
      if (!video || !stream) {
        // Au cas (rare) où le ref ne serait pas prêt sur ce tick, on retente au prochain frame.
        requestAnimationFrame(attach);
        return;
      }
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {
        // Certains navigateurs bloquent autoplay tant qu'il n'y a pas d'interaction.
        // L'utilisateur a cliqué sur "Activer la caméra", donc l'appel devrait passer.
      });
    }
    attach();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const scale = Math.min(1, maxWidth / vw);
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoDataUrl(dataUrl);
    setStatus('captured');
    stop();
    return dataUrl;
  }, [maxWidth, stop]);

  const setExternalPhoto = useCallback((dataUrl) => {
    setPhotoDataUrl(dataUrl);
    setStatus('captured');
  }, []);

  const retake = useCallback(() => {
    setPhotoDataUrl(null);
    setError(null);
    start();
  }, [start]);

  const reset = useCallback(() => {
    setPhotoDataUrl(null);
    setError(null);
    stop();
    setStatus(probeInitialStatus());
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    status,
    error,
    photoDataUrl,
    start,
    capture,
    retake,
    reset,
    setExternalPhoto,
  };
}
