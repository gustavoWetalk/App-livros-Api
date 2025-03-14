import { Router } from "express";
import prisma from "../../prisma";
import {
  extractUserDataFromToken,
  validateJWT,
} from "../../middlewares/checkJWT";
import { z } from "zod";
export const routerReview = Router();

const reviewSchema = z.object({
  review_text: z
    .string({ message: "A nota da publicação deve ser um número inteiro" })
    .optional(),
  rating: z
    .number({ message: "A nota da publicação deve ser um número inteiro" })
    .int({ message: "A  nota de publicação deve ser um número inteiro" }),
});

routerReview.post(
  "/create/:bookId",
  validateJWT,
  async (req, res): Promise<void> => {
    const bookId = req.params.bookId;
    const userData = await extractUserDataFromToken(req);
    const parseResult = reviewSchema.safeParse(req.body);

    if (!userData) {
      res.status(401).json({ message: "Invalid session data" });
      return;
    }
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => ({
        message: issue.message,
      }));

      res.status(400).json({ message: errorMessages });
      return;
    }
    const { review_text, rating } = parseResult.data;
    try {
      const newReview = await prisma.reviews.create({
        data: {
          review_text,
          rating,
          user_id: userData.id,
          book_id: Number(bookId),
        },
      });

      if (!newReview) {
        res.status(400).json({ message: "Erro ao criar uma nova review" });
      }
      res.status(201).json({
        book: {
          review_text: newReview.review_text,
          rating: newReview.rating,
        },
        message: "Review criada com sucesso no sistema",
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor." });
      return;
    }
  }
);
