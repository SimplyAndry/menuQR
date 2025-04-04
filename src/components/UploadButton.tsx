import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "~/utils/uploadthing";

interface UploadButtonProps {
  files: File[];
  setFiles: (files: File[]) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  startUpload: (files: File[]) => void;
  postId?: string;
  setImageUrl: (url: string) => void;
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
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, [setFiles]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
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
    <div className="flex flex-col items-center justify-center">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
      >
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <div>
            <p>{files.length} file(s) selected</p>
            <button
              onClick={() => uploadThingStartUpload(files)}
              disabled={isUploading}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        ) : (
          <p>Drag & drop files here, or click to select files</p>
        )}
      </div>
    </div>
  );
} 