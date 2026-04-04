const express = require('express');
const db = require('../db');
const { badRequest } = require('../utils/http');

const router = express.Router();

async function resolveResponsibility(propertyId, obligationType) {
  if (['property_tax', 'municipality_fee'].includes(obligationType)) {
    const ownerResult = await db.query(`select owner_id from properties where id = $1`, [propertyId]);
    return {
      responsiblePartyType: 'owner',
      responsibleOwnerId: ownerResult.rows[0]?.owner_id || null,
      responsibleTenantId: null,
    };
  }

  if (['electricity', 'water', 'sewage', 'rent'].includes(obligationType)) {
    const agreementResult = await db.query(
      `
        select tenant_id
        from agreements
        where property_id = $1
          and agreement_type = 'rental'
          and agreement_status = 'active'
        order by start_date desc nulls last
        limit 1
      `,
      [propertyId]
    );

    if (agreementResult.rows[0]?.tenant_id) {
      return {
        responsiblePartyType: 'tenant',
        responsibleOwnerId: null,
        responsibleTenantId: agreementResult.rows[0].tenant_id,
      };
    }
  }

  const fallback = await db.query(`select owner_id from properties where id = $1`, [propertyId]);
  return {
    responsiblePartyType: 'owner',
    responsibleOwnerId: fallback.rows[0]?.owner_id || null,
    responsibleTenantId: null,
  };
}

router.post('/', async (req, res, next) => {
  try {
    const {
      municipalityId,
      propertyId,
      unitId,
      dueSourceId,
      obligationType,
      title,
      description,
      amountDue,
      dueDate,
      periodStart,
      periodEnd,
      providerName,
      externalReference,
      metadata,
    } = req.body;

    if (!municipalityId || !propertyId || !obligationType || !title || !amountDue) {
      throw badRequest('municipalityId, propertyId, obligationType, title, and amountDue are required');
    }

    const responsibility = await resolveResponsibility(propertyId, obligationType);

    const result = await db.query(
      `
        insert into obligations (
          municipality_id, property_id, unit_id,
          obligation_type, source_system, provider_name, external_reference,
          title, description, period_start, period_end,
          amount_due, amount_paid, amount_remaining,
          currency_code, due_date, issued_date, status, metadata,
          responsible_party_type, responsible_owner_id, responsible_tenant_id
        )
        values (
          $1,$2,$3,
          $4,$5,$6,$7,
          $8,$9,$10,$11,
          $12,0,$12,
          'JOD',$13,current_date,'pending',$14,
          $15,$16,$17
        )
        returning *
      `,
      [
        municipalityId,
        propertyId,
        unitId || null,
        obligationType,
        dueSourceId || 'MANUAL',
        providerName || null,
        externalReference || null,
        title,
        description || null,
        periodStart || null,
        periodEnd || null,
        amountDue,
        dueDate || null,
        JSON.stringify(metadata || {}),
        responsibility.responsiblePartyType,
        responsibility.responsibleOwnerId,
        responsibility.responsibleTenantId,
      ]
    );

    res.status(201).json({ due: result.rows[0], message: 'Due created successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
