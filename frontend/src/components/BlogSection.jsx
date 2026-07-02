import React, { useState } from "react";
import { useI18n } from "@/context/I18nContext";

const articles = [
  {
    id: 1,
    slug: "what-is-disposable-email-address-2025-guide",
    category: "Privacy Guide",
    readTime: "7 min read",
    date: "2025-01-15",
    title: "What Is a Disposable Email Address? The Complete 2025 Guide",
    excerpt: "Billions of email addresses are exposed in data breaches every year. A disposable email address is the simplest, most effective way to keep your real inbox out of the crossfire.",
    fullContent: `<h3>The Data Breach Epidemic</h3><p>In 2024 alone, more than 8 billion email addresses were exposed in publicly reported data breaches. A disposable email address short-circuits this entire chain before it begins.</p><h3>What Is a Disposable Email Address?</h3><p>A disposable email address is a real, functional email inbox that is intentionally short-lived. It receives actual emails but expires after a set period, taking all messages with it.</p><h3>How 10 Minute Mail Works</h3><ol><li><strong>Open the page.</strong> A unique email address is instantly generated.</li><li><strong>Copy and paste.</strong> Use the address anywhere a sign-up form asks for email.</li><li><strong>Watch for mail.</strong> Your inbox refreshes automatically.</li><li><strong>Let it expire.</strong> After 10 minutes, the address and every message are permanently destroyed.</li></ol>`,
  },
  {
    id: 2,
    slug: "10-reasons-stop-using-real-email-signups",
    category: "Anti-Spam",
    readTime: "5 min read",
    date: "2025-02-03",
    title: "10 Reasons to Stop Using Your Real Email for Sign-Ups",
    excerpt: "You've given your primary email to hundreds of websites. Most of them are monetizing it right now. Here's why — and what to do about it.",
    fullContent: `<p>The average person receives 121 emails per day. 49% are spam. Here are ten reasons to stop giving your real email to every website that asks.</p><h3>1. Your Email Is Being Sold</h3><p>More than 80% of companies share customer data with third-party partners — data brokers who sell your contact details to anyone willing to pay.</p><h3>2. Breaches Are Inevitable</h3><p>The average user appears in 5+ breaches. Once your email is in a breach dump, it circulates on the dark web for years.</p><h3>3. Phishing Attacks Start With Your Email</h3><p>Targeted phishing requires knowing your email and at least one service you use. A temporary address means attackers can't correlate your accounts.</p><h3>The Simple Fix</h3><p>Use 10 Minute Mail for anything that isn't your bank or a service you genuinely need long-term.</p>`,
  },
  {
    id: 3,
    slug: "how-to-stop-email-spam-definitive-2025-playbook",
    category: "Security",
    readTime: "6 min read",
    date: "2025-03-10",
    title: "How to Stop Email Spam: The Definitive 2025 Playbook",
    excerpt: "Email spam costs the global economy $20 billion per year. Here's every tool in the arsenal — and why a temporary address is the most powerful one.",
    fullContent: `<p>Despite decades of filtering improvements, the average inbox still receives dozens of unwanted messages daily. Here is the complete 2025 toolkit.</p><h3>Method 1: The Unsubscribe Button</h3><p>Works reliably only for legitimate senders under CAN-SPAM, CASL, or GDPR. For everything else, clicking unsubscribe merely confirms your address is active.</p><h3>Method 2: Temporary Email (The Nuclear Option)</h3><p>For anything that doesn't need a long-term connection — sign-ups, downloads, trials — a disposable address is the most decisive solution. The address simply ceases to exist after your session.</p>`,
  },
  {
    id: 4,
    slug: "what-your-inbox-reveals-about-you-how-to-stop-it",
    category: "Email Privacy",
    readTime: "8 min read",
    date: "2025-04-22",
    title: "What Your Inbox Reveals About You — And How to Stop It",
    excerpt: "Tracking pixels, metadata harvesting, and data broker networks mean your inbox is leaking information constantly.",
    fullContent: `<h3>The Invisible Surveillance Inside Your Inbox</h3><p>When you open an email, you might be triggering a 1x1 pixel image load that tells the sender exactly when you opened it, what device you used, and your approximate location.</p><h3>How Tracking Pixels Work</h3><p>A tracking pixel is an invisible image embedded in an email's HTML. When your email client loads the image, it sends an HTTP request logged with your IP address, timestamp, and device information.</p><h3>The Bottom Line</h3><p>Your inbox is a surveillance surface. The most effective countermeasure is limiting which services ever have your real address to begin with.</p>`,
  },
  {
    id: 5,
    slug: "10-minute-mail-for-developers-test-email-flows",
    category: "Developer Guide",
    readTime: "4 min read",
    date: "2025-05-18",
    title: "10-Minute Mail for Developers: Test Email Flows Without the Hassle",
    excerpt: "Tired of creating test Gmail accounts for every registration flow? Here's how developers use disposable email to accelerate QA.",
    fullContent: `<h3>The Test Account Problem</h3><p>Every developer who has built a registration flow knows the pain: you need a fresh email address for every test run. Creating and managing test Gmail accounts is tedious and doesn't scale.</p><h3>Why 10 Minute Mail Is the Developer's Shortcut</h3><p>Open a new tab, copy the address, use it in your test flow. The email arrives in real time, showing exactly what a real user sees. Close the tab when done; the address evaporates.</p><h3>Testing Deliverability</h3><p>Since 10 Minute Mail uses real SMTP infrastructure, a successful delivery tells you your SPF, DKIM, and DMARC records are configured correctly.</p>`,
  },
];

function ArticleCard({ article, isFeatured, t }) {
  const [expanded, setExpanded] = useState(false);

  const cardClass = isFeatured
    ? "border border-border border-l-4 border-l-primary rounded-xl p-6 sm:p-8 bg-card shadow-md"
    : "border border-border rounded-xl p-5 bg-card hover:shadow-md hover:border-primary/40 transition-all duration-300";

  return (
    <article className={cardClass} aria-label={article.title}>
      <header>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{article.category}</span>
          <span className="text-xs text-muted-foreground">{article.readTime}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <time dateTime={article.date} className="text-xs text-muted-foreground">
            {new Date(article.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        </div>
        <h3 className={`font-bold mb-2 leading-snug ${isFeatured ? "text-xl sm:text-2xl" : "text-lg"}`}>{article.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{article.excerpt}</p>
      </header>

      <button onClick={() => setExpanded(p => !p)} className="mt-4 text-sm font-semibold text-primary hover:underline focus:outline-none" aria-expanded={expanded}>
        {expanded ? t("blogCollapse") : t("blogReadArticle")}
      </button>

      <div className={`article-content ${expanded ? "expanded" : ""}`} aria-hidden={!expanded}>
        <div className="blog-prose mt-6 pt-6 border-t border-border" dangerouslySetInnerHTML={{ __html: article.fullContent }} />
        <button onClick={() => setExpanded(false)} className="mt-4 text-sm font-semibold text-primary hover:underline focus:outline-none">
          {t("blogCollapse")}
        </button>
      </div>
    </article>
  );
}

export default function BlogSection() {
  const { t } = useI18n();
  const [featured, ...rest] = articles;

  return (
    <section id="blog" aria-label="Privacy Guides and Resources" className="py-20 sm:py-28 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t("blogHeadingPart1")} <span className="gradient-text">{t("blogHeadingGradient")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">{t("blogSubheading")}</p>
        </div>
        <div className="mb-8">
          <ArticleCard article={featured} isFeatured={true} t={t} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rest.map(article => <ArticleCard key={article.id} article={article} isFeatured={false} t={t} />)}
        </div>
      </div>
    </section>
  );
}
