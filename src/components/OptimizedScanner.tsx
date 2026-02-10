import { useZxing } from "react-zxing";
import { useState, useRef, useCallback } from "react";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

/**
 * OptimizedScanner - Full-width barcode scanner using ZXing
 * No focus box - uses entire camera view for scanning
 * Works reliably on Android
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
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const { ref } = useZxing({
    onResult(result) {
      const code = result.getText();
      const now = Date.now();
      
      // Debounce: prevent duplicate scans within 1.5 seconds
      if (code && (code !== lastScannedRef.current || now - lastScanTimeRef.current > 1500)) {
        lastScannedRef.current = code;
        lastScanTimeRef.current = now;
        onScan(code);
      }
    },
    onError(error) {
      // Only show error if it's a real camera error, not "No barcode found"
      if (error.message && !error.message.includes("No MultiFormat Readers")) {
        console.error("Scanner error:", error);
        setHasError(true);
        setErrorMessage(error.message);
        onError?.(error);
      }
    },
    paused,
    constraints: {
      video: {
        facingMode: "environment",
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
      },
    },
    timeBetweenDecodingAttempts: 150,
  });

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage("");
    window.location.reload();
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
      style={{ width, height, position: 'relative' }} 
      className="overflow-hidden rounded-md bg-black"
    >
      <video 
        ref={ref}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
        }}
        playsInline
        muted
      />
      {/* Scan guide overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-white/70 text-xs bg-black/50 px-2 py-1 rounded">
            Point camera at barcode
          </span>
        </div>
      </div>
    </div>
  );
};

export default OptimizedScanner;
