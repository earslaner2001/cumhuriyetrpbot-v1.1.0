const db = require('../database/db');

module.exports = {
    kanunEkle(teklifSahibi, baslik, icerik) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO kanunlar (teklif_sahibi, baslik, icerik) VALUES (?, ?, ?)`;
            db.run(sql, [teklifSahibi, baslik, icerik], function (err) {
                if (err) return reject(err);
                resolve(this.lastID); // eklenen kanunun ID’si
            });
        });
    },

    kanunGetir(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM kanunlar WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }
};