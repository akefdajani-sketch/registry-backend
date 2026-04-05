const express = require('express');
const db = require('../db');
const { badRequest } = require('../utils/http');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await db.query('select * from owners order by created_at desc');
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { municipalityId, fullName, nationalId, phone, email, address } = req.body;
    if (!municipalityId || !fullName) throw badRequest('municipalityId and fullName are required');

    const result = await db.query(`
      insert into owners (municipality_id, full_name, national_id, phone, email, address)
      values ($1,$2,$3,$4,$5,$6)
      returning *
    `, [municipalityId, fullName, nationalId || null, phone || null, email || null, address || null]);

    res.status(201).json({ owner: result.rows[0], message: 'Owner created successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
