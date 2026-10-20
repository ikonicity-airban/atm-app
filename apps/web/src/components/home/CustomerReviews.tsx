'use client';

import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';

interface Review {
  name: string;
  role: string;
  route: string;
  review: string;
  rating: number;
  avatarColor: string;
  initials: string;
}

const REVIEWS: Review[] = [
  {
    name: 'Engr. Emeka Nwosu',
    role: 'Frequent Business Commuter',
    route: 'Enugu (Ogui) ↔ Abuja (Utako)',
    review:
      'Ascent completely transformed intercity transit for me. No roadside haggling or shouting at noisy parks. I booked online, arrived at Ogui terminal, boarded the 5 seat Sienna, and we departed exactly on schedule. The air conditioning and extra legroom made the long interstate drive feel effortless.',
    rating: 5,
    avatarColor: 'from-[#ca2484] to-[#8b2ccb]',
    initials: 'EN',
  },
  {
    name: 'Dr. Funke Adeleke',
    role: 'Healthcare Consultant',
    route: 'Lagos (Jibowu) ↔ Enugu (Ogui)',
    review:
      'Booking my exact seat on the vehicle map and checking out with Paystack was seamless. Having only five passengers inside the vehicle meant zero overcrowding, respectful co-travelers, and plenty of clean boot space for my luggage. I felt safe throughout the entire corridor.',
    rating: 5,
    avatarColor: 'from-[#8b2ccb] to-[#4a0e68]',
    initials: 'FA',
  },
  {
    name: 'Mr. Obinna Eze',
    role: 'Logistics Director',
    route: 'Abuja (Utako) ↔ Owerri (Control Post)',
    review:
      'Both for personal travel and for commercial waybills, Ascent is completely dependable. The 15 minute seat hold gave me time to confirm my schedule, and their terminal parcel tracking with SMS notification gave my clients complete confidence.',
    rating: 5,
    avatarColor: 'from-emerald-600 to-teal-700',
    initials: 'OE',
  },
];

export function CustomerReviews() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Verified Passenger Testimonials
        </span>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight text-balance">
          Loved by Over 5,000 Travelers
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty font-normal">
          Real feedback from Nigerian executives, medical professionals, and business commuters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {REVIEWS.map((rev) => (
          <div
            key={rev.name}
            className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-card/75 backdrop-blur-xl text-card-foreground border border-border shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 relative group"
          >
            <div>
              {/* Rating Stars & Route Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Icon
                      key={i}
                      icon={Star}
                      size="sm"
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-normal px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[150px]">
                  {rev.route}
                </span>
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                "{rev.review}"
              </p>
            </div>

            {/* Commuter Avatar and Name */}
            <div className="pt-6 mt-6 border-t border-border flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${rev.avatarColor} text-white font-medium text-xs flex items-center justify-center flex-shrink-0 shadow-md`}
              >
                {rev.initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs sm:text-sm font-semibold font-heading text-foreground flex items-center gap-1.5">
                  <span className="truncate">{rev.name}</span>
                  <Icon icon={ShieldCheck} size="xs" className="text-emerald-500 flex-shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {rev.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
