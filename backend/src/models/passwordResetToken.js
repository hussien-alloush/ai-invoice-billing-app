const { query, withTransaction } = require('../config/db');

async function replaceForUser(userId, tokenHash, expiresAt) {
    await withTransaction(async (client) => {
        await client.query(
            'DELETE FROM password_reset_tokens WHERE user_id = $1',
            [userId]
        );
        await client.query(
            `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
             VALUES ($1, $2, $3)`,
            [tokenHash, userId, expiresAt]
        );
    });
}

async function deleteByHash(tokenHash) {
    await query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
}

async function consumeAndUpdatePassword(tokenHash, passwordHash) {
    return withTransaction(async (client) => {
        const { rows } = await client.query(
            `DELETE FROM password_reset_tokens
             WHERE token_hash = $1 AND expires_at > NOW()
             RETURNING user_id`,
            [tokenHash]
        );
        const userId = rows[0]?.user_id;
        if (!userId) return false;

        const result = await client.query(
            `UPDATE users
             SET password_hash = $2,
                 session_version = session_version + 1,
                 updated_at = NOW()
             WHERE id = $1`,
            [userId, passwordHash]
        );
        if (result.rowCount !== 1) return false;

        await client.query(
            'DELETE FROM password_reset_tokens WHERE user_id = $1',
            [userId]
        );
        return true;
    });
}

module.exports = {
    replaceForUser,
    deleteByHash,
    consumeAndUpdatePassword,
};
