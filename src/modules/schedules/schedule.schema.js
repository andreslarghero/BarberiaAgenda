const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const barberIdParamSchema = z.object({
  params: z.object({ barberId: z.coerce.number().int().positive() }),
});

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const listSchedulesSchema = z.object({
  query: z.object({
    barberId: z.coerce.number().int().positive().optional(),
    dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  }),
});

const createScheduleSchema = z.object({
  body: z
    .object({
      barberId: z.coerce.number().int().positive(),
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startTime: z.string().regex(timeRegex),
      endTime: z.string().regex(timeRegex),
      isWorkingDay: z.boolean().optional(),
    })
    .refine((body) => body.startTime < body.endTime, {
      message: "startTime must be before endTime",
      path: ["endTime"],
    }),
});

const createScheduleForBarberSchema = z.object({
  body: z
    .object({
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startTime: z.string().regex(timeRegex),
      endTime: z.string().regex(timeRegex),
      isWorkingDay: z.boolean().optional(),
    })
    .refine((body) => body.startTime < body.endTime, {
      message: "startTime must be before endTime",
      path: ["endTime"],
    }),
});

const replaceScheduleSchema = z.object({
  body: z
    .object({
      barberId: z.coerce.number().int().positive(),
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startTime: z.string().regex(timeRegex),
      endTime: z.string().regex(timeRegex),
      isWorkingDay: z.boolean().optional(),
    })
    .refine((body) => body.startTime < body.endTime, {
      message: "startTime must be before endTime",
      path: ["endTime"],
    }),
});

const updateScheduleStatusSchema = z.object({
  body: z.object({
    isWorkingDay: z.boolean(),
  }),
});

module.exports = {
  idParamSchema,
  barberIdParamSchema,
  listSchedulesSchema,
  createScheduleSchema,
  createScheduleForBarberSchema,
  replaceScheduleSchema,
  updateScheduleStatusSchema,
};
