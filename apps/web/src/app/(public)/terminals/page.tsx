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
import { CardHoverGroup } from '@/components/ui/card-hover-effect';
import { GooeyInput } from '@/components/ui/gooey-input';

export default function TerminalsPage() {
  const [groups, setGroups] = useState<TerminalGroup[]>(STATIC_TERMINAL_GROUPS);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    terminalRepository.getGroupedByCity().then(setGroups);
  }, []);

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      terminals: group.terminals.filter(
        (t) =>
          !filter ||
          t.name.toLowerCase().includes(filter.toLowerCase()) ||
          t.city.toLowerCase().includes(filter.toLowerCase()) ||
          t.address.toLowerCase().includes(filter.toLowerCase())
      ),
    }))
    .filter((g) => g.terminals.length > 0);

  return (
    <PageShell
      width='compact'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terminals' }]}
      title="Ascent Transport Terminals"
      description="Six physical hub terminals across Nigeria. Every terminal features passenger waiting lounges, parcel receiving counters, and verified dispatch supervisors."
    >
      <div className="space-y-8">
        {/* Dynamic Terminal Filter with GooeyInput */}
        <div className="flex justify-end">
          <GooeyInput
            placeholder="Search hub or address..."
            value={filter}
            onValueChange={setFilter}
            collapsedWidth={120}
            expandedWidth={240}
            expandedOffset={48}
          />
        </div>

        {/* City-grouped Terminal Listings */}
        {filteredGroups.map((group) => (
          <section key={group.city} className="scroll-mt-28 space-y-4">
            <div className="border-b border-border pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight text-balance">
                {group.city} Terminals
              </h2>
              <p className="text-xs text-muted-foreground">{group.state}</p>
            </div>

            <CardHoverGroup
              layoutId={`terminals-${group.city}`}
              className="grid grid-cols-1 @md/page:grid-cols-2 @xl/page:grid-cols-3 gap-4 sm:gap-6"
            >
              {group.terminals.map((terminal) => (
                <TerminalCard key={terminal.id} terminal={terminal} />
              ))}
            </CardHoverGroup>
          </section>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No terminals found matching &quot;{filter}&quot;.
          </div>
        )}

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
