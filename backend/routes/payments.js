const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Admin: get all payments
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT p.*, s.name as student_name, s.roll_number, r.room_number 
                     FROM payments p 
                     LEFT JOIN students s ON p.student_id = s.id 
                     LEFT JOIN rooms r ON s.room_id = r.id WHERE 1=1`;
        const params = [];
        if (status) { query += ' AND p.status = ?'; params.push(status); }
        query += ' ORDER BY p.created_at DESC';
        const [rows] = await db.execute(query, params);

        const [[totals]] = await db.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END), 0) as total_collected,
                COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status='overdue' THEN 1 END) as overdue_count
            FROM payments
        `);
        res.json({ payments: rows, totals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: add payment
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    const { student_id, amount, month, year, mode, due_date, status } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO payments (student_id, amount, month, year, mode, due_date, status) VALUES (?,?,?,?,?,?,?)',
            [student_id, amount, month, year, mode, due_date, status || 'pending']
        );
        res.json({ id: result.insertId, message: 'Payment added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: mark payment as paid
router.put('/:id/pay', authMiddleware, adminOnly, async (req, res) => {
    const { mode } = req.body;
    try {
        await db.execute(
            "UPDATE payments SET status='paid', mode=?, paid_date=CURDATE() WHERE id=?",
            [mode || 'Cash', req.params.id]
        );
        res.json({ message: 'Payment marked as paid' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student: get own payments
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM payments WHERE student_id = ? ORDER BY year DESC, month DESC',
            [req.user.id]
        );
        const [[totals]] = await db.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) as paid_amount,
                COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status='overdue' THEN 1 END) as overdue_count
            FROM payments WHERE student_id = ?`, [req.user.id]);
        res.json({ payments: rows, totals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update overdue payments automatically
router.post('/update-overdue', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.execute("UPDATE payments SET status='overdue' WHERE status='pending' AND due_date < CURDATE()");
        res.json({ message: 'Overdue payments updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;