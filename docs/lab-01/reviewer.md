# Lab 1 — Peer Review Record  (fill this in)

**Author:** <your name> — <student id> — GitHub: @<username>
**Peer reviewer:** Multiple Classmates

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| PR 5 | feature/1-project-foundation | Approved |
| PR 6 | feature/2-health-check | Changes requested -> Approved |
| PR 7 | feature/3-category-seed | Changes requested -> Approved |
| PR 8 | feature/4-category-list | Changes requested -> Approved |

### Reviewer comments I received & How I responded:

**PR 5:** [https://github.com/il0lk3/TokTickIT/pull/5](https://github.com/il0lk3/TokTickIT/pull/5)
- **Reviewer:** ฑิตญา ผ่องสกุล (@titayaaa) 
- **Comment:** "This PR cleanly accomplishes the goal of setting up the project foundation, project structure, TypeScript compiler settings, test harnesses, and initial stubs."
- **Response:** (Approved directly)

**PR 6:** [https://github.com/il0lk3/TokTickIT/pull/6](https://github.com/il0lk3/TokTickIT/pull/6)
- **Reviewer:** พัฒนาวดี แสงเงินยอด (@jejaebubu)
- **Comment:** "หากในอนาคต checkSystem() คืนค่าเป็น { online: false } โดยไม่โยน Error (throw) ออกมา จะทำให้ setState('success') ไม่ทำงาน และ setState('error') ก็ไม่ถูกเรียกเช่นกัน ปุ่มจะค้างสถานะเป็น 'loading' ตลอดไป แนะนำให้เติม else เพื่อรองรับกรณี online: false"
- **Response:** "ขอบคุณมากครับลืมนึกถึงเคสนี้ไปเลย ตอนนี้เติม else เพื่อเช็คกรณีที่ online: false ให้เซ็ตสถานะเป็น error เรียบร้อยแล้วครับ ลองตรวจดูอีกรอบได้เลยย" (แก้ไขและเพื่อน Approve)

**PR 7:** [https://github.com/il0lk3/TokTickIT/pull/7](https://github.com/il0lk3/TokTickIT/pull/7)
- **Reviewer:** ปทิตญา แก้ววิเชียร (@lmaybelgracel)
- **Comment:** "กานทำส่วน Category Seed ได้ค่อนข้างครบเลย... ส่วนที่อยากแนะนำเพิ่มเติมคือใน seed.ts ยังมี comment กับ console.log ที่เป็น TODO เดิมอยู่ แนะนำให้ลบหรือแก้ข้อความให้ตรงกับสิ่งที่ทำเสร็จแล้ว นอกจากนี้ถ้าเพิ่มรายละเอียดวิธีรัน migration/seed ไว้ใน README อีกนิด จะช่วยให้เพื่อนในทีมสามารถ setup และทดสอบส่วนนี้ได้ง่ายขึ้น"
- **Response:** "อัปเดตวิธี setup Database และวิธีรัน Migration/Seed ไว้ในไฟล์ README.md ให้เรียบร้อยแล้วน้า เผื่อใครเอาไปรันต่อจะได้ทำตามสเต็ปนี้ได้เลย ขอบคุณสำหรับคำแนะนำดีๆ จ้า^^" (พร้อมทั้งมีคำชมจากเพื่อนคนอื่นเพิ่มเติม และลบ TODO ทิ้งตามคำแนะนำ)

**PR 8:** [https://github.com/il0lk3/TokTickIT/pull/8](https://github.com/il0lk3/TokTickIT/pull/8)
- **Reviewers:** ชัญญา (@chanya06), พัฒนาวดี (@jejaebubu), ภัทร์ธิดาวดี (@phatthidawadi), ปทิตญา (@lmaybelgracel)
- **Comment:** เพื่อนหลายคนเข้ามาทักท้วงเรื่อง `return { online: true, categories: [] }` ที่บังการดึง API เอาไว้ รวมถึงเรื่อง TODO ที่ค้างอยู่ใน test file
- **Response:** "พอดีผมเพิ่งอัปเดต Commit ล่าสุดไปเมื่อกี้เลยคับ เข้าไปแก้พวกรีเทิร์นดักใน api.ts และลบ TODO ออกหมดแล้วด้วย ลองรีเฟรชหน้า PR แล้วเช็ค Commit ล่าสุดดูอีกทีนะครับ ขอบคุณมากน้าา" (เพื่อนเข้ามาดูโค้ดล่าสุดแล้วก็ Approve ให้ทั้งหมด)

## Pull Requests I reviewed for my partner

- **PR 5 of @titayaaa:** [Link](https://github.com/titayaaa/toktickit/pull/5)
  - **My comment:** ได้ตรวจสอบโครงสร้างโปรเจกต์และการติดตั้ง package สำหรับการเทสแล้ว มีไฟล์ .env.example และ .gitignore คิดว่าถูกต้องตามที่ Issue1 ต้องการครับ Good Girl!
- **PR 7 of @jejaebubu:** [Link](https://github.com/jejaebubu/toktickit/pull/7)
  - **My comment:** การสร้างโมเดล Category และการเขียน Seed ด้วย upsert ทำได้ถูกต้องสมบูรณ์แบบเลยครับ แต่ว่ายังขาดโฟลเดอร์ server/prisma/migrations/ ไปครับ น่าจะลืม git add โฟลเดอร์นี้ รบกวน push โฟลเดอร์ migrations เพิ่มเข้ามาหน่อยนะครับ
  - **Partner's response:** แก้ไขแล้ว ได้รัน npx prisma migrate dev --name init ต่อ PostgreSQL จริง แล้ว commit โฟลเดอร์ขึ้นมาแล้ว ขอบคุณที่ช่วยเช็คน้าา (Approve ให้เรียบร้อย)
- **PR 6 of @lmaybelgracel:** [Link](https://github.com/lmaybelgracel/TokTickit/pull/6)
  - **My comment:** เช็คโค้ดดูแล้วพบว่าใน PR นี้มีโค้ดของ Issue 2, 3, 4 ติดมาด้วยทั้งหมดเลยครับ ตามโจทย์เราต้องแตก Branch แยกทีละ Issue ครับ รบกวนย้อนโค้ดให้เหลือแค่ Project Foundation เปล่าๆ สำหรับ PR นี้ก่อนนะครับ
  - **Partner's response:** ขอบคุณมากๆ เลยนะกาน ตอนนี้คลีนโค้ดบน branch ย้อนกลับมาให้เหลือแค่ส่วน Project Foundation เพียวๆ เรียบร้อยแล้ว ฝากตรวจอีกรอบได้เลย
  - **My second comment:** ตรวจโค้ดให้ใหม่แล้วจ้า คลีนโค้ดออกไปหมดแล้ว เหลือแต่โครง Project Foundation ล้วนๆ Approve!
- **PR 9 of @chanya06:** [Link](https://github.com/chanya06/toktickit/pull/9)
  - **My comment:** โมเดล Category ถูกต้อง แนบไฟล์ Migration มาครบ และเขียน Seed จัดการข้อมูลด้วย upsert ได้ดี คิดว่าโดยรวมโอเคแล้วครับ (Approve)
- **PR 8 of @jejaebubu:** [Link](https://github.com/jejaebubu/toktickit/pull/8)
  - **My comment:** ในส่วนของโลจิกฝั่ง Backend ดึง Prisma ทำได้ดีมากครับ แต่ขอรบกวนแก้เรื่อง UI ข้อความนิดนึงครับ คิดว่าถ้าให้แสดงคำว่า 'System Status: Online' และมีหัวข้อ 'Supported Request Categories:' เพิ่มเข้าไปในไฟล์ App.tsx น่าจะดีกว่าไหมครับ
  - **Partner's response:** ขอบคุณข้อเสนอน้า ปรับ UI ตามที่แนะนำแล้ว เพิ่มหัวข้อและอัปเดต test ให้ด้วย (Approve ให้เรียบร้อย)
