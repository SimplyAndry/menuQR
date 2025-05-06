import { type FC } from 'react';

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

interface PostModalProps {
  post: MenuItem;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const PostModal: FC<PostModalProps> = ({ post, onClose, onDelete }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold">{post.title}</h2>
          <button
            onClick={() => {
              onDelete(post.id);
              onClose();
            }}
            className="bg-red-700 text-white rounded-md p-2 hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>

        {post.imageUrl && (
          <div className="my-4">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Descrizione</h3>
            <p className="text-gray-300">{post.text}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Ingredienti</h3>
            <p className="text-gray-300">{post.ingredients}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Prezzo</h3>
            <p className="text-2xl font-bold text-white">€{post.price.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};