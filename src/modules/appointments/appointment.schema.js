const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const listAppointmentsSchema = z.object({
  query: z.object({
    barberId: z.coerce.number().int().positive().optional(),
    clientId: z.coerce.number().int().positive().optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

const appointmentAvailabilitySchema = z.object({
  query: z.object({
    barberId: z.coerce.number().int().positive(),
    date: z.string().min(1),
  }),
});

const createAppointmentSchema = z.object({
  body: z.object({
    clientId: z.coerce.number().int().positive(),
    barberId: z.coerce.number().int().positive(),
    serviceId: z.coerce.number().int().positive(),
    startDatetime: z.string().datetime(),
    notes: z.string().trim().max(500).optional(),
  }),
});

const replaceAppointmentSchema = z.object({
  body: z.object({
    clientId: z.coerce.number().int().positive(),
    barberId: z.coerce.number().int().positive(),
    serviceId: z.coerce.number().int().positive(),
    startDatetime: z.string().datetime(),
    notes: z.string().trim().max(500).optional(),
  }),
});

const cancelAppointmentSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }),
});

module.exports = {
  idParamSchema,
  listAppointmentsSchema,
  appointmentAvailabilitySchema,
  createAppointmentSchema,
  replaceAppointmentSchema,
  cancelAppointmentSchema,
};
