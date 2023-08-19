// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testIndustry;

beforeEach(async () => {
  const industryResult = await db.query(`
    INSERT INTO industries (code, industry) 
    VALUES ('test_industry', 'Test Industry')
    RETURNING code, industry`);
  testIndustry = industryResult.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM industries`);
});

afterAll(async () => {
  await db.end();
});

describe("POST /industries", () => {
  test("Create a new industry", async () => {
    const newIndustry = {
      code: 'new_industry_code',
      industry: 'New Industry'
    };

    const res = await request(app)
      .post("/industries")
      .send(newIndustry);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("industries");
    expect(res.body.industries).toHaveProperty("code", newIndustry.code);
    expect(res.body.industries).toHaveProperty("industry", newIndustry.industry);
  });
});

describe("GET /industries", () => {
  test("Get a list of industries with associated companies", async () => {
    const res = await request(app).get("/industries");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("industries");
    expect(Array.isArray(res.body.industries)).toBe(true);
  });
});