import { Scanner } from "@yudiel/react-qr-scanner";
import { useState, useRef, useCallback, useEffect } from "react";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

// Check if device is Android
const isAndroid = /android/i.test(navigator.userAgent);

/**
 * OptimizedScanner - Full camera view barcode scanner
 * NO focus box - scans entire camera view
 * Optimized for Android
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
  const [isReady, setIsReady] = useState(false);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  // Add delay for Android to let camera initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, isAndroid ? 500 : 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScan = useCallback((result: { rawValue: string }[]) => {
    if (result && result.length > 0 && result[0].rawValue) {
      const code = result[0].rawValue;
      const now = Date.now();
      
      // Debounce: prevent duplicate scans within 1.5 seconds
      if (code && (code !== lastScannedRef.current || now - lastScanTimeRef.current > 1500)) {
        lastScannedRef.current = code;
        lastScanTimeRef.current = now;
        console.log("Barcode scanned:", code);
        onScan(code);
      }
    }
  }, [onScan]);

  const handleError = useCallback((error: unknown) => {
    // Ignore "not found" errors - these happen when no barcode is in view
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("NotFoundException") || errorMsg.includes("No barcode")) {
      return; // Normal - just means no barcode detected yet
    }
    
    console.error("Scanner error:", error);
    setHasError(true);
    setErrorMessage(errorMsg);
    onError?.(error instanceof Error ? error : new Error(errorMsg));
  }, [onError]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height }}>
        <p className="text-sm text-gray-500 text-center">
          Camera error: {errorMessage}
        </p>
        <button 
          onClick={() => {
            setHasError(false);
            setErrorMessage("");
            setIsReady(false);
            setTimeout(() => setIsReady(true), 500);
          }}
          className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-md" style={{ width, height }}>
        <p className="text-white text-sm">Starting camera...</p>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="overflow-hidden rounded-md bg-black">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        paused={paused}
        scanDelay={isAndroid ? 400 : 200}
        constraints={{
          facingMode: "environment",
          // Manual focus - no autofocus hunting = faster scanning
          // @ts-expect-error - focusMode/focusDistance valid but not in all TS types
          focusMode: "manual",
          focusDistance: 0.3,  // Fixed at ~30cm
        }}
        components={{
          torch: false,
          finder: false,  // NO FOCUS BOX
        }}
        styles={{
          container: {
            width: "100%",
            height: "100%",
            padding: 0,
          },
          video: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
          },
        }}
        formats={[
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
        ]}
      />
    </div>
  );
};

export default OptimizedScanner;
