# Lab 1 — Peer Review Record  (fill this in)

**Author:** ธนากร พหุลรัตน์ 67070505204 @il0lk3
**Peer reviewer:** Multiple Classmates

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| PR 5 | feature/1-project-foundation | Approved |
| PR 6 | feature/2-health-check | Changes requested -> Approved |
| PR 7 | feature/3-category-seed | Changes requested -> Approved |
| PR 8 | feature/4-category-list | Changes requested -> Approved |

### หลักฐานที่เพื่อนตรวจ/อนุมัติ PR ของเรา

**PR5: Feature 1: Project Foundation** ลิ้งค์ [https://github.com/il0lk3/TokTickIT/pull/5](https://github.com/il0lk3/TokTickIT/pull/5)
- **Reviewer1:** ฑิตญา ผ่องสกุล 67070505217 @titayaaa
    - **Approve:** This PR cleanly accomplishes the goal of setting up the project foundation, project structure, TypeScript compiler settings, test harnesses, and initial stubs.

**PR6: Feature 2: Health Check** ลิ้งค์ [https://github.com/il0lk3/TokTickIT/pull/6](https://github.com/il0lk3/TokTickIT/pull/6)
- **Reviewer1:** พัฒนาวดี แสงเงินยอด 67070505222 @jejaebubu
    - **Review:** หากในอนาคต checkSystem() คืนค่าเป็น { online: false } โดยไม่โยน Error (throw) ออกมา จะทำให้ setState("success") ไม่ทำงาน และ setState("error") ก็ไม่ถูกเรียกเช่นกัน ปุ่มจะค้างสถานะเป็น "loading" ตลอดไป แนะนำให้เติม else เพื่อรองรับกรณี online: false
    - **เราตอบกลับว่า:** ขอบคุณมากครับลืมนึกถึงเคสนี้ไปเลย ตอนนี้เติม else เพื่อเช็คกรณีที่ online: false ให้เซ็ตสถานะเป็น error เรียบร้อยแล้วครับ ลองตรวจดูอีกรอบได้เลยย
    *(ได้ทำการแก้ไขและตอบกลับเรียบร้อย และพัฒนาวดีได้ Approve ให้)*

**PR7: Feature 3: Category Seed** ลิ้งค์ [https://github.com/il0lk3/TokTickIT/pull/7](https://github.com/il0lk3/TokTickIT/pull/7)
- **Reviewer1:** พัฒนาวดี แสงเงินยอด 67070505222 @jejaebubu
    - **Approve(ให้คำแนะนำ):** โดยรวมการทำงานของ Issue 3 เริ่ดมากค่ะครบตาม Acceptance Criteria ทั้งการสร้าง Category model, migration และการ seed ข้อมูลทั้ง 4 categories การใช้ upsert ทำให้สามารถรัน seed ซ้ำได้โดยไม่เกิดข้อมูลซ้ำ ซึ่งตรงตาม requirement เลย
    - **ข้อเสนอแนะเล็กน้อย:** แนะนำให้ลบข้อความ TODO และ console.log ที่เกี่ยวกับการ implement category seed ออกจากไฟล์ seed เนื่องจากฟีเจอร์นี้ทำเสร็จแล้ว จะช่วยให้โค้ดเรียบร้อยและไม่ทำให้เข้าใจว่ายังมีงานที่ต้องทำอยู่จ้า
    - **เราตอบกลับว่า:** จริงด้วยครับการลบโค้ดที่ไม่ใช้แล้ว หรือพวกคอมเมนต์ TODO ทิ้งหลังจากที่เราทำเสร็จแล้ว ถือเป็น Best Practice ที่ดีมากๆ ขอบคุณสำหรับคำแนะนำครับ ทำตามคำแนะนำเรียบร้อยแล้วจ้า

- **Reviewer2:** ภัทร์ธิดาวดี อุ่นคำ 67070505225 @phatthidawadi
    - **Approve:** ตรวจสอบโค้ด Feature 3 แล้วว สร้างโมเดล Category ได้ถูกต้อง มีไฟล์ Migration มาครบ และ Seed ใช้ upsert จัดการข้อมูลได้ปลอดภัยดีมากจ้า Slayyyy

- **Reviewer3:** ชัญญา พูลเขตกิจ 67070501058 @chanya06
    - **Approve(ให้คำแนะนำ):** จากรายละเอียด PR มีการเพิ่มส่วนของ database schema และ seed script สำหรับ Category ตามขอบเขตของ Issue 3 เบื้องต้นไม่พบปัญหาจากรายละเอียดของ PR แต่แนะนำให้ตรวจสอบเพิ่มเติมว่า
      - Category มี field id, name และ createdAt ครบถ้วน
      - name กำหนดเป็น unique
      - seed สร้างข้อมูลครบ 4 categories และไม่สร้างข้อมูลซ้ำเมื่อรันซ้ำ
      - migration สามารถทำงานกับฐานข้อมูลได้ถูกต้อง

- **Reviewer4:** ปทิตญา แก้ววิเชียร 67070505220 @lmaybelgracel
    - **Approve(ให้คำแนะนำ):** กานทำส่วน Category Seed ได้ค่อนข้างครบเลย ทั้งการเพิ่ม Category model, migration และ seed data ทำให้โครงสร้างฐานข้อมูลชัดเจนและสามารถนำไปใช้ต่อกับ feature อื่น ๆ ได้ ชอบตรงที่ใช้ upsert ในการ seed เพราะช่วยป้องกันข้อมูล category ซ้ำเวลารัน seed หลายครั้งได้ด้วย
    - **ส่วนที่อยากแนะนำเพิ่มเติม:** ใน seed.ts ยังมี comment กับ console.log ที่เป็น TODO เดิมอยู่ ถึงแม้ implementation จะทำเสร็จแล้ว แนะนำให้ลบหรือแก้ข้อความให้ตรงกับสิ่งที่ทำเสร็จแล้ว จะทำให้โค้ดดูเรียบร้อยและไม่ทำให้คนที่มาอ่านเข้าใจว่างานยังไม่เสร็จ นอกจากนี้ถ้าเพิ่มรายละเอียดวิธีรัน migration/seed ไว้ใน README อีกนิด จะช่วยให้เพื่อนในทีมสามารถ setup และทดสอบส่วนนี้ได้ง่ายขึ้นครับ โดยรวมงานตรงตาม feature และต่อยอดได้ดีเลย
    - **เราตอบกลับว่า:** อัปเดตวิธี setup Database และวิธีรัน Migration/Seed ไว้ในไฟล์ README.md ให้เรียบร้อยแล้วน้า เผื่อใครเอาไปรันต่อจะได้ทำตามสเต็ปนี้ได้เลย ขอบคุณสำหรับคำแนะนำดีๆ จ้า^^

**PR8: Feature 4: Category List Display** ลิ้งค์ [https://github.com/il0lk3/TokTickIT/pull/8](https://github.com/il0lk3/TokTickIT/pull/8)
- **Reviewer1:** พัฒนาวดี แสงเงินยอด 67070505222 @jejaebubu
    - **Review:** โดยรวมการทำ Category List ทั้งฝั่ง API และ UI โอเคเเล้ว
    แต่มีจุดที่ต้องแก้ก่อน Merge ใน client/src/api.ts คือมี return { online: true, categories: [] } อยู่ก่อนการเรียก fetch("/api/categories") ทำให้ฟังก์ชัน return ออกไปก่อน และ API /api/categories จะไม่ถูกเรียกจริง
    แล้วก็ใน App.test.tsx และ categories.test.ts ยังมี todo ที่ซ้ำกับ test ที่ implement แล้ว แนะนำให้ลบ todo ที่ไม่จำเป็นออกเพื่อให้ test file เรียบร้อยขึ้นนะ แก้จุดหลักนี้แล้วลองรัน test และทดสอบหน้าเว็บอีกทีน่าจะโอเคเลย
    - **เราตอบกลับว่า:** จัดการลบคอมเมนต์ TODO ในไฟล์เทสต์ออกให้หมดแล้วนะจ๊ะ ส่วนเรื่อง return ดักใน api.ts ตรงนี้อัปเดตโค้ดล่าสุดแก้ไปแล้ว ตอนนี้รันเทสต์ผ่านแล้วครับ
    *(ได้ทำการแก้ไขและตอบกลับเรียบร้อย และพัฒนาวดีได้ Approve ให้)*
- **Reviewer2:** ชัญญา พูลเขตกิจ 67070501058 @chanya06
    - **Review:** ตรวจสอบ PR Feature 4: Category List Display แล้ว พบจุดที่ควรแก้ก่อน Approve ดังนี้
    ใน client/src/api.ts ยังมี return { online: true, categories: [] }; อยู่ก่อนโค้ด fetch("/api/categories") ทำให้โค้ดส่วน fetch ไม่ถูกเรียกใช้งานจริง ควรลบ return เดิมออก เพื่อให้ API สามารถดึง categories จาก backend ได้
    ใน server/tests/lab-01/categories.test.ts ยังมี describe.todo(), it.todo() และ expect(true).toBe(true) จากโค้ดเดิมค้างอยู่ และมี test ใหม่ซ้อนอยู่ภายใน TODO block ควรจัดโครงสร้างให้เหลือ test ที่ใช้งานจริงเพียงชุดเดียว
    ใน client/tests/lab-01/App.test.tsx มีการ import describe ซ้ำ และยังมี TODO test เดิมค้างอยู่ ควรลบส่วนที่ไม่ใช้งานออกเพื่อให้ test สะอาดและชัดเจน
    แนะนำให้แก้ 3 จุดนี้ก่อน แล้วค่อยรัน test ใหม่อีกครั้ง
    - **เราตอบกลับว่า:** พอดีผมเพิ่งอัปเดต Commit ล่าสุดไปเมื่อกี้เลยคับ เข้าไปแก้พวกรีเทิร์นดักใน api.ts และลบ TODO ออกหมดแล้วด้วย ลองรีเฟรชหน้า PR แล้วเช็ค Commit ล่าสุดดูอีกทีนะครับ ขอบคุณมากน้าา
    *(ได้ทำการแก้ไขและตอบกลับเรียบร้อย และชัญญาได้ Approve ให้)*
- **Reviewer3:** ภัทร์ธิดาวดี อุ่นคำ 67070505225 @phatthidawadi
    - **Review:** โดยรวมทำได้ครบทั้งฝั่ง API และ UI และมีการเพิ่ม test สำหรับกรณี Online/Offline ด้วย
    - **แต่ใน client/src/api.ts ตรง return { online: true, categories: [] }; ยังอยู่ก่อน fetch("/api/categories") ทำให้ function return ออกไปก่อน และโค้ด fetch ด้านล่างจะไม่ถูกเรียก แนะนำให้ลบ return ตัวเดิมออก เพื่อให้สามารถดึง category จาก API มาแสดงผลได้จริง
    - **เราตอบกลับว่า:** อันนี้เราเพิ่งอัปเดตแก้ไปใน Commit ล่าสุดเมื่อกี้นี้เลยครับ (น่าจะรีวิวสวนกันตอนที่ยังไม่ได้อัปเดต) รบกวนลองรีเฟรชหรือดึงโค้ดล่าสุดไปดูอีกรอบได้ไหมครับ ตอนนี้แก้จุดนั้นแล้วเรียบร้อย ขอบคุณมากๆ น้า
    *(ได้ทำการแก้ไขและตอบกลับเรียบร้อย และภัทร์ธิดาวดีได้ Approve ให้)*
- **Reviewer4:** ปทิตญา แก้ววิเชียร 67070505220 @lmaybelgracel
    - **Review:** กานทำ Feature 4 ได้ค่อนข้างครบ ทั้ง API, การแสดงผลฝั่ง client และมี test ทั้ง success/error
    จุดที่แนะนำให้แก้ก่อน merge คือใน client/src/api.ts มี return { online: true, categories: [] } อยู่ก่อน fetch("/api/categories") ทำให้โค้ด fetch categories ด้านล่างไม่ถูกเรียกจริง ควรแก้จุดนี้เพื่อให้ข้อมูล category จาก API ถูกนำมาแสดงผล
    นอกจากนี้ใน App.test.tsx และ categories.test.ts ยังมี it.todo / describe.todo เดิมค้างอยู่ แนะนำให้ลบออกเพราะมี test จริงเขียนไว้แล้ว จะทำให้ code ดูเรียบร้อยขึ้น
    โดยรวม implementation ตรง requirement และ test ครอบคลุมดี เหลือแก้จุด fetch กับเก็บ TODO ให้เรียบร้อยก่อน merge
    - **เราตอบกลับว่า:** อันนี้เราเพิ่งอัปเดตแก้ไปใน Commit ล่าสุดเมื่อกี้นี้เลยครับ (น่าจะรีวิวสวนกันตอนที่ยังไม่ได้อัปเดต) รบกวนลองรีเฟรชหรือดึงโค้ดล่าสุดไปดูอีกรอบได้ไหมครับ ตอนนี้แก้จุดนั้นแล้วเรียบร้อย ขอบคุณมากๆ น้า
    *(ได้ทำการแก้ไขและตอบกลับเรียบร้อย และปทิตญาได้ Approve ให้)*

- **Reviewer5:** [ชื่อเพื่อน] [รหัส] @[username]
    - **Review:** โดยรวมโอเคเลย โค้ดแยกส่วนค่อนข้างชัด แล้วก็มี test ให้ด้วย แต่คิดว่าน่าจะเพิ่ม test กรณีที่ API error แล้วก็ลองเช็ก response ให้ละเอียดขึ้นว่ามี id กับ name ครบไหม ส่วน void ที่ไม่ได้ใช้ ถ้าไม่จำเป็นก็อาจจะเอาออก จะได้ทำให้โค้ดดูสะอาดขึ้น
    - **เราตอบกลับว่า:** ขอบคุณสำหรับคำแนะนำดีๆ ครับ ตอนนี้เข้าไปลบ void ที่ไม่ได้ใช้ออกให้โค้ดดูสะอาดขึ้นแล้ว และได้เพิ่ม Test สำหรับเช็คค่า id กับ name ใน Response รวมถึงเขียน Test ตรวจสอบกรณี API Error เพิ่มเติมเรียบร้อยแล้วครับ!
    *(ได้ทำการแก้ไขและตอบกลับเรียบร้อย)*

---

## Pull Requests I reviewed for my partner

**PR ของฑิตญา ผ่องสกุล 67070505217 @titayaaa**
- ลิ้งค์ [https://github.com/titayaaa/toktickit/pull/5](https://github.com/titayaaa/toktickit/pull/5)
- **เรา Approve:** ได้ตรวจสอบโครงสร้างโปรเจกต์ (React+Vite, Express, Prisma) และการติดตั้ง package สำหรับการเทสแล้ว มีไฟล์ .env.example และ .gitignore คิดว่าถูกต้องตามที่ Issue1 ต้องการครับ Good Girl!

**PR ของพัฒนาวดี แสงเงินยอด 67070505222 @jejaebubu**
- ลิ้งค์ [https://github.com/jejaebubu/toktickit/pull/7](https://github.com/jejaebubu/toktickit/pull/7#event-29345036584)
- **เรา comment:** การสร้างโมเดล Category และการเขียน Seed ด้วย upsert ทำได้ถูกต้องสมบูรณ์แบบเลยครับ แต่ว่ายังขาดโฟลเดอร์ server/prisma/migrations/ ไปครับ น่าจะลืม git add โฟลเดอร์นี้ รบกวน push โฟลเดอร์ migrations เพิ่มเข้ามาหน่อยนะครับ จะได้ผ่าน Acceptance criteria ข้อที่บอกว่ามี migration ครับ
- **เพื่อนตอบกลับว่า:** แก้ไขแล้ว ได้รัน npx prisma migrate dev --name init ต่อ PostgreSQL จริง แล้ว commit โฟลเดอร์ server/prisma/migrations/ (20260812140427_init) ขึ้นมาแล้ว ขอบคุณที่ช่วยเช็คน้าา
*(ได้ Approve ให้เพื่อนเรียบร้อย)*

**PR ของ ปทิตญา แก้ววิเชียร 67070505220 @lmaybelgracel**
- ลิ้งค์ [https://github.com/lmaybelgracel/TokTickit/pull/6](https://github.com/lmaybelgracel/TokTickit/pull/6)
- **เรา Comment:** เช็คโค้ดดูแล้วพบว่าใน PR นี้มีโค้ดของ Issue 2, 3, 4 ติดมาด้วยทั้งหมดเลยครับ (เช่นไฟล์ health.test.ts, schema.prisma, App.tsx) ตามโจทย์ Lab 1 เราต้องแยกแตก Branch และทำ PR แยกทีละ Issue ครับ รบกวนกลับไปแยก Branch และย้อนโค้ดให้เหลือแค่ Project Foundation เปล่าๆ สำหรับ PR นี้ก่อนนะครับ
- **เพื่อนตอบกลับว่า:** ขอบคุณมากๆ เลยนะกาน
ตอนนี้คลีนโค้ดบน branch feature/1-project-foundation ย้อนกลับมาให้เหลือแค่ส่วน Project Foundation เพียวๆ สำหรับ Issue 1 ตามโจทย์เรียบร้อยแล้ว (ลบส่วนสตัดกับเทสของ Issue 2-4 ออกหมดแล้ว)
และได้เพิ่มไฟล์ .nvmrc กับอัปเดต README.md ล็อกเวอร์ชัน Node.js v20 ให้ตรงกันตามที่แนะนำเลยย ฝากตรวจอีกรอบได้เลยนะจ้ะ
- **เรา Approve:** ตรวจโค้ดให้ใหม่แล้วจ้า คลีนโค้ดส่วน Issue 2-4 ออกไปหมดแล้ว เหลือแต่โครง Project Foundation ล้วนๆ ถูกต้องตามสเปคของ Issue 1 แล้วเลย แอบเห็นว่าเพิ่ม .nvmrc ล็อกเวอร์ชัน Node ไว้ให้ด้วย เริ่ดเลยล่ะ Approve!

**PR ของ ชัญญา พูลเขตกิจ 67070501058 @chanya06**
- ลิ้งค์ [https://github.com/chanya06/toktickit/pull/9](https://github.com/chanya06/toktickit/pull/9)
- **เรา Approve:** โมเดล Category ถูกต้อง แนบไฟล์ Migration มาครบ และเขียน Seed จัดการข้อมูลด้วย upsert ได้ดี คิดว่าโดยรวมโอเคแล้วครับ

**PR ของพัฒนาวดี แสงเงินยอด 67070505222 @jejaebubu**
- ลิ้งค์ [https://github.com/jejaebubu/toktickit/pull/8](https://github.com/jejaebubu/toktickit/pull/8#event-29348639785)
- **เรา comment:** ในส่สนของโลจิกฝั่ง Backend ดึง Prisma พร้อมเรียงข้อมูลทำได้ดีมากครับ Frontend ก็จัดการ State ได้ครบถ้วนเลย 👍 แต่ขอรบกวนแก้เรื่อง UI ข้อความนิดนึงครับ คิดว่าถ้าให้แสดงคำว่า 'System Status: Online' และมีหัวข้อ 'Supported Request Categories:' ก่อนถึงรายการหมวดหมู่ เพิ่มข้อความสองส่วนนี้ในไฟล์ App.tsx น่าจะดีกว่าไหมครับ
- **เพื่อนตอบกลับว่า:** ขอบคุณข้อเสนอน้า ปรับ UI ตามที่แนะนำแล้ว (commit 2631f67)
success state แสดง System Status: Online แทนเดิม
เพิ่มหัวข้อ Supported Request Categories: ก่อนรายการหมวดหมู่ (เป็น h6)
อัปเดต test ใน App.test.tsx ให้ตรวจข้อความใหม่ด้วย
*(ได้ Approve ให้เพื่อนเรียบร้อย)*
