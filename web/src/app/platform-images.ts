export interface PlatformImage {
  src: string | null;
  label: string;
}

const PLATFORM_MAP: Record<string, { src: string; label: string }> = {
  'PlayStation 5': { src: '/assets/platforms/playstation.svg', label: 'PS5' },
  'PlayStation 4': { src: '/assets/platforms/playstation.svg', label: 'PS4' },
  'PlayStation 3': { src: '/assets/platforms/playstation.svg', label: 'PS3' },
  'PlayStation 2': { src: '/assets/platforms/playstation.svg', label: 'PS2' },
  PlayStation: { src: '/assets/platforms/playstation.svg', label: 'PS' },
  'PlayStation Vita': { src: '/assets/platforms/playstation.svg', label: 'PSV' },
  'Xbox Series X|S': { src: '/assets/platforms/xbox.svg', label: 'XS' },
  'Xbox Series X': { src: '/assets/platforms/xbox.svg', label: 'XSX' },
  'Xbox Series S': { src: '/assets/platforms/xbox.svg', label: 'XSS' },
  'Xbox Series': { src: '/assets/platforms/xbox.svg', label: 'XS' },
  'Xbox One': { src: '/assets/platforms/xbox.svg', label: 'XB1' },
  'Xbox 360': { src: '/assets/platforms/xbox.svg', label: 'X360' },
  Xbox: { src: '/assets/platforms/xbox.svg', label: 'XB' },
  'Nintendo Switch': { src: '/assets/platforms/nintendo.svg', label: 'SW' },
  'Nintendo Switch 2': { src: '/assets/platforms/nintendo.svg', label: 'SW2' },
  'Nintendo Wii U': { src: '/assets/platforms/nintendo.svg', label: 'WU' },
  'Nintendo Wii': { src: '/assets/platforms/nintendo.svg', label: 'Wii' },
  'Nintendo GameCube': { src: '/assets/platforms/nintendo.svg', label: 'GC' },
  'Nintendo 64': { src: '/assets/platforms/nintendo.svg', label: 'N64' },
  'Super Nintendo': { src: '/assets/platforms/nintendo.svg', label: 'SNES' },
  'Super Nintendo Entertainment System': { src: '/assets/platforms/nintendo.svg', label: 'SNES' },
  'Nintendo Entertainment System': { src: '/assets/platforms/nintendo.svg', label: 'NES' },
  'Game Boy Advance': { src: '/assets/platforms/nintendo.svg', label: 'GBA' },
  'Game Boy Color': { src: '/assets/platforms/nintendo.svg', label: 'GBC' },
  'Game Boy': { src: '/assets/platforms/nintendo.svg', label: 'GB' },
  'Nintendo DS': { src: '/assets/platforms/nintendo.svg', label: 'DS' },
  'Nintendo 3DS': { src: '/assets/platforms/nintendo.svg', label: '3DS' },
  PC: { src: '/assets/platforms/pc.svg', label: 'PC' },
  Windows: { src: '/assets/platforms/pc.svg', label: 'PC' },
  Mac: { src: '/assets/platforms/pc.svg', label: 'Mac' },
  'Sega Mega Drive/Genesis': { src: '/assets/platforms/sega.svg', label: 'MD' },
  'Sega Mega Drive': { src: '/assets/platforms/sega.svg', label: 'MD' },
  'Sega Genesis': { src: '/assets/platforms/sega.svg', label: 'MD' },
  'Sega Saturn': { src: '/assets/platforms/sega.svg', label: 'Sat' },
  'Sega Dreamcast': { src: '/assets/platforms/sega.svg', label: 'DC' },
  'Commodore Amiga': { src: '/assets/platforms/commodore.svg', label: 'Amiga' },
  'Commodore Amiga CD32': { src: '/assets/platforms/commodore.svg', label: 'CD32' },
  'Commodore 64': { src: '/assets/platforms/commodore.svg', label: 'C64' },
  'Commodore 16/Plus/4': { src: '/assets/platforms/commodore.svg', label: 'C16' },
  'Atari ST': { src: '/assets/platforms/atari.svg', label: 'Atari' },
  'Apple iOS': { src: '/assets/platforms/apple.svg', label: 'iOS' },
  'Windows Phone': { src: '/assets/platforms/windows.svg', label: 'Win' },
};

export function getPlatformImage(platform: string): PlatformImage {
  const entry = PLATFORM_MAP[platform];
  if (entry) {
    return { src: entry.src, label: entry.label };
  }
  return { src: '/assets/platforms/generic.svg', label: platform.slice(0, 6) };
}
