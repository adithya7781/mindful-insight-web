
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface StressResult {
  stressLevel: "low" | "medium" | "high";
  score: number;
  resultImage?: string;
}

const generateDemoResult = (imageUrl: string | null): StressResult => {
  const baseScore = Math.random() * 27 + 65;
  const variation = Math.random() * 10 - 5;
  const score = Math.min(Math.max(baseScore + variation, 40), 95);
  
  let stressLevel: "low" | "medium" | "high";
  if (score < 60) {
    stressLevel = "low";
  } else if (score < 80) {
    stressLevel = "medium";
  } else {
    stressLevel = "high";
  }
  
  return {
    stressLevel,
    score: parseFloat(score.toFixed(1)),
    resultImage: imageUrl || undefined,
  };
};

export const analyzeStressLevel = async (
  imageData: string | File,
  token: string
): Promise<StressResult> => {
  const formData = new FormData();
  
  if (typeof imageData === "string") {
    // Handle base64 image data from webcam
    formData.append("image_data", imageData);
  } else {
    // Handle file upload
    formData.append("image", imageData);
  }
  
  try {
    toast.loading("Analyzing stress levels...", { id: "stress-analysis" });
    
    const response = await fetch(`${API_BASE_URL}/api/stress/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: AbortSignal.timeout(8000), // Increased timeout for ML processing
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Server responded with status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to analyze image");
    }
    
    toast.success("Analysis complete", { 
      id: "stress-analysis",
      description: `Your stress level is ${data.stress_level} (${data.stress_score}%)` 
    });
    
    return {
      stressLevel: data.stress_level,
      score: data.stress_score,
      resultImage: data.result_image,
    };
  } catch (err) {
    console.error("Error analyzing image:", err);
    
    // If it's a network or connection error, inform the user
    if (err instanceof Error && (
      err.message.includes("Failed to fetch") || 
      err.message.includes("NetworkError") ||
      err.message.includes("timeout")
    )) {
      toast.error("Connection error", { 
        id: "stress-analysis", 
        description: "Couldn't connect to the analysis server. Using demo mode."
      });
    } else {
      toast.info("Using demo mode for analysis", {
        id: "stress-analysis",
        description: "Backend connection unavailable. Using simulated results.",
      });
    }
    
    return generateDemoResult(typeof imageData === "string" ? imageData : null);
  }
};

// New function to fetch user's historical stress results
export const fetchStressHistory = async (token: string, limit: number = 10): Promise<StressResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stress/results?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch stress history");
    }
    
    return data.results.map((result: any) => ({
      id: result.id,
      stressLevel: result.stress_level,
      score: result.score,
      createdAt: result.created_at,
      notes: result.notes,
      resultImage: result.image_url,
    }));
  } catch (err) {
    console.error("Error fetching stress history:", err);
    toast.error("Failed to load stress history", {
      description: "Could not retrieve your previous stress analysis results.",
    });
    return [];
  }
};
