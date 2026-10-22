"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll, useReducedMotion } from "motion/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface StickyScrollContentItem {
  title: string;
  description: string;
  content?: React.ReactNode;
  number?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const StickyScroll = ({
  content,
  contentClassName,
  className,
  backgroundColors: customBackgroundColors,
  linearGradients: customLinearGradients,
}: {
  content: StickyScrollContentItem[];
  contentClassName?: string;
  className?: string;
  backgroundColors?: string[];
  linearGradients?: string[];
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const currentBest = cardsBreakpoints[acc] ?? 0;
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - currentBest)) {
          return index;
        }
        return acc;
      },
      0,
    );
    setActiveCard(closestBreakpointIndex);
  });

  const defaultBackgroundColors = [
    "#0f172a", // slate-900
    "#090514", // dark ascent violet
    "#171717", // neutral-900
  ];
  const defaultLinearGradients = [
    "linear-gradient(to bottom right, #06b6d4, #10b981)", // cyan-500 to emerald-500
    "linear-gradient(to bottom right, #ca2484, #8b2ccb)", // ascent pink to purple
    "linear-gradient(to bottom right, #f97316, #eab308)", // orange-500 to yellow-500
  ];

  const backgroundColors = customBackgroundColors ?? defaultBackgroundColors;
  const linearGradients = customLinearGradients ?? defaultLinearGradients;

  const [backgroundGradient, setBackgroundGradient] = useState(
    linearGradients[0],
  );

  useEffect(() => {
    setBackgroundGradient(linearGradients[activeCard % linearGradients.length]);
  }, [activeCard, linearGradients]);

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
      className={cn(
        "relative flex h-[34rem] sm:h-[38rem] justify-center space-x-6 lg:space-x-12 overflow-y-auto rounded-3xl p-6 sm:p-10 border border-border/40 shadow-2xl scrollbar-thin scrollbar-thumb-white/10 motion-reduce:transition-none",
        className,
      )}
      ref={ref}
    >
      <div className="relative flex items-start px-2 sm:px-4 flex-1 max-w-xl">
        <div className="w-full">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-16 sm:my-20 first:mt-6 last:mb-24">
              {item.number && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-[#ca2484] tracking-wider uppercase font-mono px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                    Step {item.number}
                  </span>
                  {item.subtitle && (
                    <span className="text-xs text-white/70 font-medium">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              )}
              <motion.h2
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: shouldReduceMotion ? 1 : activeCard === index ? 1 : 0.35,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
                className="text-2xl sm:text-3xl font-bold font-heading text-slate-100 tracking-tight"
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: shouldReduceMotion ? 1 : activeCard === index ? 1 : 0.35,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
                className="mt-4 sm:mt-6 max-w-md text-sm sm:text-base leading-relaxed text-slate-300 font-normal"
              >
                {item.description}
              </motion.p>

              {/* Mobile and tablet inline visual preview */}
              <div
                style={{ background: linearGradients[index % linearGradients.length] }}
                className="block lg:hidden mt-6 overflow-hidden rounded-2xl p-4 shadow-xl border border-white/20"
              >
                {item.content ?? null}
              </div>
            </div>
          ))}
          <div className="h-32" />
        </div>
      </div>
      <div
        style={{ background: backgroundGradient }}
        className={cn(
          "sticky top-8 hidden h-80 w-80 xl:w-96 overflow-hidden rounded-2xl bg-white lg:flex items-center justify-center p-4 shadow-2xl border border-white/20 transition-all duration-500",
          contentClassName,
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          {content[activeCard]?.content ?? null}
        </div>
      </div>
    </motion.div>
  );
};
