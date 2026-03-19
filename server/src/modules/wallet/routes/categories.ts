// export async function categoriesRoutes(app: FastifyInstance) {
//   app.get<{ Querystring: { type?: string } }>("/api/v1/categories", async (request, reply) => {
//     try {
//       const result = await walletService.listCategories(request.query.type);
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch categories" });
//     }
//   });
//
//   app.get<{ Params: { id: string } }>("/api/v1/categories/:id", async (request, reply) => {
//     try {
//       const result = await walletService.getCategory(request.params.id);
//       if (!result) return reply.status(404).send({ error: "Category not found" });
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch category" });
//     }
//   });
//
//   app.post("/api/v1/categories", async (request, reply) => {
//     try {
//       const parsed = createCategorySchema.safeParse(request.body);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const category = await walletService.createCategory(parsed.data);
//       return reply.status(201).send(category);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to create category" });
//     }
//   });
//
//   app.put<{ Params: { id: string } }>("/api/v1/categories/:id", async (request, reply) => {
//     try {
//       const parsed = updateCategorySchema.safeParse(request.body);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const updated = await walletService.updateCategory(request.params.id, parsed.data);
//       if (!updated) return reply.status(404).send({ error: "Category not found" });
//       return reply.send(updated);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to update category" });
//     }
//   });
//
//   app.delete<{ Params: { id: string } }>("/api/v1/categories/:id", async (request, reply) => {
//     try {
//       const deleted = await walletService.deleteCategory(request.params.id);
//       if (!deleted) return reply.status(404).send({ error: "Category not found" });
//       return reply.send({ message: "Category deleted" });
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to delete category" });
//     }
//   });
// }
