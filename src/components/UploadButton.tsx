import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "~/utils/uploadthing";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  files: File[];
  setFiles: (files: File[]) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  startUpload: (files: File[]) => Promise<{ url: string }[] | undefined>;
  postId?: string;
  setImageUrl: (url: string | undefined) => void;
}

export function UploadButton({ 
  files, 
  setFiles, 
  isUploading, 
  setIsUploading,
  startUpload,
  postId,
  setImageUrl
}: UploadButtonProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    // Create preview
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [setFiles]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
  });

  const { startUpload: uploadThingStartUpload } = useUploadThing("imageUploader", {
    headers: () => ({
      'x-post-id': postId || '',
    }),
    onClientUploadComplete: (res) => {
      if (res && res[0]?.ufsUrl && postId) {
        alert("Upload Completed!");
        setFiles([]);
        setImageUrl(res[0].ufsUrl);
      }
    },
    onUploadError: (error: Error) => {
      alert(`ERROR! ${error.message}`);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <p>Uploading...</p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6" />
            <p>Drag and drop an image, or click to select</p>
          </div>
        )}
      </div>
      {preview && (
        <div className="mt-2">
          <img 
            src={preview} 
            alt="Preview" 
            className="max-h-48 w-auto rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
} 