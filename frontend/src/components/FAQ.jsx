import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is 10 Minute Mail?",
    answer:
      "10 Minute Mail is a free disposable email service that generates a real, working email address instantly — no registration required. The address is active for 10 minutes, after which it and all received messages are permanently deleted.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. There is no sign-up, no password, and no personal data required. Your temporary address is generated automatically when you open the page.",
  },
  {
    question: "How long does the email address last?",
    answer:
      "Your address is active for 10 minutes from the moment it's generated. With one click you can extend it by another 10 minutes, as many times as you need.",
  },
  {
    question: "Is my inbox private? Can others see my emails?",
    answer:
      "Yes, completely. Your inbox is bound to your IP address for the full session — nobody else can view, access, or intercept your messages during that time.",
  },
  {
    question: "What can I use a temporary email for?",
    answer:
      "Sign-up forms, free trial activations, software downloads, ebook access, contest entries, coupon codes, forum registrations, app verification codes — anything that demands an email but doesn't need to reach you long-term.",
  },
  {
    question: "Can I receive attachments?",
    answer:
      "Yes. Attachments sent to your temporary address are delivered to your inbox and visible during your session. They are deleted permanently when the session ends.",
  },
  {
    question: "Is 10 Minute Mail free?",
    answer:
      "100%. No plans, no credits, no paywalls. The service is entirely free and will remain free.",
  },
  {
    question: "Is this service GDPR and CCPA compliant?",
    answer:
      "Yes. We collect no personally identifiable information. No cookies for tracking, no email data retained beyond the session lifetime. We are fully compliant with GDPR (EU), CCPA (California), and equivalent global frameworks.",
  },
  {
    question: "What happens when the timer runs out?",
    answer:
      "If you haven't extended your session, a new email address is automatically assigned. Any messages received by the old address are deleted. If you click '10 More Minutes' before time runs out, your current address continues for another 10 minutes.",
  },
  {
    question: "Which email domains are used?",
    answer:
      "We rotate across multiple domains sourced dynamically from our mail infrastructure. Domains are rotated periodically to minimize blocklisting by websites that block known disposable email domains.",
  },
];

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {/* Always in DOM for SEO — toggled via max-height */}
      <div
        className={`faq-answer ${isOpen ? "open" : ""}`}
        aria-hidden={!isOpen}
      >
        <p className="pb-5 text-muted-foreground text-sm sm:text-base leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className="py-20 sm:py-28 container mx-auto px-4 sm:px-6"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
          Everything you need to know about 10 Minute Mail.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => toggle(index)}
          />
        ))}
      </div>
    </section>
  );
}
