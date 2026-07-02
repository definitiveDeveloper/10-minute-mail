import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-5 text-left gap-4 group" aria-expanded={isOpen}>
        <span className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`faq-answer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
        <p className="pb-5 text-muted-foreground text-sm sm:text-base leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = Array.from({ length: 10 }, (_, i) => ({
    question: t(`faq${i + 1}Q`),
    answer: t(`faq${i + 1}A`),
  }));

  return (
    <section id="faq" aria-label="Frequently Asked Questions" className="py-20 sm:py-28 container mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          {t("faqHeadingPart1")}{" "}
          <span className="gradient-text">{t("faqHeadingGradient")}</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">{t("faqSubheading")}</p>
      </div>
      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} isOpen={openIndex === index} onToggle={() => setOpenIndex(prev => prev === index ? null : index)} />
        ))}
      </div>
    </section>
  );
}
