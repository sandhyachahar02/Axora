 
export type Profile = {
  id: string;
  full_name: string;
  role: string;
  skills: string[];
  bio: string;
  github_url: string;
  linkedin_url: string;
  availability: boolean;
  match_score?: number;
  reason?: string;
};

export function calculateMatchScore(
  currentUserSkills: string[],
  candidateSkills: string[]
): number {
  if (!currentUserSkills?.length || !candidateSkills?.length) return 0;

  const normalize = (s: string) => s.toLowerCase().trim();
  const userSet = new Set(currentUserSkills.map(normalize));
  const candidateSet = new Set(candidateSkills.map(normalize));

  // Same skills score — overlap
  let sameCount = 0;
  userSet.forEach((skill) => {
    if (candidateSet.has(skill)) sameCount++;
  });

  // Complementary score — skills candidate has that user doesn't
  let complementaryCount = 0;
  candidateSet.forEach((skill) => {
    if (!userSet.has(skill)) complementaryCount++;
  });

  const totalSkills = new Set([...userSet, ...candidateSet]).size;

  // Weighted: 50% same skills, 50% complementary
  const sameScore = (sameCount / totalSkills) * 50;
  const complementaryScore =
    (Math.min(complementaryCount, userSet.size) / Math.max(userSet.size, 1)) * 50;

  return Math.round(sameScore + complementaryScore);
}