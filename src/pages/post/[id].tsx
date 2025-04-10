import React, { useState } from 'react';
import NextError from 'next/error';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '~/components/ui/button';

import type { NextPageWithLayout } from '~/pages/_app';
import type { RouterOutput } from '~/utils/trpc';
import { trpc } from '~/utils/trpc';

type PostByIdOutput = {
  id: string;
  title: string;
  text: string;
  price: number;
  ingredients: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
};

function PostItem(props: { post: PostByIdOutput }) {
  const { post } = props;
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: post.title,
    text: post.text,
    price: post.price,
    ingredients: post.ingredients,
    categoryId: post.category.id,
  });

  const updateMutation = trpc.post.update.useMutation({
    onSuccess: () => {
      utils.post.byId.invalidate({ id: post.id });
      setIsEditing(false);
    },
  });

  const deleteMutation = trpc.post.delete.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      router.push('/');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: post.id,
      ...formData,
    });
  };

  const deletePost = () => {
    deleteMutation.mutate({ id: post.id });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col justify-center px-8 space-y-6">
        <Link className="underline mb-4" href="/">
          Home
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              className="w-full p-2 rounded border border-gray-300"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
            />
          </div>

          <div className="space-y-2">
            <textarea
              className="w-full p-2 rounded border border-gray-300"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <input
              type="number"
              step="0.01"
              className="w-full p-2 rounded border border-gray-300"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price"
            />
          </div>

          <div className="space-y-2">
            <input
              className="w-full p-2 rounded border border-gray-300"
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              placeholder="Ingredients"
            />
          </div>

          <div className="space-y-2">
            <input
              className="w-full p-2 rounded border border-gray-300"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              placeholder="Category ID"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              Save Changes
            </Button>
            <Button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center px-8 space-y-6 py-5">
      <Link className="underline mb-4" href="/">
        Home
      </Link>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <em className="text-gray-500">
          Created {post.createdAt.toLocaleDateString('en-us')}
        </em>
      </div>

      {post.imageUrl && (
        <div className="my-4">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-gray-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{post.text}</p>
        </div>

        <div className="bg-gray-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
          <p className="text-gray-700">{post.ingredients}</p>
        </div>

        <div className="bg-gray-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Price</h2>
          <p className="text-gray-700">€{post.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          className="bg-orange-700 w-48  text-white p-2 rounded-md hover:bg-blue-600 transition-colors" 
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <Button 
          className="bg-red-700 w-48 text-white p-2 rounded-md hover:bg-red-600 transition-colors" 
          onClick={deletePost}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

const PostViewPage: NextPageWithLayout = () => {
  const id = useRouter().query.id as string;
  const postQuery = trpc.post.byId.useQuery({ id });

  if (postQuery.error) {
    return (
      <NextError
        title={postQuery.error.message}
        statusCode={postQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (postQuery.status !== 'success') {
    return (
      <div className="flex flex-col justify-center h-full px-8 ">
        <div className="w-full bg-zinc-900/70 rounded-md h-10 animate-pulse mb-2"></div>
        <div className="w-2/6 bg-zinc-900/70 rounded-md h-5 animate-pulse mb-8"></div>

        <div className="w-full bg-zinc-900/70 rounded-md h-40 animate-pulse"></div>
      </div>
    );
  }
  const { data } = postQuery;
  return <PostItem post={data} />;
};

export default PostViewPage;
