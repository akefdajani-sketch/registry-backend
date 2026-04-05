const express = require('express');
const db = require('../db');
const { badRequest } = require('../utils/http');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await db.query('select * from contractors order by created_at desc');
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { municipalityId, companyName, contactName, phone, email, tradeType, registrationNumber, notes } = req.body;
    if (!municipalityId || !companyName) throw badRequest('municipalityId and companyName are required');
    const result = await db.query(`
      insert into contractors (
        municipality_id, company_name, contact_name, phone, email, trade_type, registration_number, notes
      ) values ($1,$2,$3,$4,$5,$6,$7,$8)
      returning *
    `, [municipalityId, companyName, contactName || null, phone || null, email || null, tradeType || null, registrationNumber || null, notes || null]);
    res.status(201).json({ contractor: result.rows[0], message: 'Contractor created successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
