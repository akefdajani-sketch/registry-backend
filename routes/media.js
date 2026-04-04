const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { badRequest } = require('../utils/http');
const { isConfigured, createSignedUploadUrl } = require('../utils/r2Presign');

const router = express.Router();

router.post('/sign-upload', async (req, res, next) => {
  try {
    const { municipalityId, entityType, entityId, mediaCategory, fileName, mimeType } = req.body;
    if (!municipalityId || !entityType || !entityId || !mediaCategory || !fileName || !mimeType) {
      throw badRequest('municipalityId, entityType, entityId, mediaCategory, fileName, and mimeType are required');
    }

    if (!isConfigured()) {
      return res.status(501).json({
        error: 'R2 upload signing is not configured yet',
        message: 'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL to enable direct uploads.',
      });
    }

    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const key = `${municipalityId}/${entityType}/${entityId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const uploadUrl = await createSignedUploadUrl({ key, contentType: mimeType });
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;

    res.json({ uploadUrl, key, publicUrl });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { municipalityId, entityType, entityId, mediaCategory, fileName, mimeType, fileSizeBytes, r2Key, publicUrl } = req.body;
    if (!municipalityId || !entityType || !entityId || !mediaCategory || !fileName || !r2Key) {
      throw badRequest('municipalityId, entityType, entityId, mediaCategory, fileName, and r2Key are required');
    }

    const result = await db.query(
      `
        insert into media_assets (
          municipality_id, entity_type, entity_id, media_category,
          file_name, mime_type, file_size_bytes, r2_bucket, r2_key, public_url
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        returning *
      `,
      [
        municipalityId,
        entityType,
        entityId,
        mediaCategory,
        fileName,
        mimeType || null,
        fileSizeBytes || null,
        process.env.R2_BUCKET || 'unconfigured-bucket',
        r2Key,
        publicUrl || null,
      ]
    );

    res.status(201).json({ media: result.rows[0], message: 'Media registered successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
