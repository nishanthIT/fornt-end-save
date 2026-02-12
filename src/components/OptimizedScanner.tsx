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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`scanner-${Date.now()}`);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const scanLineDirectionRef = useRef(1); // 1 = down, -1 = up

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
    // Debounce: prevent duplicate scans of SAME barcode within 800ms
    // But allow different barcodes immediately
    if (decodedText && (decodedText !== lastScannedRef.current || now - lastScanTimeRef.current > 800)) {
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
        const html5Qrcode = new Html5Qrcode(containerId, {
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native BarcodeDetector API if available
          }
        });
        scannerRef.current = html5Qrcode;

        // Aggressive scanning config - high FPS, full view scanning
        const config = {
          fps: isIOS ? 15 : 30, // Higher FPS for faster scanning
          qrbox: undefined, // No scan box - scan full view for speed
          aspectRatio: isIOS ? 4 / 3 : 16 / 9,
          disableFlip: false,
          formatsToSupport: [
            0, // QR_CODE
            1, // AZTEC
            2, // CODABAR
            3, // CODE_39
            4, // CODE_93
            5, // CODE_128
            6, // DATA_MATRIX
            7, // MAXICODE
            8, // ITF
            9, // EAN_13
            10, // EAN_8
            11, // PDF_417
            12, // RSS_14
            13, // RSS_EXPANDED
            14, // UPC_A
            15, // UPC_E
            16, // UPC_EAN_EXTENSION
          ],
          videoConstraints: isIOS ? {
            facingMode: { exact: "environment" },
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          } : {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          } as MediaTrackConstraints,
        };

        await html5Qrcode.start(
          { facingMode: "environment" },
          config,
          handleScanSuccess,
          () => {} // Ignore scan failures (no barcode in view) - keep scanning
        );

        // Apply focus settings for better barcode detection
        const applyFocusSettings = async () => {
          try {
            const videoElement = document.querySelector(`#${containerId} video`) as HTMLVideoElement;
            if (videoElement?.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              const capabilities = track.getCapabilities?.();
              
              // @ts-expect-error - focusMode is valid
              if (capabilities?.focusMode) {
                const constraints: MediaTrackConstraints = {};
                
                // @ts-expect-error - focusMode is valid
                if (capabilities.focusMode.includes("continuous")) {
                  // @ts-expect-error
                  constraints.focusMode = "continuous";
                }
                
                // @ts-expect-error
                if (isAndroid && capabilities.focusDistance) {
                  // @ts-expect-error
                  constraints.focusDistance = 0.3;
                }
                
                if (Object.keys(constraints).length > 0) {
                  await track.applyConstraints(constraints);
                  console.log("Applied focus constraints:", constraints);
                }
              }
            }
          } catch (focusErr) {
            console.log("Focus constraints not supported, using defaults");
          }
        };

        // Apply focus settings - iOS needs multiple attempts
        if (isIOS) {
          setTimeout(applyFocusSettings, 300);
          setTimeout(applyFocusSettings, 1000);
          setTimeout(applyFocusSettings, 2000);
        } else {
          setTimeout(applyFocusSettings, 100);
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

    // Short delay for camera initialization
    const delay = isIOS ? 200 : 100;
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
          {/* Top-left corner */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderTop: '3px solid #ff0000', borderLeft: '3px solid #ff0000', zIndex: 10 }} />
          {/* Top-right corner */}
          <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderTop: '3px solid #ff0000', borderRight: '3px solid #ff0000', zIndex: 10 }} />
          {/* Bottom-left corner */}
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 30, height: 30, borderBottom: '3px solid #ff0000', borderLeft: '3px solid #ff0000', zIndex: 10 }} />
          {/* Bottom-right corner */}
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
