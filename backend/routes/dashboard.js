const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [[{ total_students }]] = await db.execute('SELECT COUNT(*) as total_students FROM students');
        const [[{ active_students }]] = await db.execute("SELECT COUNT(*) as active_students FROM students WHERE status='active'");
        const [[{ total_rooms }]] = await db.execute('SELECT COUNT(*) as total_rooms FROM rooms');
        const [[{ available_rooms }]] = await db.execute("SELECT COUNT(*) as available_rooms FROM rooms WHERE status='available'");
        const [[{ occupied_rooms }]] = await db.execute("SELECT COUNT(*) as occupied_rooms FROM rooms WHERE status='occupied'");
        const [[{ total_staff }]] = await db.execute('SELECT COUNT(*) as total_staff FROM staff');
        const [[{ total_revenue }]] = await db.execute("SELECT COALESCE(SUM(amount),0) as total_revenue FROM payments WHERE status='paid'");
        const [[{ monthly_revenue }]] = await db.execute("SELECT COALESCE(SUM(amount),0) as monthly_revenue FROM payments WHERE status='paid' AND month=MONTH(NOW()) AND year=YEAR(NOW())");
        const [[{ pending_payments }]] = await db.execute("SELECT COUNT(*) as pending_payments FROM payments WHERE status IN ('pending','overdue')");
        const [[{ open_complaints }]] = await db.execute("SELECT COUNT(*) as open_complaints FROM complaints WHERE status='open'");
        const [[{ resolved_complaints }]] = await db.execute("SELECT COUNT(*) as resolved_complaints FROM complaints WHERE status='resolved'");

        const [recent_activity] = await db.execute('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10');

        res.json({
            total_students, active_students, total_rooms, available_rooms, occupied_rooms,
            total_staff, total_revenue, monthly_revenue, pending_payments,
            open_complaints, resolved_complaints, recent_activity,
            occupancy_rate: total_rooms > 0 ? Math.round((occupied_rooms / total_rooms) * 100) : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student dashboard
router.get('/student', authMiddleware, async (req, res) => {
    try {
        const student_id = req.user.id;
        const [[student]] = await db.execute(
            'SELECT s.*, r.room_number FROM students s LEFT JOIN rooms r ON s.room_id = r.id WHERE s.id = ?',
            [student_id]
        );
        const [[{ pending_payments }]] = await db.execute(
            "SELECT COUNT(*) as pending_payments FROM payments WHERE student_id=? AND status IN ('pending','overdue')",
            [student_id]
        );
        const [[{ open_complaints }]] = await db.execute(
            "SELECT COUNT(*) as open_complaints FROM complaints WHERE student_id=? AND status='open'",
            [student_id]
        );
        const [recent_complaints] = await db.execute(
            'SELECT * FROM complaints WHERE student_id=? ORDER BY created_at DESC LIMIT 5',
            [student_id]
        );
        const [recent_payments] = await db.execute(
            "SELECT * FROM payments WHERE student_id=? AND status IN ('pending','overdue') ORDER BY created_at DESC LIMIT 5",
            [student_id]
        );
        res.json({ student, pending_payments, open_complaints, recent_complaints, recent_payments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;