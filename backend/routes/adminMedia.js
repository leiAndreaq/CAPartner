// Admin: camera clips sent from the phones. The files are not public; only a logged-in admin gets them.
const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { audit } = require('../audit');
const { requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAdmin);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Newest clips first, with who sent them.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.kind, m.recorded_at, m.duration_seconds, m.size_bytes, m.upload_status,
              m.alert_id, e.full_name AS enforcer, c.cap_code
       FROM media m
       LEFT JOIN enforcers e ON e.id = m.enforcer_id
       LEFT JOIN caps c ON c.id = m.cap_id
       ORDER BY m.recorded_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// The video file itself.
router.get('/:id/file', async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Clip not found.' });
    const result = await pool.query(
      `SELECT file_url FROM media WHERE id = $1 AND upload_status = 'uploaded'`,
      [req.params.id]
    );
    const fileUrl = result.rows[0]?.file_url;
    const filePath = fileUrl && path.resolve(UPLOADS_DIR, fileUrl);
    if (!filePath || !filePath.startsWith(UPLOADS_DIR + path.sep)) {
      return res.status(404).json({ error: 'Clip not found.' });
    }
    res.sendFile(filePath);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// PERMANENT DELETE: removes the clip's database row and its video file. This cannot be undone.
router.delete('/:id', async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Clip not found.' });
    const result = await pool.query(
      'DELETE FROM media WHERE id = $1 RETURNING id, file_url, enforcer_id',
      [req.params.id]
    );
    const clip = result.rows[0];
    if (!clip) return res.status(404).json({ error: 'Clip not found.' });

    // The row is gone; now remove the file. A missing file is fine (nothing left to delete).
    const filePath = clip.file_url && path.resolve(UPLOADS_DIR, clip.file_url);
    if (filePath && filePath.startsWith(UPLOADS_DIR + path.sep)) {
      try {
        fs.rmSync(filePath, { force: true });
      } catch (fileError) {
        console.error('Clip row deleted but the file could not be removed: ' + fileError.message);
      }
    }

    await audit('clip_deleted', `Admin permanently deleted camera clip #${clip.id}`, {
      adminId: req.admin.id,
      targetEnforcerId: clip.enforcer_id,
    });
    res.json({ message: 'Clip deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
