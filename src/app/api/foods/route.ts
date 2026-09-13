import { foods } from "@/db/schema";
import { collection } from "@/lib/crud";
import { foodCreateSchema, foodUpdateSchema } from "@/lib/validation";

export const { GET, POST } = collection({
  table: foods,
  createSchema: foodCreateSchema,
  updateSchema: foodUpdateSchema,
  orderBy: [foods.category, foods.name],
});
