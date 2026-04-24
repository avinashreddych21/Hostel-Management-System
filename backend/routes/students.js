const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get all students (admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = 'SELECT s.*, r.room_number FROM students s LEFT JOIN rooms r ON s.room_id = r.id WHERE 1=1';
        const params = [];
        if (search) { query += ' AND (s.name LIKE ? OR s.roll_number LIKE ? OR s.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
        if (status) { query += ' AND s.status = ?'; params.push(status); }
        query += ' ORDER BY s.created_at DESC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add student (admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    const bcrypt = require('bcryptjs');
    const { roll_number, name, email, phone, address, course, year, guardian_name, guardian_phone, password, room_id } = req.body;
    try {
        const hashed = await bcrypt.hash(password || 'student123', 10);
        const [result] = await db.execute(
            'INSERT INTO students (roll_number,name,email,phone,address,course,year,guardian_name,guardian_phone,password,room_id,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [roll_number, name, email, phone, address, course, year, guardian_name, guardian_phone, hashed, room_id || null, 'active']
        );
        if (room_id) {
            await db.execute('UPDATE rooms SET occupied = occupied + 1, status = CASE WHEN occupied + 1 >= capacity THEN "occupied" ELSE status END WHERE id = ?', [room_id]);
        }
        await db.execute('INSERT INTO activity_log (type, message) VALUES (?, ?)', ['New Student', `New student ${name} (${roll_number}) registered`]);
        res.json({ id: result.insertId, message: 'Student added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update student
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { name, email, phone, address, course, year, guardian_name, guardian_phone, room_id, status } = req.body;
    try {
        const [[old]] = await db.execute('SELECT room_id FROM students WHERE id = ?', [req.params.id]);
        if (old.room_id && old.room_id !== room_id) {
            await db.execute('UPDATE rooms SET occupied = GREATEST(0, occupied - 1), status = CASE WHEN occupied - 1 < capacity THEN "available" ELSE status END WHERE id = ?', [old.room_id]);
        }
        if (room_id && room_id !== old.room_id) {
            await db.execute('UPDATE rooms SET occupied = occupied + 1, status = CASE WHEN occupied + 1 >= capacity THEN "occupied" ELSE "available" END WHERE id = ?', [room_id]);
        }
        await db.execute(
            'UPDATE students SET name=?,email=?,phone=?,address=?,course=?,year=?,guardian_name=?,guardian_phone=?,room_id=?,status=? WHERE id=?',
            [name, email, phone, address, course, year, guardian_name, guardian_phone, room_id || null, status, req.params.id]
        );
        res.json({ message: 'Student updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete student
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [[student]] = await db.execute('SELECT room_id FROM students WHERE id = ?', [req.params.id]);
        if (student?.room_id) {
            await db.execute('UPDATE rooms SET occupied = GREATEST(0, occupied - 1) WHERE id = ?', [student.room_id]);
        }
        await db.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get own profile (student)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [[student]] = await db.execute(
            'SELECT s.*, r.room_number, r.type as room_type, r.floor FROM students s LEFT JOIN rooms r ON s.room_id = r.id WHERE s.id = ?',
            [req.user.id]
        );
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update own profile (student)
router.put('/profile/update', authMiddleware, async (req, res) => {
    const { phone, address, email } = req.body;
    try {
        await db.execute('UPDATE students SET phone=?, address=?, email=? WHERE id=?', [phone, address, email, req.user.id]);
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;