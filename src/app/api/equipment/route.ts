import { equipment } from "@/db/schema";
import { collection } from "@/lib/crud";
import { equipmentCreateSchema, equipmentUpdateSchema } from "@/lib/validation";

export const { GET, POST } = collection({
  table: equipment,
  createSchema: equipmentCreateSchema,
  updateSchema: equipmentUpdateSchema,
  orderBy: [equipment.name],
});
