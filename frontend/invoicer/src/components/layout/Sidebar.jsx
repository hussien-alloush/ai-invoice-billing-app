import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  Users,
  Receipt,
  Wallet,
  Package,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import AILogo from "./AILogo";

const NAV = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/payments", icon: Wallet, label: "Payments" },
  { to: "/items", icon: Package, label: "Items" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

const ROW_BASE =
  "relative flex items-center h-11 w-full rounded-xl overflow-hidden " +
  "transition-[background-color,color,box-shadow] duration-200";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} title={label} className="block">
      {({ isActive }) => (
        <div
          className={cn(
            ROW_BASE,
            isActive
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold"
              : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
          )}
        >
          <span className="h-11 w-12 flex items-center justify-center shrink-0">
            <Icon size={18} strokeWidth={2} />
          </span>
          <span className="text-sm font-medium whitespace-nowrap pr-3">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

function ActionRow({ icon: Icon, label, onClick, to }) {
  const inner = (isActive) => (
    <div
      className={cn(
        ROW_BASE,
        isActive
          ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold"
          : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      )}
    >
      <span className="h-11 w-12 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </span>
      <span className="text-sm font-medium whitespace-nowrap pr-3">{label}</span>
    </div>
  );

  if (to) {
    return (
      <NavLink to={to} title={label} className="block">
        {({ isActive }) => inner(isActive)}
      </NavLink>
    );
  }

  return (
    <button onClick={onClick} title={label} className="block">
      {inner(false)}
    </button>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const displayName = user?.name || "Account";
  const displayEmail = user?.email || "";

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 h-screen sticky top-0",
        "flex-col items-stretch justify-between px-4 py-6",
        "bg-[var(--surface)] border-r border-[var(--border)]",
        "w-[248px]",
      )}
    >
      <div className="flex flex-col gap-8 w-full">
        <div className="flex items-center gap-3 h-12 px-2">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
            <AILogo size={32} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold text-[var(--ink)]">Invoicer</div>
            <div className="text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">Finance workspace</div>
          </div>
        </div>

        <nav className="flex flex-col items-stretch gap-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">Workspace</div>
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-stretch gap-1 w-full">
        <ActionRow icon={Settings} label="Settings" to="/settings" />
        <ActionRow icon={LogOut} label="Log out" onClick={logout} />

        <div className="flex items-center gap-3 h-14 mt-4 px-2 border-t border-[var(--border)]">
          <div className="h-9 w-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold flex items-center justify-center text-sm shrink-0">
            {user?.name?.[0]?.toUpperCase() || "R"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--ink)] truncate">
              {displayName}
            </div>
            {displayEmail && (
              <div className="text-[11px] text-[var(--ink-muted)] truncate">
                {displayEmail}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
