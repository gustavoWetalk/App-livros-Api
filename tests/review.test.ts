import { prismaMock } from "../src/singleton";
import request from "supertest";
import { mockReset } from "jest-mock-extended";
import { app } from "../src/app";
import jwt from "jsonwebtoken";

const fakeReview = {
  id: 1,
  user_id: 1,
  book_id: 1,
  review_text: "fdsffdsdds",
  rating: 5,
  created_at: new Date(),
};

const fakeBook = {
  id: 1,
  title: "fdsfsfsd",
  author: "ffdsfddsfdsfds",
  description: "Uhufeuhfeuhef123@",
  published_year: 1960,
  created_at: new Date(),
};

describe("Testando rota de criação de review", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      username: "userTest",
      email: "user@test.com",
      password: "hashedPassword",
      created_at: new Date(),
    });

    prismaMock.books.findUnique.mockResolvedValue(null);
    prismaMock.reviews.create.mockResolvedValue(fakeReview);
    prismaMock.books.create.mockResolvedValue(fakeBook);

    (prismaMock.sessions.findFirst as jest.Mock).mockResolvedValue({
      ses_key: "myTestSessionKey",
    });
  });

  it("Não será possível criar a review, pois o texto da review é um número e não uma string", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/review/create/1")
      .set("Authorization", token)
      .send({
        review_text: 12345,
        rating: 5,
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toContainEqual({
      message: "A review do usuário deve ser uma string",
    });
  });

  it("Não será possível criar a review, pois a nota da review é uma string e não um número", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/review/create/1")
      .set("Authorization", token)
      .send({
        review_text: "hufuhhufhuew",
        rating: "122345",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toContainEqual({
      message: "A nota deve ser um número",
    });
  });

  it("Criar a review, pois todos os dados estão sendo criados corretamente", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/review/create/1")
      .set("Authorization", token)
      .send({
        review_text: "duhuhduduwhuwdh",
        rating: 5,
      })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "Review criada com sucesso no sistema"
    );
  });
});
