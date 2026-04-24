const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get all rooms
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT r.*, GROUP_CONCAT(s.name SEPARATOR ", ") as student_names FROM rooms r LEFT JOIN students s ON s.room_id = r.id WHERE 1=1';
        const params = [];
        if (status) { query += ' AND r.status = ?'; params.push(status); }
        query += ' GROUP BY r.id ORDER BY r.room_number';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get available rooms (for student booking)
router.get('/available', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM rooms WHERE status='available' AND occupied < capacity ORDER BY room_number"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add room
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    const { room_number, floor, type, capacity, rent, amenities } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO rooms (room_number, floor, type, capacity, rent, amenities, status) VALUES (?,?,?,?,?,?,?)',
            [room_number, floor, type, capacity, rent, amenities, 'available']
        );
        res.json({ id: result.insertId, message: 'Room added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update room
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { room_number, floor, type, capacity, rent, amenities, status } = req.body;
    try {
        await db.execute(
            'UPDATE rooms SET room_number=?, floor=?, type=?, capacity=?, rent=?, amenities=?, status=? WHERE id=?',
            [room_number, floor, type, capacity, rent, amenities, status, req.params.id]
        );
        res.json({ message: 'Room updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete room
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [[room]] = await db.execute('SELECT occupied FROM rooms WHERE id = ?', [req.params.id]);
        if (room?.occupied > 0) return res.status(400).json({ error: 'Cannot delete occupied room' });
        await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ message: 'Room deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student books a room
router.post('/book/:id', authMiddleware, async (req, res) => {
    const room_id = req.params.id;
    const student_id = req.user.id;
    try {
        const [[student]] = await db.execute('SELECT room_id FROM students WHERE id = ?', [student_id]);
        if (student.room_id) return res.status(400).json({ error: 'You already have a room assigned' });

        const [[room]] = await db.execute('SELECT * FROM rooms WHERE id = ?', [room_id]);
        if (!room || room.status === 'occupied' || room.status === 'maintenance') {
            return res.status(400).json({ error: 'Room not available' });
        }

        await db.execute('UPDATE students SET room_id = ? WHERE id = ?', [room_id, student_id]);
        const newOccupied = room.occupied + 1;
        const newStatus = newOccupied >= room.capacity ? 'occupied' : 'available';
        await db.execute('UPDATE rooms SET occupied = ?, status = ? WHERE id = ?', [newOccupied, newStatus, room_id]);

        // Auto-generate payment for current month
        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);
        await db.execute(
            'INSERT INTO payments (student_id, amount, month, year, due_date, status) VALUES (?,?,?,?,?,?)',
            [student_id, room.rent, now.getMonth() + 1, now.getFullYear(), dueDate.toISOString().split('T')[0], 'pending']
        );

        await db.execute('INSERT INTO activity_log (type, message) VALUES (?, ?)',
            ['Room Booking', `${req.user.name} booked Room ${room.room_number}`]);

        res.json({ message: `Room ${room.room_number} booked successfully!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;