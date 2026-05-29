"use client";

import { useEffect, useRef, useState } from "react";

export function CameraBarcodeScanner({ onDetected }: { onDetected: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<{ detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [supported, setSupported] = useState(true);
  const [message, setMessage] = useState("");

  function stopScanner() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRunning(false);
  }

  useEffect(() => stopScanner, []);

  async function startScanner() {
    setMessage("");
    const BarcodeDetectorCtor = (window as Window & { BarcodeDetector?: new (init?: { formats?: string[] }) => { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!BarcodeDetectorCtor) {
      setSupported(false);
      setMessage("Camera barcode scanning is not supported on this browser. Use manual input or Bluetooth scanner keyboard mode.");
      return;
    }
    try {
      const detector = new BarcodeDetectorCtor({
        formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"]
      });
      detectorRef.current = detector;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);

      const scanLoop = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          const value = codes.find((item) => item.rawValue?.trim())?.rawValue?.trim();
          if (value) {
            onDetected(value);
            setMessage(`Scanned: ${value}`);
            stopScanner();
            return;
          }
        } catch {
          setMessage("Scanning in progress...");
        }
        rafRef.current = requestAnimationFrame(scanLoop);
      };
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setMessage("Unable to access camera. Check camera permission in browser settings.");
      stopScanner();
    }
  }

  return (
    <section className="panel">
      <div className="toolbar" style={{ marginBottom: 10 }}>
        {!running ? (
          <button className="button secondary" onClick={startScanner} type="button">Scan With Camera</button>
        ) : (
          <button className="button secondary" onClick={stopScanner} type="button">Stop Camera</button>
        )}
      </div>
      {running ? <video className="camera-preview" muted playsInline ref={videoRef} /> : null}
      {message ? <p className="muted">{message}</p> : null}
      {!supported ? <p className="muted">Tip: use manual accession input on this browser.</p> : null}
    </section>
  );
}
