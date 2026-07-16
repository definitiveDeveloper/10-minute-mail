import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Globe, Clock, RotateCcw, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EmailDisplay from "@/components/EmailDisplay";
import InboxManager from "@/components/InboxManager";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
const Stats      = lazy(() => import("@/components/Stats"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const Features   = lazy(() => import("@/components/Features"));
const FAQ        = lazy(() => import("@/components/FAQ"));
const BlogSection= lazy(() => import("@/components/BlogSection"));
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { I18nProvider, useI18n } from "@/context/I18nContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { USER_LANGUAGES } from "@/config/languages";
import { languageNames } from "@/config/languageNames";
import wadeImage from "@/images/WadeMercer.png";
import lisaImage from "@/images/LisaChen.png";
import jaydenImage from "@/images/JaydenMorales.png";
import avaImage from "@/images/AvaRoberts.png";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const EMAIL_LIFESPAN_MS = 10 * 60 * 1000;
const EXTEND_THRESHOLD_MS = 2 * 60 * 1000;

// Interpolates between RGB color stops: green → yellow → orange → red as time drains.
function lerpRGB(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}
const COLOR_STOPS = [
  { at: 1.00, rgb: [34, 197, 94]  },  // green-500
  { at: 0.55, rgb: [234, 179, 8]  },  // yellow-500
  { at: 0.25, rgb: [249, 115, 22] },  // orange-500
  { at: 0.00, rgb: [239, 68, 68]  },  // red-500
];
function getTimerColor(timeLeft) {
  const ratio = Math.min(1, Math.max(0, timeLeft / EMAIL_LIFESPAN_MS));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const hi = COLOR_STOPS[i], lo = COLOR_STOPS[i + 1];
    if (ratio >= lo.at) {
      const t = (ratio - lo.at) / (hi.at - lo.at);
      const [r, g, b] = lerpRGB(lo.rgb, hi.rgb, t);
      return `rgb(${r},${g},${b})`;
    }
  }
  return "rgb(239,68,68)";
}

const testimonials = [
  {
    name: "Wade Mercer",
    role: "Digital Marketer",
    contentKey: "testimonial1Content",
    image: wadeImage,
  },
  {
    name: "Lisa Chen",
    role: "Software Developer",
    contentKey: "testimonial2Content",
    image: lisaImage,
  },
  {
    name: "Jayden Morales",
    role: "Content Creator",
    contentKey: "testimonial3Content",
    image: jaydenImage,
  },
];

const BMC_URL = "https://www.buymeacoffee.com/MeansMuch";

// Official BMC coffee-cup logo that quietly bobs — used inside every BMC touch-point.
function BMCIcon({ size = 16, className = "", delay = 0 }) {
  return (
    <motion.img
      src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`inline-block select-none flex-shrink-0 ${className}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// Yellow BMC button with periodic shimmer + golden glow pulse.
// Drop-in replacement for any <button> that opens BMC.
function CoffeeButton({ onClick, children, className = "", title = "" }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      className={`relative overflow-hidden cursor-pointer ${className}`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          "0 0 0px 0px rgba(255,221,0,0)",
          "0 0 18px 3px rgba(255,221,0,0.38)",
          "0 0 0px 0px rgba(255,221,0,0)",
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
    >
      {children}
      {/* Light-gleam sweep across the surface */}
      <motion.span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.42) 50%, transparent 70%)",
        }}
        animate={{ x: ["-180%", "180%"] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 5.5, ease: "easeInOut" }}
      />
    </motion.button>
  );
}

// ── Placement 1: After inbox ──────────────────────────────────────────────────
function CoffeeWhisper() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="my-8 flex items-center justify-center gap-3 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
        >
          <div className="h-px flex-1 bg-border/40 max-w-[100px]" />
          <motion.button
            onClick={() => window.open(BMC_URL, "_blank")}
            className="flex items-center gap-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground/90 transition-colors duration-500 group"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            <span className="tracking-wide">servers online</span>
            <span className="text-border/60">·</span>
            <span className="group-hover:text-amber-500 transition-colors duration-300 flex items-center gap-1">
              kept free by <BMCIcon size={13} />
            </span>
          </motion.button>
          <div className="h-px flex-1 bg-border/40 max-w-[100px]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Placement 2: Between sections ────────────────────────────────────────────
function CoffeeDivider() {
  return (
    <div className="py-8 flex items-center justify-center gap-4 px-6">
      <div className="h-px flex-1 bg-border/25" />
      <motion.button
        onClick={() => window.open(BMC_URL, "_blank")}
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] select-none"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        animate={{ color: ["rgba(80,65,50,0.65)", "rgba(180,120,0,0.95)", "rgba(80,65,50,0.65)"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <BMCIcon size={13} />
        <span>kept free by community</span>
        <BMCIcon size={13} delay={0.4} />
      </motion.button>
      <div className="h-px flex-1 bg-border/25" />
    </div>
  );
}

// ── Placement 3: After testimonials ──────────────────────────────────────────
// Styled as a 4th testimonial card — creator speaking in first person.
function CreatorCard() {
  return (
    <div className="pb-6 px-4 flex justify-center">
      <motion.div
        className="max-w-sm w-full card-gradient p-6 rounded-lg border border-border/50 relative overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-1 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <BMCIcon key={i} size={16} delay={i * 0.18} />
          ))}
        </div>
        <p className="mb-5 text-sm text-muted-foreground/80 leading-relaxed italic">
          "I built this nights and weekends so everyone could have a spam-free
          inbox. If it saved you from even a handful of junk emails, a coffee
          keeps the lights on."
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-amber-400/40 rounded-full overflow-hidden flex-shrink-0">
              <AvatarImage
                src={avaImage}
                alt="Ava Roberts"
                className="object-cover object-top w-full h-full"
              />
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-sm">
                A
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">Ava Roberts</p>
              <p className="text-xs text-muted-foreground">Creator, 10 Minute Mail</p>
            </div>
          </div>
          <CoffeeButton
            onClick={() => window.open(BMC_URL, "_blank")}
            className="flex items-center gap-1.5 bg-[#FFDD00] text-black px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm flex-shrink-0"
          >
            <BMCIcon size={14} />
            <span style={{ fontFamily: "'Pacifico', cursive", fontWeight: 400 }}>
              Buy a coffee
            </span>
          </CoffeeButton>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { t, setLanguage, currentLanguage } = useI18n();
  // Translated language names for the current UI language
  const activeLangNames = languageNames[currentLanguage] || languageNames.en;
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailExpiry, setEmailExpiry] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [emailLoading, setEmailLoading] = useState(true);
  const [showExtendButton, setShowExtendButton] = useState(false);
  const [assigningEmail, setAssigningEmail] = useState(false);
  const [assigningCountdown, setAssigningCountdown] = useState(0);
  const autoRefreshingRef = useRef(false);

  // Use the prefetch started in <head> if available, otherwise fetch now.
  useEffect(() => {
    setEmailLoading(true);
    const p = window.__emailPreload || fetch("/api/email").then((r) => r.json());
    window.__emailPreload = null;
    p.then((data) => {
      if (data?.email) {
        setCurrentEmail(data.email);
        setEmailExpiry(data.assignedAt + EMAIL_LIFESPAN_MS);
      }
    }).catch(console.error).finally(() => setEmailLoading(false));
  }, []);

  // Countdown timer with auto-refresh, extend button, and assigning-email logic
  useEffect(() => {
    if (!emailExpiry) return;
    const tick = () => {
      // Cap at EMAIL_LIFESPAN_MS so server clock-skew never shows > 10:00
      const remaining = Math.min(EMAIL_LIFESPAN_MS, Math.max(0, emailExpiry - Date.now()));
      setTimeLeft(remaining);

      if (remaining <= EXTEND_THRESHOLD_MS && remaining > 0) {
        setShowExtendButton(true);
      } else if (remaining > EXTEND_THRESHOLD_MS) {
        setShowExtendButton(false);
      }

      // Show countdown message in the last 5 seconds
      if (remaining <= 5000 && remaining > 0) {
        setAssigningEmail(true);
        setAssigningCountdown(Math.ceil(remaining / 1000));
      }

      if (remaining === 0 && !autoRefreshingRef.current) {
        autoRefreshingRef.current = true;
        setAssigningEmail(true);
        setAssigningCountdown(0);
        fetch("/api/email")
          .then((r) => r.json())
          .then((data) => {
            if (data.email) {
              setCurrentEmail(data.email);
              setEmailExpiry(data.assignedAt + EMAIL_LIFESPAN_MS);
              setTimeLeft(EMAIL_LIFESPAN_MS);
              setShowExtendButton(false);
            }
          })
          .catch(console.error)
          .finally(() => {
            autoRefreshingRef.current = false;
            setAssigningEmail(false);
            setAssigningCountdown(0);
          });
      }
    };
    tick(); // run immediately so display updates without waiting 1 s
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [emailExpiry]);

  const extendEmailSession = useCallback(async () => {
    try {
      const res = await fetch("/api/email/extend", { method: "POST" });
      const data = await res.json();
      if (data.email) {
        setEmailExpiry(data.assignedAt + EMAIL_LIFESPAN_MS);
        setTimeLeft(EMAIL_LIFESPAN_MS);
        setShowExtendButton(false);
        setAssigningEmail(false);
        setAssigningCountdown(0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleNewAddress = useCallback(async () => {
    // Clear all timer-related UI immediately — don't wait for the fetch
    setShowExtendButton(false);
    setAssigningEmail(false);
    setAssigningCountdown(0);
    setEmailLoading(true);
    try {
      const res = await fetch("/api/email/renew", { method: "POST" });
      const data = await res.json();
      if (data.email) {
        setCurrentEmail(data.email);
        setEmailExpiry(data.assignedAt + EMAIL_LIFESPAN_MS);
        setTimeLeft(EMAIL_LIFESPAN_MS);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen font-sans">
      {/* ── Hero / Gradient Section ── */}
      <div className="hero-gradient">
        {/* Navbar */}
        <nav className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-y-3">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {activeLangNames[currentLanguage] ||
                      USER_LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName ||
                      "Language"}
                  </span>
                  <span className="sm:hidden">{currentLanguage.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-96 overflow-y-auto bg-background border border-border shadow-md"
              >
                {USER_LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={lang.code === currentLanguage ? "bg-accent font-semibold" : ""}
                  >
                    <span className="mr-2 text-muted-foreground text-xs w-8 shrink-0">{lang.code.toUpperCase()}</span>
                    {/* Show the language's name translated into the currently active UI language */}
                    {activeLangNames[lang.code] || lang.nativeName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-[10px] text-muted-foreground/60 hidden md:block">
              {t("poweredByPassion")}
            </p>
            <CoffeeButton
              onClick={() => window.open(BMC_URL, "_blank")}
              title={t("buyMeACoffeeTooltip")}
              className="flex items-center gap-2 bg-[#FFDD00] text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow text-xs sm:text-sm"
            >
              <BMCIcon size={18} />
              <span
                style={{ fontFamily: "'Pacifico', cursive", fontWeight: 400 }}
                className="hidden sm:inline"
              >
                {t("buyMeACoffee")}
              </span>
            </CoffeeButton>
          </div>
        </nav>

        {/* Hero */}
        <motion.div
          className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-4 text-center"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <motion.button
            onClick={() => window.open(BMC_URL, "_blank")}
            className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-amber-500/40 dark:border-amber-400/20 bg-amber-50 dark:bg-amber-400/[0.06] text-[9px] sm:text-[10px] text-foreground/65 dark:text-muted-foreground/70 tracking-wide hover:border-amber-500/70 dark:hover:border-amber-400/40 hover:text-foreground/90 dark:hover:text-muted-foreground transition-all duration-500 group"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-amber-500 dark:text-amber-400/70"
            >
              ✦
            </motion.span>
            <span>
              No ads · no clutter · no noise —{" "}
              <span className="text-amber-600 dark:text-amber-500/80 group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors duration-300">
                built in silence, kept free by coffee
              </span>
            </span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="text-amber-500 dark:text-amber-400/70"
            >
              ✦
            </motion.span>
          </motion.button>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
            {t("mainHeading1")}{" "}
            <span className="gradient-text">{t("mainHeading2")}</span>{" "}
            {t("mainHeading3")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-3 max-w-md sm:max-w-xl mx-auto">
            {t("subHeading")}
          </p>

          {/* Email display + New Address button + Extend button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xl sm:max-w-3xl mx-auto">
            <div className="w-full sm:flex-1">
              {emailLoading ? (
                <div className="h-14 rounded-lg bg-muted/40 animate-pulse flex items-center justify-center text-muted-foreground text-sm">
                  {t("generatingMailbox")}
                </div>
              ) : (
                <EmailDisplay email={currentEmail} />
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewAddress}
                disabled={emailLoading}
                title={t("newAddressButton")}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs">{t("newAddressButton")}</span>
              </Button>
              <AnimatePresence>
                {showExtendButton && (
                  <motion.button
                    key="extend"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    onClick={extendEmailSession}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors cursor-pointer shadow-sm"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>+10 min</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── IP lock badge + timer ── */}
          <div className="mt-1.5 w-full max-w-xl sm:max-w-3xl mx-auto flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/45 select-none">
            <span>🔒</span>
            <span>{t("ipLockedBadge")}</span>
            <span className="text-border/60">·</span>
            {assigningEmail ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
            ) : (
              <span className="tabular-nums font-medium" style={{ color: getTimerColor(timeLeft) }}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>

          {/* ── Drain bar — full-width, standalone ── */}
          <div className="mt-1 w-full max-w-xl sm:max-w-3xl mx-auto">
            <div className="h-[3px] bg-border/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (timeLeft / EMAIL_LIFESPAN_MS) * 100)}%`,
                  background: getTimerColor(timeLeft),
                  boxShadow: `0 0 6px 1px ${getTimerColor(timeLeft)}90`,
                  transition: "width 0.95s linear, background 0.5s ease, box-shadow 0.5s ease",
                }}
                animate={timeLeft <= 5000 ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                transition={timeLeft <= 5000 ? { duration: 0.55, repeat: Infinity } : { duration: 0.3 }}
              />
            </div>

            <AnimatePresence>
              {assigningEmail && assigningCountdown > 0 && (
                <motion.div
                  className="flex items-center justify-center mt-1"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-[10px] text-muted-foreground/60">
                    {t("assigningIn", { count: assigningCountdown })}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inbox */}
          <div className="mt-2">
            <InboxManager currentEmail={currentEmail} />
          </div>

          <CoffeeWhisper />
        </motion.div>
      </div>

      <Suspense fallback={null}>
      {/* ── Stats ── */}
      <Stats />

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── How It Works ── */}
      <HowItWorks />

      <CoffeeDivider />

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Features ── */}
      <Features />

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Blog ── */}
      <BlogSection />
      </Suspense>

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Testimonials ── */}
      <section className="py-12 sm:py-16 container mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-8 sm:mb-10"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t("testimonialsHeading")}
          </h2>
          <p className="text-muted-foreground max-w-lg sm:max-w-2xl mx-auto text-base sm:text-lg">
            {t("testimonialsSubheading")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="card-gradient p-6 rounded-lg border border-border"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-6 text-sm sm:text-base">{t(testimonial.contentKey)}</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary rounded-full overflow-hidden">
                  <AvatarImage
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="object-cover object-center w-full h-full"
                    style={{
                      imageRendering: "crisp-edges",
                      WebkitImageSmoothing: "antialiased",
                      MozImageSmoothing: "antialiased",
                    }}
                  />
                  <AvatarFallback>
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      testimonial.role
                        .toLowerCase()
                        .replace(/\s+/g, "")
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <CreatorCard />

      {/* ── Divider ── */}
      <div className="section-divider" />

      <Suspense fallback={null}>
        <FAQ />
      </Suspense>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-semibold mb-4 text-base">{t("footerService")}</p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footerHowItWorks")}
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footerFeatures")}
                  </a>
                </li>
                <li>
                  <a
                    href="#blog"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4 text-base">{t("footerLegal")}</p>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {t("footerPrivacy")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {t("footerTerms")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {t("footerCookiePolicy")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4 text-base">{t("footerSupport")}</p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#faq"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {t("footerContact")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {t("footerStatus")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-muted-foreground">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} &middot; 10 Minute Mail.{" "}
              {t("footerRightsReserved")}
            </p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}
