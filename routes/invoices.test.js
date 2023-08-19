// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testIndustry;
let invoiceId;

beforeEach(async () => {
  const companyResult = await db.query(`
    INSERT INTO companies (code, name, description) 
    VALUES ('test', 'Test Company', 'This company is for testing.')
    RETURNING code, name, description`);
  testCompany = companyResult.rows[0];

  const industryResult = await db.query(`
    INSERT INTO industries (code, industry) 
    VALUES ('industry_code', 'Test Industry')
    RETURNING code, industry`);
  testIndustry = industryResult.rows[0];

  const invoiceResult = await db.query(`
    INSERT INTO invoices (comp_code, amt) 
    VALUES ($1, $2) 
    RETURNING id`, [testCompany.code, 100]);
  invoiceId = invoiceResult.rows[0].id;
});

afterEach(async () => {
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM industries`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end()
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("invoices");
    expect(Array.isArray(res.body.invoices)).toBe(true);
  });
});

describe("GET /invoices/:id", () => {
  test("Get a single invoice", async () => {
    const res = await request(app).get(`/invoices/${invoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("invoices");
  });

  test("Responds with 404 for invalid ID", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.status).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Create a new invoice", async () => {
    const newInvoice = {
      comp_code: testCompany.code,
      amt: 100
    };

    const res = await request(app).post("/invoices").send(newInvoice);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("invoices");
    expect(res.body.invoices).toHaveProperty("id");
    expect(res.body.invoices).toHaveProperty("comp_code", newInvoice.comp_code);
  });
});

describe("PATCH /invoices/:id", () => {
  test("Update an existing invoice", async () => {
    const updatedData = {
      amt: 150,
      paid: true
    };

    const res = await request(app)
      .patch(`/invoices/${invoiceId}`)
      .send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("invoices");
    expect(res.body.invoices).toHaveProperty("id", invoiceId);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete an existing invoice", async () => {
    const res = await request(app).delete(`/invoices/${invoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "Invoice Deleted!" });
  });
});

describe("GET /companies/:code", () => {
  test("Get a company's information and associated invoices", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("code", testCompany.code);
    expect(res.body).toHaveProperty("description", testCompany.description);
    expect(res.body).toHaveProperty("industry", [null]);
    expect(res.body).toHaveProperty("name", testCompany.name);
  });

  test("Responds with 404 for non-existent company code", async () => {
    const res = await request(app).get(`/companies/nonexistent_code`);
    expect(res.status).toBe(404);
  });
});