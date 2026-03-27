const { z } = require("zod");

const summarySchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  }),
});

module.exports = {
  summarySchema,
  overviewSchema: summarySchema,
  commissionsSchema: summarySchema,
  exportSchema: summarySchema,
};
