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

  it("Não criar o livro, pois o campo de título não foi preenchido", async () => {
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
