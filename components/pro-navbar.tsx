"use client";

/* Replika setia HeroUI Pro Navbar (https://heroui.pro/docs/react/components/navbar)
   dengan API yang sama persis — dot-notation composable:
     <Navbar navigate hideOnScroll maxWidth>
       <Navbar.Header>
         <Navbar.Brand />
         <Navbar.MenuToggle />
         <Navbar.Menu><Navbar.MenuItem /></Navbar.Menu>
       </Navbar.Header>
       <Navbar.Content>
         <Navbar.Item /> <Navbar.Label /> <Navbar.Separator /> <Navbar.Spacer />
       </Navbar.Content>
     </Navbar>
   Dibangun di atas stack proyek ini (Tailwind v3 + Framer Motion, tanpa paket
   @heroui-pro berbayar) karena paket Pro asli butuh lisensi + React 19 + Tailwind v4.
   Perilaku yang direplika: hide-on-scroll (spring), mobile menu animasi + kunci
   scroll body, client-side routing via prop `navigate`, link eksternal tab baru,
   `isCurrent` -> aria-current, dan hook `useNavbar`. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ---------- konteks ---------- */

interface NavbarContextValue {
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  navigate?: (href: string) => void;
  menuContent: ReactNode;
  registerMenu: (node: ReactNode) => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

function useNavbarContext(): NavbarContextValue {
  const ctx = useContext(NavbarContext);
  if (!ctx) throw new Error("Komponen Navbar.* harus dipakai di dalam <Navbar>");
  return ctx;
}

/** Akses state navbar dari dalam children — setara `useNavbar` di HeroUI Pro. */
export function useNavbar(): { isMenuOpen: boolean; setMenuOpen: (open: boolean) => void } {
  const { isMenuOpen, setMenuOpen } = useNavbarContext();
  return { isMenuOpen, setMenuOpen };
}

/* ---------- util ---------- */

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

const MAX_WIDTHS: Record<string, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
};

const HEIGHTS: Record<string, string> = {
  sm: "3rem",
  md: "4rem",
  lg: "5rem",
};

/* ---------- root ---------- */

export interface NavbarProps {
  children: ReactNode;
  position?: "sticky" | "static" | "floating";
  size?: "sm" | "md" | "lg";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  height?: string;
  hideOnScroll?: boolean;
  isMenuOpen?: boolean;
  defaultMenuOpen?: boolean;
  onMenuOpenChange?: (isOpen: boolean) => void;
  shouldBlockScroll?: boolean;
  navigate?: (href: string) => void;
  className?: string;
  style?: CSSProperties;
  innerClassName?: string;
  ["aria-label"]?: string;
}

function NavbarRoot({
  children,
  position = "sticky",
  size = "md",
  maxWidth = "lg",
  height,
  hideOnScroll = false,
  isMenuOpen,
  defaultMenuOpen = false,
  onMenuOpenChange,
  shouldBlockScroll = true,
  navigate,
  className,
  style,
  innerClassName,
  "aria-label": ariaLabel = "Navigasi utama",
}: NavbarProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultMenuOpen);
  const [menuContent, setMenuContent] = useState<ReactNode>(null);
  const open = isMenuOpen ?? uncontrolledOpen;
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const setMenuOpen = useCallback(
    (next: boolean) => {
      if (isMenuOpen === undefined) setUncontrolledOpen(next);
      onMenuOpenChange?.(next);
    },
    [isMenuOpen, onMenuOpenChange]
  );

  const registerMenu = useCallback((node: ReactNode) => {
    setMenuContent(node);
  }, []);

  // Kunci scroll body saat menu mobile terbuka.
  useEffect(() => {
    if (!shouldBlockScroll) return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, shouldBlockScroll]);

  // Sembunyikan saat scroll ke bawah, tampilkan saat scroll ke atas (spring, layout utuh).
  useEffect(() => {
    if (!hideOnScroll || reduceMotion) return;
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY.current + 4;
      const goingUp = y < lastY.current - 4;
      if (goingDown && y > 120 && !open) setHidden(true);
      else if (goingUp || y <= 120) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScroll, open, reduceMotion]);

  const barHeight = height ?? HEIGHTS[size];

  return (
    <NavbarContext.Provider value={{ isMenuOpen: open, setMenuOpen, navigate, menuContent, registerMenu }}>
      <nav
        aria-label={ariaLabel}
        data-menu-open={open}
        data-hidden={hidden}
        style={style}
        className={cn(
          "z-40 bg-white/90 backdrop-blur-md",
          position === "sticky" && "sticky top-0 border-b border-stone-200",
          position === "static" && "relative border-b border-stone-200",
          position === "floating" && "sticky top-2 mx-2 rounded-2xl border border-stone-200 shadow-lg",
          className
        )}
      >
        <motion.div
          animate={hideOnScroll && !reduceMotion ? { y: hidden ? "-110%" : "0%" } : undefined}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <div
            style={{ maxWidth: MAX_WIDTHS[maxWidth], height: barHeight }}
            className={cn("mx-auto flex w-full items-center gap-2 px-4 sm:gap-4 sm:px-6", innerClassName)}
          >
            {children}
          </div>
        </motion.div>
      </nav>
      {/* Mobile menu dirender di luar <nav> agar tingginya tepat mengisi viewport. */}
      <MobileMenuHost maxWidth={maxWidth} barHeight={barHeight} />
    </NavbarContext.Provider>
  );
}

/* Menu mobile: konten didaftarkan ke root lewat context, dirender sejajar <nav>. */
function MobileMenuHost({ maxWidth, barHeight }: { maxWidth: string; barHeight: string }) {
  const { isMenuOpen, menuContent } = useNavbarContext();
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {isMenuOpen && menuContent ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-x-0 top-[var(--navbar-height)] z-40 overflow-y-auto border-b border-stone-200 bg-white shadow-xl"
          style={{ "--navbar-height": barHeight, maxHeight: "calc(100dvh - var(--navbar-height))" } as CSSProperties}
        >
          <div style={{ maxWidth: MAX_WIDTHS[maxWidth] }} className="mx-auto flex w-full flex-col gap-1 px-4 pb-6 pt-2 sm:px-6">
            {menuContent}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ---------- Header / Brand / Content / Spacer / Separator / Label ---------- */

function Header({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex w-full items-center gap-2 sm:gap-3", className)}>{children}</div>;
}

function Brand({
  children,
  className,
  render,
}: {
  children: ReactNode;
  className?: string;
  render?: (props: { className?: string; children: ReactNode }) => ReactElement;
}) {
  const cls = cn("flex shrink-0 items-center gap-2", className);
  if (render) return render({ className: cls, children });
  return <div className={cls}>{children}</div>;
}

function Content({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-1", className)}>{children}</div>;
}

function Spacer() {
  return <div className="flex-1" aria-hidden />;
}

function Separator({ className }: { className?: string }) {
  return <div role="separator" aria-orientation="vertical" className={cn("h-6 w-px self-center bg-stone-200", className)} aria-hidden />;
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("truncate", className)}>{children}</span>;
}

/* ---------- Item (desktop) ---------- */

export interface NavbarItemProps {
  children: ReactNode;
  href?: string;
  isCurrent?: boolean;
  forceReload?: boolean;
  render?: (props: {
    href?: string;
    onClick: (e: MouseEvent) => void;
    "aria-current"?: "page";
    "data-current"?: boolean;
    className?: string;
    children: ReactNode;
  }) => ReactElement;
  onPress?: () => void;
  className?: string;
  as?: ElementType;
}

const ITEM_BASE =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const ITEM_IDLE = "text-stone-600 hover:bg-stone-100 hover:text-stone-900";
const ITEM_CURRENT = "bg-emerald-50 text-emerald-800";

function useItemNavigation(href?: string, forceReload?: boolean, onPress?: () => void, afterNavigate?: () => void) {
  const { navigate } = useNavbarContext();
  return useCallback(
    (e: MouseEvent) => {
      if (!href) {
        onPress?.();
        afterNavigate?.();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 2) return;
      if (isExternalHref(href)) {
        e.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      if (forceReload) return;
      if (navigate) {
        e.preventDefault();
        afterNavigate?.();
        navigate(href);
        return;
      }
      afterNavigate?.();
      onPress?.();
    },
    [href, forceReload, navigate, onPress, afterNavigate]
  );
}

function Item({ children, href, isCurrent = false, forceReload = false, render, onPress, className, as }: NavbarItemProps) {
  const handleClick = useItemNavigation(href, forceReload, onPress);
  const cls = cn(ITEM_BASE, isCurrent ? ITEM_CURRENT : ITEM_IDLE, className);
  const a11y = isCurrent ? ({ "aria-current": "page" as const, "data-current": true }) : {};

  if (render) {
    return render({ href, onClick: handleClick, className: cls, children, ...a11y });
  }
  if (href) {
    return (
      <a href={href} onClick={handleClick} className={cls} {...a11y}>
        {children}
      </a>
    );
  }
  const Tag = (as ?? "button") as ElementType;
  return (
    <Tag type={Tag === "button" ? "button" : undefined} onClick={handleClick} className={cls} {...a11y}>
      {children}
    </Tag>
  );
}

/* ---------- MenuToggle ---------- */

function MenuToggle({
  className,
  srLabel = "Buka/tutup menu navigasi",
}: {
  className?: string;
  srLabel?: string;
  children?: ReactNode;
}) {
  const { isMenuOpen, setMenuOpen } = useNavbarContext();
  return (
    <button
      type="button"
      aria-expanded={isMenuOpen}
      aria-label={srLabel}
      onClick={() => setMenuOpen(!isMenuOpen)}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-700 outline-none transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-emerald-500",
        className
      )}
    >
      <span className="relative block h-4 w-5" aria-hidden>
        <motion.span
          animate={isMenuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current"
        />
        <motion.span
          animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.12 }}
          className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current"
        />
        <motion.span
          animate={isMenuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current"
        />
      </span>
    </button>
  );
}

/* ---------- Menu / MenuItem (mobile) ---------- */

function Menu({ children }: { children: ReactNode }) {
  // Konten didaftarkan ke root agar bisa dirender sejajar <nav> oleh host.
  const { registerMenu } = useNavbarContext();
  useEffect(() => {
    registerMenu(children);
  }, [children, registerMenu]);
  return null;
}

const MENU_ITEM_BASE =
  "rounded-xl px-3 py-2.5 text-left text-base font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

function MenuItem({
  children,
  href,
  isCurrent = false,
  forceReload = false,
  render,
  onPress,
  className,
}: {
  children: ReactNode;
  href?: string;
  isCurrent?: boolean;
  forceReload?: boolean;
  render?: NavbarItemProps["render"];
  onPress?: () => void;
  className?: string;
}) {
  const { setMenuOpen } = useNavbarContext();
  const close = useCallback(() => setMenuOpen(false), [setMenuOpen]);
  const handleClick = useItemNavigation(href, forceReload, onPress, close);
  const cls = cn(MENU_ITEM_BASE, isCurrent ? "bg-emerald-50 text-emerald-800" : "text-stone-700 hover:bg-stone-100", className);
  const a11y = isCurrent ? ({ "aria-current": "page" as const, "data-current": true }) : {};

  if (render) {
    return render({ href, onClick: handleClick, className: cls, children, ...a11y });
  }
  if (href) {
    return (
      <a href={href} onClick={handleClick} className={cn(cls, "block")} {...a11y}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={handleClick} className={cn(cls, "w-full")} {...a11y}>
      {children}
    </button>
  );
}

/* ---------- export API dot-notation ala HeroUI Pro ---------- */

export const Navbar = Object.assign(NavbarRoot, {
  Header,
  Brand,
  Content,
  Item,
  Label,
  Separator,
  Spacer,
  MenuToggle,
  Menu,
  MenuItem,
});

export default Navbar;
