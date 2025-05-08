import { type FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadButton } from './UploadButton';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(32, 'Title must be less than 32 characters'),
  text: z.string().min(1, 'Text is required'),
  price: z.number(),
  ingredients: z.string().min(1, 'Ingredients is required'),
  imageUrl: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface MenuItem {
  id: string;
  title: string;
  text: string;
  price: number;
  ingredients: string;
  imageUrl?: string | null;
  category: {
    id: string;
    name: string;
  };
}

interface EditProductFormProps {
  editingPost: MenuItem | null;
  files: File[];
  setFiles: (files: File[]) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  setImageUrl: (url: string | undefined) => void;
  startUpload: (files: File[]) => Promise<{ url: string }[] | undefined>;
  onSubmitEdit: SubmitHandler<PostFormData>;
  onCancel: () => void;
}

export const EditProductForm: FC<EditProductFormProps> = ({
  editingPost,
  files,
  setFiles,
  isUploading,
  setIsUploading,
  setImageUrl,
  startUpload,
  onSubmitEdit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: editingPost ? {
      title: editingPost.title,
      text: editingPost.text,
      price: editingPost.price,
      ingredients: editingPost.ingredients,
      imageUrl: editingPost.imageUrl || undefined,
    } : undefined,
  });

  if (!editingPost) return null;

  return (
    <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
      <div className="flex justify-between items-start mb-4">
        <input
          className="text-2xl font-semibold outline-none bg-transparent border-gray-700 focus:border-blue-500 outline-none w-full"
          {...register('title')}
          type="text"
          placeholder="Nome prodotto"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
          title="Salva modifiche"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>
      </div>
      {editingPost.imageUrl && (
        <div className="relative group">
          <img 
            src={editingPost.imageUrl} 
            alt={editingPost.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <UploadButton 
                files={files}
                setFiles={setFiles}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                startUpload={startUpload}
                setImageUrl={setImageUrl}
              /> 
            </div>
          </div>
        </div>
      )}
      <textarea
        className="w-full p-2 bg-transparent outline-none border-gray-700 focus:border-blue-500 outline-none text-gray-300"
        {...register('text')}
        placeholder="Descrizione"
        disabled={isSubmitting}
        rows={2}
      />
      <input
        className="w-full p-2 bg-transparent outline-none border-gray-700 focus:border-blue-500 outline-none text-gray-400"
        {...register('ingredients')}
        type="text"
        placeholder="Ingredienti"
        disabled={isSubmitting}
      />
      <div className="flex justify-between items-center">
        <input
          className="text-xl font-bold bg-transparent outline-none border-gray-700 focus:border-blue-500 outline-none w-24"
          {...register('price', { valueAsNumber: true })}
          type="number"
          step="0.01"
          placeholder="Prezzo"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}; 