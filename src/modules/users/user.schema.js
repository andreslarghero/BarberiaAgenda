const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "BARBER", "CLIENT"]),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "BARBER", "CLIENT"]).optional(),
  }),
});

const linkBarberSchema = z.object({
  body: z.object({
    barberId: z.coerce.number().int().positive(),
  }),
});

module.exports = {
  idParamSchema,
  createUserSchema,
  updateRoleSchema,
  linkBarberSchema,
};
