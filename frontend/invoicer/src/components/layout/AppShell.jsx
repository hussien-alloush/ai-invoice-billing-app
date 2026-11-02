import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";

export function AppShell() {
  const location = useLocation();
  const [paletteState, setPaletteState] = useState({
    pathname: location.pathname,
    open: false,
  });
  const paletteOpen =
    paletteState.pathname === location.pathname && paletteState.open;

  const openPalette = useCallback(() => {
    setPaletteState({ pathname: location.pathname, open: true });
  }, [location.pathname]);
  const closePalette = useCallback(() => {
    setPaletteState({ pathname: location.pathname, open: false });
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteState((state) => ({
          pathname: location.pathname,
          open:
            state.pathname === location.pathname
              ? !state.open
              : true,
        }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar />
      <main className="flex-1 min-w-0 px-5 md:px-8 xl:px-10 py-6 md:py-8 max-w-[1680px] mx-auto w-full">
        <Topbar onOpenPalette={openPalette} />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
