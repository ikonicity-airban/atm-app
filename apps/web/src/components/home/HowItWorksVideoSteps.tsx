'use client';

import React, { useRef, useState } from 'react';
import { Search, Armchair, QrCode } from 'lucide-react';
import { useScroll, useMotionValueEvent, motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { QrCodeView } from '@/components/ui/QrCodeView';

function SearchVisual() {
  return (
    <div className="w-full max-w-[320px] bg-slate-950/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-white/20 text-white shadow-2xl space-y-3.5">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-pink-300">Enugu (Ogui)</span>
        <span className="text-white/40">→</span>
        <span className="text-white">Abuja (Utako)</span>
      </div>
      <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
        <div className="h-full w-4/5 bg-gradient-to-r from-[#ca2484] to-[#8b2ccb] rounded-full transition-all duration-700" />
      </div>
      <div className="flex items-center justify-between text-xs text-white/85">
        <span className="font-mono">06:30 AM Departure</span>
        <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
          3 Seats Left
        </span>
      </div>
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
        <span>Guaranteed AC Sienna</span>
        <span className="text-white font-medium">WAT 06:30</span>
      </div>
    </div>
  );
}

function SeatVisual() {
  const [selectedSeat, setSelectedSeat] = useState<number>(2);

  return (
    <div className="w-full max-w-[320px] bg-slate-950/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-white/20 text-white shadow-2xl text-center space-y-3.5">
      <div className="flex items-center justify-between text-xs font-semibold text-white/85 pb-1 border-b border-white/10">
        <span>5 Seat Toyota Sienna</span>
        <span className="text-pink-300 font-mono text-[11px]">Hold: 15m</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-w-[200px] mx-auto text-xs font-bold pt-1">
        <div className="p-2.5 rounded-lg bg-slate-800/80 text-white/40 border border-white/10 flex items-center justify-center text-[10px]">
          Driver
        </div>
        <div className="p-2.5" />
        <button
          type="button"
          onClick={() => setSelectedSeat(1)}
          className={`p-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
            selectedSeat === 1
              ? 'bg-[#ca2484] border-pink-400 text-white shadow-lg shadow-pink-500/30 scale-105'
              : 'bg-white/15 border-white/20 hover:bg-white/25 text-white/90'
          }`}
        >
          1 (Front)
        </button>
        <button
          type="button"
          onClick={() => setSelectedSeat(2)}
          className={`p-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
            selectedSeat === 2
              ? 'bg-[#ca2484] border-pink-400 text-white shadow-lg shadow-pink-500/30 scale-105'
              : 'bg-white/15 border-white/20 hover:bg-white/25 text-white/90'
          }`}
        >
          2A (Win)
        </button>
        <div className="p-2.5" />
        <button
          type="button"
          onClick={() => setSelectedSeat(3)}
          className={`p-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
            selectedSeat === 3
              ? 'bg-[#ca2484] border-pink-400 text-white shadow-lg shadow-pink-500/30 scale-105'
              : 'bg-white/15 border-white/20 hover:bg-white/25 text-white/90'
          }`}
        >
          2B (Win)
        </button>
      </div>
      <div className="text-xs text-pink-300 font-bold bg-pink-500/10 py-1.5 px-3 rounded-xl border border-pink-500/20">
        Seat {selectedSeat} Selected (15 minute hold active)
      </div>
    </div>
  );
}

function PassVisual() {
  return (
    <div className="w-full max-w-[300px] bg-white rounded-2xl p-5 text-slate-900 shadow-2xl border border-pink-200 text-center space-y-3">
      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-2">
        <span className="text-[#ca2484] tracking-wide font-mono">ATM DIGITAL PASS</span>
        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
          VERIFIED
        </span>
      </div>
      <div className="w-28 h-28 mx-auto flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-200">
        <QrCodeView value="https://atmnigeria.com/pass/ATM-ENU-ABJ-9812" size={100} />
      </div>
      <div className="text-xs font-mono text-slate-700 font-bold tracking-wider">
        ATM-ENU-ABJ-9812
      </div>
      <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
        <span>SMS Delivered</span>
        <span>Instant Gate Scan</span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    number: '01',
    title: 'Search & Pick Corridor',
    subtitle: 'Real time schedule lookup',
    description:
      'Select your origin terminal, destination hub, and travel date. View live departure times and remaining seats with guaranteed departure hours.',
    icon: Search,
    content: <SearchVisual />,
  },
  {
    number: '02',
    title: 'Choose Exact Seat',
    subtitle: '15 minute seat hold',
    description:
      'Pick your preferred seat directly on the 5 passenger Toyota Sienna map. Once selected, your seat is held exclusively for 15 minutes while you complete checkout.',
    icon: Armchair,
    content: <SeatVisual />,
  },
  {
    number: '03',
    title: 'Instant Digital QR Pass',
    subtitle: 'Zero paper check in',
    description:
      'Pay securely using your Nigerian bank card, transfer, or USSD via Paystack. Receive an SMS confirmation and a paperless QR boarding pass.',
    icon: QrCode,
    content: <PassVisual />,
  },
];

const GRADIENTS = [
  'linear-gradient(135deg, rgba(202,36,132,0.92), rgba(139,44,203,0.92))',
  'linear-gradient(135deg, rgba(139,44,203,0.92), rgba(59,130,246,0.92))',
  'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(202,36,132,0.92))',
];

export function HowItWorksVideoSteps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Track scroll progress across the full height of this section container on the page
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const stepCount = STEPS.length;
    // Map progress 0..1 cleanly across the 3 steps so each step has dedicated scroll travel
    const stepIndex = Math.min(
      stepCount - 1,
      Math.max(0, Math.floor(latest * stepCount))
    );
    setActiveStep(stepIndex);
  });

  const scrollToStep = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const sectionTop = rect.top + scrollTop;
    const sectionHeight = containerRef.current.clientHeight;
    const targetY = sectionTop + (index / STEPS.length) * sectionHeight;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Section Header resting cleanly on section background */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Simple Reservation Flow
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-foreground tracking-tight text-balance">
          How Ascent Booking Works
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty font-normal">
          Book your seat in three straightforward steps. Scroll through each stage to preview the traveler experience.
        </p>
      </div>

      {/* Ample vertical scroll travel so the sticky reveal completes completely before scrolling away */}
      <div ref={containerRef} className="relative min-h-[220vh] sm:min-h-[240vh] w-full">
        {/* Sticky wrapper pinned to top while page scrolls through the section */}
        <div className="sticky top-24 sm:top-28 w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-16 py-6 sm:py-8">
          {/* Left: Step items and progress rail (no card background) */}
          <div className="flex-1 max-w-xl w-full space-y-6 sm:space-y-8">
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.number}
                  onClick={() => scrollToStep(index)}
                  className={`group relative pl-6 border-l-2 cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'border-[#ca2484] opacity-100'
                      : 'border-border/60 dark:border-white/10 opacity-40 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-[#ca2484] text-white shadow-md shadow-pink-500/25'
                          : 'bg-muted text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <StepIcon className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider font-mono ${
                        isActive ? 'text-[#ca2484]' : 'text-muted-foreground'
                      }`}
                    >
                      Step {step.number}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                      • {step.subtitle}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg">
                    {step.description}
                  </p>

                  {/* Inline visual preview for small mobile viewports */}
                  <div className="block lg:hidden mt-4 overflow-hidden rounded-2xl shadow-xl border border-white/20 p-4" style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
                    {step.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Sticky visual preview card (swaps content smoothly as you scroll) */}
          <div className="hidden lg:flex w-full lg:w-auto justify-center items-center">
            <motion.div
              style={{
                background: GRADIENTS[activeStep % GRADIENTS.length],
              }}
              animate={{
                scale: shouldReduceMotion ? 1 : 1,
              }}
              transition={{ duration: 0.4 }}
              className="relative w-80 sm:w-96 h-80 sm:h-96 rounded-3xl p-6 shadow-2xl border border-white/20 flex items-center justify-center transition-all duration-500 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {STEPS[activeStep]?.content}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
