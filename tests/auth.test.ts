import request from "supertest";
import express from "express";
import { routerAuth } from "../src/routes/auth";

const app = express();

app.use(express.json());
app.use("/auth", routerAuth);

describe("Testando rota de criação de usuário", () => {
  it("O usuário não pode ser criado, pois o email não é válido", async () => {
    const response = await request(app)
      .post("/auth/create")
      .send({
        userName: "Lucasss",
        email: "1234456775",
        password: "Batata123456@",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toContainEqual({ message: "Email inválido" });
  });
});

describe("Testando rota de criação de usuário", () => {
  it("O usuário não pode ser criado, pois a senha não é válida", async () => {
    const response = await request(app)
      .post("/auth/create")
      .send({
        userName: "Lucasss",
        email: "gustavo@fuffuf.com.br",
        password: "123345",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toEqual([
      { message: "A senha deve ter pelo menos 8 caracteres" },
      { message: "A senha deve conter pelo menos um caractere especial e uma letra maiúscula" }
    ]);
  });
});
