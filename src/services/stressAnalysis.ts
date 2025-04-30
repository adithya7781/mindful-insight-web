
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface StressResult {
  stressLevel: "low" | "medium" | "high";
  score: number;
  resultImage?: string;
}

export const analyzeStressLevel = async (
  imageData: string | File,
  token: string
): Promise<StressResult> => {
  const formData = new FormData();
  
  if (typeof imageData === "string") {
    // Handle base64 image data from webcam
    console.log("Processing base64 image from camera");
    formData.append("image_data", imageData);
  } else {
    // Handle file upload
    console.log("Processing uploaded file:", imageData.name, imageData.type);
    formData.append("image", imageData);
  }
  
  try {
    toast.loading("Analyzing stress levels...", { id: "stress-analysis" });
    
    console.log("Sending request to API...");
    
    // Since we're in a demo mode, let's create a mock response
    // This will help us test the UI without a backend
    
    // Wait to simulate network request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a random score between 30 and 90
    const score = Math.floor(Math.random() * 60) + 30;
    
    // Determine stress level based on score
    let stressLevel: "low" | "medium" | "high";
    if (score < 50) {
      stressLevel = "low";
      toast.success("Analysis complete", { 
        id: "stress-analysis",
        description: `Your stress level is low (${score}%).` 
      });
    } else if (score < 75) {
      stressLevel = "medium";
      toast.warning("Moderate stress detected", { 
        id: "stress-analysis",
        description: `Your stress level is moderate (${score}%).` 
      });
    } else {
      stressLevel = "high";
      toast.error("High stress detected!", { 
        id: "stress-analysis",
        description: `Your stress level is high (${score}%). Please take care of yourself.` 
      });
    }
    
    // Create a mock result image
    // We'll use a placeholder image for now
    const mockImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABIAAAAAQAAAEgAAAABcGFpbnQubmV0IDUuMC43/9sAQwABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/9sAQwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/8AAEQgAQABAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/v4paKKABScUHgc9BQvbrz3x17eo9PT17V4p8U/in4a+EekXWseIdUFk0UNxNZaaJoU1PVIoCFaKyilkVmdnZAHxsQbmdn2RzTpwT9FKMZyUYK8qk2opd3Jt2SXm3ZdWu5PXmg9On6j0pnm7s7SG29yi7j9cn+nStbw14g0zxboOmeING82bStTQPE8sTQyArkEFHAIOR904DAhlYFWANUGsdkFpMjJJPc5/xooB5HHSikB6pRRRQB//2Q==";
    
    return {
      stressLevel,
      score,
      resultImage: mockImage
    };
    
    /* Commented out the actual API call, replace with mock response above
    const response = await fetch(`${API_BASE_URL}/api/stress/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30000), // Increased timeout for ML processing
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Server responded with status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Analysis result:", data);
    
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
    */
    
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
    // Since we're in a demo mode, let's create mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate some random historical data
    const mockResults = Array.from({ length: 5 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index * 2); // Every 2 days in the past
      
      const score = Math.floor(Math.random() * 80) + 20;
      let stressLevel: "low" | "medium" | "high";
      
      if (score < 50) {
        stressLevel = "low";
      } else if (score < 75) {
        stressLevel = "medium";
      } else {
        stressLevel = "high";
      }
      
      return {
        id: `result-${index + 1}`,
        userId: "demo-user-id",
        stressLevel,
        score,
        createdAt: date,
        notes: index % 2 === 0 ? "After meditation session" : "During work hours",
      };
    });
    
    return mockResults;
    
    /* Commented out the actual API call, replace with mock response above
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
    */
    
  } catch (err) {
    console.error("Error fetching stress history:", err);
    toast.error("Failed to load stress history", {
      description: "Could not retrieve your previous stress analysis results.",
    });
    return [];
  }
};
