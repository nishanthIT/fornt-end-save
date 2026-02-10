import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

// Check if device is Android or iOS
const isAndroid = /android/i.test(navigator.userAgent);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * OptimizedScanner - Fast barcode scanner using html5-qrcode
 * Optimized for both Android and iOS with proper focus handling
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`scanner-${Date.now()}`);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    // Debounce: prevent duplicate scans within 1.5 seconds
    if (decodedText && (decodedText !== lastScannedRef.current || now - lastScanTimeRef.current > 1500)) {
      lastScannedRef.current = decodedText;
      lastScanTimeRef.current = now;
      console.log("Barcode scanned:", decodedText);
      onScan(decodedText);
    }
  }, [onScan]);

  useEffect(() => {
    if (paused) return;
    
    let mounted = true;
    const containerId = containerIdRef.current;

    const startScanner = async () => {
      try {
        // Create scanner instance
        const html5Qrcode = new Html5Qrcode(containerId);
        scannerRef.current = html5Qrcode;

        // Get camera config based on device
        const config = {
          fps: isAndroid ? 15 : 30,
          qrbox: undefined, // No scan box - scan full view
          aspectRatio: 16 / 9,
          disableFlip: false,
          // Focus settings - continuous for iOS, none for Android (let device handle)
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: isAndroid ? 1280 : 1920 },
            height: { ideal: isAndroid ? 720 : 1080 },
            // These help reduce focus hunting
            ...(isIOS && {
              advanced: [{
                // @ts-expect-error - valid constraint
                focusMode: "continuous",
              }]
            }),
          } as MediaTrackConstraints,
        };

        await html5Qrcode.start(
          { facingMode: "environment" },
          config,
          handleScanSuccess,
          () => {} // Ignore scan failures (no barcode in view)
        );

        // After camera starts, try to apply focus settings directly to the track
        try {
          const videoElement = document.querySelector(`#${containerId} video`) as HTMLVideoElement;
          if (videoElement?.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.();
            
            // @ts-expect-error - focusMode is valid
            if (capabilities?.focusMode) {
              // Apply continuous focus for iOS, or none/manual for Android
              await track.applyConstraints({
                // @ts-expect-error
                focusMode: isIOS ? "continuous" : "manual",
                // @ts-expect-error  
                ...(isAndroid && capabilities.focusDistance && { focusDistance: 0.25 }),
              });
              console.log("Applied focus constraints");
            }
          }
        } catch (focusErr) {
          console.log("Focus constraints not supported, using defaults");
        }

        if (mounted) setIsReady(true);
      } catch (err) {
        console.error("Scanner error:", err);
        if (mounted) {
          setHasError(true);
          setErrorMessage(err instanceof Error ? err.message : String(err));
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    // Delay start slightly for Android
    const delay = isAndroid ? 500 : 100;
    const timer = setTimeout(startScanner, delay);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [paused, handleScanSuccess, onError]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height: typeof height === 'number' ? height : 250 }}>
        <p className="text-sm text-gray-500 text-center">
          Camera error: {errorMessage}
        </p>
        <button 
          onClick={() => {
            setHasError(false);
            setErrorMessage("");
            setIsReady(false);
          }}
          className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="overflow-hidden rounded-md bg-black relative">
      <div 
        id={containerIdRef.current} 
        style={{ width: "100%", height: "100%" }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <p className="text-white text-sm">Starting camera...</p>
        </div>
      )}
    </div>
  );
};

export default OptimizedScanner;
