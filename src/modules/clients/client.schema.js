const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listClientsSchema = z.object({
  query: z.object({
    search: z.string().trim().min(1).max(100).optional(),
  }),
});

const createClientSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30),
    email: z.string().trim().toLowerCase().email().max(150).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

const replaceClientSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30),
    email: z.string().trim().toLowerCase().email().max(150).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

const updateClientSchema = z.object({
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

module.exports = {
  idParamSchema,
  listClientsSchema,
  createClientSchema,
  replaceClientSchema,
  updateClientSchema,
};
