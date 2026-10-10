import type { Accent } from '@phonologic/shared-types';

const ROBOTIC_VOICE_NAMES = new Set([
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'fred',
  'good news',
  'jester',
  'junior',
  'organ',
  'ralph',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
]);

const UK_PREFERRED_VOICE_PATTERNS = [
  'daniel',
  'google uk english female',
  'google uk english male',
  'microsoft sonia online (natural)',
  'microsoft ryan online (natural)',
  'microsoft libby online (natural)',
  'microsoft maisie online (natural)',
  'serena',
  'oliver',
  'arthur',
  'martha',
  'flo (english (united kingdom))',
  'eddy (english (united kingdom))',
  'reed (english (united kingdom))',
  'rocko (english (united kingdom))',
  'shelley (english (united kingdom))',
  'sandy (english (united kingdom))',
  'grandma (english (united kingdom))',
  'grandpa (english (united kingdom))',
];

const US_PREFERRED_VOICE_PATTERNS = [
  'samantha',
  'google us english',
  'microsoft jenny online (natural)',
  'microsoft guy online (natural)',
  'microsoft aria online (natural)',
  'microsoft christopher online (natural)',
  'microsoft eric online (natural)',
  'ava',
  'allison',
  'tom',
  'alex',
  'flo (english (united states))',
  'eddy (english (united states))',
  'reed (english (united states))',
  'rocko (english (united states))',
  'shelley (english (united states))',
  'sandy (english (united states))',
];

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function findBestNaturalVoice(
  voices: SpeechSynthesisVoice[],
  accent: Accent = 'US'
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  const validVoices = voices.filter(
    (v) => !ROBOTIC_VOICE_NAMES.has(v.name.trim().toLowerCase())
  );

  const preferredPatterns =
    accent === 'UK' ? UK_PREFERRED_VOICE_PATTERNS : US_PREFERRED_VOICE_PATTERNS;

  // 1. Check preferred high-quality natural voices in ranked order
  for (const pattern of preferredPatterns) {
    const found = validVoices.find((v) =>
      v.name.toLowerCase().includes(pattern)
    );
    if (found) return found;
  }

  // 2. Look for voices tagged as natural, neural, or enhanced for target locale
  const targetPrefix = accent === 'UK' ? 'en-gb' : 'en-us';
  const naturalForLocale = validVoices.find((v) => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    const isTargetLang =
      lang.startsWith(targetPrefix) ||
      lang === (accent === 'UK' ? 'en_gb' : 'en_us');
    const isNatural =
      name.includes('natural') ||
      name.includes('neural') ||
      name.includes('enhanced') ||
      name.includes('premium') ||
      name.includes('online');
    return isTargetLang && isNatural;
  });
  if (naturalForLocale) return naturalForLocale;

  // 3. Fallback to any non-robotic voice with target language
  const anyTargetLang = validVoices.find((v) => {
    const lang = v.lang.toLowerCase();
    return (
      lang.startsWith(targetPrefix) ||
      lang === (accent === 'UK' ? 'en_gb' : 'en_us')
    );
  });
  if (anyTargetLang) return anyTargetLang;

  // 4. Fallback to any non-robotic English voice
  return validVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
}

/**
 * Phát âm tự nhiên với giọng đọc người thật (Samantha, Daniel, Google/Microsoft Natural).
 * Tinh chỉnh rate 0.90 và pitch 1.0 cho âm sắc ấm áp, tròn vành rõ chữ, không bị méo tiếng máy.
 */
export function playBrowserTts(
  text: string,
  accent: Accent = 'US',
  rate = 0.9
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const cleanText = text.trim();
  if (!cleanText) return;

  try {
    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = accent === 'UK' ? 'en-GB' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const bestVoice = findBestNaturalVoice(synthesis.getVoices(), accent);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    const releaseUtterance = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };
    utterance.onend = releaseUtterance;
    utterance.onerror = releaseUtterance;
    activeUtterance = utterance;

    if (synthesis.speaking || synthesis.pending) {
      synthesis.cancel();
    }
    if (synthesis.paused) {
      synthesis.resume();
    }

    // Mobile browsers require speak() inside the original user gesture.
    // The default voice still works when getVoices() has not populated yet.
    synthesis.speak(utterance);
  } catch (err) {
    activeUtterance = null;
    console.warn('SpeechSynthesis error:', err);
  }
}
