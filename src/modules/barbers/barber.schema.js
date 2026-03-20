const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listBarbersSchema = z.object({
  query: z.object({
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === "true")),
  }),
});

const createBarberSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30).optional(),
    email: z.string().trim().toLowerCase().email().max(150).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

const replaceBarberSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30).optional(),
    email: z.string().trim().toLowerCase().email().max(150).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

const updateBarberSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      phone: z.string().trim().min(6).max(30).optional(),
      email: z.string().trim().toLowerCase().email().max(150).optional(),
      notes: z.string().trim().max(500).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided",
    }),
});

const updateBarberStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

module.exports = {
  idParamSchema,
  listBarbersSchema,
  createBarberSchema,
  replaceBarberSchema,
  updateBarberSchema,
  updateBarberStatusSchema,
};
