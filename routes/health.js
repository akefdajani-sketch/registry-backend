const express = require('express');
const router = express.Router();

router.get('/', async (_req, res) => {
  res.json({
    ok: true,
    service: 'registry-api'
  });
});

module.exports = router;
