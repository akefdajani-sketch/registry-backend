const express = require('express');
const router = express.Router();

router.get('/:id', async (_req, res) => {
  res.json({
    improvement: null,
    materials: [],
    media: [],
    notes: []
  });
});

router.post('/', async (_req, res) => {
  res.status(201).json({
    ok: true,
    message: 'Improvement stub created'
  });
});

module.exports = router;
