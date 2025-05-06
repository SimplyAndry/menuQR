import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import type { inferProcedureInput } from '@trpc/server';
import { UploadButton } from '~/components/UploadButton';
import Link from 'next/link';
import { Fragment, useState } from 'react';
//import type { AppRouter } from '~/server/routers/_app';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUploadThing } from '~/utils/uploadthing';
import { PostModal } from '~/components/PostModal';
// Define the form schema
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

interface Page {
  items: MenuItem[];
  nextCursor?: string | null;
}

const IndexPage: NextPageWithLayout = () => {
  const utils = trpc.useUtils();
  const postsQuery = trpc.post.list.useInfiniteQuery(
    {
      limit: 80,
    },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    },
  );

  const addPost = trpc.post.add.useMutation({
    async onSuccess() {
      await utils.post.list.invalidate();
    },
  });
  const updatePost = trpc.post.update.useMutation({
    async onSuccess() {
      await utils.post.list.invalidate();
    },
  });
  const deletePost = trpc.post.delete.useMutation({
    async onSuccess() {
      await utils.post.list.invalidate();
    },
  });

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPostId, setUploadedPostId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [editingPost, setEditingPost] = useState<MenuItem | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [selectedPost, setSelectedPost] = useState<MenuItem | null>(null);
  
  const { data: categories } = trpc.category.list.useQuery();
  
  const createCategory = trpc.category.create.useMutation({
    onSuccess: () => {
      setNewCategoryName('');
      setIsAddingCategory(false);
      utils.category.list.invalidate();
      utils.post.list.invalidate();
      // Force a refetch of the posts to update groupedItems
      postsQuery.refetch();
    },
  });

  const updateCategory = trpc.category.update.useMutation({
    onSuccess: () => {
      setNewCategoryName('');
      setIsAddingCategory(false);
      utils.category.list.invalidate();
      utils.post.list.invalidate();
    },
  });

  const deleteCategory = trpc.category.delete.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      utils.post.list.invalidate();
    },
  });

  

  const { startUpload } = useUploadThing("imageUploader", {
    headers: () => ({
      'x-post-id': uploadedPostId || '',
    }),
    onClientUploadComplete: (res) => {
      if (res && res[0]?.ufsUrl && uploadedPostId) {
        // Qui possiamo aggiornare il post con l'URL dell'immagine
        // usando una nuova mutation che dovrai creare nel router
        alert("Immagine caricata!");
        setFiles([]);
        setUploadedPostId(null);
      }
    },
    onUploadError: (error: Error) => {
      alert(`ERRORE! ${error.message}`);
    },
  });

  // Form for category-specific product addition
  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    setValue: setValueCategory,
    formState: { errors: errorsCategory, isSubmitting: isSubmittingCategory },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      if (editingCategoryId) {
        await updateCategory.mutateAsync({ 
          id: editingCategoryId, 
          name: newCategoryName.trim() 
        });
        setEditingCategoryId('');
      } else {
        await createCategory.mutateAsync({ name: newCategoryName.trim() });
      }
    }
  };

  const handleEditPost = (post: MenuItem) => {
    setEditingPost(post);
    setValue('title', post.title);
    setValue('text', post.text);
    setValue('price', post.price);
    setValue('ingredients', post.ingredients);
    setImageUrl(post.imageUrl || undefined);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    reset();
    setFiles([]);
    setImageUrl(undefined);
  };

  const onSubmitEdit: SubmitHandler<PostFormData> = async (data) => {
    if (!editingPost) return;
    
    try {
      let newImageUrl: string | undefined = editingPost.imageUrl || undefined;
      
      if (files.length > 0) {
        setIsUploading(true);
        const uploadResult = await startUpload(files);
        if (uploadResult && uploadResult[0]?.url) {
          newImageUrl = uploadResult[0].url;
        }
        setIsUploading(false);
      }

      await updatePost.mutateAsync({
        id: editingPost.id,
        ...data,
        price: Number(data.price),
        ingredients: data.ingredients,
        imageUrl: newImageUrl,
        categoryId: editingPost.category.id,
      });
      
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const onSubmit: SubmitHandler<PostFormData> = async (data) => {
    try {
      let imageUrl = undefined;
      
      if (files.length > 0) {
        setIsUploading(true);
        const uploadResult = await startUpload(files);
        if (uploadResult && uploadResult[0]?.url) {
          imageUrl = uploadResult[0].url;
        }
        setIsUploading(false);
      }

      const result = await addPost.mutateAsync({
        ...data,
        price: Number(data.price),
        ingredients: data.ingredients,
        categoryId: selectedCategoryId,
        imageUrl: imageUrl,
      });
      
      // Reset di tutti gli stati
      reset();
      setFiles([]);
      setImageUrl(undefined);
      setSelectedCategoryId('');
      setIsAddingProduct(false);
    } catch (error) {
      console.error('Failed to add post:', error);
    }
  };

  // Group items by category
  const groupedItems = postsQuery.data?.pages.reduce((acc, page) => {
    page.items.forEach((item) => {
      const category = item.category.name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
    });
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

  // Add empty categories to the grouped items
  const allCategories = categories?.map(cat => cat.name) || [];
  allCategories.forEach(category => {
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAddProduct = (category: string) => {
    const categoryObj = categories?.find(cat => cat.name === category);
    if (categoryObj) {
      setIsAddingProduct(true);
      setSelectedCategoryId(categoryObj.id);
      // Reset del form quando si aggiunge un nuovo prodotto
      reset();
      setFiles([]);
      setImageUrl(undefined);
    }
  };

  const handleCloseCategoryForm = () => {
    setSelectedCategoryId('');
    resetCategory();
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, hasItems: boolean) => {
    if (hasItems) {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare la categoria "${categoryName}" e tutti i suoi prodotti?`);
      if (!confirmed) return;
    }
    await deleteCategory.mutateAsync({ id: categoryId });
  };

  const handleEditCategory = (category: { id: string; name: string }) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setIsEditingCategory(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategoryName.trim()) {
      await updateCategory.mutateAsync({ 
        id: editingCategoryId, 
        name: editingCategoryName.trim() 
      });
      setIsEditingCategory(false);
      setEditingCategoryId('');
      setEditingCategoryName('');
    }
  };

  return (
    
    <div className="flex flex-col bg-gray-800 text-white py-8 px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Menu QR
        </h1>
      </div>
      <p className="text-white-400 mb-8">
        Scegli cosa vuoi ordinare.
      </p>

      <div className="space-y-4">
        {Object.entries(groupedItems || {}).map(([category, items]) => (
          <div key={category} className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="w-full p-4 bg-gray-900 hover:bg-gray-800 flex justify-between items-center">
              <button
                onClick={() => toggleCategory(category)}
                className="flex-1 flex justify-between items-center"
              >
                
                {editingCategoryId === categories?.find(cat => cat.name === category)?.id ? (
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
                    {/* <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingCategory(false);
                        setEditingCategoryId('');
                        setEditingCategoryName('');
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold"
                    >
                      Annulla
                    </button> */}
                  </form>
                ) : (
                  <h2 className="text-2xl font-semibold">{category}</h2>
                )}
                <span className="text-xl">
                  {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </button>
              <button
                onClick={() => {
                  const categoryObj = categories?.find(cat => cat.name === category);
                  if (categoryObj) {
                    handleDeleteCategory(categoryObj.id, category, items.length > 0);
                  }
                }}
                className="ml-4 p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold"
                title="Elimina categoria"
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
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
              {!editingCategoryId && (
                <button
                  onClick={() => {
                    const categoryObj = categories?.find(cat => cat.name === category);
                    if (categoryObj) {
                      handleEditCategory(categoryObj);
                    }
                  }}
                  className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
                  title="Modifica categoria"
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
              )}
            </div>
            
            {expandedCategories[category] && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    
                    <article 
                      key={item.id} 
                      className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {editingPost?.id === item.id ? (
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
                          {item.imageUrl && (
                            <div className="relative group">
                              <img 
                                src={item.imageUrl} 
                                alt={item.title}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                              />
                              {editingPost?.id === item.id && (
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
                              )}
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
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold"
                            >
                              Annulla
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          
                          <button 
                            onClick={() => setSelectedPost(item)}
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
                              onClick={() => handleEditPost(item)}
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
                  ))}
                  
                  {/* Add Product Card */}
                  <article 
                    className={`bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors ${
                      isAddingProduct && selectedCategoryId === categories?.find(cat => cat.name === category)?.id
                        ? 'border-2 border-solid border-green-500'
                        : 'border-2 border-dashed border-gray-700'
                    }`}
                    onClick={() => {
                      if (!isAddingProduct) {
                        const categoryObj = categories?.find(cat => cat.name === category);
                        if (categoryObj) {
                          setIsAddingProduct(true);
                          setSelectedCategoryId(categoryObj.id);
                          reset();
                          setFiles([]);
                          setImageUrl(undefined);
                        }
                      }
                    }}
                  >
                    {isAddingProduct && selectedCategoryId === categories?.find(cat => cat.name === category)?.id ? (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                            title="Salva prodotto"
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
                        <div className="relative group">
                          <div className="w-full h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
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
                            onClick={() => {
                              setIsAddingProduct(false);
                              setSelectedCategoryId('');
                              reset();
                              setFiles([]);
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold"
                          >
                            Annulla
                          </button>
                        </div>
                        
                      </form>
                    ) : (
                      <div className="text-center h-full flex items-center justify-center">
                        <div>
                          <span className="text-4xl mb-2">+</span>
                          <p className="text-gray-400">Aggiungi prodotto</p>
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add New Category Button */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          {isAddingCategory ? (
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
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full p-4 bg-gray-900 hover:bg-gray-800 flex justify-between items-center"
            >
              <h2 className="text-2xl font-semibold">Nuova Categoria</h2>
            </button>
          )}
        </div>
      </div>

      <hr className="my-12 border-gray-700" />

      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)}
          onDelete={(id) => deletePost.mutate({ id })}
        />
      )}
    </div>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @see https://trpc.io/docs/v11/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createServerSideHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.post.all.fetch();
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
