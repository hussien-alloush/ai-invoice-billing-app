
const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../middleware/asyncHandler");
const APIError = require("../utils/ApiError");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { query, queryOne, withTransaction } = require("../config/db");
const settings = require("../models/setting");
const { computeTotals, serializeInvoice } = require("../utils/invoice");

const router = express.Router();
router.use(requireAuth);

const uuid = z.string().uuid("Invalid UUID format");

const idParam = z.object({
    id: uuid,
});

const dateString = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional();

const invoiceSchema = z.object({
    description: z.string().trim().max(255).default(""),
    quantity: z.coerce.number().min(0, "Quantity must be a non-negative number").default(1),
    rate: z.coerce.number().min(0, "Rate must be a non-negative number").default(0),
    position: z.coerce.number().int().min(0, "Position must be a non-negative integer").default(0),
});

const invoiceDataSchema = z.object({
    client_id: uuid,
    invoice_number: z.string().trim().max(50).optional(),
    status: z.enum(["draft", "sent", "paid"]).default("draft"),
    issue_date: dateString,
    due_date: dateString,
    currency: z.string().trim().max(10).default("USD"),
    tax_rate: z.coerce.number().min(0, "Tax rate must be a non-negative number").default(0),
    discount: z.coerce.number().min(0, "Discount must be a non-negative number").default(0),
    notes: z.string().trim().max(1000).default(""),
    terms: z.string().trim().max(1000).default(""),
    items: z.array(invoiceSchema).default([]),
});

async function loadInvoice(id, userId) {
    const invoice = await queryOne(
        "SELECT i.*, c.name AS client_name, c.email AS client_email, c.company AS client_company, c.address AS client_address FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = $1 AND i.user_id = $2",
        [id, userId]
    );

    if (!invoice) {
        return null;
    }

    const { rows: items } = await query(
        "SELECT id, description, quantity, rate, amount, position FROM invoice_items WHERE invoice_id = $1 ORDER BY position ASC",
        [id]
    );

    return serializeInvoice(invoice, items);
}

async function replaceItems(client, invoiceID, items) {
    await client.query(
        "DELETE FROM invoice_items WHERE invoice_id = $1",
        [invoiceID]
    );

    for (const it of items) {
        await client.query(
            "INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, position) VALUES ($1, $2, $3, $4, $5, $6)",
            [invoiceID, it.description, it.quantity, it.rate, it.amount, it.position]
        );
    }
}

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const {
            status,
            client_id,
            search,
            sort = "issue_date",
            order = "desc"
        } = req.query;

        const params = [req.user.id];
        const where = ["i.user_id = $1"];

        if (client_id) {
            params.push(client_id);
            where.push(`i.client_id = $${params.length}`);
        }

        if (status && status !== "all") {
            if (status === "overdue") {
                where.push("i.status = 'sent' AND i.due_date < CURRENT_DATE");
            } else if (status === "sent") {
                where.push("i.status = 'sent' AND (i.due_date IS NULL OR i.due_date >= CURRENT_DATE)");
            } else {
                params.push(status);
                where.push(`i.status = $${params.length}`);
            }
        }

        if (search) {
            params.push(`%${search}%`);
            where.push(
                `(i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`
            );
        }

        const sortCol = {
            issue_date: "i.issue_date",
            total: "i.total",
            due_date: "i.due_date",
            created_at: "i.created_at"
        }[sort] || "i.issue_date";

        const sortDir = order === "asc" ? "ASC" : "DESC";

        const { rows } = await query(
            `SELECT i.*, c.name AS client_name, c.company AS client_company
             FROM invoices i
             LEFT JOIN clients c ON c.id = i.client_id
             WHERE ${where.join(" AND ")}
             ORDER BY ${sortCol} ${sortDir}, i.created_at DESC`,
            params
        );

        res.json({
            invoices: rows.map((r) => serializeInvoice(r))
        });
    })
);

router.get(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async (req, res, next) => {
        const invoice = await loadInvoice(req.params.id, req.user.id);

        if (!invoice) {
            return next(
                APIError.notFound(`Invoice with ID ${req.params.id} not found`)
            );
        }

        res.json({ invoice });
    })
);

router.post(
    "/",
    validate(invoiceDataSchema),
    asyncHandler(async (req, res) => {
        const b = req.body;
        const totals = computeTotals(b.items, b.tax_rate, b.discount);

        const invoiceNumber =
            b.invoice_number || (await settings.nextInvoiceNumber(req.user.id));

        const createdInvoice = await withTransaction(async (client) => {
            const { rows } = await client.query(
                `INSERT INTO invoices
                    (user_id, client_id, invoice_number, status, issue_date, due_date,
                     currency, tax_rate, discount, subtotal, tax_amount, total, notes, terms, paid_at)
                 VALUES
                    ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE),
                     COALESCE($6, CURRENT_DATE + interval '30 days'), $7, $8, $9,
                     $10, $11, $12, $13, $14, $15)
                 RETURNING *`,
                [
                    req.user.id,
                    b.client_id,
                    invoiceNumber,
                    b.status,
                    b.issue_date || null,
                    b.due_date || null,
                    b.currency,
                    b.tax_rate,
                    totals.discount,
                    totals.subtotal,
                    totals.tax,
                    totals.total,
                    b.notes,
                    b.terms,
                    b.status === "paid" ? new Date() : null,
                ]
            );

            await replaceItems(client, rows[0].id, totals.items);

            return rows[0];
        });

        const invoice = await loadInvoice(createdInvoice.id, req.user.id);

        res.status(201).json({ invoice });
    })
);

router.patch(
    "/:id",
    validate(idParam, "params"),
    validate(invoiceDataSchema.partial()),
    asyncHandler(async (req, res, next) => {
        const existing = await queryOne(
            "SELECT * FROM invoices WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user.id]
        );

        if (!existing) {
            return next(
                APIError.notFound(`Invoice with ID ${req.params.id} not found`)
            );
        }

        const b = req.body;
        const taxRate = b.tax_rate ?? Number(existing.tax_rate ?? 0);
        const discount = b.discount ?? Number(existing.discount ?? 0);

        await withTransaction(async (client) => {
            let totals = null;
            let shouldReplaceItems = false;

            if (Array.isArray(b.items)) {
                totals = computeTotals(b.items, taxRate, discount);
                shouldReplaceItems = true;
            } else if (
                b.tax_rate !== undefined ||
                b.discount !== undefined
            ) {
                const { rows: currentItems } = await client.query(
                    "SELECT description, quantity, rate, position FROM invoice_items WHERE invoice_id = $1 ORDER BY position ASC",
                    [existing.id]
                );

                totals = computeTotals(currentItems, taxRate, discount);
            }

            const sets = [];
            const values = [req.user.id, req.params.id];

            const set = (col, val) => {
                values.push(val);
                sets.push(`${col} = $${values.length}`);
            };

            if (b.client_id !== undefined) {
                set("client_id", b.client_id || null);
            }

            if (b.invoice_number !== undefined) {
                set("invoice_number", b.invoice_number || "");
            }

            if (b.status !== undefined) {
                set("status", b.status);
                set(
                    "paid_at",
                    b.status === "paid" ? new Date() : null
                );
            }

            if (b.issue_date !== undefined) {
                set("issue_date", b.issue_date || null);
            }

            if (b.due_date !== undefined) {
                set("due_date", b.due_date || null);
            }

            if (b.currency !== undefined) {
                set("currency", b.currency || "USD");
            }

            if (b.notes !== undefined) {
                set("notes", b.notes || "");
            }

            if (b.terms !== undefined) {
                set("terms", b.terms || "");
            }

            if (totals) {
                set("tax_rate", taxRate);
                set("discount", totals.discount);
                set("subtotal", totals.subtotal);
                set("tax_amount", totals.tax);
                set("total", totals.total);
            }

            if (sets.length) {
                await client.query(
                    `UPDATE invoices
                     SET ${sets.join(", ")}, updated_at = NOW()
                     WHERE user_id = $1 AND id = $2
                     RETURNING *`,
                    values
                );
            }

            if (shouldReplaceItems) {
                await replaceItems(client, existing.id, totals.items);
            }
        });

        res.json({
            invoice: await loadInvoice(existing.id, req.user.id)
        });
    })
);

router.patch(
    "/:id/status",
    validate(idParam, "params"),
    validate(z.object({
        status: z.enum(["draft", "sent", "paid"])
    })),
    asyncHandler(async (req, res) => {
        const { status } = req.body;

        const updated = await queryOne(
            `UPDATE invoices
             SET status = $3,
                 paid_at = CASE
                     WHEN $3 = 'paid' THEN COALESCE(paid_at, NOW())
                     ELSE NULL
                 END,
                 updated_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [req.params.id, req.user.id, status]
        );

        if (!updated) {
            throw APIError.notFound("Invoice not found");
        }

        res.json({
            invoice: await loadInvoice(req.params.id, req.user.id)
        });
    })
);

router.delete(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async (req, res) => {
        const result = await queryOne(
            "DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING *",
            [req.params.id, req.user.id]
        );

        if (!result) {
            throw APIError.notFound("Invoice not found");
        }

        res.json({ ok: true });
    })
);

module.exports = router;
