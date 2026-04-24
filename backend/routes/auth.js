const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../middleware/db');

// Admin Login
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin.id, username: admin.username, name: admin.name, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, user: { id: admin.id, name: admin.name, username: admin.username, role: 'admin' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student Login
router.post('/student/login', async (req, res) => {
    const { roll_number, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM students WHERE roll_number = ?', [roll_number]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const student = rows[0];
        const match = await bcrypt.compare(password, student.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: student.id, roll_number: student.roll_number, name: student.name, role: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, user: { id: student.id, name: student.name, roll_number: student.roll_number, role: 'student' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student Register
router.post('/student/register', async (req, res) => {
    const { roll_number, name, email, phone, address, course, year, guardian_name, guardian_phone, password } = req.body;
    try {
        const [exists] = await db.execute('SELECT id FROM students WHERE roll_number = ? OR email = ?', [roll_number, email]);
        if (exists.length) return res.status(400).json({ error: 'Roll number or email already exists' });

        const hashed = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO students (roll_number, name, email, phone, address, course, year, guardian_name, guardian_phone, password, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [roll_number, name, email, phone, address, course, year, guardian_name, guardian_phone, hashed, 'active']
        );

        await db.execute("INSERT INTO activity_log (type, message) VALUES (?, ?)",
            ['New Student', `New student ${name} (${roll_number}) registered`]);

        res.json({ message: 'Registration successful! You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Setup default admin (run once)
router.post('/setup', async (req, res) => {
    try {
        const hashed = await bcrypt.hash('admin123', 10);
        await db.execute('UPDATE admins SET password = ? WHERE username = ?', [hashed, 'admin']);
        
        // Also set student passwords
        const studentPass = await bcrypt.hash('student123', 10);
        await db.execute('UPDATE students SET password = ? WHERE password = ?', [studentPass, '$2b$10$placeholder']);
        
        res.json({ message: 'Setup complete! Admin: admin/admin123, Student: S001/student123' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;