// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testIndustry;

beforeEach(async () => {
  const companyResult = await db.query(`
    INSERT INTO companies (code, name, description) 
    VALUES ('test', 'Test Company', 'This company is for testing.')
    RETURNING code, name, description`);
  testCompany = companyResult.rows[0];

  const industryResult = await db.query(`
    INSERT INTO industries (code, industry) 
    VALUES ('test_industry', 'Test Industry')
    RETURNING code, industry`);
  testIndustry = industryResult.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM comp_industries`);
  await db.query(`DELETE FROM industries`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("POST /comp_industries", () => {
  test("Create a new company-industry association", async () => {
    const newCompIndustry = {
      comp_code: testCompany.code,
      ind_code: testIndustry.code
    };

    const res = await request(app)
      .post("/comp_industries")
      .send(newCompIndustry);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("industries");
    expect(res.body.industries).toHaveProperty("comp_code", newCompIndustry.comp_code);
    expect(res.body.industries).toHaveProperty("ind_code", newCompIndustry.ind_code);
  });
});