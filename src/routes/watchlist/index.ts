import { Router } from "express";
import prisma from "../../prisma";
import {
  extractUserDataFromToken,
  validateJWT,
} from "../../middlewares/checkJWT";
import { z } from "zod";
export const routerWatchlist = Router();

routerWatchlist.post(
  "/create/:bookId",
  validateJWT,
  async (req, res): Promise<void> => {
    const bookId = Number(req.params.bookId);
    const userData = await extractUserDataFromToken(req);

    try {
      const exists = await verifyBookExists(bookId);
      if (!exists) {
        res.status(400).json({ message: "Livro não se encontra no sistema" });
        return;
      }

      const alreadyInWatchlist = await prisma.watchlist.findFirst({
        where: {
          user_id: userData.id,
          book_id: bookId,
        },
      });

      if (alreadyInWatchlist) {
        res
          .status(409)
          .json({ message: "Livro já se encontra na sua watchlist" });
        return;
      }

      await prisma.watchlist.create({
        data: {
          user_id: userData.id,
          book_id: bookId,
        },
      });

      res
        .status(201)
        .json({ message: "Watchlist criada com sucesso para o usuário" });
    } catch (error) {
      console.error("Erro durante a criação da watchlist:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

routerWatchlist.get(
  "/user/list",
  validateJWT,
  async (req, res): Promise<void> => {
    const userData = await extractUserDataFromToken(req);
    try {
      const findUserWatchlist = await prisma.users.findFirst({
        where: {
          id: userData.id,
        },
        select: {
          watchlist: true,
        },
      });
      if (!findUserWatchlist) {
        res.status(401).json({ message: "Usuário não encontrado no sistema" });
        return;
      }
      if (findUserWatchlist.watchlist.length == 0) {
        res
          .status(401)
          .json({ message: "Usuário não possui nenhuma Watchlist" });
      }
      const watchlist = findUserWatchlist.watchlist;
      res.status(200).json({ watchlist });
    } catch (error) {
      console.error("Erro durante a listagem dos livros:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
      return;
    }
  }
);

routerWatchlist.delete(
  "/delete/:bookId",
  validateJWT,
  async (req, res): Promise<void> => {
    const bookId = Number(req.params.bookId);
    const userData = await extractUserDataFromToken(req);
    try {
      const exists = await verifyBookExists(bookId);
      if (!exists) {
        res.status(400).json({ message: "Livro não se encontra no sistema" });
        return;
      }

      await prisma.watchlist.delete({
        where: {
          user_id_book_id: {
            user_id: userData.id,
            book_id: bookId,
          },
        },
      });
      res.status(200).json({ message: "Watchlist deletada com sucesso" });
    } catch (error) {
      console.error("Erro durante a exclusão da watchlist:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

async function verifyBookExists(id: number): Promise<boolean> {
  const book = await prisma.books.findUnique({
    where: { id },
  });
  return book !== null;
}
