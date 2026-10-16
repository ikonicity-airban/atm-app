import fs from 'fs';
import path from 'path';

const files = [
  {
    src: 'C:/Users/User/.gemini/antigravity-ide/brain/c5b9ed93-e559-4986-ac05-eb1add234109/hero_highway_sunset_1791994524951.jpg',
    dest: 'highway-sunset.jpg',
  },
  {
    src: 'C:/Users/User/.gemini/antigravity-ide/brain/c5b9ed93-e559-4986-ac05-eb1add234109/sienna_fleet_thumb_1791994550691.jpg',
    dest: 'sienna-thumb.jpg',
  },
  {
    src: 'C:/Users/User/.gemini/antigravity-ide/brain/c5b9ed93-e559-4986-ac05-eb1add234109/city_enugu_thumb_1791994582610.jpg',
    dest: 'city-enugu.jpg',
  },
  {
    src: 'C:/Users/User/.gemini/antigravity-ide/brain/c5b9ed93-e559-4986-ac05-eb1add234109/city_abuja_thumb_1791994673779.jpg',
    dest: 'city-abuja.jpg',
  },
  {
    src: 'C:/Users/User/.gemini/antigravity-ide/brain/c5b9ed93-e559-4986-ac05-eb1add234109/city_lagos_thumb_1791994858203.jpg',
    dest: 'city-lagos.jpg',
  },
  {
    src: 'C:/Users/User/.gemini/antigravity-ide/brain/c5b9ed93-e559-4986-ac05-eb1add234109/city_owerri_thumb_1791994975958.jpg',
    dest: 'city-owerri.jpg',
  },
];

const targetDirs = [
  path.resolve('public/images/hero'),
  path.resolve('apps/web/public/images/hero'),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const item of files) {
  for (const dir of targetDirs) {
    const destPath = path.join(dir, item.dest);
    fs.copyFileSync(item.src, destPath);
    console.log(`Copied ${item.dest} -> ${destPath}`);
  }
}
