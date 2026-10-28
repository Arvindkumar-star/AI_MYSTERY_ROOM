/**
 * scoring.service.js
 * Implements Section 12 scoring rules:
 *
 * score = 1000 (correct)
 *       - 200 x (wrong attempts)
 *       - 75 x (hints used)
 *       - timePenalty            // 1 point per 30 s beyond 10 min, max 200
 *       + 10 x (key evidence items the player viewed)   // max 100
 *       + 50 x (theory mentions the true motive keyword match)
 */

export function calculateScore({
  isCorrect,
  wrongAttempts = 0,
  hintsUsed = 0,
  startedAt,
  endedAt = new Date(),
  viewedEvidenceIds = [],
  keyEvidenceIds = [],
  theory = '',
  motive = '',
}) {
  if (!isCorrect) {
    return {
      score: 0,
      rank: 'Rookie',
      breakdown: {
        baseScore: 0,
        wrongAttemptsDeduction: 0,
        hintsDeduction: 0,
        timePenalty: 0,
        keyEvidenceBonus: 0,
        motiveBonus: 0,
      },
    };
  }

  const baseScore = 1000;
  const wrongAttemptsDeduction = 200 * wrongAttempts;
  const hintsDeduction = 75 * hintsUsed;

  // Time penalty: 1 pt per 30s beyond 10 min (600s), capped at 200
  let timePenalty = 0;
  if (startedAt) {
    const elapsedSeconds = Math.max(0, (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    const overtimeSeconds = Math.max(0, elapsedSeconds - 600);
    timePenalty = Math.min(200, Math.floor(overtimeSeconds / 30));
  }

  // Key evidence bonus: +10 per key evidence viewed, max 100
  const viewedKeyCount = keyEvidenceIds.filter((id) => viewedEvidenceIds.includes(id)).length;
  const keyEvidenceBonus = Math.min(100, viewedKeyCount * 10);

  // Motive keyword match bonus: +50
  let motiveBonus = 0;
  if (theory && motive) {
    const motiveWords = motive
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const theoryLower = theory.toLowerCase();
    const matched = motiveWords.some((word) => theoryLower.includes(word));
    if (matched) {
      motiveBonus = 50;
    }
  }

  const total = Math.max(
    0,
    baseScore - wrongAttemptsDeduction - hintsDeduction - timePenalty + keyEvidenceBonus + motiveBonus
  );

  let rank = 'Rookie';
  if (total >= 900) rank = 'Master Sleuth';
  else if (total >= 700) rank = 'Inspector';
  else if (total >= 400) rank = 'Detective';

  return {
    score: total,
    rank,
    breakdown: {
      baseScore,
      wrongAttemptsDeduction,
      hintsDeduction,
      timePenalty,
      keyEvidenceBonus,
      motiveBonus,
    },
  };
}

