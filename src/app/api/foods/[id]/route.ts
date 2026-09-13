import { foods } from "@/db/schema";
import { item } from "@/lib/crud";
import { foodCreateSchema, foodUpdateSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = item({
  table: foods,
  createSchema: foodCreateSchema,
  updateSchema: foodUpdateSchema,
});
