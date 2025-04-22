
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface StressResult {
  stressLevel: "low" | "medium" | "high";
  score: number;
  resultImage?: string;
}

// We'll remove the demo result generation since we're focusing on real API calls
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
      signal: AbortSignal.timeout(15000), // Increased timeout for ML processing
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
    
    // Display appropriate toast based on stress level
    if (data.stress_level === "high") {
      toast.error("High stress detected!", { 
        id: "stress-analysis",
        description: `Your stress level is high (${data.stress_score}%). Please take care of yourself.` 
      });
      
      // Also notify the backend to send email
      try {
        await fetch(`${API_BASE_URL}/api/stress/notify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    } else if (data.stress_level === "medium") {
      toast.warning("Moderate stress detected", { 
        id: "stress-analysis",
        description: `Your stress level is moderate (${data.stress_score}%).` 
      });
    } else {
      toast.success("Analysis complete", { 
        id: "stress-analysis",
        description: `Your stress level is low (${data.stress_score}%).` 
      });
    }
    
    return {
      stressLevel: data.stress_level,
      score: data.stress_score,
      resultImage: data.result_image,
    };
  } catch (err) {
    console.error("Error analyzing image:", err);
    
    // If it's a network or connection error, inform the user
    if (err instanceof Error) {
      toast.error("Analysis failed", { 
        id: "stress-analysis", 
        description: err.message
      });
    }
    
    throw err; // Re-throw the error to be handled by the component
  }
};

// Function to fetch user's historical stress results
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
