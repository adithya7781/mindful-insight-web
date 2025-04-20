
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
    formData.append("image_data", imageData);
  } else {
    formData.append("image", imageData);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/stress/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to analyze image");
    }
    
    return {
      stressLevel: data.stress_level,
      score: data.stress_score,
      resultImage: data.result_image,
    };
  } catch (err) {
    console.error("Error analyzing image:", err);
    toast.info("Using demo mode for analysis", {
      description: "Backend connection unavailable. Using simulated results.",
    });
    
    return generateDemoResult(typeof imageData === "string" ? imageData : null);
  }
};

