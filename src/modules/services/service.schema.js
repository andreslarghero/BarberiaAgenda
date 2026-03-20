const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listServicesSchema = z.object({
  query: z.object({
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === "true")),
  }),
});

const createServiceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    durationMinutes: z.coerce.number().int().positive(),
    price: z.coerce.number().min(0),
  }),
});

const replaceServiceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    durationMinutes: z.coerce.number().int().positive(),
    price: z.coerce.number().min(0),
  }),
});

const updateServiceSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(500).optional(),
      durationMinutes: z.coerce.number().int().positive().optional(),
      price: z.coerce.number().min(0).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided",
    }),
});

const updateServiceStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

module.exports = {
  idParamSchema,
  listServicesSchema,
  createServiceSchema,
  replaceServiceSchema,
  updateServiceSchema,
  updateServiceStatusSchema,
};
