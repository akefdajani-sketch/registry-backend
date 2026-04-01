const express = require('express');
const router = express.Router();

router.post('/', async (_req, res) => {
  res.status(201).json({
    ok: true,
    message: 'Due stub created'
  });
});

module.exports = router;
