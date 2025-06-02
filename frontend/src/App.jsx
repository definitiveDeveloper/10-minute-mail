import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Globe, Clock, Annoyed } from "lucide-react"; 
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EmailDisplay from "@/components/EmailDisplay";
import InboxManager from "@/components/InboxManager";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
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
import wadeImage from '@/images/WadeMercer.png'; // Using alias if configured
import lisaImage from '@/images/LisaChen.png'; // Using alias if configured
import jaydenImage from '@/images/JaydenMorales.png'; // Using alias if configured

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const testimonials = [
  {
    name: 'Wade Mercer',
    role: 'Digital Marketer',
    contentKey: 'testimonial1Content',
    image: wadeImage
  },
  {
    name: 'Lisa Chen',
    role: 'Software Developer',
    contentKey: 'testimonial2Content',
    image: lisaImage
  },
  {
    name: 'Jayden Morales',
    role: 'Content Creator',
    contentKey: 'testimonial3Content',
    image: jaydenImage
  },
];

const AVAILABLE_DOMAINS = ["10-minute-mail.net"];
const EMAIL_LIFESPAN_MS = 10 * 60 * 1000; // 10 minutes
const EXTEND_BUTTON_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function generateRandomUsername(length = 20) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

function generateNewEmailAddress(domains) {
  const username = generateRandomUsername();
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
}

function AdPlaceholder() {
  const { t } = useI18n();
  return (
    <div className="my-8 py-6 bg-muted/20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
      <Annoyed className="w-12 h-12 mb-3 text-muted-foreground/50" />
      <p className="font-semibold">{t('adPlaceholderTitle')}</p>
      <p className="text-sm text-center px-4">{t('adPlaceholderDescription')}</p>
    </div>
  );
}


function AppContent() {
  const { t, setLanguage, currentLanguage } = useI18n();
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailExpiry, setEmailExpiry] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExtendButton, setShowExtendButton] = useState(false);

  const getStoredEmailData = () => {
    const storedEmail = localStorage.getItem("tempEmail");
    const storedExpiry = localStorage.getItem("tempEmailExpiry");
    if (storedEmail && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      if (expiryTime > Date.now()) {
        return { email: storedEmail, expiry: expiryTime };
      }
    }
    return null;
  };

  const createNewEmailSession = useCallback(() => {
    const newEmail = generateNewEmailAddress(AVAILABLE_DOMAINS);
    const newExpiry = Date.now() + EMAIL_LIFESPAN_MS;
    localStorage.setItem("tempEmail", newEmail);
    localStorage.setItem("tempEmailExpiry", newExpiry.toString());
    setCurrentEmail(newEmail);
    setEmailExpiry(newExpiry);
    setShowExtendButton(false);
  }, []);

  const extendEmailSession = useCallback(() => {
    const newExpiry = Date.now() + EMAIL_LIFESPAN_MS;
    localStorage.setItem("tempEmailExpiry", newExpiry.toString());
    setEmailExpiry(newExpiry);
    setShowExtendButton(false);
    // Add toast notification for extension
  }, []);

  useEffect(() => {
    const storedData = getStoredEmailData();
    if (storedData) {
      setCurrentEmail(storedData.email);
      setEmailExpiry(storedData.expiry);
    } else {
      createNewEmailSession();
    }
  }, [createNewEmailSession]);

  useEffect(() => {
    if (!emailExpiry) return;

    const timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, emailExpiry - now);
      setTimeLeft(remaining);

      if (remaining <= EXTEND_BUTTON_THRESHOLD_MS && remaining > 0) {
        setShowExtendButton(true);
      } else {
        setShowExtendButton(false);
      }

      // Removed createNewEmailSession() call when remaining === 0
      // Email will only regenerate on refresh if expired or on initial load if expired/missing.
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [emailExpiry]); // Removed createNewEmailSession from dependencies

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen font-sans">
      <div className="hero-gradient">
        <nav className="container mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-y-4">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end sm:justify-start">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{USER_LANGUAGES.find(lang => lang.code === currentLanguage)?.name || "Language"}</span>
                  <span className="sm:hidden">{currentLanguage.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto bg-background border border-border shadow-md">
                {USER_LANGUAGES.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium hidden md:block">{t('poweredByPassion')}</p>
            <button
              className="flex items-center gap-2 bg-[#FFDD00] text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow hover:brightness-110 transition duration-200 text-xs sm:text-sm"
              onClick={() => window.open('https://www.buymeacoffee.com/yourname', '_blank')}
              title={t('buyMeACoffeeTooltip')}
            >
              <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt={t('coffeeMugAlt')} className="h-4 w-4 sm:h-5 sm:w-5" />
              <span style={{ fontFamily: "'Pacifico', cursive", fontWeight: 400 }} className="hidden sm:inline">{t('buyMeACoffee')}</span>
            </button>
          </div>
        </nav>

        <motion.div
          className="container mx-auto px-4 sm:px-6 py-12 md:py-20 text-center"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6">
            {t('mainHeading1')} <span className="gradient-text">{t('mainHeading2')}</span> {t('mainHeading3')}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-md sm:max-w-2xl mx-auto">
            {t('subHeading')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl sm:max-w-3xl mx-auto">
            <div className="w-full sm:flex-1">
              <EmailDisplay email={currentEmail} />
            </div>
            <AnimatePresence>
            {showExtendButton && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-full sm:w-auto flex-shrink-0 mt-4 sm:mt-0"
              >
                <Button 
                  onClick={extendEmailSession} 
                  size="lg"
                  className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-opacity shadow-lg w-full sm:w-auto whitespace-nowrap"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  {t('extendSessionButton10MoreMinutes')}
                </Button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
          
          <div className="mt-6 text-lg">
            <span className="font-bold text-muted-foreground">{t('timeLeft')}:</span>
            <span className="ml-1 font-bold text-primary">{formatTime(timeLeft)}</span>
          </div>
          
          <AdPlaceholder />

          <div className="mt-12">
            <InboxManager currentEmail={currentEmail} />
          </div>
        </motion.div>
      </div>

      <section className="py-16 sm:py-24 container mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t('testimonialsHeading')}
          </h2>
          <p className="text-muted-foreground max-w-lg sm:max-w-2xl mx-auto text-base sm:text-lg">
            {t('testimonialsSubheading')}
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
                      imageRendering: 'crisp-edges',
                      WebkitImageSmoothing: 'antialiased',
                      MozImageSmoothing: 'antialiased'
                    }}
                  />
                  <AvatarFallback>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{t(testimonial.role.toLowerCase().replace(/\s+/g, ''))}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-semibold mb-4 text-base">{t('footerService')}</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerHowItWorks')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerFeatures')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerSecurity')}</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4 text-base">{t('footerLegal')}</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerPrivacy')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerTerms')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerCookiePolicy')}</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4 text-base">{t('footerSupport')}</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerHelpCenter')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerContact')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footerStatus')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-muted-foreground">
            <p className="text-sm">&copy; {new Date().getFullYear()} 10 Minute Mail. {t('footerRightsReserved')}</p>
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
