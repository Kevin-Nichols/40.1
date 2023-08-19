/** Routes for comp_industries in biztime. */

const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();
const db = require("../db");

router.post('/', async (req, res, next) => {
  try {
    const {comp_code, ind_code} = req.body;
    const results = await db.query(
      `INSERT INTO comp_industries (comp_code, ind_code) 
      VALUES ($1, $2) 
      RETURNING comp_code, ind_code`, [comp_code, ind_code]
      );
    return res.status(201).json({industries: results.rows[0]});
  } catch (e) {
    return next(e);
  }
});

module.exports = router;