const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Admin: get all complaints
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT c.*, s.name as student_name, s.roll_number, 
                     r.room_number, st.name as assigned_staff_name
                     FROM complaints c 
                     LEFT JOIN students s ON c.student_id = s.id
                     LEFT JOIN rooms r ON s.room_id = r.id
                     LEFT JOIN staff st ON c.assigned_to = st.id WHERE 1=1`;
        const params = [];
        if (status) { query += ' AND c.status = ?'; params.push(status); }
        query += ' ORDER BY c.created_at DESC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: update complaint status
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { status, assigned_to } = req.body;
    try {
        const resolved_date = status === 'resolved' ? new Date().toISOString().split('T')[0] : null;
        await db.execute(
            'UPDATE complaints SET status=?, assigned_to=?, resolved_date=? WHERE id=?',
            [status, assigned_to || null, resolved_date, req.params.id]
        );
        res.json({ message: 'Complaint updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student: get own complaints
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT c.*, st.name as assigned_staff_name FROM complaints c 
             LEFT JOIN staff st ON c.assigned_to = st.id
             WHERE c.student_id = ? ORDER BY c.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student: submit complaint
router.post('/', authMiddleware, async (req, res) => {
    const { title, description, category, priority } = req.body;
    try {
        await db.execute(
            'INSERT INTO complaints (student_id, title, description, category, priority, status) VALUES (?,?,?,?,?,?)',
            [req.user.id, title, description, category, priority, 'open']
        );
        await db.execute('INSERT INTO activity_log (type, message) VALUES (?, ?)',
            ['Complaint', `Complaint "${title}" raised by ${req.user.name} - open`]);
        res.json({ message: 'Complaint submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;