from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import MatchRequest, MatchResult, SimpleMatchRequest, ProfileOut
from app.matching import compute_match
from app.supabase_client import get_profile, get_all_profiles_except

app = FastAPI(
    title="Axora AI API",
    description="AI-powered teammate matching using NLP",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Axora AI API is running"}


# ── Full matching endpoint (accepts user data directly) ──
@app.post("/api/match-users", response_model=list[MatchResult])
def match_users(request: MatchRequest):
    results = []
    for candidate in request.other_users:
        result = compute_match(
            request.current_user.model_dump(),
            candidate.model_dump()
        )
        results.append(result)

    # Sort by highest score, limit top 10
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:10]


# ── Simple matching endpoint (uses Supabase profiles by user_id) ──
@app.post("/match", response_model=list[ProfileOut])
def get_matches(request: SimpleMatchRequest):
    user_profile = get_profile(request.user_id)

    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    all_profiles = get_all_profiles_except(request.user_id)

    if not all_profiles:
        return []

    results = []
    for profile in all_profiles:
        match = compute_match(user_profile, profile)
        results.append(ProfileOut(
            id=profile["id"],
            full_name=profile.get("full_name"),
            role=profile.get("role"),
            skills=profile.get("skills", []),
            bio=profile.get("bio"),
            github_url=profile.get("github_url"),
            linkedin_url=profile.get("linkedin_url"),
            match_score=match["match_score"],
            reason=match["reason"]
        ))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:10]


@app.get("/profile/{user_id}")
def get_profile_endpoint(user_id: str):
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile