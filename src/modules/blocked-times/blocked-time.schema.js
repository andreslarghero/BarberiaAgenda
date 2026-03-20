const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const barberIdParamSchema = z.object({
  params: z.object({ barberId: z.coerce.number().int().positive() }),
});

const listBlockedTimesSchema = z.object({
  query: z.object({
    barberId: z.coerce.number().int().positive().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

const createBlockedTimeSchema = z
  .object({
    body: z.object({
      barberId: z.coerce.number().int().positive(),
      startDatetime: z.string().datetime(),
      endDatetime: z.string().datetime(),
      reason: z.string().trim().max(300).optional(),
    }),
  })
  .refine((payload) => payload.body.startDatetime < payload.body.endDatetime, {
    message: "startDatetime must be before endDatetime",
    path: ["body", "endDatetime"],
  });

const createBlockedTimeForBarberSchema = z
  .object({
    body: z.object({
      startDatetime: z.string().datetime(),
      endDatetime: z.string().datetime(),
      reason: z.string().trim().max(300).optional(),
    }),
  })
  .refine((payload) => payload.body.startDatetime < payload.body.endDatetime, {
    message: "startDatetime must be before endDatetime",
    path: ["body", "endDatetime"],
  });

const replaceBlockedTimeSchema = z
  .object({
    body: z.object({
      barberId: z.coerce.number().int().positive(),
      startDatetime: z.string().datetime(),
      endDatetime: z.string().datetime(),
      reason: z.string().trim().max(300).optional(),
    }),
  })
  .refine((payload) => payload.body.startDatetime < payload.body.endDatetime, {
    message: "startDatetime must be before endDatetime",
    path: ["body", "endDatetime"],
  });

module.exports = {
  idParamSchema,
  barberIdParamSchema,
  listBlockedTimesSchema,
  createBlockedTimeSchema,
  createBlockedTimeForBarberSchema,
  replaceBlockedTimeSchema,
};
