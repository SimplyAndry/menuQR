/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultPostSelect = {
  id: true,
  title: true,
  text: true,
  price: true,
  ingredients: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MenuSelect;

const selectWithCategory = {
  ...defaultPostSelect,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const categoryRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.category.create({
        data: input,
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.category.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),
  list: publicProcedure
    .query(async () => {
      return prisma.category.findMany();
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Delete all menu items in this category first
      await prisma.menu.deleteMany({
        where: { categoryId: input.id },
      });
      // Then delete the category
      return prisma.category.delete({
        where: { id: input.id },
      });
    }),
});

export const postRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      /**
       * For pagination docs you can have a look here
       * @see https://trpc.io/docs/v11/useInfiniteQuery
       * @see https://www.prisma.io/docs/concepts/components/prisma-client/pagination
       */

      const limit = input.limit ?? 50;
      const { cursor } = input;

      const items = await prisma.menu.findMany({
        select: selectWithCategory,
        take: limit + 1,
        where: {},
        cursor: cursor
          ? {
              id: cursor,
            }
          : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        // Remove the last item and use it as next cursor

        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items: items.reverse(),
        nextCursor,
      };
    }),
  byId: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { id } = input;
      const post = await prisma.menu.findUnique({
        where: { id },
        select: selectWithCategory,
      });
      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No post with id '${id}'`,
        });
      }
      return post;
    }),
  add: publicProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(32),
        text: z.string().min(1),
        price: z.number().min(0),
        ingredients: z.string().min(1),
        categoryId: z.string(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const post = await prisma.menu.create({
        data: input,
        select: selectWithCategory,
      });
      return post;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.menu.delete({
        where: { id: input.id },
      });
    }),
  updateImageUrl: publicProcedure
    .input(
      z.object({
        id: z.string(),
        imageUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, imageUrl } = input;
      return prisma.menu.update({
        where: { id },
        data: { imageUrl },
        select: selectWithCategory,
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        text: z.string(),
        price: z.number(),
        ingredients: z.string(),
        categoryId: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.menu.update({
        where: { id: input.id },
        data: input,
        select: selectWithCategory,
      });
    }),
});
