import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  extractUserDataFromToken,
  validateJWT,
} from "../../middlewares/checkJWT";
import { z } from "zod";

const prisma = new PrismaClient();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

export const routerAuth = Router();

const userSchema = z.object({
  userName: z.string().min(1, "O nome de usuário é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[!@#$%^&*])(?=.*[A-Z]).+$/,
      "A senha deve conter pelo menos um caractere especial e uma letra maiúscula"
    ),
});

routerAuth.post("/create", async (req, res): Promise<void> => {
  const parseResult = userSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => ({
      message: issue.message,
    }));

    res.status(400).json({ message: errorMessages });
    return;
  }

  const { userName, email, password } = parseResult.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userAlreadyExists = await prisma.users.findUnique({
      where: { email },
    });

    if (userAlreadyExists) {
      res.status(400).json({ message: "Usuário já cadastrado no sistema" });
      return;
    }

    const createdUser = await prisma.users.create({
      data: {
        username: userName,
        email,
        password: hashedPassword,
      },
    });

    if (!createdUser) {
      res.status(400).json({ message: "Erro ao criar usuário" });
      return;
    }

    const code: string = await sessionGenerator(createdUser.id);
    if (code === "Error") {
      res.status(500).json({
        message: "Erro interno do servidor. Entre em contato com o suporte",
      });
      return;
    }

    const token = jwt.sign(
      {
        user: createdUser.id,
        client: "API",
      },
      code,
      {
        expiresIn: "2h",
      }
    );

    res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        createdAt: createdUser.created_at,
      },
      message: "Usuário criado com sucesso",
    });
    return;
  } catch (error) {
    console.error("Erro durante a criação de usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
    return;
  }
});

async function sessionGenerator(user: number) {
  const randomCode: string = generateRandomCode(8);
  try {
    const deleteSessionsUser = await prisma.sessions.deleteMany({
      where: {
        ses_user: user,
      },
    });

    const saveSession = await prisma.sessions.create({
      data: {
        ses_key: randomCode,
        ses_city: "any",
        ses_country: "any",
        ses_ip: "any",
        ses_location: "any",
        ses_state: "any",
        ses_timezone: "any",
        ses_user: user,
      },
    });
    return randomCode;
  } catch (error) {
    console.log(error);
    return "Error";
  }
}

function generateRandomCode(length: number) {
  return crypto.randomBytes(length).toString("hex");
}
