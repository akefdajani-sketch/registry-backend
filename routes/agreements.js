const express = require('express');
const db = require('../db');
const { badRequest, notFound } = require('../utils/http');
const { addMonths, monthLabel, toISODate } = require('../utils/date');

const router = express.Router();

function validateAgreementPayload(body) {
  if (!body.municipalityId || !body.propertyId || !body.agreementType) {
    throw badRequest('municipalityId, propertyId, and agreementType are required');
  }
}

async function createDepositObligation(client, agreement) {
  if (!agreement.deposit_due || Number(agreement.deposit_due) <= 0) return;

  await client.query(
    `
      insert into obligations (
        municipality_id, property_id, unit_id, agreement_id,
        obligation_type, title, amount_due, amount_paid, amount_remaining,
        currency_code, due_date, issued_date, status
      )
      values ($1,$2,$3,$4,'custom','Security Deposit',$5,0,$5,$6,$7,$7,'pending')
    `,
    [
      agreement.municipality_id,
      agreement.property_id,
      agreement.unit_id || null,
      agreement.id,
      agreement.deposit_due,
      agreement.currency_code || 'JOD',
      agreement.start_date || null,
    ]
  );
}

async function generateRentSchedule(client, agreement) {
  if (
    agreement.agreement_type !== 'rental' ||
    !agreement.auto_generate_obligations ||
    !agreement.rent_amount ||
    !agreement.payment_frequency ||
    !agreement.start_date ||
    !agreement.recurring_until
  ) {
    return;
  }

  const monthMap = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12,
  };

  const stepMonths = monthMap[agreement.payment_frequency];
  if (!stepMonths) return;

  const scheduleKey = `agreement:${agreement.id}:rent`;
  let cursor = new Date(agreement.first_billing_date || agreement.start_date);
  const end = new Date(agreement.recurring_until);

  while (cursor <= end) {
    const periodStart = new Date(cursor);
    const nextCursor = addMonths(cursor, stepMonths);
    const periodEnd = new Date(nextCursor);
    periodEnd.setDate(periodEnd.getDate() - 1);

    const titlePrefix = {
      monthly: 'Monthly Rent',
      quarterly: 'Quarterly Rent',
      semi_annual: 'Semi-Annual Rent',
      annual: 'Annual Rent',
    }[agreement.payment_frequency];

    await client.query(
      `
        insert into obligations (
          municipality_id, property_id, unit_id, agreement_id,
          obligation_type, title, period_start, period_end,
          amount_due, amount_paid, amount_remaining,
          currency_code, due_date, issued_date, status,
          is_recurring_generated, parent_schedule_key
        )
        values (
          $1,$2,$3,$4,
          'rent',$5,$6,$7,
          $8,0,$8,$9,$6,$6,'pending',
          true,$10
        )
      `,
      [
        agreement.municipality_id,
        agreement.property_id,
        agreement.unit_id || null,
        agreement.id,
        `${titlePrefix} - ${monthLabel(periodStart)}`,
        toISODate(periodStart),
        toISODate(periodEnd),
        agreement.rent_amount,
        agreement.currency_code || 'JOD',
        scheduleKey,
      ]
    );

    cursor = nextCursor;
  }
}

router.get('/:id', async (req, res, next) => {
  try {
    const agreementResult = await db.query(`select * from agreements where id = $1`, [req.params.id]);
    if (!agreementResult.rowCount) throw notFound('Agreement not found');

    const obligations = await db.query(
      `select * from obligations where agreement_id = $1 order by due_date asc nulls last, created_at asc`,
      [req.params.id]
    );

    const payments = await db.query(
      `
        select p.*
        from payments p
        left join obligations o on o.id = p.obligation_id
        where o.agreement_id = $1
        order by p.paid_at desc, p.created_at desc
      `,
      [req.params.id]
    );

    res.json({ agreement: agreementResult.rows[0], obligations: obligations.rows, payments: payments.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const client = await db.connect();
  try {
    validateAgreementPayload(req.body);
    const {
      municipalityId,
      propertyId,
      unitId,
      ownerId,
      tenantId,
      agreementType,
      agreementStatus,
      referenceNumber,
      startDate,
      endDate,
      contractValue,
      currencyCode,
      paymentFrequency,
      depositAmount,
      rentAmount,
      depositDue,
      billingDay,
      firstBillingDate,
      recurringUntil,
      autoGenerateObligations,
      utilityResponsibility,
      taxResponsibility,
      notes,
    } = req.body;

    await client.query('begin');

    const result = await client.query(
      `
        insert into agreements (
          municipality_id, property_id, unit_id, owner_id, tenant_id,
          agreement_type, agreement_status, reference_number,
          start_date, end_date, contract_value, currency_code, payment_frequency,
          deposit_amount, rent_amount, deposit_due, billing_day,
          first_billing_date, recurring_until, auto_generate_obligations,
          utility_responsibility, tax_responsibility, notes
        )
        values (
          $1,$2,$3,$4,$5,
          $6,$7,$8,
          $9,$10,$11,$12,$13,
          $14,$15,$16,$17,
          $18,$19,$20,
          $21,$22,$23
        )
        returning *
      `,
      [
        municipalityId,
        propertyId,
        unitId || null,
        ownerId || null,
        tenantId || null,
        agreementType,
        agreementStatus || 'draft',
        referenceNumber || null,
        startDate || null,
        endDate || null,
        contractValue || null,
        currencyCode || 'JOD',
        paymentFrequency || null,
        depositAmount || null,
        rentAmount || null,
        depositDue || null,
        billingDay || null,
        firstBillingDate || null,
        recurringUntil || null,
        Boolean(autoGenerateObligations),
        utilityResponsibility || null,
        taxResponsibility || null,
        notes || null,
      ]
    );

    const agreement = result.rows[0];
    await generateRentSchedule(client, agreement);
    await createDepositObligation(client, agreement);

    await client.query('commit');
    res.status(201).json({ agreement, message: 'Agreement created successfully' });
  } catch (error) {
    await client.query('rollback');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
