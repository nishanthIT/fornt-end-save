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
  const [retryCount, setRetryCount] = useState(0); // Track retries to force re-init
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const scanLineDirectionRef = useRef(1); // 1 = down, -1 = up
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]); // Track all timeouts for cleanup
  const isScanningRef = useRef(false); // Prevent race conditions

  // Clear all tracked timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

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

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    clearAllTimeouts();
    
    if (scannerRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false;
        await scannerRef.current.stop();
        console.log("Scanner stopped successfully");
      } catch (err) {
        console.log("Scanner stop error (may already be stopped):", err);
      }
    }
    scannerRef.current = null;
  }, [clearAllTimeouts]);

  useEffect(() => {
    if (paused) {
      stopScanner();
      return;
    }
    
    let mounted = true;
    const containerId = containerIdRef.current;

    const startScanner = async () => {
      // Ensure previous scanner is stopped
      await stopScanner();
      
      if (!mounted) return;
      
      try {
        // Create scanner instance
        const html5Qrcode = new Html5Qrcode(containerId, {
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        scannerRef.current = html5Qrcode;

        // Scanning config
        const config = {
          fps: isIOS ? 10 : 20, // Moderate FPS to avoid overload
          qrbox: undefined,
          aspectRatio: isIOS ? 4 / 3 : 16 / 9,
          disableFlip: false,
          formatsToSupport: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
          ],
          videoConstraints: isIOS ? {
            facingMode: { exact: "environment" },
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          } : {
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

        isScanningRef.current = true;

        // Apply focus settings
        const applyFocusSettings = async () => {
          if (!mounted || !isScanningRef.current) return;
          
          try {
            const videoElement = document.querySelector(`#${containerId} video`) as HTMLVideoElement;
            if (videoElement?.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              if (!track) return;
              
              const capabilities = track.getCapabilities?.();
              
              // @ts-expect-error - focusMode is valid
              if (capabilities?.focusMode) {
                const constraints: MediaTrackConstraints = {};
                
                // @ts-expect-error
                if (capabilities.focusMode.includes("continuous")) {
                  // @ts-expect-error
                  constraints.focusMode = "continuous";
                }
                
                if (Object.keys(constraints).length > 0) {
                  await track.applyConstraints(constraints);
                  console.log("Applied focus constraints");
                }
              }
            }
          } catch (focusErr) {
            // Ignore focus errors - not critical
          }
        };

        // Apply focus with tracked timeouts
        const t1 = setTimeout(applyFocusSettings, 500);
        timeoutsRef.current.push(t1);
        
        if (isIOS) {
          const t2 = setTimeout(applyFocusSettings, 1500);
          timeoutsRef.current.push(t2);
        }

        if (mounted) setIsReady(true);
      } catch (err) {
        console.error("Scanner error:", err);
        isScanningRef.current = false;
        if (mounted) {
          setHasError(true);
          setErrorMessage(err instanceof Error ? err.message : String(err));
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    // Delay start
    const delay = isIOS ? 300 : 150;
    const timer = setTimeout(startScanner, delay);
    timeoutsRef.current.push(timer);

    return () => {
      mounted = false;
      clearAllTimeouts();
      stopScanner();
    };
  }, [paused, handleScanSuccess, onError, stopScanner, clearAllTimeouts, retryCount]);

  // Handle retry - reset everything
  const handleRetry = useCallback(() => {
    // Reset all scan state
    lastScannedRef.current = "";
    lastScanTimeRef.current = 0;
    
    // Generate new container ID to force fresh DOM element
    containerIdRef.current = `scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setHasError(false);
    setErrorMessage("");
    setIsReady(false);
    setRetryCount(prev => prev + 1); // Force useEffect to re-run
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
    <div style={{ width, height }} className="overflow-hidden rounded-md bg-black relative">
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
