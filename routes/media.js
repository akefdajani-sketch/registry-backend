const express = require('express');
const router = express.Router();

router.post('/sign-upload', async (_req, res) => {
  res.json({
    uploadUrl: '',
    key: '',
    publicUrl: ''
  });
});

router.post('/register', async (_req, res) => {
  res.status(201).json({
    media: null
  });
});

module.exports = router;
