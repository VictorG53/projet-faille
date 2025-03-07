import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import bodyParser from 'body-parser';
import session from 'express-session'; // Ajoutez cette ligne

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'votre_secret_de_session', // Remplacez par une chaîne secrète sécurisée
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Utilisez secure: true en production avec HTTPS
}));

const client = new Client({
    user: 'failleuser',
    host: 'db',
    database: 'failledb',
    password: 'faillepassword',
    port: 5432,
});

client.connect().then(() => {
    console.log('Connected to database');
    client.query('CREATE TABLE IF NOT EXISTS userapp (id SERIAL PRIMARY KEY, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, description TEXT);').then(() => {
        console.log('Table created');
    }).catch((err) => {
        console.error('Table creation failed', err);
    });
}).catch((err) => {
    console.error('Connection to database failed', err);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/pages/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/pages/register.html');
});

app.get('/user/:id', (req, res) => {
    res.sendFile(__dirname + '/pages/user.html');
});


app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    client.query(`SELECT * FROM userapp WHERE id = '${userId}'`, (err, result) => {
        if (err) {
            console.error('Error querying user', err);
            res.status(500).send('Error retrieving user data');
        } else if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('User not found');
        }
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    client.query(`INSERT INTO userapp (username, password) VALUES ('${username}', '${password}')`, (err, result) => {
        if (err) {
            console.error('Error inserting user', err);
            res.status(500).send('Error creating user');
        } else {
            res.redirect('/login');
        }
    });
});

app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        client.query(`SELECT * FROM userapp WHERE id = '${req.session.userId}'`, (err, result) => {
            if (err) {
                console.error('Error querying user', err);
                res.status(500).send('Error retrieving user data');
            } else if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).send('User not found');
            }
        });
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/update-description', (req, res) => {
    res.sendFile(__dirname + '/pages/update-description.html');
});

app.post('/api/update-description', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }

    const { description } = req.body;
    const userId = req.session.userId;

    client.query(`UPDATE userapp SET description = $1 WHERE id = $2`, [description, userId], (err, result) => {
        if (err) {
            console.error('Error updating description', err);
            res.status(500).send('Error updating description');
        } else {
            res.send('Description updated successfully');
        }
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    client.query(`SELECT * FROM userapp WHERE username = '${username}' AND password = '${password}'`, (err, result) => {
        if (err) {
            console.error('Error querying user', err);
            res.status(500).send('Error logging in');
        } else if (result.rows.length > 0) {
            req.session.userId = result.rows[0].id;
            req.session.username = result.rows[0].username;
            res.redirect('/');
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});