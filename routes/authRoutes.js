const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

router.post('/register', (req, res) => {
    const { nom, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.query('INSERT INTO users (nom, email, password) VALUES (?, ?, ?)', [nom, email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        res.json({ message: 'Utilisateur enregistré' });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: 'Identifiants incorrects' });

        const user = results[0];
        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Mot de passe incorrect' });
        }
    });
});

module.exports = router;
