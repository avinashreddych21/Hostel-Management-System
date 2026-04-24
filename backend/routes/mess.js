const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get full menu (all days) - accessible to all logged-in users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM mess_menu ORDER BY FIELD(day_name,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"), FIELD(meal_type,"Breakfast","Lunch","Snacks","Dinner")'
        );
        // Group by day
        const menu = {};
        const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        days.forEach(d => { menu[d] = {}; });
        rows.forEach(r => { menu[r.day_name][r.meal_type] = { items: r.items, timing: r.timing, id: r.id, updated_at: r.updated_at }; });
        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a single meal slot (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { items, timing } = req.body;
    try {
        await db.execute('UPDATE mess_menu SET items=?, timing=? WHERE id=?', [items, timing, req.params.id]);
        res.json({ message: 'Menu updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update by day+meal (admin only) - upsert
router.post('/update', authMiddleware, adminOnly, async (req, res) => {
    const { day_name, meal_type, items, timing } = req.body;
    try {
        await db.execute(
            'INSERT INTO mess_menu (day_name, meal_type, items, timing) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE items=?, timing=?',
            [day_name, meal_type, items, timing, items, timing]
        );
        res.json({ message: 'Menu updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;