import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef, useCallback } from "react";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

/**
 * OptimizedScanner - Reliable barcode scanner using html5-qrcode
 * Works reliably on both iOS and Android
 */
export const OptimizedScanner = ({
  onScan,
  onError,
  width = "100%",
  height = 250,
  paused = false,
}: OptimizedScannerProps) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>("");
  const scannerIdRef = useRef(`scanner-${Math.random().toString(36).substr(2, 9)}`);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (paused) return;

      try {
        // Wait for DOM element to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted) return;

        // Clean up any existing scanner
        await stopScanner();

        if (!mounted) return;

        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // All formats
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (decodedText && decodedText !== lastScannedRef.current) {
              lastScannedRef.current = decodedText;
              onScan(decodedText);
              // Reset after 2 seconds
              setTimeout(() => {
                lastScannedRef.current = "";
              }, 2000);
            }
          },
          () => {} // Ignore QR code not found errors
        );

        if (mounted) {
          setIsStarting(false);
          setHasError(false);
        }
      } catch (err) {
        console.error("Scanner start error:", err);
        if (mounted) {
          setIsStarting(false);
          setHasError(true);
          setErrorMessage(err instanceof Error ? err.message : "Failed to start camera");
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [paused, onScan, onError, stopScanner]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage("");
    setIsStarting(true);
    // Force re-render by updating key
    scannerIdRef.current = `scanner-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height }}>
        <p className="text-sm text-gray-500 text-center">
          Camera error: {errorMessage}
        </p>
        <button 
          onClick={handleRetry}
          className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ width, height, position: 'relative' }} 
      className="overflow-hidden rounded-md bg-black"
    >
      <div 
        id={scannerIdRef.current}
        style={{ width: '100%', height: '100%' }}
      />
      {isStarting && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <p className="text-white text-sm">Starting camera...</p>
        </div>
      )}
    </div>
  );
};

export default OptimizedScanner;
