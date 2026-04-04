const express = require('express');
const db = require('../db');

const router = express.Router();

async function getDueCenter({ propertyId, tenantId, ownerId, municipalityId }) {
  const conditions = [];
  const values = [];

  if (propertyId) {
    values.push(propertyId);
    conditions.push(`property_id = $${values.length}`);
  }
  if (tenantId) {
    values.push(tenantId);
    conditions.push(`responsible_tenant_id = $${values.length}`);
  }
  if (ownerId) {
    values.push(ownerId);
    conditions.push(`responsible_owner_id = $${values.length}`);
  }
  if (municipalityId) {
    values.push(municipalityId);
    conditions.push(`municipality_id = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const dues = await db.query(
    `select * from obligations ${whereClause} order by due_date asc nulls last, created_at desc`,
    values
  );

  const summary = await db.query(
    `
      select obligation_type, status,
        coalesce(sum(amount_due), 0) as total_due,
        coalesce(sum(amount_paid), 0) as total_paid,
        coalesce(sum(amount_remaining), 0) as total_remaining
      from obligations
      ${whereClause}
      group by obligation_type, status
      order by obligation_type, status
    `,
    values
  );

  return { dues: dues.rows, summary: summary.rows };
}

router.get('/property/:propertyId', async (req, res, next) => {
  try {
    res.json(await getDueCenter({ propertyId: req.params.propertyId }));
  } catch (error) {
    next(error);
  }
});

router.get('/tenant/:tenantId', async (req, res, next) => {
  try {
    res.json(await getDueCenter({ tenantId: req.params.tenantId }));
  } catch (error) {
    next(error);
  }
});

router.get('/owner/:ownerId', async (req, res, next) => {
  try {
    res.json(await getDueCenter({ ownerId: req.params.ownerId }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
