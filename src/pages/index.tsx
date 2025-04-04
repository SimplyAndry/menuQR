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

  return (
    <div className="flex flex-col bg-gray-800 text-white py-8 px-8">
      <h1 className="text-4xl font-bold mb-8">
        Menu QR
      </h1>
      <p className="text-white-400 mb-8">
        Scegli cosa vuoi ordinare.
      </p>

      <div className="space-y-12">
        {groupedItems && Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-3xl font-semibold border-b border-gray-700 pb-2">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <article 
                  key={item.id} 
                  className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors"
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
                  <Link 
                    className="text-blue-400 hover:text-blue-300 mt-4 inline-block" 
                    href={`/post/${item.id}`}
                  >
                    View details
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="bg-gray-900 p-2 rounded-md font-semibold disabled:bg-gray-700 disabled:text-white-400 mt-8"
        onClick={() => postsQuery.fetchNextPage()}
        disabled={!postsQuery.hasNextPage || postsQuery.isFetchingNextPage}
      >
        {postsQuery.isFetchingNextPage
          ? 'Loading more...'
          : postsQuery.hasNextPage
            ? 'Load More'
            : 'Nothing more to load'}
      </button>

      <hr className="my-12 border-gray-700" />

      <div className="flex flex-col py-8 items-center">
        <h2 className="text-3xl font-semibold pb-2">Aggiungi un prodotto</h2>

        <form
          className="py-2 w-4/6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-y-4 font-semibold">
            <div className="flex flex-col gap-y-1">
              <input
                className="focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900"
                {...register('title')}
                type="text"
                placeholder="Title"
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
                placeholder="Text"
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
                placeholder="Tipo"
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
