import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

describe('Aceternity Card Hover Effect & Gliding Animation', () => {
  test('Motion dependency exports motion and AnimatePresence', async () => {
    const motionModule = await import('motion/react');
    assert.equal(typeof motionModule.motion, 'function', 'motion must be an exported function');
    assert.equal(typeof motionModule.AnimatePresence, 'function', 'AnimatePresence must be an exported function');
  });

  test('Card hover effect module exports required components and interfaces', async () => {
    const cardHoverModule = await import('../../../apps/web/src/components/ui/card-hover-effect.tsx');
    assert.equal(typeof cardHoverModule.HoverEffect, 'function', 'HoverEffect must be exported');
    assert.equal(typeof cardHoverModule.Card, 'function', 'Card must be exported');
    assert.equal(typeof cardHoverModule.CardTitle, 'function', 'CardTitle must be exported');
    assert.equal(typeof cardHoverModule.CardDescription, 'function', 'CardDescription must be exported');
    assert.equal(typeof cardHoverModule.CardHoverGroup, 'function', 'CardHoverGroup must be exported');
  });

  test('Demo projects list contains valid cards without missing properties', async () => {
    const demoModule = await import('../../../apps/web/src/components/card-hover-effect-demo.tsx');
    assert.equal(typeof demoModule.default, 'function', 'Demo component default export must exist');
    assert.ok(Array.isArray(demoModule.projects), 'projects must be an array');
    assert.equal(demoModule.projects.length >= 6, true, 'projects must contain at least 6 demo cards');

    demoModule.projects.forEach((proj: any) => {
      assert.ok(proj.title, 'Demo card must have a title');
      assert.ok(proj.description, 'Demo card must have a description');
      assert.ok(proj.link, 'Demo card must have a link');
    });
  });

  test('CardHoverGroup establishes isolated stacking context and elevated card layer', async () => {
    const { CardHoverGroup } = await import('../../../apps/web/src/components/ui/card-hover-effect.tsx');
    const html = ReactDOMServer.renderToString(
      React.createElement(
        CardHoverGroup,
        { className: 'grid grid-cols-2' },
        React.createElement('div', { key: '1' }, 'Card 1'),
        React.createElement('div', { key: '2' }, 'Card 2')
      )
    );

    assert.ok(html.includes('isolate'), 'CardHoverGroup container must include isolate class');
    assert.ok(html.includes('z-index:10'), 'Card content must be pinned to elevated z-index (10)');
    assert.ok(html.includes('transform:none'), 'Card content must neutralize translate and scale transforms');
  });

  test('HoverEffect renders isolated grid with cards on elevated layer', async () => {
    const { HoverEffect } = await import('../../../apps/web/src/components/ui/card-hover-effect.tsx');
    const html = ReactDOMServer.renderToString(
      React.createElement(HoverEffect, {
        items: [
          { title: 'Item 1', description: 'Desc 1', link: '/1' },
          { title: 'Item 2', description: 'Desc 2', link: '/2' },
        ],
      })
    );

    assert.ok(html.includes('isolate'), 'HoverEffect container must include isolate class');
    assert.ok(html.includes('z-index:10'), 'Card content wrapper must have elevated z-index (10)');
    assert.ok(html.includes('z-index:20'), 'Inner Card element must have z-index (20)');
    assert.ok(html.includes('transform:none'), 'HoverEffect card wrapper must neutralize translate and scale transforms');
  });
});

describe('Aceternity Wobble Card Effect for Cards with Images', () => {
  test('WobbleCard module exports WobbleCard and Noise components', async () => {
    const wobbleModule = await import('../../../apps/web/src/components/ui/wobble-card.tsx');
    assert.equal(typeof wobbleModule.WobbleCard, 'function', 'WobbleCard must be exported');
    assert.equal(typeof wobbleModule.Noise, 'function', 'Noise must be exported');
  });

  test('WobbleCard renders with radial gradient and noise layer', async () => {
    const { WobbleCard } = await import('../../../apps/web/src/components/ui/wobble-card.tsx');
    const html = ReactDOMServer.renderToString(
      React.createElement(
        WobbleCard,
        { containerClassName: 'bg-pink-800' },
        React.createElement('div', null, 'Wobble Card Content')
      )
    );

    assert.ok(html.includes('bg-pink-800'), 'Must contain container class');
    assert.ok(html.includes('radial-gradient'), 'Must contain radial gradient highlight');
    assert.ok(html.includes('Wobble Card Content'), 'Must render children inside card');
  });

  test('WobbleCardDemo renders 3 wobble cards', async () => {
    const demoModule = await import('../../../apps/web/src/components/wobble-card-demo.tsx');
    assert.equal(typeof demoModule.default, 'function', 'Demo component default export must exist');
    const html = ReactDOMServer.renderToString(React.createElement(demoModule.default));
    assert.ok(html.includes('Gippity AI powers the entire universe'), 'Must render demo card 1');
    assert.ok(html.includes('No shirt, no shoes, no weapons.'), 'Must render demo card 2');
    assert.ok(html.includes('Signup for blazing-fast cutting-edge'), 'Must render demo card 3');
  });
});

describe('Spec 0032: 3D Samsung S26 Ultra Model & PWA Screen Scroll Animation', () => {
  test('S26 Ultra 3D glTF model asset exists in public models directory', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const modelPath = path.resolve(process.cwd(), 'apps/web/public/models/samsung_s_26_ultra_3d_model.glb');

    assert.equal(fs.existsSync(modelPath), true, 'samsung_s_26_ultra_3d_model.glb must exist');
    const stats = fs.statSync(modelPath);
    assert.ok(stats.size > 500000, 'Model binary must be valid glTF (>500KB)');
  });

  test('SamsungPhoneCanvas component module exports properly', async () => {
    const canvasModule = await import('../../../apps/web/src/components/home/SamsungPhoneCanvas.tsx');
    assert.equal(typeof canvasModule.SamsungPhoneCanvas, 'function', 'SamsungPhoneCanvas must be an exported function');
  });

  test('MobileAppBanner integrates SamsungPhoneCanvas on transparent showcase', async () => {
    const bannerModule = await import('../../../apps/web/src/components/home/MobileAppBanner.tsx');
    assert.equal(typeof bannerModule.MobileAppBanner, 'function', 'MobileAppBanner must be an exported function');

    const html = ReactDOMServer.renderToString(React.createElement(bannerModule.MobileAppBanner));
    assert.ok(html.includes('Take Ascent Travel Everywhere'), 'Must contain mobile app heading');
    assert.ok(html.includes('Mobile First Progressive Web App'), 'Must contain mobile first subtitle');
    assert.equal(html.includes('WobbleCard'), false, 'Outer card container must be removed for clean transparent canvas');
  });
});
