import { prismaMock } from "../src/singleton";
import request from "supertest";
import express from "express";
import { routerAuth } from "../src/routes/auth";
import { mockReset } from "jest-mock-extended";

const app = express();

app.use(express.json());
app.use("/auth", routerAuth);

describe("Testando rota de criação de usuário", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

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
      {
        message:
          "A senha deve conter pelo menos um caractere especial e uma letra maiúscula",
      },
    ]);
  });

  it("O usuário não pode ser criado, pois o nome de usuário é obrigatório", async () => {
    const response = await request(app)
      .post("/auth/create")
      .send({
        userName: "",
        email: "gustavo@fuffuf.com.br",
        password: "Batata12345@",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toContainEqual({
      message: "O nome de usuário é obrigatório",
    });
  });

  it("O usuário não pode ser criado, pois os dados estão vazios", async () => {
    const response = await request(app)
      .post("/auth/create")
      .send({
        userName: "",
        email: "",
        password: "",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toEqual([
      { message: "O nome de usuário é obrigatório" },
      { message: "Email inválido" },
      { message: "A senha deve ter pelo menos 8 caracteres" },
      {
        message:
          "A senha deve conter pelo menos um caractere especial e uma letra maiúscula",
      },
    ]);
  });

  it("O usuário não pode ser criado, pois a senha não possui caractere especial", async () => {
    const response = await request(app)
      .post("/auth/create")
      .send({
        userName: "Gustavoooo",
        email: "gustavo@fuffuf.com.br",
        password: "Batata12345",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toContainEqual({
      message:
        "A senha deve conter pelo menos um caractere especial e uma letra maiúscula",
    });
  });

  it("Cria o usuário com sucesso se os dados forem válidos", async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);
    prismaMock.users.create.mockResolvedValue({
      id: 14,
      username: "Lucassssss",
      email: "lucas@examplwweeee345.com",
      password: "Hashedpassword",
      created_at: new Date(),
    });

    prismaMock.sessions.deleteMany.mockResolvedValue({ count: 1 });
    (prismaMock.sessions.create as jest.Mock).mockResolvedValue({
      ses_id: 6,
      ses_key: "abc123",
      ses_ip: "any",
      ses_location: "any",
      ses_city: "any",
      ses_state: "any",
      ses_country: "any",
      ses_timezone: "any",
      ses_user: 14,
    });

    const response = await request(app)
      .post("/auth/create")
      .send({
        userName: "Lucasssssssss",
        email: "lucas@examplwweeee345.com",
        password: "Hashedpassword@@",
      })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toEqual("lucas@examplwweeee345.com");
    expect(response.body.message).toEqual("Usuário criado com sucesso");
  });
});
