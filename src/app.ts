import express from "express";

import { routerAuth } from "./routes/auth";
import { routerBooks } from "./routes/books";
export const app = express();

app.use(express.json());

app.use("/auth", routerAuth);
app.use("/books", routerBooks);
