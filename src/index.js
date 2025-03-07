import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/pages/login.html');
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})