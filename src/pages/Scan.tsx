import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Camera, Loader2, RefreshCw, Check, UploadCloud, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useCamera } from "@/hooks/useCamera";
import { analyzeStressLevel } from "@/services/stressAnalysis";
import { CameraTab } from "@/components/scan/CameraTab";
import { UploadTab } from "@/components/scan/UploadTab";
import { StressResult } from "@/components/scan/StressResult";

const Scan = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
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

  const { videoRef, cameraActive, cameraError, startCamera, stopCamera } = useCamera();

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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      
      if (context) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        
        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        
        try {
          const imageDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9); // Increased quality
          setCapturedImage(imageDataUrl);
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
      
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      
      setUploadedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAnalysis = async () => {
    let imageToAnalyze: string | File | null = null;
    
    if (activeTab === "camera" && capturedImage) {
      imageToAnalyze = capturedImage;
      console.log("Analyzing captured image from camera");
    } else if (activeTab === "upload" && uploadedImage) {
      imageToAnalyze = uploadedImage;
      console.log("Analyzing uploaded image file");
    } else {
      setError("No image available for analysis.");
      return;
    }
    
    if (!imageToAnalyze) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication error. Please log in again.");
        setAnalyzing(false);
        return;
      }
      
      console.log("Starting stress analysis with token");
      const analysisResult = await analyzeStressLevel(imageToAnalyze, token);
      console.log("Analysis complete:", analysisResult);
      setResult(analysisResult);
      
      // Show appropriate toast notification
      if (analysisResult.stressLevel === "high") {
        toast.error("High Stress Detected", {
          description: "Your stress levels are high. Consider taking a break.",
        });
      } else if (analysisResult.stressLevel === "medium") {
        toast.warning("Medium Stress Detected", {
          description: "Your stress levels are moderate. Consider some relaxation techniques.",
        });
      } else {
        toast.success("Low Stress Detected", {
          description: "Your stress levels are low. Keep up the good work!",
        });
      }
    } catch (err) {
      console.error("Error during analysis:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setResult(null);
    stopCamera();
    setError(null);
    
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
                
                <TabsContent value="camera">
                  <CameraTab
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    cameraActive={cameraActive}
                    cameraError={cameraError}
                    capturedImage={capturedImage}
                    onStartCamera={startCamera}
                    onStopCamera={stopCamera}
                    onCapture={captureImage}
                  />
                  
                  {!capturedImage && (
                    <div className="flex justify-center mt-4">
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
                  )}
                </TabsContent>
                
                <TabsContent value="upload">
                  <UploadTab
                    previewUrl={previewUrl}
                    onFileChange={handleFileChange}
                    onTriggerFileInput={triggerFileInput}
                    fileInputRef={fileInputRef}
                  />
                  
                  {!previewUrl && (
                    <div className="flex justify-center mt-4">
                      <Button onClick={triggerFileInput}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {result && <StressResult {...result} />}
          </CardContent>
          <CardFooter className="flex justify-center gap-4 flex-wrap">
            {((activeTab === "camera" && capturedImage) || (activeTab === "upload" && previewUrl)) && !result && (
              <>
                <Button onClick={handleAnalysis} disabled={analyzing}>
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
