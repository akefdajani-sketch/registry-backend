const express = require('express');
const db = require('../db');
const { badRequest, notFound } = require('../utils/http');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { municipalityId } = req.query;
    const result = municipalityId
      ? await db.query(
          `select * from properties where municipality_id = $1 order by created_at desc limit 100`,
          [municipalityId]
        )
      : await db.query(`select * from properties order by created_at desc limit 100`);

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/improvement-timeline', async (req, res, next) => {
  try {
    const result = await db.query(
      `
        select
          i.*,
          c.label as category_label,
          ct.company_name as contractor_company
        from improvements i
        left join improvement_categories c on c.id = i.category_id
        left join contractors ct on ct.id = i.contractor_id
        where i.property_id = $1
        order by coalesce(i.end_date, i.start_date, i.created_at::date) desc
      `,
      [req.params.id]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const propertyResult = await db.query(`select * from properties where id = $1`, [req.params.id]);

    if (!propertyResult.rowCount) {
      throw notFound('Property not found');
    }

    const obligations = await db.query(
      `select * from obligations where property_id = $1 order by due_date asc nulls last, created_at asc`,
      [req.params.id]
    );

    const payments = await db.query(
      `select * from payments where property_id = $1 order by paid_at desc, created_at desc`,
      [req.params.id]
    );

    const improvements = await db.query(
      `select * from improvements where property_id = $1 order by created_at desc`,
      [req.params.id]
    );

    const media = await db.query(
      `select * from media_assets where entity_type = 'property' and entity_id = $1 order by created_at desc`,
      [req.params.id]
    );

    const ledgerSummary = await db.query(
      `
        select
          coalesce(sum(amount_due), 0) as total_due,
          coalesce(sum(amount_paid), 0) as total_paid,
          coalesce(sum(amount_remaining), 0) as total_remaining
        from obligations
        where property_id = $1
      `,
      [req.params.id]
    );

    res.json({
      property: propertyResult.rows[0],
      obligations: obligations.rows,
      payments: payments.rows,
      improvements: improvements.rows,
      media: media.rows,
      ledgerSummary: ledgerSummary.rows[0],
    });
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
      usageType,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      plotNumber,
      parcelNumber,
      buildingNumber,
      floorCount,
      totalAreaSqm,
      geoLat,
      geoLng,
    } = req.body;

    if (!municipalityId || !title || !propertyType) {
      throw badRequest('municipalityId, title, and propertyType are required');
    }

    const result = await db.query(
      `
        insert into properties (
          municipality_id,
          owner_id,
          title,
          property_type,
          usage_type,
          address_line_1,
          address_line_2,
          city,
          region,
          postal_code,
          plot_number,
          parcel_number,
          building_number,
          floor_count,
          total_area_sqm,
          geo_lat,
          geo_lng
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        returning *
      `,
      [
        municipalityId,
        ownerId || null,
        title,
        propertyType,
        usageType || null,
        addressLine1 || null,
        addressLine2 || null,
        city || null,
        region || null,
        postalCode || null,
        plotNumber || null,
        parcelNumber || null,
        buildingNumber || null,
        floorCount || null,
        totalAreaSqm || null,
        geoLat || null,
        geoLng || null,
      ]
    );

    res.status(201).json({ property: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
