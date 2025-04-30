
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface UploadTabProps {
  previewUrl: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileInput: () => void;
}

export const UploadTab = ({ previewUrl, onFileChange, onTriggerFileInput }: UploadTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      <div
        className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-4 border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center p-4 cursor-pointer"
        onClick={onTriggerFileInput}
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
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
