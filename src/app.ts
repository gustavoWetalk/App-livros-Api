import express from "express";

import { routerAuth } from "./routes/auth";
export const app = express();

app.use(express.json());

app.use("/auth", routerAuth);
