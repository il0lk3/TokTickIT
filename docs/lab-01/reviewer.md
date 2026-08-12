# Lab 1 — Peer Review Record  (fill this in)

**Author:** <your name> — <student id> — GitHub: @<username>
**Peer reviewer:** <partner name> — <student id> — GitHub: @<username>

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| PR 5 | feature/1-project-foundation | Approved |
| PR 6 | feature/2-health-check | Changes requested -> Approved |
| PR 7 | feature/3-category-seed | Changes requested -> Approved |
| PR 8 | feature/4-category-list | Changes requested -> Approved |

Reviewer comment I received: "ใน client/src/App.tsx ถ้าผลลัพธ์เป็น { online: false } ฟังก์ชัน setState("success") จะไม่ถูกเรียก ทำให้ UI ยังค้างสถานะเก่า ควรเพิ่ม else สำหรับจัดการกรณี online: false"
How I responded: I modified `App.tsx` to include an `else { setState("error") }` block to properly handle the offline state, then pushed the update.

## Pull Requests I reviewed for my partner
My comment: <...>
Partner's response: <...>
