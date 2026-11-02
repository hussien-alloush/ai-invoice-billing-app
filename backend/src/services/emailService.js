const env = require('../config/env');
const APIError = require('../utils/ApiError');

function assertEmailConfigured() {
    if (!env.resendApiKey || !env.emailFrom) {
        throw APIError.internal(
            'Password reset email is not configured. Set RESEND_API_KEY and EMAIL_FROM.'
        );
    }

    let frontendUrl;
    try {
        frontendUrl = new URL(env.frontendUrl);
    } catch {
        throw APIError.internal('FRONTEND_URL must be a valid absolute URL.');
    }

    if (
        !['http:', 'https:'].includes(frontendUrl.protocol) ||
        (env.isProd && frontendUrl.protocol !== 'https:')
    ) {
        throw APIError.internal('FRONTEND_URL must use HTTPS in production.');
    }
}

async function sendPasswordResetEmail(email, token) {
    assertEmailConfigured();

    const resetUrl = new URL('/reset-password', env.frontendUrl);
    resetUrl.searchParams.set('token', token);

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: env.emailFrom,
            to: [email],
            subject: 'Reset your Invoicer password',
            html: `<p>We received a request to reset the password for your Invoicer account.</p>
                <p><a href="${resetUrl.toString()}">Reset your password</a></p>
                <p>This link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p>`,
            text: `Reset your Invoicer password: ${resetUrl.toString()}\n\nThis link expires in 30 minutes. If you did not request a reset, you can ignore this email.`,
        }),
    });

    if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Resend request failed (${response.status}): ${responseBody}`);
    }
}

module.exports = {
    assertEmailConfigured,
    sendPasswordResetEmail,
};
