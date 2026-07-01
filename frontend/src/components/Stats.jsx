import React, { useState, useEffect, useRef } from "react";

const stats = [
  { value: "12M+", label: "Emails Generated", numericEnd: 12, suffix: "M+" },
  { value: "0 sec", label: "Time to Get Started", numericEnd: 0, suffix: " sec" },
  { value: "100%", label: "Anonymous & Free", numericEnd: 100, suffix: "%" },
  { value: "45+", label: "Countries Served", numericEnd: 45, suffix: "+" },
  { value: "<5s", label: "Email Delivery Time", prefix: "<", numericEnd: 5, suffix: "s" },
];

function AnimatedCounter({ numericEnd, prefix = "", suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || numericEnd === 0) {
      setCount(numericEnd);
      return;
    }
    const steps = 60;
    const increment = numericEnd / steps;
    const intervalMs = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericEnd) {
        setCount(numericEnd);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [started, numericEnd, duration]);

  return (
    <span ref={ref} className="stat-enter">
      {prefix}{count}{suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section
      aria-label="Service statistics"
      className="w-full py-14 sm:py-20 bg-primary/10 dark:bg-primary/20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <p className="text-3xl sm:text-4xl font-bold text-primary leading-none mb-2">
                <AnimatedCounter
                  numericEnd={stat.numericEnd}
                  prefix={stat.prefix || ""}
                  suffix={stat.suffix}
                />
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
