const db = require('../database/db');

module.exports = {
    // Oy kaydet
    oyVer(kullaniciId, kanunId, oy) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO oylar (kullanici_id, kanun_id, oy) VALUES (?, ?, ?)`;
            db.run(sql, [kullaniciId, kanunId, oy], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    },

    // Oy kontrolü
    dahaOnceOyKullanildiMi(kullaniciId, kanunId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM oylar WHERE kullanici_id = ? AND kanun_id = ?`;
            db.get(sql, [kullaniciId, kanunId], (err, row) => {
                if (err) return reject(err);
                resolve(!!row); // true / false
            });
        });
    }
};