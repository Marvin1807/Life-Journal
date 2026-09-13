import { equipment } from "@/db/schema";
import { item } from "@/lib/crud";
import { equipmentCreateSchema, equipmentUpdateSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = item({
  table: equipment,
  createSchema: equipmentCreateSchema,
  updateSchema: equipmentUpdateSchema,
});
