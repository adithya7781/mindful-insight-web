
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  Camera, 
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
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Scan = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (!isLoading && (!user || !user.isApproved)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Cleanup function to stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
    };
  }, [cameraActive]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError("Failed to access camera. Please check permissions and try again.");
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach((track) => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      
      if (context) {
        // Match canvas dimensions to video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        
        // Convert canvas to data URL
        const imageDataUrl = canvasRef.current.toDataURL("image/png");
        setCapturedImage(imageDataUrl);
        
        // Stop camera
        stopCamera();
      }
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
    
    // In a real implementation, this would send the image to a backend API
    // For this demo, we'll simulate the response after a delay
    try {
      // Simulate API call
      setTimeout(() => {
        // Generate random score between 10-95 for demo purposes
        const score = Math.floor(Math.random() * 85) + 10;
        let stressLevel: "low" | "medium" | "high";
        
        if (score < 40) {
          stressLevel = "low";
        } else if (score < 70) {
          stressLevel = "medium";
        } else {
          stressLevel = "high";
        }
        
        // Create result
        setResult({
          stressLevel,
          score,
          resultImage: activeTab === "camera" ? capturedImage || undefined : previewUrl || undefined
        });
        
        // Show notification for high stress
        if (stressLevel === "high") {
          toast({
            variant: "destructive",
            title: "High Stress Detected",
            description: "Your stress levels are high. Consider taking a break.",
          });
        }
        
        setAnalyzing(false);
      }, 2000);
      
      /* 
      // Real implementation would look like this:
      
      const formData = new FormData();
      
      if (typeof imageToAnalyze === 'string') {
        // For base64 image data from camera
        formData.append('image_data', imageToAnalyze);
      } else {
        // For file upload
        formData.append('image', imageToAnalyze);
      }
      
      const response = await fetch('/api/detect/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Process the first face result
        const faceResult = data.results[0];
        
        setResult({
          stressLevel: faceResult.stress_category,
          score: faceResult.stress_score,
          resultImage: data.result_image
        });
        
        if (faceResult.stress_category === 'high') {
          toast({
            variant: "destructive",
            title: "High Stress Detected",
            description: "Your stress levels are high. Consider taking a break.",
          });
        }
      } else {
        setError(data.message || 'Failed to analyze image');
      }
      
      setAnalyzing(false);
      */
      
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError("An error occurred during analysis. Please try again.");
      setAnalyzing(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setCameraActive(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveResult = () => {
    if (!result) return;
    
    // Would send to backend in production
    toast({
      title: "Result Saved",
      description: "Your stress analysis has been saved successfully.",
    });
    
    navigate("/dashboard/results");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user || !user.isApproved) {
    return null; // Will redirect in useEffect
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {cameraActive && (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
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
                    className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-4 border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center p-4"
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
