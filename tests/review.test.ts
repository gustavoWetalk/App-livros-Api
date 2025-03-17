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

  it("Não será possível criar a review, pois a nota é uma string e o review_text é um number", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/review/create/1")
      .set("Authorization", token)
      .send({
        review_text: 12345,
        rating: "122345",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toEqual([
      { message: "A review do usuário deve ser uma string" },
      {
        message: "A nota deve ser um número",
      },
    ]);
  });

  it("Não será possível criar a review, pois o livro não existe no sistema", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .post("/review/create/1234")
      .set("Authorization", token)
      .send({
        review_text: "hufuhhufhuew",
        rating: 5,
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty(
      "message",
      "Livro não se encontra no sistema"
    );
  });

  it("Criar a review, pois todos os dados estão sendo criados corretamente", async () => {
    prismaMock.books.findUnique.mockResolvedValue(fakeBook);
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

  it("Não foi possível atualizar uma review, pois ela não se encontra no sistema", async () => {
    prismaMock.books.findUnique.mockResolvedValue(fakeBook);
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .put("/review/edit/2")
      .set("Authorization", token)
      .send({
        review_text: "duhuhduduwhuwdh",
        rating: 5,
      })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toHaveProperty(
      "message",
      "Review não encontrada no sistema"
    );
  });

  it("Informações da review atualizadas com sucesso", async () => {
    prismaMock.reviews.findUnique.mockResolvedValue(fakeReview);
    prismaMock.reviews.update.mockResolvedValue(fakeReview);

    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .put("/review/edit/1")
      .set("Authorization", token)
      .send({
        review_text: "duhuhduduwhuwdh",
        rating: 5,
      })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Review editada com sucesso"
    );
  });

  it("Informações da review atualizadas com sucesso", async () => {
    prismaMock.reviews.findUnique.mockResolvedValue(fakeReview);
    prismaMock.reviews.update.mockResolvedValue(fakeReview);

    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .put("/review/edit/1")
      .set("Authorization", token)
      .send({
        review_text: 1234567,
        rating: "gergerggrerggreer",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toEqual([
      { message: "A review do usuário deve ser uma string" },
      {
        message: "A nota deve ser um número",
      },
    ]);
  });

  it("Não é possível fazer a exclusão da review no sistema", async () => {
    prismaMock.reviews.deleteMany.mockResolvedValue({ count: 0 });

    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .delete("/review/delete/3")
      .set("Authorization", token)
      .send({
        review_text: 1234567,
        rating: "gergerggrerggreer",
      })
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toHaveProperty(
      "message",
      "Não foi possível realizar a exclusão da review, pois ela não se encontra no sistema"
    );
  });

  it("Delete da review realizada com sucesso no sistema", async () => {
    prismaMock.reviews.deleteMany.mockResolvedValue({ count: 1 });
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });

    const response = await request(app)
      .delete("/review/delete/1")
      .set("Authorization", token)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Review excluída com sucesso do sistema"
    );
  });

  it("Não mostrar nenhuma review, pois o usuário não tem nenhuma cadastrada", async () => {
    const response = await request(app)
      .get("/review/user-reviews")
      .expect("Content-Type", /json/)
      .expect(401);
    expect(response.body).toHaveProperty(
      "message",
      "Authorization token not provided."
    );
  });

  it("Não mostrar nenhuma review, pois o usuário não tem nenhuma cadastrada", async () => {
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });
    const response = await request(app)
      .get("/review/user-reviews")
      .set("Authorization", token)
      .expect("Content-Type", /json/)
      .expect(401);
    expect(response.body).toHaveProperty(
      "message",
      "Usuário não possui nenhuma review de livro"
    );
  });

  it("Mostrar a lista de reviews do usuário no sistema", async () => {
    prismaMock.reviews.findMany.mockResolvedValue([fakeReview]);
    const token = jwt.sign({ user: 1, client: "API" }, "myTestSessionKey", {
      expiresIn: "2h",
    });
    const response = await request(app)
      .get("/review/user-reviews")
      .set("Authorization", token)
      .expect("Content-Type", /json/)
      .expect(200);
    expect(response.body).toHaveProperty("userReviews");
  });
});
