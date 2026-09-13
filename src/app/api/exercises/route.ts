import { exercises } from "@/db/schema";
import { collection } from "@/lib/crud";
import { exerciseCreateSchema, exerciseUpdateSchema } from "@/lib/validation";

export const { GET, POST } = collection({
  table: exercises,
  createSchema: exerciseCreateSchema,
  updateSchema: exerciseUpdateSchema,
  orderBy: [exercises.muscleGroup, exercises.name],
});
