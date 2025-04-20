
import { AlertCircle, Check, XCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface StressResultProps {
  stressLevel: "low" | "medium" | "high";
  score: number;
  resultImage?: string;
}

export const StressResult = ({ stressLevel, score, resultImage }: StressResultProps) => {
  return (
    <div className="w-full">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
        <img
          src={resultImage}
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
              stressLevel === "low" 
                ? "bg-green-500" 
                : stressLevel === "medium" 
                ? "bg-amber-500" 
                : "bg-red-500"
            }`}
          >
            {stressLevel === "low" ? (
              <Check className="h-8 w-8 text-white" />
            ) : stressLevel === "medium" ? (
              <AlertCircle className="h-8 w-8 text-white" />
            ) : (
              <XCircle className="h-8 w-8 text-white" />
            )}
          </div>
          
          <div>
            <h4 className="font-semibold">{score}% Stress Level</h4>
            <p className="capitalize text-sm">
              {stressLevel} Stress Detected
            </p>
          </div>
        </div>
        
        {stressLevel === "high" && (
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
  );
};

