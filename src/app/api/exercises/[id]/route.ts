import { exercises } from "@/db/schema";
import { item } from "@/lib/crud";
import { exerciseCreateSchema, exerciseUpdateSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = item({
  table: exercises,
  createSchema: exerciseCreateSchema,
  updateSchema: exerciseUpdateSchema,
});
