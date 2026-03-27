const { z } = require("zod");

const updateSettingsSchema = z.object({
  body: z.object({
    businessName: z.string().trim().min(2).max(120),
    currency: z.string().trim().min(3).max(10).transform((v) => v.toUpperCase()),
    defaultCommissionRate: z.coerce.number().min(0).max(1),
  }),
});

module.exports = {
  updateSettingsSchema,
};
