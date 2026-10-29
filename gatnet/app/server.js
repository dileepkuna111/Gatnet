"use strict";

const express = require("express");
const helmet = require("helmet");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", app: "Gatnet", timestamp: new Date().toISOString() });
});

app.get("/api/plans", (_req, res) => {
  res.json({
    provider: "Gatnet",
    states: ["Washington", "Idaho", "Montana", "Oregon"],
    plans: [
      { id: "fiber-300", name: "Fiber 300", speed: "Up to 300 Mbps", price: 49.99, features: ["Unlimited data", "Wi-Fi router available", "No annual contract"] },
      { id: "fiber-1g", name: "Fiber Gig", speed: "Up to 1 Gbps", price: 69.99, features: ["Unlimited data", "Wi-Fi 7 router option", "Whole-home Wi-Fi support"] },
      { id: "fiber-2g", name: "Fiber 2 Gig", speed: "Up to 2 Gbps", price: 89.99, features: ["Multi-gig capable equipment", "Wi-Fi 7 router option", "Priority support"] }
    ],
    addOns: [
      { name: "Gatnet TV", price: 29.99, description: "Streaming TV package; channel availability varies." },
      { name: "Home Phone", price: 14.99, description: "Digital home phone service." },
      { name: "Wi-Fi 7 Router", price: 9.99, description: "Optional monthly equipment rental." }
    ],
    disclaimer: "Demo pricing for portfolio and learning purposes only. Not a real offer. Availability, speeds, taxes, and fees vary."
  });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Gatnet listening on ${HOST}:${PORT}`);
});
