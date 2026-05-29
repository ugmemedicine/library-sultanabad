"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

export function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 44,
        width: 1.5
      });
    } catch {
      ref.current.innerHTML = "";
    }
  }, [value]);

  return <svg className="barcode-svg" ref={ref} role="img" aria-label={`Barcode ${value}`} />;
}
