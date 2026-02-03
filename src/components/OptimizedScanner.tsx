import { Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState, useCallback } from "react";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

// Detect if the device is Android
const isAndroid = () => {
  return /android/i.test(navigator.userAgent);
};

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
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // Check camera permission on mount
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        // Stop the stream immediately after checking
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        setCameraError(null);
      } catch (error) {
        console.error("Camera permission error:", error);
        setHasPermission(false);
        if (error instanceof Error) {
          setCameraError(error.message);
        }
      }
    };
    
    checkPermission();
  }, []);

  // Get constraints based on device type - Android needs simpler constraints
  const getConstraints = useCallback((): MediaTrackConstraints => {
    if (isAndroid()) {
      // Simplified constraints for Android - avoid advanced constraints that may not be supported
      return {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
    }
    
    // iOS and other devices can use more advanced constraints
    return {
      facingMode: "environment",
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      // Request continuous autofocus for faster focusing (iOS supported)
      advanced: [
        { focusMode: "continuous" } as MediaTrackConstraintSet,
      ],
    };
  }, []);

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height }}>
        <p className="text-sm text-gray-500 text-center">
          Camera permission denied. Please allow camera access to scan barcodes.
          {cameraError && <span className="block mt-1 text-xs text-red-500">{cameraError}</span>}
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
        constraints={getConstraints()}
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
