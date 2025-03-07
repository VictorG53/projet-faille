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

app.get('/data', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    client.query('SELECT * FROM userapp', (err, result) => {
        if (err) {
            res.send('An error has occurred');
        } else {
            res.send(result.rows);
        }
    });
});

app.post('/create-user', (req, res) => {
    const { username, password } = req.body;
    client.query('INSERT INTO userapp (username, password) VALUES ($1, $2)', [username, password], (err, result) => {
        if (err) {
            console.error('Error inserting user', err);
            res.status(500).send('Error creating user');
        } else {
            res.redirect('/');
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    client.query('SELECT * FROM userapp WHERE username = $1 AND password = $2', [username, password], (err, result) => {
        if (err) {
            console.error('Error querying user', err);
            res.status(500).send('Error logging in');
        } else if (result.rows.length > 0) {
            req.session.userId = result.rows[0].id;
            res.send('Login successful');
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.send('Logout successful');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});