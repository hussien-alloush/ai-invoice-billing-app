import { apiClient } from "./client";

export const dashboardApi = {
  // ── Real API (uncomment when backend is ready) ──
  get: async () => {
    const { data } = await apiClient.get("/dashboard");
    const totals = data.totals;

    return {
      stats: {
        totalRevenue: totals.total_revenue,
        outstanding: totals.outstanding,
        paidThisMonth: totals.paid_this_month,
        overdueCount: totals.overdue_count,
        overdueTotal: totals.overdue_total,
        invoiceCount: totals.invoice_count,
        clientCount: totals.client_count,
      },
      revenueSeries: data.series,
      recentInvoices: data.recent_invoices,
    };
  },
};
