import { Router } from "express";
import prisma from "../../prisma";
import {
  extractUserDataFromToken,
  validateJWT,
} from "../../middlewares/checkJWT";
import { z } from "zod";
export const routerBooks = Router();

const bookSchema = z.object({
  title: z
    .string()
    .min(1, { message: "O título é obrigatório" })
    .max(255, { message: "O título deve ter no máximo 255 caracteres" }),
  author: z
    .string()
    .min(1, { message: "O autor é obrigatório" })
    .max(255, { message: "O autor deve ter no máximo 255 caracteres" }),
  description: z
    .string({ required_error: "A descrição do livro precisa ser uma string" })
    .optional(),
  published_year: z
    .number({ invalid_type_error: "O ano de publicação deve ser um número" })
    .int({ message: "O ano de publicação deve ser um número inteiro" })
    .optional(),
});

routerBooks.post("/create", validateJWT, async (req, res): Promise<void> => {
  const parseResult = bookSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => ({
      message: issue.message,
    }));

    res.status(400).json({ message: errorMessages });
    return;
  }

  const { title, author, description, published_year } = parseResult.data;

  try {
    const book = await prisma.books.create({
      data: {
        title,
        author,
        description,
        published_year,
      },
    });

    res.status(201).json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        published_year: book.published_year,
      },
      message: "Livro criado com sucesso",
    });
  } catch (error) {
    console.error("Erro durante a criação de usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
    return;
  }
});

routerBooks.get("/list", validateJWT, async (req, res): Promise<void> => {
  try {
    const books = await prisma.books.findMany();
    if (!books || books.length === 0) {
      res.status(404).json({ message: "Nenhum livro cadastrado no sistema" });
      return;
    }
    res.status(200).json({ books });
    return;
  } catch (error) {
    console.error("Erro durante a listagem dos livros:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
    return;
  }
});
