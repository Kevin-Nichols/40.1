/** Routes for invoices in biztime. */

const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT id, comp_code 
      FROM invoices`
      );
    return res.json({invoices: results.rows})
  } catch (e) {
    return next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const {id} = req.params;
    const results = await db.query(
      `SELECT * 
      FROM invoices 
      WHERE id = $1`, [id]
      );
    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404)
    }
    return res.send({invoices: results.rows[0]});
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {comp_code, amt} = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
      VALUES ($1, $2) 
      RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
      );
    return res.status(201).json({invoices: results.rows[0]});
  } catch (e) {
    return next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const {id} = req.params;
    const {amt, paid} = req.body;
    let paidDate = null;
    const firstRes = await db.query(
      `SELECT paid
      FROM invoices 
      WHERE id = $1`, [id]
      );
    if (firstRes.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404)
    }

    const paidDateRes = firstRes.rows[0].paid_date;
    if (!paidDateRes && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null
    } else {
      paidDate = paidDateRes;
    }

    const results = await db.query(
      `UPDATE invoices 
      SET amt = $1, paid = $2, paid_date = $3 
      WHERE id = $4 
      RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paidDate, id]
      );
    return res.send({invoices: results.rows[0]});
  } catch (e) {
    return next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const {id} = req.params;
    const results = db.query(
      `DELETE FROM invoices 
      WHERE id = $1`, [id]
      );
    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404)
    }
    return res.send({msg: "Invoice Deleted!"});
  } catch (e) {
    return next(e);
  }
});

router.get('/companies/:code', async (req, res, next) => {
  try {
    const {code} = req.params;
    const cResults = await db.query(`
    SELECT code, name, description 
    FROM companies WHERE code = $1`, [code]
    );

    const iResults = await db.query(
      `SELECT id 
      FROM invoices 
      WHERE comp_code = $1`, [code]
      );

    if (cResults.rows.length === 0) {
      throw new ExpressError(`Cannot find company with code of ${code}`, 404)
    }
    const c = cResults.rows[0];
    const i = iResults.rows;
    c.i= i.map(inv => inv.id);

    return res.send({companies: c});
  } catch (e) {
    return next(e);
  }
})

module.exports = router;