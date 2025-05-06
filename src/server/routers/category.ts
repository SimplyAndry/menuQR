import { router, publicProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';



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