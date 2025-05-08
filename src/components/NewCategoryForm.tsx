import { type FC } from 'react';

interface NewCategoryFormProps {
  isAddingCategory: boolean;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  setIsAddingCategory: (isAdding: boolean) => void;
  handleCreateCategory: (e: React.FormEvent) => Promise<void>;
}

export const NewCategoryForm: FC<NewCategoryFormProps> = ({
  isAddingCategory,
  newCategoryName,
  setNewCategoryName,
  setIsAddingCategory,
  handleCreateCategory,
}) => {
  if (!isAddingCategory) {
    return (
      <button
        onClick={() => setIsAddingCategory(true)}
        className="w-full p-4 bg-gray-900 hover:bg-gray-800 flex justify-between items-center"
      >
        <h2 className="text-2xl font-semibold">Nuova Categoria</h2>
      </button>
    );
  }

  return (
    <form onSubmit={handleCreateCategory} className="p-4 bg-gray-900">
      <div className="flex items-center gap-4">
        <input
          className="flex-1 p-2 rounded border bg-gray-800 border-gray-700 text-white"
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nome categoria"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
        >
          Crea
        </button>
        <button
          type="button"
          onClick={() => {
            setIsAddingCategory(false);
            setNewCategoryName('');
          }}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}; 