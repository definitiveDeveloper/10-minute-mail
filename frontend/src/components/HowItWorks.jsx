import React from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Trash2 } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

const icons = [Zap, Mail, Trash2];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function HowItWorks() {
  const { t } = useI18n();

  const steps = [
    { number: 1, icon: icons[0], title: t("step1Title"), description: t("step1Description") },
    { number: 2, icon: icons[1], title: t("step2Title"), description: t("step2Description") },
    { number: 3, icon: icons[2], title: t("step3Title"), description: t("step3Description") },
  ];

  return (
    <section id="how-it-works" aria-label="How 10 Minute Mail works" className="py-20 sm:py-28 container mx-auto px-4 sm:px-6">
      <motion.div className="text-center mb-14 sm:mb-18" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          {t("howItWorksHeadingPart1")}{" "}
          <span className="gradient-text">{t("howItWorksHeadingGradient")}</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">{t("howItWorksSubheading")}</p>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div key={step.number} variants={itemVariants} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Icon className="w-9 h-9 text-white" />
                </div>
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{step.description}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
