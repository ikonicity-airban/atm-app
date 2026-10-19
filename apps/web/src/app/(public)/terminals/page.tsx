'use client';

import React, { useState, useEffect } from 'react';
import {
  terminalRepository,
  STATIC_TERMINAL_GROUPS,
  type TerminalGroup,
} from '../../../server/repositories/terminals.ts';
import { TerminalCard, SectionBanner } from '../../../components/atm/AtmBlocks.tsx';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { BRAND } from '@atm/shared';

export default function TerminalsPage() {
  const [groups, setGroups] = useState<TerminalGroup[]>(STATIC_TERMINAL_GROUPS);

  useEffect(() => {
    terminalRepository.getGroupedByCity().then(setGroups);
  }, []);

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terminals' }]}
      title="Ascent Transport Terminals"
      description="Six physical hub terminals across Nigeria. Every terminal features passenger waiting lounges, parcel receiving counters, and verified dispatch supervisors."
    >
      <div className="space-y-12">
        {/* City-grouped Terminal Listings */}
        {groups.map((group) => (
          <section key={group.city} className="scroll-mt-28 space-y-4">
            <div className="border-b border-border pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight text-balance">
                {group.city} Terminals
              </h2>
              <p className="text-xs text-muted-foreground">{group.state}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.terminals.map((terminal) => (
                <TerminalCard key={terminal.id} terminal={terminal} />
              ))}
            </div>
          </section>
        ))}

        {/* Operational Notice Banner */}
        <SectionBanner title="Terminal Check-in Guidelines">
          <p>
            Passengers are advised to arrive at their designated departure terminal at least 30 minutes before the scheduled time. Luggage loading closes 10 minutes prior to departure. Courier parcel drop-offs are received daily between 6:00 AM and 6:00 PM.
          </p>
          <p className="mt-2 text-xs font-semibold text-primary-foreground/90">
            Head Office Helpline: {BRAND.contactPhones[0]} &bull; {BRAND.contactPhones[1]}
          </p>
        </SectionBanner>
      </div>
    </PageShell>
  );
}
