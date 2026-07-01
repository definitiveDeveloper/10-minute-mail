import React from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Trash2 } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Zap,
    title: "Get Your Address",
    description:
      "A unique, real mailbox appears the moment you open this page. No sign-up. No form. Nothing.",
  },
  {
    number: 2,
    icon: Mail,
    title: "Use It Anywhere",
    description:
      "Paste it into any sign-up form, download gate, or verification field. Real emails arrive in seconds.",
  },
  {
    number: 3,
    icon: Trash2,
    title: "Watch It Vanish",
    description:
      "After 10 minutes, the address and every message are permanently deleted. No trace. No spam.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-label="How 10 Minute Mail works"
      className="py-20 sm:py-28 container mx-auto px-4 sm:px-6"
    >
      <motion.div
        className="text-center mb-14 sm:mb-18"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          Three Steps to a{" "}
          <span className="gradient-text">Spam-Free Life</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
          No account, no password, no consequences.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="flex flex-col items-center text-center"
            >
              {/* Numbered badge with icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Icon className="w-9 h-9 text-white" />
                </div>
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
