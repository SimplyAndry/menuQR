import { type FC } from 'react';

interface CategoryEditFormProps {
  editingCategoryId: string;
  categories: Array<{ id: string; name: string }> | undefined;
  category: string;
  editingCategoryName: string;
  setEditingCategoryName: (name: string) => void;
  handleUpdateCategory: (e: React.FormEvent) => Promise<void>;
}

export const CategoryEditForm: FC<CategoryEditFormProps> = ({
  editingCategoryId,
  categories,
  category,
  editingCategoryName,
  setEditingCategoryName,
  handleUpdateCategory,
}) => {
  return editingCategoryId === categories?.find(cat => cat.name === category)?.id ? (
    <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center gap-4">
      <input
        className="flex p-2 rounded bg-transparent text-white text-xl outline-none"
        type="text"
        value={editingCategoryName}
        onChange={(e) => setEditingCategoryName(e.target.value)}
        placeholder="Nome categoria"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="submit"
        className="px-2 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
        onClick={(e) => e.stopPropagation()}
      >
        Salva
      </button>
    </form>
  ) : null;
}; 