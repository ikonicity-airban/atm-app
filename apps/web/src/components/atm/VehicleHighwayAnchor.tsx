import React from 'react';
import { ShieldCheck, Snowflake, Gauge, Users } from 'lucide-react';
import { SiennaModelViewer } from './SiennaModelViewer.tsx';



export function VehicleHighwayAnchor() {
  return (
    <div className="relative w-full pt-1 sm:pt-2 pb-0 overflow-hidden select-none">
      {/* Toyota Sienna Side Profile Vector / 3D Canvas Visual */}
      <div className="relative max-w-5xl mx-auto px-4 flex flex-col items-center">
        {/* Fleet highlight feature tags */}
        <div className="hidden sm:flex sm:flex-wrap max-sm:overflow-x-scroll items-center justify-center gap-1.5 sm:gap-3 mb-1 text-[11px] sm:text-xs font-semibold text-slate-100">
          <div className="flex min-w-fit items-center gap-1.5 bg-[#ca248410] backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/20 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-[#ca2484]" />
            <span>Strictly 5 Passenger Seats</span>
          </div>
          <div className="flex min-w-fit items-center gap-1.5 bg-sky-600/10 backdrop-blur-xs px-3 py-1 rounded-full border border-sky-600/30 shadow-2xs">
            <Snowflake className="w-3.5 h-3.5 text-sky-600" />
            <span>Dual Climate A/C</span>
          </div>
          <div className="flex min-w-fit items-center gap-1.5 bg-emerald-600/30 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/20 shadow-2xs">
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            <span>Speed-Governed (100 km/h)</span>
          </div>
          <div className="flex min-w-fit items-center gap-1.5 bg-[#ca248410] backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/10 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ca2484]" />
            <span>GPS Tracking &amp; Speed Telemetry</span>
          </div>
        </div>

        {/* 3D Interactive Model Canvas with Parallax Anchor and 2D SVG Fallback */}
        <div className="parallax-vehicle w-full relative z-10">
          <SiennaModelViewer
            modelUrl="/models/2022_toyota_sienna_xse.glb"
            fallback={null}
          />
        </div>
      </div>
    </div>
  );
}
