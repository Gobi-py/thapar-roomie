// Simple rule-based compatibility score between two profiles.
// Returns a number 0-100 (higher = more compatible).
export function computeCompatibility(a, b) {
  let score = 100;

  // Sleep schedule: hour of day (0-23) they usually sleep
  score -= Math.abs(a.sleep_time - b.sleep_time) * 3;

  // Wake-up time: hour of day (0-23) they usually wake up
  score -= Math.abs((a.wake_time ?? 7) - (b.wake_time ?? 7)) * 2;

  // Cleanliness (1-5 scale)
  score -= Math.abs(a.cleanliness - b.cleanliness) * 6;

  // Noise tolerance (1-5 scale)
  score -= Math.abs(a.noise_tolerance - b.noise_tolerance) * 5;

  // Food preference match bonus
  if (a.food_pref === b.food_pref) score += 10;

  // Study style match bonus
  if (a.study_style === b.study_style) score += 8;

  // Smoking compatibility (big penalty if mismatched)
  if (a.smoking !== b.smoking) score -= 15;

  // Drinking compatibility
  if (a.drinking !== b.drinking) score -= 10;

  // Guests ok compatibility
  if (a.guests_ok !== b.guests_ok) score -= 8;

  // Social type: extrovert + introvert is the riskiest pairing;
  // matching or ambivert pairings are fine.
  const socialA = a.social_type ?? "ambivert";
  const socialB = b.social_type ?? "ambivert";
  if (socialA !== socialB) {
    const isExtremeClash =
      (socialA === "introvert" && socialB === "extrovert") ||
      (socialA === "extrovert" && socialB === "introvert");
    score -= isExtremeClash ? 12 : 5;
  }

  // AC / temperature preference
  const acA = a.ac_preference ?? "no_preference";
  const acB = b.ac_preference ?? "no_preference";
  if (acA !== acB && acA !== "no_preference" && acB !== "no_preference") {
    score -= 10;
  }

  // Music while studying
  if (a.music_while_studying !== b.music_while_studying) score -= 5;

  // Late-night calls
  const callsA = a.night_calls ?? "sometimes";
  const callsB = b.night_calls ?? "sometimes";
  if (callsA === "often" && callsB === "rarely") score -= 8;
  if (callsB === "often" && callsA === "rarely") score -= 8;

  // Sharing stuff (gadgets/food/chargers)
  if (a.sharing_ok !== b.sharing_ok) score -= 5;

  // Same preferred/current hostel is a nice-to-have bonus, not a penalty
  // if they differ (people may not have decided yet).
  if (
    a.hostel_pref &&
    b.hostel_pref &&
    a.hostel_pref.trim().toLowerCase() === b.hostel_pref.trim().toLowerCase()
  ) {
    score += 8;
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Sorted pair id used to identify a unique conversation between two users,
// regardless of who initiated it.
export function conversationId(userIdA, userIdB) {
  return [userIdA, userIdB].sort().join("_");
}
