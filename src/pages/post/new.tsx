import { UploadButton } from "~/components/UploadButton";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useUploadThing } from "~/utils/uploadthing";

export default function NewPost() {
  const { handleSubmit } = useForm();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const { startUpload } = useUploadThing("imageUploader");

  const onSubmit = async (data: any) => {
    // Handle form submission here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <UploadButton 
          files={files}
          setFiles={setFiles}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          startUpload={startUpload}
          setImageUrl={setImageUrl}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Post
      </button>
    </form>
  );
} 