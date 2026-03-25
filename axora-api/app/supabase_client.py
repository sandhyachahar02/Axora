import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xbivifsoakmhdsaerajz.supabase.co")
SUPABASE_KEY = os.environ.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiaXZpZnNvYWttaGRzYWVyYWp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkxMTg0MywiZXhwIjoyMDg5NDg3ODQzfQ.6x5mb4GPQMmEoHScMPAhZ5e1RtN0kZktvre00PlCZpM")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def get_profile(user_id: str):
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*"
    with httpx.Client() as client:
        res = client.get(url, headers=HEADERS)
        data = res.json()
        return data[0] if data else None

def get_all_profiles_except(user_id: str):
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=neq.{user_id}&select=*"
    with httpx.Client() as client:
        res = client.get(url, headers=HEADERS)
        return res.json()