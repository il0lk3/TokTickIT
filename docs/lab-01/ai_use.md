# Lab 1 — AI Use and Reflection  

**LLM/agent used:** Antigravity (Google Deepmind)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | "วิธีอัพ issue1 ขึ้น github" | Ran the suggested git commands to commit and push branch 1. |
| 2 | "issue 2 มีเพื่อนมา review ให้แก้... ช่วยแก้หน่อย" | Applied the code fix for handling `online: false` in `App.tsx`. |
| 3 | "ลบ approve อันเก่าได้ปะ" | Followed instructions to dismiss stale PR reviews on GitHub. |
| 4 | "สร้างเป็น docker compose ให้หน่อยได้ปะ (Port 5435)" | Applied the provided `docker-compose.yml` to run PostgreSQL. |
| 5 | "เพื่อนมีแนะนำมานิดหน่อย ทำตามดีไหม (Issue 3)" | Updated `README.md` and removed `TODO`/`console.log` from `seed.ts`. |
| 6 | "มี review issue4 มาอีกกกกกก" | Verified that the code was already correct and the review was from an old commit. |

## Reflection
Two or three sentences: what made your prompts better, and one place you had to correct or reject what the agent produced.
The agent was very helpful when I gave it specific context like the exact error or the exact review comment I received from my peer. One place I had to reject/correct the agent was when the reviewer commented on an old commit; the agent and I had to verify the current code status instead of blindly changing the code again.
แก