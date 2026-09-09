import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const icon = path.join(root, 'public', 'icon.svg');
const resources = path.join(root, 'android', 'app', 'src', 'main', 'res');

const launcherDensities = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
];

for (const [density, size] of launcherDensities) {
  const directory = path.join(resources, `mipmap-${density}`);
  const foregroundSize = Math.round(size * 2.25);
  const foregroundLogoSize = Math.round(foregroundSize * 0.75);
  const foregroundLogo = await sharp(icon)
    .resize(foregroundLogoSize, foregroundLogoSize)
    .png()
    .toBuffer();

  await sharp(icon).resize(size, size).png().toFile(path.join(directory, 'ic_launcher.png'));
  await sharp(icon).resize(size, size).png().toFile(path.join(directory, 'ic_launcher_round.png'));
  await sharp({
    create: {
      width: foregroundSize,
      height: foregroundSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: foregroundLogo, gravity: 'centre' }])
    .png()
    .toFile(path.join(directory, 'ic_launcher_foreground.png'));
}

const splashSizes = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
];

for (const [directoryName, width, height] of splashSizes) {
  const logoSize = Math.round(Math.min(width, height) / 3);
  const logo = await sharp(icon).resize(logoSize, logoSize).png().toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#090B16',
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(resources, directoryName, 'splash.png'));
}

console.log('Generated branded Android launcher and splash assets.');
