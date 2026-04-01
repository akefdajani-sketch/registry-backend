const express = require('express');
const router = express.Router();

router.get('/:id', async (_req, res) => {
  res.json({
    agreement: null,
    obligations: [],
    payments: []
  });
});

router.post('/', async (_req, res) => {
  res.status(201).json({
    ok: true,
    message: 'Agreement stub created'
  });
});

module.exports = router;
