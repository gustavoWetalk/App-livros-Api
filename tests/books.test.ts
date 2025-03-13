import { prismaMock } from "../src/singleton";
import request from "supertest";
import { mockReset } from "jest-mock-extended";
import { app } from "../src/app";
import jwt from "jsonwebtoken";

const fakeBook = {
  id: 180,
  title: "",
  author: "",
  description: "Uhufeuhfeuhef123@",
  published_year: 1960,
  created_at: new Date(),
};

describe("Testando rota de criação de livros", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    prismaMock.books.findUnique.mockResolvedValue(null);
    prismaMock.books.create.mockResolvedValue(fakeBook);
    (prismaMock.sessions.create as jest.Mock).mockResolvedValue({
      ses_key: "myTestSessionKey",
    });

    (prismaMock.sessions.findFirst as jest.Mock).mockResolvedValue({
      ses_key: "myTestSessionKey",
    });
  });

  it("Não criar o livro, pois o campo de título não foi preenchido", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/books/create")
      .set("Authorization", token)
      .send({
        title: "",
        author: "duhuhduduwhuwdh",
        description: "Uhufeuhfeuhef123@",
        published_year: 1960,
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toContainEqual({
      message: "O título é obrigatório",
    });
  });

  it("Não criar o livro, pois o campo de título não foi preenchido", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/books/create")
      .set("Authorization", token)
      .send({
        title: "uhduhdsuhudshuhfduhsfd",
        author: "",
        description: "Uhufeuhfeuhef123@",
        published_year: 1960,
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toContainEqual({
      message: "O autor é obrigatório",
    });
  });

  it("Não foi possível criar o livro, pois o token não é válido", async () => {
    const response = await request(app)
      .post("/books/create")
      .set("Authorization", "12345434553")
      .send({
        title: "uhduhdsuhudshuhfduhsfd",
        author: "",
        description: "Uhufeuhfeuhef123@",
        published_year: 1960,
      })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toHaveProperty("message", "Invalid JWT token.");
  });

  it("Criando o livro no sistema, pois todos os dados foram passados corretamente", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });
    const response = await request(app)
      .post("/books/create")
      .set("Authorization", token)
      .send({
        title: "uhduhdsuhudshuhfduhsfd",
        author: "udhudhudhudfhudshud",
        description: "Uhufeuhfeuhef123@",
        published_year: 1960,
      })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toHaveProperty("message", "Livro criado com sucesso");
  });
});
