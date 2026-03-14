import { FastifyInstance } from "fastify";
import { db } from "@vdp/db";
import { categories } from "@vdp/db";
import { createCategorySchema, updateCategorySchema } from "@vdp/shared";
import { eq, and } from "drizzle-orm";

export async function categoriesRoutes(app: FastifyInstance) {
  // List categories with optional type filter
  app.get<{ Querystring: { type?: string } }>("/api/v1/categories", async (request, reply) => {
    try {
      const { type } = request.query;
      const conditions = [];

      if (type && (type === "income" || type === "expense")) {
        conditions.push(eq(categories.type, type));
      }

      const result = conditions.length > 0
        ? await db.select().from(categories).where(and(...conditions))
        : await db.select().from(categories);

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch categories" });
    }
  });

  // Get single category
  app.get<{ Params: { id: string } }>("/api/v1/categories/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await db.select().from(categories).where(eq(categories.id, id));

      if (result.length === 0) {
        return reply.status(404).send({ error: "Category not found" });
      }

      return reply.send(result[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch category" });
    }
  });

  // Create category
  app.post("/api/v1/categories", async (request, reply) => {
    try {
      const parsed = createCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [category] = await db.insert(categories).values(parsed.data).returning();
      return reply.status(201).send(category);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create category" });
    }
  });

  // Update category
  app.put<{ Params: { id: string } }>("/api/v1/categories/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const parsed = updateCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [updated] = await db
        .update(categories)
        .set(parsed.data)
        .where(eq(categories.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Category not found" });
      }

      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update category" });
    }
  });

  // Delete category
  app.delete<{ Params: { id: string } }>("/api/v1/categories/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();

      if (!deleted) {
        return reply.status(404).send({ error: "Category not found" });
      }

      return reply.send({ message: "Category deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete category" });
    }
  });
}
