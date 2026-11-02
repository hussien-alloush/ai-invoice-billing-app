const bcrypt = require('bcrypt');
const { queryOne } = require('../config/db');

const PUBLIC_COLS = 'id, name, email, created_at, updated_at';

async function hashPassword(plain) {
    return bcrypt.hash(plain, 10);
}
async function comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}


async function findByEmail(email) {
    return queryOne(
        'SELECT id, name, email, password_hash, session_version, created_at, updated_at FROM users WHERE email = $1',
        [email]
    );
}
async function findById(id) {
    return queryOne(
        `SELECT ${PUBLIC_COLS}, session_version FROM users WHERE id = $1`,
        [id]
    );
}

async function findByIdWithPassword(id) {
    return queryOne(
        'SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE id = $1',
        [id]
    );
}

async function create({ name, email, passwordHash }) {
    return queryOne(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING ${PUBLIC_COLS}`,
        [name, email, passwordHash]
    );
}

async function updateName(id, name) {
    return queryOne(
        `UPDATE users SET name = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING ${PUBLIC_COLS}`,
        [id, name]
    );
}

async function updatePassword(id, passwordHash) {
    return queryOne(
        `UPDATE users SET password_hash = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING ${PUBLIC_COLS}`,
        [id, passwordHash]
    );
}

module.exports = {
    PUBLIC_COLS,
    hashPassword,
    comparePassword,
    findByEmail,
    findById,
    findByIdWithPassword,
    create,
    updateName,
    updatePassword
};