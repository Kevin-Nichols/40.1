/** Routes for industries in biztime. */

const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();
const db = require("../db");

router.post('/', async (req, res, next) => {
  try {
    const {code, industry} = req.body;
    const results = await db.query(
      `INSERT INTO industries (code, industry) 
      VALUES ($1, $2) 
      RETURNING code, industry`, [code, industry]
      );
    return res.status(201).json({industries: results.rows[0]});
  } catch (e) {
    return next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT ind.code, ind.industry, c.name
      FROM industries AS ind
      LEFT JOIN comp_industries AS ci
      ON ind.code = ci.ind_code
      LEFT JOIN companies AS c
      ON ci.comp_code = c.code`
      );
    return res.json({industries: results.rows})
  } catch (e) {
    return next(e);
  }
});

module.exports = router;