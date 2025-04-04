import { z } from "zod";
import { publicProcedure } from "../trpc";

const postRouter = publicProcedure
  .input(
    z.object({
      id: z.string(),
      title: z.string(),
      text: z.string(),
      price: z.number(),
      ingredients: z.string(),
      type: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.post.update({
      where: { id: input.id },
      data: {
        title: input.title,
        text: input.text,
        price: input.price,
        ingredients: input.ingredients,
        type: input.type,
      },
    });
  });

export default postRouter; 