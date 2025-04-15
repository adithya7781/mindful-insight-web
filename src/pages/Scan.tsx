
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Camera, Check, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Scan = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    stressLevel: "low" | "medium" | "high";
    score: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !user.isApproved)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

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

  const analyzeImage = () => {
    if (!capturedImage) return;
    
    setAnalyzing(true);
    
    // Simulate stress analysis with ML (would connect to backend in production)
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
      
      setResult({
        stressLevel,
        score,
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
    }, 3000);
  };

  const resetScan = () => {
    setCapturedImage(null);
    setResult(null);
    setCameraActive(false);
  };

  const saveResult = () => {
    if (!result) return;
    
    // Would send to backend in production
    toast({
      title: "Result Saved",
      description: "Your stress analysis has been saved successfully.",
    });
    
    navigate("/dashboard");
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
            Capture an image to analyze your current stress levels
          </p>
        </div>

        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Stress Detection</CardTitle>
            <CardDescription>
              Use your camera to capture an image for stress analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="relative w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden mb-4">
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

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />

            {result && (
              <div className="w-full max-w-md p-4 bg-muted rounded-lg mb-4">
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
                        ? "bg-stress-low" 
                        : result.stressLevel === "medium" 
                        ? "bg-stress-medium" 
                        : "bg-stress-high"
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
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4 flex-wrap">
            {!cameraActive && !capturedImage && (
              <Button onClick={startCamera}>
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            )}
            
            {cameraActive && !capturedImage && (
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
            
            {capturedImage && !result && (
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
                  Retake
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
