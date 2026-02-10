import { Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState, useCallback, useRef } from "react";

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
  const [scannerKey, setScannerKey] = useState(0); // Key to force re-mount scanner
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Release any existing camera streams before starting
  const releaseAllCameras = useCallback(async () => {
    try {
      // Get all media devices and stop any active video tracks
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      // Try to get and immediately release each camera to clear any locks
      for (const device of videoDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: device.deviceId }
          });
          stream.getTracks().forEach(track => {
            track.stop();
          });
        } catch {
          // Ignore errors for individual devices
        }
      }
    } catch (error) {
      console.warn("Could not release cameras:", error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Check camera permission on mount - don't hold the stream
    const initCamera = async () => {
      try {
        // On Android, first try to release any locked cameras
        if (isAndroid()) {
          await releaseAllCameras();
          // Small delay after releasing to let the camera fully reset
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Just check permission status without holding the stream
        const permissionStatus = await navigator.permissions.query({ 
          name: 'camera' as PermissionName 
        });
        
        if (!mountedRef.current) return;
        
        if (permissionStatus.state === 'granted') {
          setHasPermission(true);
          setCameraError(null);
          // Quick start for camera
          setTimeout(() => {
            if (mountedRef.current) {
              setIsReady(true);
            }
          }, isAndroid() ? 200 : 50);
        } else if (permissionStatus.state === 'prompt') {
          // Request permission by briefly accessing the camera
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: "environment" } 
            });
            stream.getTracks().forEach(track => track.stop());
            
            if (!mountedRef.current) return;
            
            setHasPermission(true);
            setCameraError(null);
            setTimeout(() => {
              if (mountedRef.current) {
                setIsReady(true);
              }
            }, isAndroid() ? 200 : 50);
          } catch (error) {
            if (!mountedRef.current) return;
            handleCameraError(error);
          }
        } else {
          setHasPermission(false);
          setCameraError("Camera permission denied");
        }
      } catch (error) {
        // Fallback for browsers that don't support permissions.query for camera
        if (!mountedRef.current) return;
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          stream.getTracks().forEach(track => track.stop());
          
          if (!mountedRef.current) return;
          
          setHasPermission(true);
          setCameraError(null);
          setTimeout(() => {
            if (mountedRef.current) {
              setIsReady(true);
            }
          }, isAndroid() ? 200 : 50);
        } catch (fallbackError) {
          if (!mountedRef.current) return;
          handleCameraError(fallbackError);
        }
      }
    };
    
    initCamera();
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      setIsReady(false);
    };
  }, [releaseAllCameras]);

  const handleCameraError = (error: unknown) => {
    console.error("Camera error:", error);
    setHasPermission(false);
    if (error instanceof Error) {
      setCameraError(error.message);
    } else {
      setCameraError("Failed to access camera");
    }
  };

  // Retry mechanism for Android camera issues
  const handleScannerError = useCallback((error: unknown) => {
    console.error("Scanner error:", error);
    
    if (isAndroid() && retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      console.log(`Retrying camera... attempt ${retryCountRef.current}/${maxRetries}`);
      
      // Reset and retry
      setIsReady(false);
      setTimeout(async () => {
        if (!mountedRef.current) return;
        
        await releaseAllCameras();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (mountedRef.current) {
          setScannerKey(prev => prev + 1); // Force re-mount
          setIsReady(true);
        }
      }, 500);
    } else {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [onError, releaseAllCameras]);

  // Get constraints based on device type - Android needs simpler constraints
  const getConstraints = useCallback((): MediaTrackConstraints => {
    if (isAndroid()) {
      // Simplified constraints for Android - prioritize back camera
      return {
        facingMode: { ideal: "environment" },
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
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height }}>
        <p className="text-sm text-gray-500 text-center">
          Camera permission denied. Please allow camera access to scan barcodes.
          {cameraError && <span className="block mt-1 text-xs text-red-500">{cameraError}</span>}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state while camera is initializing
  if (!isReady || hasPermission === null) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-md p-4" style={{ width, height }}>
        <p className="text-sm text-gray-500 text-center">
          Initializing camera...
        </p>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="overflow-hidden rounded-md">
      <Scanner
        key={scannerKey}
        onScan={(result) => {
          if (result && result.length > 0 && result[0].rawValue) {
            retryCountRef.current = 0; // Reset retry count on successful scan
            onScan(result[0].rawValue);
          }
        }}
        onError={handleScannerError}
        paused={paused}
        scanDelay={100} // Fast scan rate for quick detection
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
          "upc_a",
          "upc_e",
          "code_128",
        ]}
      />
    </div>
  );
};

export default OptimizedScanner;
