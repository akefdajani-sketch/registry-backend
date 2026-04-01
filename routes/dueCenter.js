const express = require('express');
const router = express.Router();

router.get('/property/:propertyId', async (_req, res) => {
  res.json({
    dues: [],
    summary: []
  });
});

module.exports = router;
