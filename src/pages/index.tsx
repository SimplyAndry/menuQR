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

// Define the form schema
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(32, 'Title must be less than 32 characters'),
  text: z.string().min(1, 'Text is required'),
  price: z.number(),
  ingredients: z.string().min(1, 'Ingredients is required'),
  type: z.string().optional(),
  imageUrl: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface MenuItem {
  id: string;
  title: string;
  text: string;
  price: number;
  ingredients: string;
  type?: string | null;
  imageUrl?: string | null;
}

interface Page {
  items: MenuItem[];
  nextCursor?: string | null;
}

const IndexPage: NextPageWithLayout = () => {
  const utils = trpc.useUtils();
  const postsQuery = trpc.post.list.useInfiniteQuery(
    {
      limit: 50,
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
  const [isAddingToCategory, setIsAddingToCategory] = useState<string | null>(null);

  const { startUpload } = useUploadThing("imageUploader", {
    headers: () => ({
      'x-post-id': uploadedPostId || '',
    }),
    onClientUploadComplete: (res) => {
      if (res && res[0]?.ufsUrl && uploadedPostId) {
        // Qui possiamo aggiornare il post con l'URL dell'immagine
        // usando una nuova mutation che dovrai creare nel router
        alert("Upload Completed!");
        setFiles([]);
        setUploadedPostId(null);
      }
    },
    onUploadError: (error: Error) => {
      alert(`ERROR! ${error.message}`);
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

  const onSubmit: SubmitHandler<PostFormData> = async (data) => {
    try {
      let imageUrl = undefined;
      
      // If there are files to upload, upload them first
      if (files.length > 0) {
        setIsUploading(true);
        const uploadResult = await startUpload(files);
        if (uploadResult && uploadResult[0]?.url) {
          imageUrl = uploadResult[0].url;
        }
        setIsUploading(false);
      }

      // Create the post with the image URL
      const result = await addPost.mutateAsync({
        ...data,
        price: Number(data.price),
        ingredients: data.ingredients,
        type: data.type,
        imageUrl: imageUrl,
      });
      
      reset();
      setFiles([]);
      setImageUrl(undefined);
    } catch (error) {
      console.error('Failed to add post:', error);
    }
  };

  const onSubmitCategory: SubmitHandler<PostFormData> = async (data) => {
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
        type: isAddingToCategory || data.type,
        imageUrl: imageUrl,
      });
      
      resetCategory();
      setFiles([]);
      setImageUrl(undefined);
      setIsAddingToCategory(null);
    } catch (error) {
      console.error('Failed to add post:', error);
    }
  };

  // Group items by category
  const groupedItems = postsQuery.data?.pages.reduce((acc, page) => {
    page.items.forEach((item) => {
      const category = item.type || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
    });
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAddProduct = (category: string) => {
    setValueCategory('type', category);
    setIsAddingToCategory(category);
  };

  const handleCloseCategoryForm = () => {
    setIsAddingToCategory(null);
    resetCategory();
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('main-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      setIsAddingProduct(true);
    }
  };

  return (
    <div className="flex flex-col bg-gray-800 text-white py-8 px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Menu QR
        </h1>
        <button
          onClick={scrollToForm}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
        >
          Aggiungi nuovo prodotto
        </button>
      </div>
      <p className="text-white-400 mb-8">
        Scegli cosa vuoi ordinare.
      </p>

      <div className="space-y-4">
        {groupedItems && Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 bg-gray-900 hover:bg-gray-800 flex justify-between items-center"
            >
              <h2 className="text-2xl font-semibold">{category}</h2>
              <span className="text-xl">
                {expandedCategories[category] ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedCategories[category] && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    
                    <article 
                      key={item.id} 
                      className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors"
                    ><Link 
                    className="text-blue-400 hover:text-blue-300 mt-4 inline-block" 
                    href={`/post/${item.id}`}
                  >
                      <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <p className="text-gray-300 mb-2">{item.text}</p>
                      <p className="text-gray-400 mb-2">{item.ingredients}</p>
                      <p className="text-xl font-bold text-white">€{item.price.toFixed(2)}</p>
                      
                        View details
                     </Link>
                    </article> 
                  ))}
                  
                  {/* Add Product Card */}
                  <article 
                    className="bg-gray-900 h-48 p-6 rounded-lg hover:bg-gray-800 transition-colors border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer"
                    onClick={() => handleAddProduct(category)}
                  >
                    <div className="text-center">
                      <span className="text-4xl mb-2">+</span>
                      <p className="text-gray-400">Aggiungi prodotto</p>
                    </div>
                  </article>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Category-specific Add Product Form Modal */}
      {isAddingToCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Aggiungi Prodotto a {isAddingToCategory}</h2>
            <form
              className="py-2"
              onSubmit={handleSubmitCategory(onSubmitCategory)}
            >
              <div className="flex flex-col gap-y-4 font-semibold">
                <div className="flex flex-col gap-y-1">
                  <input
                    className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                    {...registerCategory('title')}
                    type="text"
                    placeholder="Nome prodotto"
                    disabled={isSubmittingCategory}
                  />
                  {errorsCategory.title && (
                    <span className="text-red-500 text-sm">{errorsCategory.title.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-y-1">
                  <textarea
                    className="resize-none focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                    {...registerCategory('text')}
                    placeholder="Descrizione"
                    disabled={isSubmittingCategory}
                    rows={6}
                  />
                  {errorsCategory.text && (
                    <span className="text-red-500 text-sm">{errorsCategory.text.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-y-1">
                  <input
                    className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                    {...registerCategory('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="Prezzo"
                    disabled={isSubmittingCategory}
                  />
                  {errorsCategory.price && (
                    <span className="text-red-500 text-sm">{errorsCategory.price.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-y-1">
                  <input
                    className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                    {...registerCategory('ingredients')}
                    type="text"
                    placeholder="Ingredienti"
                    disabled={isSubmittingCategory}
                  />
                  {errorsCategory.ingredients && (
                    <span className="text-red-500 text-sm">{errorsCategory.ingredients.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-y-1">
                  <label className="text-white">Foto</label>
                  <UploadButton 
                    files={files}
                    setFiles={setFiles}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    startUpload={startUpload}
                    setImageUrl={setImageUrl}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseCategoryForm}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCategory}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                  >
                    {isSubmittingCategory ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        className="bg-gray-900 p-2 rounded-md font-semibold disabled:bg-gray-700 disabled:text-white-400 mt-8"
        onClick={() => postsQuery.fetchNextPage()}
        disabled={!postsQuery.hasNextPage || postsQuery.isFetchingNextPage}
      >
        {postsQuery.isFetchingNextPage
          ? 'Loading more...'
          : postsQuery.hasNextPage
            ? 'Load More'
            : 'fine del menu'}
      </button>

      <hr className="my-12 border-gray-700" />

      <div id="main-form" className="flex flex-col py-8 items-center">
        <button
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className="w-full max-w-2xl p-4 bg-gray-900 hover:bg-gray-800 flex justify-between items-center rounded-lg mb-4"
        >
          <h2 className="text-2xl font-semibold">Aggiungi un prodotto</h2>
          <span className="text-xl">
            {isAddingProduct ? '▼' : '▶'}
          </span>
        </button>

        {isAddingProduct && (
          <form
            className="py-2 w-full"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-y-4 font-semibold">
              <div className="flex flex-col gap-y-1">
                <input
                  className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                  {...register('title')}
                  type="text"
                  placeholder="Nome prodotto"
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <span className="text-red-500 text-sm">{errors.title.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-y-1">
                <textarea
                  className="resize-none focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                  {...register('text')}
                  placeholder="Descrizione"
                  disabled={isSubmitting}
                  rows={6}
                />
                {errors.text && (
                  <span className="text-red-500 text-sm">{errors.text.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-y-1">
                <input
                  className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="Prezzo"
                  disabled={isSubmitting}
                />
                {errors.price && (
                  <span className="text-red-500 text-sm">{errors.price.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-y-1">
                <input
                  className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                  {...register('type')}
                  type="text"
                  placeholder="Categoria"
                  disabled={isSubmitting}
                />
                {errors.type && (
                  <span className="text-red-500 text-sm">{errors.type.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-y-1">
                <input
                  className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                  {...register('ingredients')}
                  type="text"
                  placeholder="Ingredienti"
                  disabled={isSubmitting}
                />
                {errors.ingredients && (
                  <span className="text-red-500 text-sm">{errors.ingredients.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-y-1">
                <label className="text-white">Foto</label>
                <UploadButton 
                  files={files}
                  setFiles={setFiles}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                  startUpload={startUpload}
                  setImageUrl={setImageUrl}
                />
              </div>

              <div className="flex justify-center">
                <input
                  className="cursor-pointer bg-gray-900 p-2 rounded-md px-16 disabled:opacity-50"
                  type="submit"
                  disabled={isSubmitting}
                  value={isSubmitting ? 'Submitting...' : 'Submit'}
                />
                {addPost.error && (
                  <p className="text-red-500 ml-2">{addPost.error.message}</p>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
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
