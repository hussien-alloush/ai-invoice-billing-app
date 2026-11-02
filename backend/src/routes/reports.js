const express = require("express");

const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const { query, queryOne } = require("../config/db");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const uid = req.user.id;

    const totals = await queryOne(
      `SELECT
        COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) AS revenue,
        COALESCE(SUM(CASE WHEN status<>'paid' THEN total ELSE 0 END),0) AS outstanding,
        COUNT(*)::int AS invoice_count
      FROM invoices WHERE user_id = $1`,
      [uid]
    );

    const exp = await queryOne(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id = $1`,
      [uid]
    );

    const { rows: monthly } = await query(
      `WITH months AS (
        SELECT date_trunc('month', CURRENT_DATE) - (series.n || ' month')::interval AS m
        FROM generate_series(0, 5) AS series(n)
      )
      SELECT to_char(months.m,'Mon') AS label, to_char(months.m,'YYYY-MM') AS ym,
        COALESCE((SELECT SUM(i.total) FROM invoices i
          WHERE i.user_id=$1 AND i.status='paid'
          AND date_trunc('month',COALESCE(i.paid_at,i.issue_date))=months.m),0) AS revenue,
        COALESCE((SELECT SUM(e.amount) FROM expenses e
          WHERE e.user_id=$1 AND date_trunc('month',e.expense_date)=months.m),0) AS expenses
      FROM months ORDER BY months.m ASC`,
      [uid]
    );

    const agingTotals = await queryOne(
      `SELECT
        COALESCE(SUM(CASE WHEN due_date IS NULL OR due_date >= CURRENT_DATE THEN total ELSE 0 END),0) AS current,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 THEN total ELSE 0 END),0) AS d30,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN total ELSE 0 END),0) AS d60,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN total ELSE 0 END),0) AS d90,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date > 90 THEN total ELSE 0 END),0) AS d90plus
      FROM invoices
      WHERE user_id = $1 AND status = 'sent'`,
      [uid]
    );

    const { rows: topClientRows } = await query(
      `SELECT
        c.id,
        c.name,
        COALESCE(SUM(i.total), 0) AS billed,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) AS paid
      FROM clients c
      JOIN invoices i ON i.client_id = c.id
      WHERE c.user_id = $1
        AND i.user_id = $1
      GROUP BY c.id, c.name
      ORDER BY billed DESC
      LIMIT 5`,
      [uid]
    );

    const { rows: statusRows } = await query(
      `SELECT
        CASE
          WHEN status = 'sent' AND due_date < CURRENT_DATE THEN 'overdue'
          ELSE status
        END AS key,
        COALESCE(SUM(total), 0) AS value
      FROM invoices
      WHERE user_id = $1
      GROUP BY key`,
      [uid]
    );

    const statusTotals = new Map(
      statusRows.map((row) => [row.key, Number(row.value)])
    );
    const statusBreakdown = [
      { name: "Draft", key: "draft" },
      { name: "Sent", key: "sent" },
      { name: "Overdue", key: "overdue" },
      { name: "Paid", key: "paid" },
    ].map((status) => ({
      ...status,
      value: statusTotals.get(status.key) || 0,
    }));

    res.json({
      totals: {
        revenue: Number(totals.revenue),
        expenses: Number(exp.total),
        netProfit: Number(totals.revenue) - Number(exp.total),
        outstanding: Number(totals.outstanding),
        invoiceCount: Number(totals.invoice_count),
      },
      monthly: monthly.map((row) => ({
        label: row.label,
        ym: row.ym,
        revenue: Number(row.revenue),
        expenses: Number(row.expenses),
      })),
      aging: [
        { bucket: "Current", value: Number(agingTotals.current) },
        { bucket: "1–30d", value: Number(agingTotals.d30) },
        { bucket: "31–60d", value: Number(agingTotals.d60) },
        { bucket: "61–90d", value: Number(agingTotals.d90) },
        { bucket: "90d+", value: Number(agingTotals.d90plus) },
      ],
      topClients: topClientRows.map((client) => ({
        id: client.id,
        name: client.name,
        billed: Number(client.billed),
        paid: Number(client.paid),
      })),
      statusBreakdown,
    });
  })
);

module.exports = router;