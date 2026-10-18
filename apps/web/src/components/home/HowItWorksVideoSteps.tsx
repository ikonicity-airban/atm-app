'use client';

import React, { useRef, useState } from 'react';
import { Search, Armchair, QrCode, Play, Pause, CheckCircle2 } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  videoSrc?: string;
  simulatedType: 'search' | 'seat' | 'ticket';
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Search & Pick Corridor',
    subtitle: 'Real time schedule lookup',
    description:
      'Select your origin terminal, destination hub, and date. View departure times and remaining seats in real time with guaranteed departure hours.',
    icon: Search,
    videoSrc: '/videos/step-1-search.mp4',
    simulatedType: 'search',
  },
  {
    number: '02',
    title: 'Choose Exact Seat',
    subtitle: '15 minute seat hold',
    description:
      'Pick your preferred seat directly on the 5 passenger Toyota Sienna map. Once selected, your seat is held exclusively for 15 minutes while you check out.',
    icon: Armchair,
    videoSrc: '/videos/step-2-seat.mp4',
    simulatedType: 'seat',
  },
  {
    number: '03',
    title: 'Instant Digital QR Pass',
    subtitle: 'Zero paper check in',
    description:
      'Pay securely using your Nigerian bank card, transfer, or USSD via Paystack. Receive an SMS ticket confirmation and paperless QR boarding pass.',
    icon: QrCode,
    videoSrc: '/videos/step-3-ticket.mp4',
    simulatedType: 'ticket',
  },
];

function StepCard({ step }: { step: Step }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [activeSimulatedSeat, setActiveSimulatedSeat] = useState<number>(2);

  const handleMouseEnter = () => {
    if (videoRef.current && !hasVideoError) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Auto-play was prevented or video source not yet available, fallback to simulation
          setHasVideoError(true);
          setIsPlaying(true);
        });
    } else {
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && !hasVideoError) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const Icon = step.icon;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#ca2484]/40 transition-all duration-300 overflow-hidden"
    >
      {/* Interactive Media Container with Hover-to-Play Video & Fallback Simulator */}
      <div className="relative h-56 sm:h-64 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Real Video Element */}
        {!hasVideoError && step.videoSrc && (
          <video
            ref={videoRef}
            src={step.videoSrc}
            playsInline
            muted
            loop
            preload="metadata"
            onError={() => setHasVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity"
          />
        )}

        {/* Dynamic Simulated Preview Overlay (Active if video error or hovering) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-[#ca2484]" />
                  <span>Preview active</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-pink-300 fill-pink-300" />
                  <span>Hover to preview</span>
                </>
              )}
            </span>
            <span className="text-2xl font-black text-white/30 font-mono">
              {step.number}
            </span>
          </div>

          {/* Step Specific Interactive Visual Simulation */}
          <div className="w-full flex items-center justify-center my-auto pointer-events-auto">
            {step.simulatedType === 'search' && (
              <div className="w-full max-w-[240px] bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-white space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-pink-300">Enugu (Ogui)</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white">Abuja (Utako)</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-[#ca2484] to-[#8b2ccb] transition-all duration-700 ${
                      isPlaying ? 'w-full' : 'w-2/5'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/70">
                  <span>06:30 AM Departure</span>
                  <span className="text-emerald-400 font-bold">3 Seats Left</span>
                </div>
              </div>
            )}

            {step.simulatedType === 'seat' && (
              <div className="w-full max-w-[220px] bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-white text-center">
                <div className="text-[10px] font-semibold text-white/70 mb-2">
                  5 Seat Toyota Sienna Cabin
                </div>
                <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto text-[10px] font-bold">
                  <div className="p-1 rounded bg-slate-800 text-white/40 border border-white/10">Driver</div>
                  <div className="p-1"></div>
                  <div
                    onClick={() => setActiveSimulatedSeat(1)}
                    className={`p-1 rounded border cursor-pointer transition-colors ${
                      activeSimulatedSeat === 1
                        ? 'bg-[#ca2484] border-pink-400 text-white'
                        : 'bg-white/20 border-white/20'
                    }`}
                  >
                    1 (Front)
                  </div>
                  <div
                    onClick={() => setActiveSimulatedSeat(2)}
                    className={`p-1 rounded border cursor-pointer transition-colors ${
                      activeSimulatedSeat === 2
                        ? 'bg-[#ca2484] border-pink-400 text-white'
                        : 'bg-white/20 border-white/20'
                    }`}
                  >
                    2A (Win)
                  </div>
                  <div className="p-1"></div>
                  <div
                    onClick={() => setActiveSimulatedSeat(3)}
                    className={`p-1 rounded border cursor-pointer transition-colors ${
                      activeSimulatedSeat === 3
                        ? 'bg-[#ca2484] border-pink-400 text-white'
                        : 'bg-white/20 border-white/20'
                    }`}
                  >
                    2B (Win)
                  </div>
                </div>
                <div className="text-[10px] text-pink-300 font-bold mt-2">
                  Seat {activeSimulatedSeat} Selected (15m hold)
                </div>
              </div>
            )}

            {step.simulatedType === 'ticket' && (
              <div className="w-full max-w-[210px] bg-white rounded-xl p-3 text-slate-900 shadow-xl border border-pink-200 text-center space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-[#ca2484]">ATM DIGITAL PASS</span>
                  <span className="text-emerald-600 font-semibold">VERIFIED</span>
                </div>
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-lg p-1 border border-slate-200 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-bold">
                  ATM-ENU-ABV-9812
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{step.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Step Description Content */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-3 bg-card text-card-foreground">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-accent text-[#ca2484] flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#ca2484] tracking-wide uppercase">
              Step {step.number}
            </span>
          </div>
          <h3 className="text-lg font-bold font-heading text-foreground">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
            {step.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksVideoSteps() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#ca2484] bg-accent px-3.5 py-1 rounded-full inline-block">
          Simple Reservation Flow
        </span>
        <h2 className="text-2xl sm:text-4xl font-black font-heading text-foreground tracking-tight text-balance">
          How Ascent Booking Works
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
          Book your seat in three straightforward steps. Hover on each card to preview the traveler experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {STEPS.map((step) => (
          <StepCard key={step.number} step={step} />
        ))}
      </div>
    </section>
  );
}
