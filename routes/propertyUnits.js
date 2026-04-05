const express = require('express');
const db = require('../db');
const { badRequest } = require('../utils/http');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { propertyId } = req.query;
    if (!propertyId) throw badRequest('propertyId is required');

    const result = await db.query(
      'select * from property_units where property_id = $1 order by created_at desc',
      [propertyId]
    );
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { propertyId, unitCode, unitLabel, unitType, floorLabel, areaSqm, bedroomCount, bathroomCount, occupancyStatus } = req.body;
    if (!propertyId) throw badRequest('propertyId is required');

    const result = await db.query(`
      insert into property_units (
        property_id, unit_code, unit_label, unit_type, floor_label,
        area_sqm, bedroom_count, bathroom_count, occupancy_status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      returning *
    `, [
      propertyId,
      unitCode || null,
      unitLabel || null,
      unitType || null,
      floorLabel || null,
      areaSqm || null,
      bedroomCount || null,
      bathroomCount || null,
      occupancyStatus || 'vacant',
    ]);
    res.status(201).json({ unit: result.rows[0], message: 'Property unit created successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
