
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, CameraOff, XCircle } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface CameraTabProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  cameraError: string | null;
  capturedImage: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapture: () => void;
}

export const CameraTab = ({
  videoRef,
  canvasRef,
  cameraActive,
  cameraError,
  capturedImage,
  onStartCamera,
  onStopCamera,
  onCapture,
}: CameraTabProps) => {
  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-4">
        {!capturedImage && !cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            {cameraError ? (
              <>
                <CameraOff className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-red-500 text-center px-4">{cameraError}</p>
              </>
            ) : (
              <Camera className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}
        
        {!capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
          />
        )}
        
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {!capturedImage && (
        <div className="flex justify-center">
          {!cameraActive ? (
            <Button onClick={onStartCamera}>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={onCapture}>
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <Button variant="outline" onClick={onStopCamera}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

