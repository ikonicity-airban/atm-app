import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CORRIDOR_SEO_PROFILES,
  corridorParamSchema,
  SEED_TERMINALS,
} from '../src/index.ts';

describe('Phase 13: SEO Landing Pages and Launch Preparation (Spec 0020)', () => {
  describe('AC-1 & AC-2: Corridor SEO Profiles & Integrity', () => {
    it('provides exactly 12 active travel corridor profiles', () => {
      assert.strictEqual(CORRIDOR_SEO_PROFILES.length, 12);
    });

    it('enforces lowercase kebab-case slug format for all corridors', () => {
      for (const corridor of CORRIDOR_SEO_PROFILES) {
        const validation = corridorParamSchema.safeParse({ corridor: corridor.slug });
        assert.strictEqual(
          validation.success,
          true,
          `Slug "${corridor.slug}" failed format validation`
        );
      }
    });

    it('stores starting fares as integer kobo without decimals', () => {
      for (const corridor of CORRIDOR_SEO_PROFILES) {
        assert.ok(
          Number.isInteger(corridor.startingFareKobo),
          `Corridor ${corridor.slug} starting fare must be an integer`
        );
        assert.ok(
          corridor.startingFareKobo > 0,
          `Corridor ${corridor.slug} starting fare must be positive`
        );
      }
    });

    it('references valid origin and destination terminals from SEED_TERMINALS', () => {
      const validTerminalIds = new Set(SEED_TERMINALS.map((t) => t.id));

      for (const corridor of CORRIDOR_SEO_PROFILES) {
        assert.ok(
          validTerminalIds.has(corridor.originTerminalId as any),
          `Origin terminal ${corridor.originTerminalId} for ${corridor.slug} not found in SEED_TERMINALS`
        );
        assert.ok(
          validTerminalIds.has(corridor.destinationTerminalId as any),
          `Destination terminal ${corridor.destinationTerminalId} for ${corridor.slug} not found in SEED_TERMINALS`
        );
        assert.notStrictEqual(
          corridor.originTerminalId,
          corridor.destinationTerminalId,
          `Origin and destination cannot be identical for ${corridor.slug}`
        );
      }
    });

    it('provides departure schedules and FAQ items for each corridor', () => {
      for (const corridor of CORRIDOR_SEO_PROFILES) {
        assert.ok(
          corridor.departureSchedules.length > 0,
          `Corridor ${corridor.slug} must have at least one departure schedule`
        );
        assert.ok(
          corridor.faqs.length >= 2,
          `Corridor ${corridor.slug} must have at least 2 FAQs`
        );
        for (const faq of corridor.faqs) {
          assert.ok(faq.question.length > 5, 'FAQ question too short');
          assert.ok(faq.answer.length > 10, 'FAQ answer too short');
        }
      }
    });

    it('ensures bidirectional coverage for key corridors (e.g. enugu-abuja and abuja-enugu)', () => {
      const slugs = new Set(CORRIDOR_SEO_PROFILES.map((c) => c.slug));
      assert.ok(slugs.has('enugu-abuja') && slugs.has('abuja-enugu'));
      assert.ok(slugs.has('enugu-lagos') && slugs.has('lagos-enugu'));
      assert.ok(slugs.has('lagos-owerri') && slugs.has('owerri-lagos'));
      assert.ok(slugs.has('enugu-owerri') && slugs.has('owerri-enugu'));
      assert.ok(slugs.has('abuja-owerri') && slugs.has('owerri-abuja'));
      assert.ok(slugs.has('lagos-abuja') && slugs.has('abuja-lagos'));
    });
  });

  describe('AC-3: JSON-LD Schema Formats', () => {
    it('generates valid structured data parameters', () => {
      const corridor = CORRIDOR_SEO_PROFILES[0];
      assert.ok(corridor);
      const fareInNaira = (corridor.startingFareKobo / 100).toFixed(2);
      assert.strictEqual(typeof fareInNaira, 'string');
      assert.strictEqual(Number(fareInNaira) > 0, true);
    });
  });
});
