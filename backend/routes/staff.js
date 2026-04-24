const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM staff ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
    const { name, role, department, email, phone, salary, join_date } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO staff (name, role, department, email, phone, salary, join_date, status) VALUES (?,?,?,?,?,?,?,?)',
            [name, role, department, email, phone, salary, join_date, 'active']
        );
        res.json({ id: result.insertId, message: 'Staff added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { name, role, department, email, phone, salary, join_date, status } = req.body;
    try {
        await db.execute(
            'UPDATE staff SET name=?, role=?, department=?, email=?, phone=?, salary=?, join_date=?, status=? WHERE id=?',
            [name, role, department, email, phone, salary, join_date, status, req.params.id]
        );
        res.json({ message: 'Staff updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.execute('DELETE FROM staff WHERE id = ?', [req.params.id]);
        res.json({ message: 'Staff removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;