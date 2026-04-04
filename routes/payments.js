const express = require('express');
const db = require('../db');
const { badRequest, notFound } = require('../utils/http');

const router = express.Router();

function deriveStatus(amountDue, amountPaid, dueDate) {
  const remaining = Number(amountDue) - Number(amountPaid);
  const today = new Date().toISOString().slice(0, 10);

  if (remaining <= 0) return 'paid';
  if (Number(amountPaid) > 0) return 'partial';
  if (dueDate && dueDate < today) return 'overdue';
  return 'pending';
}

router.post('/', async (req, res, next) => {
  const client = await db.connect();
  try {
    const { municipalityId, obligationId, amountPaid, paymentMethod, paymentReference, externalTransactionId, notes } = req.body;
    if (!municipalityId || !obligationId || !amountPaid || !paymentMethod) {
      throw badRequest('municipalityId, obligationId, amountPaid, and paymentMethod are required');
    }

    await client.query('begin');

    const obligationResult = await client.query(`select * from obligations where id = $1 for update`, [obligationId]);
    if (!obligationResult.rowCount) throw notFound('Obligation not found');

    const obligation = obligationResult.rows[0];
    const nextPaid = Number(obligation.amount_paid || 0) + Number(amountPaid);
    const nextRemaining = Math.max(0, Number(obligation.amount_due) - nextPaid);
    const nextStatus = deriveStatus(obligation.amount_due, nextPaid, obligation.due_date);

    const paymentResult = await client.query(
      `
        insert into payments (
          municipality_id, obligation_id, property_id, agreement_id,
          amount_paid, currency_code, payment_method, payment_reference,
          external_transaction_id, notes
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        returning *
      `,
      [
        municipalityId,
        obligationId,
        obligation.property_id || null,
        obligation.agreement_id || null,
        amountPaid,
        obligation.currency_code || 'JOD',
        paymentMethod,
        paymentReference || null,
        externalTransactionId || null,
        notes || null,
      ]
    );

    await client.query(
      `insert into payment_allocations (municipality_id, payment_id, obligation_id, amount_allocated) values ($1,$2,$3,$4)`,
      [municipalityId, paymentResult.rows[0].id, obligationId, amountPaid]
    );

    const updatedObligation = await client.query(
      `
        update obligations
        set amount_paid = $2,
            amount_remaining = $3,
            status = $4,
            updated_at = now()
        where id = $1
        returning *
      `,
      [obligationId, nextPaid, nextRemaining, nextStatus]
    );

    await client.query('commit');
    res.status(201).json({ payment: paymentResult.rows[0], obligation: updatedObligation.rows[0], message: 'Payment applied successfully' });
  } catch (error) {
    await client.query('rollback');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
