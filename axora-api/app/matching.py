from sentence_transformers import SentenceTransformer, util
from typing import List, Optional

model = SentenceTransformer("all-MiniLM-L6-v2")

COMPLEMENTARY_ROLES = {
    "Frontend Developer": ["Designer", "Backend Developer", "UI/UX"],
    "Backend Developer": ["Frontend Developer", "Designer", "DevOps"],
    "Designer": ["Frontend Developer", "Backend Developer", "Product Manager"],
    "UI/UX": ["Frontend Developer", "Backend Developer"],
    "DevOps": ["Backend Developer", "Frontend Developer"],
    "Product Manager": ["Designer", "Frontend Developer", "Backend Developer"],
    "Student": ["Frontend Developer", "Backend Developer", "Designer"],
    "Freelancer": ["Designer", "Frontend Developer", "Backend Developer"],
    "Developer": ["Designer", "Product Manager", "DevOps"],
}

EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]

def skill_match_score(user_skills: List[str], candidate_skills: List[str]) -> float:
    if not user_skills or not candidate_skills:
        return 0.0
    user_set = set(s.lower() for s in user_skills)
    candidate_set = set(s.lower() for s in candidate_skills)
    common = len(user_set & candidate_set)
    total = len(user_set | candidate_set)
    return common / total if total > 0 else 0.0

def complementary_score(user_role: str, candidate_role: str) -> float:
    if not user_role or not candidate_role:
        return 0.0
    complementary_roles = COMPLEMENTARY_ROLES.get(user_role, [])
    if candidate_role in complementary_roles:
        return 1.0
    # Use NLP for semantic role similarity
    emb1 = model.encode(user_role, convert_to_tensor=True)
    emb2 = model.encode(candidate_role, convert_to_tensor=True)
    similarity = util.cos_sim(emb1, emb2).item()
    # Invert — complementary means different but related
    return 1.0 - (similarity * 0.5)

def interest_match_score(user_interests: List[str], candidate_interests: List[str]) -> float:
    if not user_interests or not candidate_interests:
        return 0.0
    user_text = " ".join(user_interests)
    candidate_text = " ".join(candidate_interests)
    emb1 = model.encode(user_text, convert_to_tensor=True)
    emb2 = model.encode(candidate_text, convert_to_tensor=True)
    return util.cos_sim(emb1, emb2).item()

def experience_match_score(user_exp: str, candidate_exp: str) -> float:
    if not user_exp or not candidate_exp:
        return 0.5
    try:
        user_idx = EXPERIENCE_LEVELS.index(user_exp)
        candidate_idx = EXPERIENCE_LEVELS.index(candidate_exp)
        diff = abs(user_idx - candidate_idx)
        return 1.0 - (diff / len(EXPERIENCE_LEVELS))
    except ValueError:
        return 0.5

def generate_reason(
    user_skills: List[str],
    candidate_skills: List[str],
    user_role: str,
    candidate_role: str,
    user_interests: List[str],
    candidate_interests: List[str],
    skill: float,
    complementary: float,
    interest: float,
) -> str:
    reasons = []
    common_skills = set(s.lower() for s in user_skills) & set(s.lower() for s in candidate_skills)
    if common_skills:
        reasons.append(f"you share skills in {', '.join(list(common_skills)[:3])}")
    if complementary > 0.6 and user_role and candidate_role:
        reasons.append(f"your roles complement each other ({user_role} + {candidate_role})")
    common_interests = set(s.lower() for s in user_interests) & set(s.lower() for s in candidate_interests)
    if common_interests:
        reasons.append(f"you share interests in {', '.join(list(common_interests)[:2])}")
    elif interest > 0.6:
        reasons.append("you have similar goals and interests")
    if not reasons:
        reasons.append("your profiles are compatible for collaboration")
    return "Matched because " + " and ".join(reasons)

def compute_match(current_user: dict, candidate: dict) -> dict:
    skill = skill_match_score(
        current_user.get("skills", []),
        candidate.get("skills", [])
    )
    complementary = complementary_score(
        current_user.get("role", ""),
        candidate.get("role", "")
    )
    interest = interest_match_score(
        current_user.get("interests", []),
        candidate.get("interests", [])
    )
    experience = experience_match_score(
        current_user.get("experience", ""),
        candidate.get("experience", "")
    )

    # Weighted score
    final_score = (
        (0.4 * skill) +
        (0.3 * complementary) +
        (0.2 * interest) +
        (0.1 * experience)
    )

    return {
        "user_id": candidate.get("id"),
        "match_score": round(final_score * 100, 1),
        "reason": generate_reason(
            current_user.get("skills", []),
            candidate.get("skills", []),
            current_user.get("role", ""),
            candidate.get("role", ""),
            current_user.get("interests", []),
            candidate.get("interests", []),
            skill, complementary, interest
        )
    }