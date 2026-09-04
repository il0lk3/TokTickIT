# Lab 2 Code Review Documentation

This document serves as evidence of the Git workflow and peer review process as required by **Part 1: Git Use with Engineering Workflow**.

## 1. Pull Request Summary

| PR Link / Number | Feature Branch | Status | Reviewers |
|---|---|---|---|
| PR #8 | `feature/lab2-e2e-real` | Merged | phatthidawadi, lmaybelgracel, Suprawi5227, chanya06, jejaebubu |

## 2. Review Comments and Responses

### Review 1: API Category Fetch Bug
**Reviewer:** `lmaybelgracel`, `phatthidawadi`
- **Comment Given:** "ใน `client/src/api.ts` ตรง `return { online: true, categories: [] };` ยังอยู่ก่อน `fetch("/api/categories")` ทำให้โค้ด fetch categories ด้านล่างไม่ถูกเรียกจริง ควรแก้จุดนี้เพื่อให้ข้อมูล category จาก API ถูกนำมาแสดงผล"
- **My Response:** "อันนี้เราเพิ่งอัปเดตแก้ไปใน Commit ล่าสุดเมื่อกี้นี้เลยครับ (น่าจะรีวิวสวนกันตอนที่ยังไม่ได้อัปเดต) รบกวนลองรีเฟรชหรือดึงโค้ดล่าสุดไปดูอีกรอบได้ไหมครับ ตอนนี้แก้จุดนั้นแล้วเรียบร้อย ขอบคุณมากๆ น้า"
- **Result:** Reviewers verified the updated commit and Approved the PR ("เจ๋ง", "ผ่านจ้า").

### Review 2: Unused TODOs in Tests
**Reviewer:** `jejaebubu`
- **Comment Given:** "ใน `client/tests/lab-01/App.test.tsx` มีการ import `describe` ซ้ำ และยังมี TODO test เดิมค้างอยู่ ควรลบส่วนที่ไม่ใช้งานออกเพื่อให้ test สะอาดและชัดเจน"
- **My Response:** "พอดีผมเพิ่งอัปเดต Commit ล่าสุดไปเมื่อกี้เลยคับ ลบ TODO ออกหมดแล้วด้วย ลองรีเฟรชหน้า PR แล้วเช็ค Commit ล่าสุดดูอีกทีนะครับ"
- **Result:** Approved.

## 3. General Approvals
- **Suprawi5227:** "โค้ดเขียนมาครบถ้วนและถูกต้องตามโจทย์ทุกจุดเลยจ้า! 👍" - Approved.

## 4. Final Approval & Merge
All required reviewers approved the pull request. The feature branch `feature/lab2-e2e-real` was successfully merged into the staging branch, and subsequently into `main`.
