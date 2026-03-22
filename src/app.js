const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { notFoundMiddleware } = require("./middlewares/not-found.middleware");
const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Agenda Barbería API running" });
});

app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
