from pydantic import BaseModel
from typing import List, Optional

class UserProfile(BaseModel):
    id: str
    skills: Optional[List[str]] = []
    role: Optional[str] = ""
    experience: Optional[str] = ""
    interests: Optional[List[str]] = []

class MatchRequest(BaseModel):
    current_user: UserProfile
    other_users: List[UserProfile]

class MatchResult(BaseModel):
    user_id: str
    match_score: float
    reason: str

# For simple matching by user_id only (uses Supabase data)
class SimpleMatchRequest(BaseModel):
    user_id: str

class ProfileOut(BaseModel):
    id: str
    full_name: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    match_score: float = 0.0
    reason: Optional[str] = None