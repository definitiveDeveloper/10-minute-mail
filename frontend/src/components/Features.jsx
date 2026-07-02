import React from "react";
import { motion } from "framer-motion";
import { Shield, Inbox, Lock, Timer, Globe, Repeat } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

const icons = [Shield, Inbox, Lock, Timer, Globe, Repeat];
const keys = ["feature1","feature2","feature3","feature4","feature5","feature6"];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  const { t } = useI18n();

  const features = keys.map((k, i) => ({
    icon: icons[i],
    title: t(`${k}Title`),
    description: t(`${k}Description`),
  }));

  return (
    <section id="features" aria-label="Service features" className="py-20 sm:py-28 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t("featuresHeadingPart1")}{" "}
            <span className="gradient-text">{t("featuresHeadingGradient")}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">{t("featuresSubheading")}</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={cardVariants} className="bg-white dark:bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
