
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  Camera, 
  CameraOff,
  Check, 
  Loader2, 
  RefreshCw, 
  UploadCloud, 
  XCircle 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Scan = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    stressLevel: "low" | "medium" | "high";
    score: number;
    resultImage?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !user.isApproved)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Cleanup function to stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
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
      setError("Camera access failed. " + errorMessage);
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      
      if (context) {
        // Get video dimensions
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        // Set canvas dimensions to match video
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(
          videoRef.current,
          0,
          0,
          videoWidth,
          videoHeight
        );
        
        // Convert canvas to data URL
        try {
          const imageDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.8);
          setCapturedImage(imageDataUrl);
          
          // Stop camera
          stopCamera();
        } catch (err) {
          console.error("Error capturing image:", err);
          setError("Failed to capture image. Please try again.");
        }
      }
    } else {
      setError("Camera not initialized properly. Please restart the camera.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      
      setUploadedImage(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const analyzeImage = async () => {
    let imageToAnalyze: string | File | null = null;
    
    if (activeTab === "camera" && capturedImage) {
      imageToAnalyze = capturedImage;
    } else if (activeTab === "upload" && uploadedImage) {
      imageToAnalyze = uploadedImage;
    } else {
      setError("No image available for analysis.");
      return;
    }
    
    if (!imageToAnalyze) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (typeof imageToAnalyze === 'string') {
        // For base64 image data from camera
        formData.append('image_data', imageToAnalyze);
      } else {
        // For file upload
        formData.append('image', imageToAnalyze);
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Authentication error. Please log in again.");
        setAnalyzing(false);
        return;
      }
      
      console.log("Sending image for analysis...");
      
      const response = await fetch(`${API_BASE_URL}/api/stress/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Analysis response:", data);
      
      if (data.success) {
        // Process the face result
        setResult({
          stressLevel: data.stress_level,
          score: data.stress_score,
          resultImage: data.result_image || undefined
        });
        
        if (data.stress_level === 'high') {
          toast.error("High Stress Detected", {
            description: "Your stress levels are high. Consider taking a break.",
          });
        }
      } else {
        setError(data.message || 'Failed to analyze image');
      }
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError(`An error occurred during analysis: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setCameraActive(false);
    setCameraError(null);
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveResult = async () => {
    if (!result) return;
    
    try {
      navigate("/dashboard/results");
      toast.success("Result Saved", {
        description: "Your stress analysis has been saved successfully.",
      });
    } catch (err) {
      console.error("Error saving result:", err);
      toast.error("Error Saving Result", {
        description: "Failed to save your stress analysis.",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.isApproved) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Your account needs to be approved by an administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stress Scan</h1>
          <p className="text-muted-foreground mt-1">
            Capture or upload an image to analyze your current stress levels
          </p>
        </div>

        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Stress Detection</CardTitle>
            <CardDescription>
              Use your camera or upload an image for stress analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {error && (
              <Alert variant="destructive" className="mb-4 w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!result && (
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as "camera" | "upload")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="camera">Camera</TabsTrigger>
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                </TabsList>
                
                <TabsContent value="camera" className="w-full">
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
                        className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
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
                  
                  {!capturedImage ? (
                    <div className="flex justify-center">
                      {!cameraActive ? (
                        <Button onClick={startCamera}>
                          <Camera className="mr-2 h-4 w-4" />
                          Start Camera
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button onClick={captureImage}>
                            <Camera className="mr-2 h-4 w-4" />
                            Capture
                          </Button>
                          <Button variant="outline" onClick={stopCamera}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </TabsContent>
                
                <TabsContent value="upload" className="w-full">
                  <div 
                    className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-4 border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center p-4 cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    {!previewUrl ? (
                      <>
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          Click to upload an image<br />
                          <span className="text-xs">or drag and drop</span>
                        </p>
                      </>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Uploaded"
                        className="w-full h-full object-contain"
                      />
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  {!previewUrl && (
                    <div className="flex justify-center">
                      <Button onClick={triggerFileInput}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />

            {result && (
              <div className="w-full">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  <img
                    src={result.resultImage || (activeTab === "camera" ? capturedImage || "" : previewUrl || "")}
                    alt="Analysis Result"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="w-full p-4 bg-muted rounded-lg mb-4">
                  <div className="text-center mb-2">
                    <h3 className="text-xl font-semibold">Analysis Result</h3>
                    <p className="text-sm text-muted-foreground">
                      Based on facial features and expressions
                    </p>
                  </div>
                  
                  <div className="flex justify-center items-center gap-4 my-4">
                    <div 
                      className={`h-16 w-16 rounded-full flex items-center justify-center ${
                        result.stressLevel === "low" 
                          ? "bg-green-500" 
                          : result.stressLevel === "medium" 
                          ? "bg-amber-500" 
                          : "bg-red-500"
                      }`}
                    >
                      {result.stressLevel === "low" ? (
                        <Check className="h-8 w-8 text-white" />
                      ) : result.stressLevel === "medium" ? (
                        <AlertCircle className="h-8 w-8 text-white" />
                      ) : (
                        <XCircle className="h-8 w-8 text-white" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">{result.score}% Stress Level</h4>
                      <p className="capitalize text-sm">
                        {result.stressLevel} Stress Detected
                      </p>
                    </div>
                  </div>
                  
                  {result.stressLevel === "high" && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>High Stress Detected</AlertTitle>
                      <AlertDescription>
                        Your stress levels are concerning. We recommend taking a break and practicing relaxation techniques.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4 flex-wrap">
            {activeTab === "camera" && !capturedImage && !result && (
              <Button onClick={startCamera} disabled={cameraActive}>
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            )}
            
            {activeTab === "camera" && cameraActive && !capturedImage && !result && (
              <>
                <Button onClick={captureImage} variant="default">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
            
            {activeTab === "upload" && !previewUrl && !result && (
              <Button onClick={triggerFileInput}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            )}
            
            {((activeTab === "camera" && capturedImage) || (activeTab === "upload" && previewUrl)) && !result && (
              <>
                <Button onClick={analyzeImage} disabled={analyzing}>
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Analyze Stress
                    </>
                  )}
                </Button>
                <Button onClick={resetScan} variant="outline" disabled={analyzing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </>
            )}
            
            {result && (
              <>
                <Button onClick={saveResult}>
                  <Check className="mr-2 h-4 w-4" />
                  Save Result
                </Button>
                <Button onClick={resetScan} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Scan
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Scan;
