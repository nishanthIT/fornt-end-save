import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface OptimizedScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  width?: string | number;
  height?: string | number;
  paused?: boolean;
}

/**
 * OptimizedScanner - Fast barcode scanner using html5-qrcode
 * Optimized for both Android and iOS with proper focus handling
 * Features: Red scan line animation, continuous aggressive scanning
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
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [key, setKey] = useState(0); // Force remount on retry
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const scanLineDirectionRef = useRef(1); // 1 = down, -1 = up
  const mountedRef = useRef(true);

  // Animate the red scan line
  useEffect(() => {
    if (!isReady || paused) return;
    
    let lastTime = 0;
    const speed = 2; // pixels per frame
    
    const animate = (timestamp: number) => {
      if (timestamp - lastTime >= 16) { // ~60fps
        setScanLinePosition(prev => {
          const containerHeight = typeof height === 'number' ? height : 250;
          let newPos = prev + (speed * scanLineDirectionRef.current);
          
          if (newPos >= containerHeight - 4) {
            scanLineDirectionRef.current = -1;
            newPos = containerHeight - 4;
          } else if (newPos <= 0) {
            scanLineDirectionRef.current = 1;
            newPos = 0;
          }
          
          return newPos;
        });
        lastTime = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, paused, height]);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    // Allow same barcode after 500ms, different barcodes immediately
    if (decodedText && (decodedText !== lastScannedRef.current || now - lastScanTimeRef.current > 500)) {
      lastScannedRef.current = decodedText;
      lastScanTimeRef.current = now;
      console.log("Barcode scanned:", decodedText);
      onScan(decodedText);
    }
  }, [onScan]);

  useEffect(() => {
    if (paused) return;
    
    mountedRef.current = true;
    const containerId = containerIdRef.current;
    let html5Qrcode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5Qrcode = new Html5Qrcode(containerId, {
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        scannerRef.current = html5Qrcode;

        // Simple config - works on both Android and iOS
        const config = {
          fps: 30,
          qrbox: undefined,
          aspectRatio: 16 / 9,
          disableFlip: false,
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          } as MediaTrackConstraints,
        };

        await html5Qrcode.start(
          { facingMode: "environment" },
          config,
          handleScanSuccess,
          () => {} // Ignore failures - keep scanning
        );

        console.log("Scanner started successfully");

        // Apply focus settings after camera starts
        setTimeout(async () => {
          if (!mountedRef.current) return;
          try {
            const videoElement = document.querySelector(`#${containerId} video`) as HTMLVideoElement;
            if (videoElement?.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              if (track) {
                const capabilities = track.getCapabilities?.();
                // @ts-expect-error
                if (capabilities?.focusMode?.includes("continuous")) {
                  // @ts-expect-error
                  await track.applyConstraints({ focusMode: "continuous" });
                  console.log("Applied continuous focus");
                }
              }
            }
          } catch (e) {
            // Ignore focus errors
          }
        }, 500);

        if (mountedRef.current) setIsReady(true);
      } catch (err) {
        console.error("Scanner error:", err);
        if (mountedRef.current) {
          setHasError(true);
          setErrorMessage(err instanceof Error ? err.message : String(err));
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    // Small delay before starting
    const timer = setTimeout(startScanner, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (html5Qrcode) {
        html5Qrcode.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [paused, handleScanSuccess, onError, key]);

  // Handle retry - reset everything
  const handleRetry = useCallback(() => {
    lastScannedRef.current = "";
    lastScanTimeRef.current = 0;
    containerIdRef.current = `scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setHasError(false);
    setErrorMessage("");
    setIsReady(false);
    setKey(prev => prev + 1);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height: typeof height === 'number' ? height : 250 }}>
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
    <div key={key} style={{ width, height }} className="overflow-hidden rounded-md bg-black relative">
      <div 
        id={containerIdRef.current} 
        style={{ width: "100%", height: "100%" }}
      />
      
      {/* Red Scan Line */}
      {isReady && !paused && (
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: scanLinePosition,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #ff0000, #ff3333, #ff0000, transparent)',
            boxShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
            borderRadius: '2px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Corner brackets for scan area */}
      {isReady && (
        <>
          <div style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderTop: '3px solid #ff0000', borderLeft: '3px solid #ff0000', zIndex: 10 }} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderTop: '3px solid #ff0000', borderRight: '3px solid #ff0000', zIndex: 10 }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 30, height: 30, borderBottom: '3px solid #ff0000', borderLeft: '3px solid #ff0000', zIndex: 10 }} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, borderBottom: '3px solid #ff0000', borderRight: '3px solid #ff0000', zIndex: 10 }} />
        </>
      )}
      
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <p className="text-white text-sm">Starting camera...</p>
        </div>
      )}
    </div>
  );
};

export default OptimizedScanner;
