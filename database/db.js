// database/db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DİKKAT: db.js dosyasının kendisi database/ klasöründe olduğu için
// veritabanı dosyasının tam yolu şöyle olmalı:
const dbPath = path.join(__dirname, 'cumhuriyet.db'); // Eğer dosyanızın adı cumhuriyet.db ise

const dbPromise = open({
    filename: dbPath,
    driver: sqlite3.Database
});

export default dbPromise;