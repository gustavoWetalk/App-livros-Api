import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import prisma from "../prisma";

export const extractUserFromToken = (token: string) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object" && "user" in decoded) {
      return decoded["user"];
    }
    return null;
  } catch (error) {
    throw new Error("Error decoding the JWT token");
  }
};

export const getSessionKey = async (user: number) => {
  try {
    const session = await prisma.sessions.findFirst({
      where: {
        ses_user: user,
      },
      select: {
        ses_key: true,
      },
    });

    if (session) {
      return session.ses_key;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error("Error finding the session key");
  }
};

export const validateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization");
  if (!token) {
    res.status(401).json({ message: "Authorization token not provided." });
    return;
  }

  const userId = await extractUserFromToken(token);
  if (userId === null) {
    res.status(401).json({ message: "Invalid JWT token." });
    return;
  }

  const secretKey = await getSessionKey(userId);
  if (secretKey === null) {
    res.status(401).json({ message: "Invalid JWT token." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secretKey as Secret);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid authorization token." });
    return;
  }
};

export const extractUserDataFromToken = async (req: Request) => {
  const token = req.header("Authorization");
  if (!token) {
    throw new Error("Invalid session data");
  }

  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object" && "user" in decoded) {
      const user = await prisma.users.findFirst({
        where: { id: decoded["user"] },
      });
      if (!user) throw new Error("User not found");
      return user;
    }
    throw new Error("Invalid token payload");
  } catch (error) {
    throw new Error("Error decoding the JWT token");
  }
};
