// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
  const companyResult = await db.query(`
  INSERT INTO companies (code, name, description) 
  VALUES ('company_code', 'Test Company', 'This company is for testing.')
  RETURNING code, name, description`);
  testCompany = companyResult.rows[0];
 
  const industryResult = await db.query(`
  INSERT INTO industries  (code, industry) 
  VALUES ('industry_code', 'Test Industry')
  RETURNING code, industry`);
  testIndustry = industryResult.rows[0];

  await db.query(`
    INSERT INTO comp_industries (comp_code, ind_code) 
    VALUES ($1, $2)`, [testCompany.code, testIndustry.code]);
});

afterEach(async () => {
  await db.query(`DELETE FROM comp_industries`)
  await db.query(`DELETE FROM companies`)
  await db.query(`DELETE FROM industries`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /companies", () => {
  test("Get a list with one company", async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.companies)).toBe(true);
    expect(res.body.companies).toContainEqual(testCompany);
  })
})

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      ...testCompany,
      industry: [testIndustry.industry]
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/0`)
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Create a new company", async () => {
    const newCompany = {
      name: "New Test Company",
      description: "A new test company"
    };

    const res = await request(app).post("/companies").send(newCompany);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("companies");
    expect(res.body.companies).toHaveProperty("code");
    expect(res.body.companies).toHaveProperty("name", newCompany.name);
  });
});

describe("PATCH /companies/:code", () => {
  test("Update an existing company", async () => {
    const updatedData = {
      name: "Updated Test Company",
      description: "An updated test company"
    };

    const res = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("companies");
    expect(res.body.companies).toHaveProperty("code", testCompany.code);
    expect(res.body.companies).toHaveProperty("name", updatedData.name);
  });

  test("Responds with 404 for non-existent company code", async () => {
    const res = await request(app)
      .patch(`/companies/nonexistent_code`)
      .send({ name: "New Name" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Delete an existing company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "Company Deleted!" });
  });
});