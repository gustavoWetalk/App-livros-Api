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
    .string({ message: "A review do usuário deve ser uma string" })
    .optional(),
  rating: z
    .number({ message: "A nota deve ser um número" })
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
      const bookExists = await prisma.books.findUnique({
        where: {
          id: Number(bookId),
        },
      });
      if (!bookExists) {
        res.status(400).json({ message: "Livro não se encontra no sistema" });
        return;
      }
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
        return;
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
routerReview.get(
  "/user-reviews",
  validateJWT,
  async (req, res): Promise<void> => {
    const userData = await extractUserDataFromToken(req);

    if (!userData) {
      res.status(401).json({ message: "Invalid session data" });
      return;
    }

    try {
      const userReviews = await prisma.reviews.findMany({
        where: {
          user_id: userData.id,
        },
      });
      if (!userReviews) {
        res
          .status(401)
          .json({ message: "Usuário não possui nenhuma review de livro" });
      }
      res.status(200).json({ userReviews });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor." });
      return;
    }
  }
);

routerReview.put("/edit/:id", validateJWT, async (req, res): Promise<void> => {
  const id = req.params.id;
  const parseResult = reviewSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => ({
      message: issue.message,
    }));

    res.status(400).json({ message: errorMessages });
    return;
  }
  const { review_text, rating } = parseResult.data;
  try {
    const userReviews = await prisma.reviews.update({
      where: {
        id: Number(id),
      },
      data: {
        rating,
        review_text,
      },
    });
    if (!userReviews) {
      res
        .status(401)
        .json({ message: "Usuário não possui nenhuma review de livro" });
    }
    res.status(200).json({ message: "usuário editado com sucesso" })

  } catch (error) {
    res.status(500).json({ message: "Erro interno do servidor." });
    return;
  }
});

routerReview.delete(
  "/delete/:id",
  validateJWT,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);

    try {
      const result = await prisma.reviews.deleteMany({
        where: { id },
      });

      if (result.count === 0) {
        res.status(404).json({
          message:
            "Não foi possível realizar a exclusão da review, pois ela não se encontra no sistema",
        });
        return;
      }

      res.status(200).json({
        message: "Review excluída com sucesso do sistema",
      });
      return;
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor." });
      return;
    }
  }
);
