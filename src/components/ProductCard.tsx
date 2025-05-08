import { type FC } from 'react';
import { EditProductForm } from './EditProductForm';
import { type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

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

interface ProductCardProps {
  item: MenuItem;
  editingPost: MenuItem | null;
  files: File[];
  setFiles: (files: File[]) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  setImageUrl: (url: string | undefined) => void;
  startUpload: (files: File[]) => Promise<{ url: string }[] | undefined>;
  onSubmitEdit: SubmitHandler<PostFormData>;
  onCancelEdit: () => void;
  onEdit: (post: MenuItem) => void;
  onSelect: (post: MenuItem) => void;
}

export const ProductCard: FC<ProductCardProps> = ({
  item,
  editingPost,
  files,
  setFiles,
  isUploading,
  setIsUploading,
  setImageUrl,
  startUpload,
  onSubmitEdit,
  onCancelEdit,
  onEdit,
  onSelect,
}) => {
  const isEditing = editingPost?.id === item.id;

  return (
    <article className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors">
      {isEditing ? (
        <EditProductForm
          editingPost={editingPost}
          files={files}
          setFiles={setFiles}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          setImageUrl={setImageUrl}
          startUpload={startUpload}
          onSubmitEdit={onSubmitEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <button 
            onClick={() => onSelect(item)}
            className="text-white-300 hover:text-blue-300 inline-block w-full text-left"
          >
            <h3 className="text-2xl text-white-300 font-semibold mb-4">{item.title}</h3>
            {item.imageUrl && (
              <div className="relative group">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              </div>
            )}
            <p className="text-gray-300 mb-2">{item.text}</p>
            <p className="text-gray-400 mb-2">{item.ingredients}</p>
            <p className="text-xl font-bold text-white">€{item.price.toFixed(2)}</p>
          </button>
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => onEdit(item)}
              className="p-2 mt-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              title="Modifica prodotto"
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        </>
      )}
    </article>
  );
}; 