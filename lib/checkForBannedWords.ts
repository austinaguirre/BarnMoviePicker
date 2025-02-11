
const bannedWordsEnv = process.env.BAN_WORDS || "";

export const BANNED_WORDS = bannedWordsEnv
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);

export function checkForBannedWords(text: string): boolean {
    // We'll do a case-insensitive substring check for each banned word.
    // If text includes any banned word, return true (meaning "bad").
    const lower = text.toLowerCase();
    return BANNED_WORDS.some((bad) => lower.includes(bad));
}
