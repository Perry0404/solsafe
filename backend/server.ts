import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// TODO: add REST endpoints for off-chain evidence storage, webhook for waitlist, etc.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on ${PORT}`);
});
