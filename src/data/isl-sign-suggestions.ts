/** Context and letter-based phrase suggestions for ISL recognition. */

export const CONTEXT_DICT: Record<string, string[]> = {
  I: ["AM", "WANT", "LIKE", "LOVE", "NEED", "FEEL"],
  "I AM": ["HAPPY", "SAD", "OKAY", "FINE", "READY", "SORRY"],
  "I AM O": ["OKAY", "OPEN"],
  "I AM R": ["READY"],
  HOW: ["ARE", "YOU"],
  "HOW ARE": ["YOU"],
  HELLO: ["FRIEND", "WORLD"],
  MY: ["NAME", "AGE", "HOME"],
  WHAT: ["IS", "YOUR", "NAME"],
  GOOD: ["MORNING", "AFTERNOON", "EVENING", "NIGHT"],
  "GOOD M": ["MORNING"],
};

export const LETTER_DICT: Record<string, string[]> = {
  A: ["AM", "APPLE", "AND", "ARE"],
  B: ["BE", "BOY", "BIG", "BOOK"],
  C: ["CAT", "CAN", "COME", "CALL"],
  D: ["DO", "DAD", "DAY", "DOG"],
  E: ["EAT", "EGG", "END", "EVERY"],
  F: ["FOR", "FAN", "FINE", "FEEL"],
  G: ["GO", "GOOD", "GET", "GIVE"],
  H: ["HELLO", "HI", "HOME", "HOW"],
  I: ["IS", "IN", "IT", "IF"],
  J: ["JUST", "JOY", "JOB", "JOIN"],
  K: ["KEEP", "KIND", "KNOW", "KING"],
  L: ["LIKE", "LOOK", "LOVE", "LIFE"],
  M: ["ME", "MY", "MORNING", "MAKE"],
  N: ["NO", "NAME", "NEW", "NOW"],
  O: ["OKAY", "ON", "OR", "OPEN"],
  P: ["PLAY", "PLEASE", "PUT", "PLACE"],
  Q: ["QUIET", "QUICK", "QUESTION"],
  R: ["READY", "READ", "RUN", "RIGHT"],
  S: ["SAD", "SAY", "SEE", "SHE"],
  T: ["THE", "TO", "THAT", "THIS"],
  U: ["UP", "US", "UNDER", "USE"],
  V: ["VERY", "VIEW", "VISIT"],
  W: ["WANT", "WE", "WHAT", "WHEN"],
  X: ["XRAY", "XMAS"],
  Y: ["YOU", "YOUR", "YES", "YEAR"],
  Z: ["ZERO", "ZOO", "ZONE"],
};

export function buildSuggestions(accumulatedText: string): string[] {
  const trimmed = accumulatedText.trim();
  if (!trimmed) return [];

  const text = trimmed.toUpperCase();
  const words = text.split(/\s+/);
  const currentWord = words[words.length - 1] ?? "";
  const matches: string[] = [];

  if (currentWord.length > 0) {
    for (const key of Object.keys(LETTER_DICT)) {
      for (const word of LETTER_DICT[key]) {
        if (word.startsWith(currentWord) && !matches.includes(word)) {
          matches.push(word);
        }
      }
    }
  }

  const contextMatches = CONTEXT_DICT[currentWord] ?? CONTEXT_DICT[text] ?? [];
  return [...new Set([...matches, ...contextMatches])].slice(0, 8);
}
