import express from "express";

import { routerAuth } from "./routes/auth";
import { routerBooks } from "./routes/books";
import { routerReview } from "./routes/review";
export const app = express();

app.use(express.json());

app.use("/auth", routerAuth);
app.use("/books", routerBooks);
app.use("/review", routerReview);
