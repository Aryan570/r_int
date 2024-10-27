import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { posts, message, user } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(posts).values({
        name: input.name,
        createdById: ctx.session.user.id,
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.query.posts.findFirst({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return post ?? null;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

export const messageRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        senderId: z.number(),
        content: z.string(),
        type: z.string().optional(),
      })
    )
    .mutation(async ({ ctx,input }) => {
      const newMessage = await ctx.db.insert(message).values({
        id: input.senderId,
        content: input.content,
        type: input.type ?? 'text',
      }).returning();
      return newMessage;
    }),

  getMessages: publicProcedure
    .input(z.object({ senderId: z.number(), recipientId: z.number() }))
    .query(async ({ ctx,input }) => {
      return await ctx.db.select().from(message)
        .where(eq(message.senderId,input.senderId))
        .orderBy(message.timestamp);
    }),
    
  // Handle online status
  updateStatus: publicProcedure
    .input(z.object({ userId: z.number(), status: z.string() }))
    .mutation(async ({ ctx,input }) => {
      await ctx.db.update(user).set({ status: input.status }).where(eq(user.id,input.userId));
      return { status: input.status };
    }),
});
