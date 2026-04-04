const express = require('express');
const db = require('../db');
const { badRequest, notFound } = require('../utils/http');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const improvement = await db.query(`select * from improvements where id = $1`, [req.params.id]);
    if (!improvement.rowCount) throw notFound('Improvement not found');

    const materials = await db.query(
      `select * from improvement_materials where improvement_id = $1 order by created_at asc`,
      [req.params.id]
    );

    const media = await db.query(
      `select * from media_assets where entity_type = 'improvement' and entity_id = $1 order by created_at desc`,
      [req.params.id]
    );

    const notes = await db.query(
      `select * from property_value_notes where improvement_id = $1 order by created_at desc`,
      [req.params.id]
    );

    res.json({ improvement: improvement.rows[0], materials: materials.rows, media: media.rows, notes: notes.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      municipalityId,
      propertyId,
      unitId,
      title,
      description,
      categoryId,
      contractorId,
      improvementType,
      contractorName,
      materialSummary,
      estimatedCost,
      actualCost,
      estimatedValueAdd,
      permitReference,
      blueprintVersion,
      startDate,
      endDate,
      status,
      completionNotes,
    } = req.body;

    if (!municipalityId || !propertyId || !title) {
      throw badRequest('municipalityId, propertyId, and title are required');
    }

    const result = await db.query(
      `
        insert into improvements (
          municipality_id, property_id, unit_id,
          title, description, category_id, contractor_id,
          improvement_type, contractor_name, material_summary,
          estimated_cost, actual_cost, estimated_value_add,
          permit_reference, blueprint_version,
          start_date, end_date, status, completion_notes
        )
        values (
          $1,$2,$3,
          $4,$5,$6,$7,
          $8,$9,$10,
          $11,$12,$13,
          $14,$15,
          $16,$17,$18,$19
        )
        returning *
      `,
      [
        municipalityId,
        propertyId,
        unitId || null,
        title,
        description || null,
        categoryId || null,
        contractorId || null,
        improvementType || null,
        contractorName || null,
        materialSummary || null,
        estimatedCost || null,
        actualCost || null,
        estimatedValueAdd || null,
        permitReference || null,
        blueprintVersion || null,
        startDate || null,
        endDate || null,
        status || 'planned',
        completionNotes || null,
      ]
    );

    res.status(201).json({ improvement: result.rows[0], message: 'Improvement created successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/materials', async (req, res, next) => {
  try {
    const { municipalityId, materialName, specification, quantity, unit, unitCost, totalCost, supplierName } = req.body;
    if (!municipalityId || !materialName) {
      throw badRequest('municipalityId and materialName are required');
    }

    const result = await db.query(
      `
        insert into improvement_materials (
          municipality_id, improvement_id, material_name, specification,
          quantity, unit, unit_cost, total_cost, supplier_name
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        returning *
      `,
      [
        municipalityId,
        req.params.id,
        materialName,
        specification || null,
        quantity || null,
        unit || null,
        unitCost || null,
        totalCost || null,
        supplierName || null,
      ]
    );

    res.status(201).json({ material: result.rows[0], message: 'Material added successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
