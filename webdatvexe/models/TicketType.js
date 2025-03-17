const connection = require('../config/database').connection;

class TicketType {
    static getAll() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM ticket_types WHERE status = true', (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM ticket_types WHERE id = ? AND status = true', [id], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });
    }
}

module.exports = TicketType; 