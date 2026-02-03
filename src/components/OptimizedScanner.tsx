import { Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

/**
 * OptimizedScanner - A barcode/QR scanner with better autofocus performance
 * Uses @yudiel/react-qr-scanner which has better camera handling
 * Optimized for iPhone and Samsung devices with focus constraints
 */
export const OptimizedScanner = ({
  onScan,
  onError,
  width = "100%",
  height = 250,
  paused = false,
}: OptimizedScannerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check camera permission on mount
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height }}>
        <p className="text-sm text-gray-500 text-center">
          Camera permission denied. Please allow camera access to scan barcodes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="overflow-hidden rounded-md">
      <Scanner
        onScan={(result) => {
          if (result && result.length > 0 && result[0].rawValue) {
            onScan(result[0].rawValue);
          }
        }}
        onError={(error) => {
          console.error("Scanner error:", error);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }}
        paused={paused}
        scanDelay={300}
        constraints={{
          facingMode: "environment",
          // Optimized video constraints for better autofocus on mobile devices
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          // Request continuous autofocus for faster focusing
          advanced: [
            { focusMode: "continuous" } as MediaTrackConstraintSet,
          ],
        }}
        styles={{
          container: {
            width: "100%",
            height: "100%",
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
          "code_128",
          "code_39",
          "code_93",
          "upc_a",
          "upc_e",
          "itf",
          "qr_code",
          "data_matrix",
        ]}
      />
    </div>
  );
};

export default OptimizedScanner;
