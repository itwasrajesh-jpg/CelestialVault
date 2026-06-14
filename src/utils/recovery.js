// ─── RECOVERY PHRASE — 12 word BIP-39 style ──────────────────────────────────

const WORDS = [
  'apple','bridge','castle','dragon','empire','forest','garden','harbor',
  'island','jungle','knight','lantern','mirror','noble','ocean','palace',
  'quartz','river','shadow','tower','umbrella','valley','winter','xenon',
  'yellow','zenith','amber','beacon','crystal','dawn','eclipse','flame',
  'glacier','horizon','ivory','jade','karma','lotus','maple','nebula',
  'orbit','prism','quest','radiant','stone','temple','unity','voyage',
  'wave','azure','bloom','coral','dusk','ember','frost','golden',
  'haven','indigo','jasper','kindle','lunar','mystic','nexus','onyx',
  'pearl','quantum','rune','silver','terra','ultra','vortex','willow',
  'xeric','yield','zeal','anchor','breeze','cloud','depth','echo',
  'fable','grace','honor','iris','jewel','keen','lore','moon',
  'night','opal','path','quiet','realm','swift','thorn','ursa',
  'veil','west','xenial','yarn','zephyr','aura','blaze','cipher',
];

export function generateRecoveryPhrase() {
  const words = [];
  const used = new Set();
  while (words.length < 12) {
    const idx = Math.floor(Math.random() * WORDS.length);
    if (!used.has(idx)) {
      used.add(idx);
      words.push(WORDS[idx]);
    }
  }
  return words.join(' ');
}

export function validatePhrase(input, stored) {
  if (!input || !stored) return false;
  return input.trim().toLowerCase() === stored.trim().toLowerCase();
}
