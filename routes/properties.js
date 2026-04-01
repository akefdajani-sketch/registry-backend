const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await db.query(
      `select * from properties order by created_at desc limit 100`
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `select * from properties where id = $1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ property: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      municipalityId,
      ownerId,
      title,
      propertyType,
      addressLine1,
      city,
      region,
      totalAreaSqm
    } = req.body;

    if (!municipalityId || !title || !propertyType) {
      return res.status(400).json({
        error: 'municipalityId, title, and propertyType are required'
      });
    }

    const result = await db.query(
      `
        insert into properties (
          municipality_id,
          owner_id,
          title,
          property_type,
          address_line_1,
          city,
          region,
          total_area_sqm
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8)
        returning *
      `,
      [
        municipalityId,
        ownerId || null,
        title,
        propertyType,
        addressLine1 || null,
        city || null,
        region || null,
        totalAreaSqm || null
      ]
    );

    res.status(201).json({ property: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
