
import { useState, useRef } from "react";

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    
    try {
      // Stop any existing stream first
      stopCamera();
      
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log("Setting video stream...");
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error("Error playing video:", err);
              setCameraError("Failed to start video stream");
            });
          }
        };
        setCameraActive(true);
      } else {
        console.error("Video reference is null");
        setCameraError("Camera element not found");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Failed to access camera. ";
      
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          errorMessage += "Camera access was denied. Please check your browser permissions.";
        } else if (err.name === "NotFoundError") {
          errorMessage += "No camera detected on this device.";
        } else if (err.name === "NotReadableError") {
          errorMessage += "Camera may be in use by another application.";
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += "Please check browser permissions and try again.";
      }
      
      setCameraError(errorMessage);
      return errorMessage;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  };

  return {
    videoRef,
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
  };
};

