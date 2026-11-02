const express = require("express");
const { z } = require("zod");

const asyncHandler = require("../middleware/asyncHandler");
const APIError = require("../utils/ApiError");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { query, queryOne } = require("../config/db");


const router = express.Router();
router.use(requireAuth);

const uuid = z.string().uuid("Invalid UUID format");
const idParam = z.object({
  id: uuid,
});

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  company: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional(),
});


router.get(
    "/",
    asyncHandler(async (req, res) => {
        const { rows } = await query(
            `SELECT
                c.*,
                COUNT(i.id) AS invoice_count,
                COALESCE(SUM(i.total), 0) AS total_billed,
                COALESCE(
                    SUM(
                        CASE
                            WHEN i.status <> 'paid'
                            THEN i.total
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_outstanding
            FROM clients c
            LEFT JOIN invoices i ON i.client_id = c.id
            WHERE c.user_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC`,
            [req.user.id]
        );

        const clients = rows.map((r) => ({
            ...r,
            invoice_count: Number(r.invoice_count),
            total_billed: Number(r.total_billed),
            total_outstanding: Number(r.total_outstanding),
        }));

        res.json({ clients });
    })
);

router.get(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async (req, res) => {
        const client = await queryOne(
            'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if(!client) {
            throw APIError.notFound('Client not found');
        }

        const { rows: invoices } = await query(
            'SELECT id, invoice_number, status, issue_date, due_date, total, currency, created_at FROM invoices WHERE client_id = $1 AND user_id = $2 ORDER BY issue_date DESC, created_at DESC',
            [req.params.id, req.user.id]
        );

        const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
        const outstanding = invoices.filter(invoice => invoice.status !== 'paid').reduce((sum, invoice) => sum + Number(invoice.total), 0);

        res.json({
            client,
            invoices: invoices.map(invoice => ({
                ...invoice,
                total: Number(invoice.total),
            })),
            stats: {
                totalBilled,
                outstanding,
                count: invoices.length,
            },
        });
    })
);

router.post(
    "/",
    validate(clientSchema),
    asyncHandler(async (req, res) => {
        const b = req.body;
        const client = await queryOne(
            `INSERT INTO clients (user_id, name, email, company, phone, address, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [req.user.id, b.name, b.email, b.company || "", b.phone || "", b.address || "", b.notes || ""]
        );
        res.status(201).json({ client });
    })
);

router.patch(
    "/:id",
    validate(idParam, "params"),
    validate(clientSchema.partial()),
    asyncHandler(async (req, res) => {
        const fields = ["name", "email", "company", "phone", "address", "notes"];
        const sets = [];
        const values = [req.user.id, req.params.id];
        for(const f of fields) {
            if(req.body[f] !== undefined) {
                values.push(req.body[f]);
                sets.push(`${f} = $${values.length}`);
            }
        }
        if(!sets.length) {
            throw APIError.badRequest("No valid fields to update");
        }
        const client = await queryOne(
            `UPDATE clients SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = $1 AND id = $2 RETURNING *`,
            values
        );
        if(!client) {
            throw APIError.notFound('Client not found');
        }
        res.json({ client });
    }
));

router.delete(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async (req, res) => {
        const client = await queryOne(
            'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if(!client) {
            throw APIError.notFound('Client not found');
        }
        res.json({ client });
    })
);

module.exports = router;
