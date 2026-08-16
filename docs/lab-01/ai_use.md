# Lab 1 — AI Use and Reflection  

I used the Antigravity coding agent. I mainly used Gemini 2.0 Flash as the LLM with a thinking level of Medium.

**Selected Key Prompts:**

| Prompt Name | Actual Prompt Text |
|-------------|--------------------|
| **Git and Branching** | "วิธีอัพ issue1 ขึ้น github"<br><br>**My Reflection:** ตอนแรกผมยังไม่ค่อยแน่ใจกับคำสั่ง Git เวลาแตก Branch เลยได้ศึกษาคำสั่งที่ใช้เกี่ยวกับ Git มาครบ  และทำให้เข้าใจลำดับการ Commit และ Push มากขึ้น |
| **Fixing Issue 2 Feedback** | "issue 2 มีเพื่อนมา review ให้แก้... ช่วยแก้หน่อย"<br><br>**My Reflection:** ต้องเอาข้อความรีวิวของเพื่อนมาใส่ให้ครบ AI ถึงจะเข้าใจ Context และช่วยแก้โค้ด Error ได้ตรงจุดมาก ๆ |
| **GitHub PR Management** | "ลบ approve อันเก่าได้ปะ"<br><br>**My Reflection:** เนื่องจากเพื่อน review มาให้ผม แต่ผมยังไม่ได้แก้ไขและตอบกลับอะไรไปเลย แล้วเพื่อนก็ approve มาให้เลยอีกรอบ ทำให้สถานะ PR ดูแปลกๆ ผมเลยมาถาม AI |
| **Database Docker Setup** | "สร้างเป็น docker compose ให้หน่อยได้ปะ (Port 5435)"<br><br>**My Reflection:** เวิร์คตั้งแต่ครั้งแรก เพราะระบุ Port ที่ต้องการไปในคำสั่งชัดเจน ทำให้ได้ไฟล์พร้อมรันทันที |
| **Addressing Issue 3 Clean Code** | "เพื่อนมีแนะนำมานิดหน่อย แนะนำให้ลบข้อความ TODO และ console.log ที่เกี่ยวกับการ implement category seed ออกจากไฟล์ seed เนื่องจากฟีเจอร์นี้ทำเสร็จแล้ว จะช่วยให้โค้ดเรียบร้อยและไม่ทำให้เข้าใจว่ายังมีงานที่ต้องทำอยู่จ้า ทำตามดีไหม (Issue 3)"<br><br>**My Reflection:** การแนบรีวิวของเพื่อนให้ AI วิเคราะห์ ช่วยคอนเฟิร์มว่าการลบโค้ดขยะ (TODO) เป็น Best practice ที่ควรทำ |
| **Verifying Outdated Reviews** | "มี review issue4 มาอีกกกกกก โดยรวมทำได้ครบทั้งฝั่ง API และ UI และมีการเพิ่ม test สำหรับกรณี Online/Offline ด้วย แต่ใน client/src/api.ts ตรง return { online: true, categories: [] }; ยังอยู่ก่อน fetch("/api/categories") ทำให้ function return ออกไปก่อน และโค้ด fetch ด้านล่างจะไม่ถูกเรียก แนะนำให้ลบ return ตัวเดิมออก เพื่อให้สามารถดึง category จาก API มาแสดงผลได้จริง "<br><br>**My Reflection:** เพื่อตรวจสอบสถานะโค้ดปัจจุบันว่าอัปเดตแล้ว แทนที่จะให้ AI แก้โค้ดซ้ำ เนื่องจากก่อนหน้ามีเพื่อนมารีวิวให้แก้ไข ซึ่งแก้ไปแล้วเรียบร้อย แต่มีเพื่อนอีกคนมารีวิวให้แก้ในเรื่องเดิมอีก |
| **Generating Peer Review Logs** | "หลักฐานการ Peer Review ของไฟล์ docs/lab-01/reviewer.md น่าจะต้องมีข้อมูลตามนี้นะ"<br><br>**My Reflection:** ป้อนข้อมูลดิบไปแล้ว AI จัดตารางให้ในครั้งเดียว ถือว่าช่วยประหยัดเวลาทำเอกสารได้เยอะมาก |
| **Improving API Tests (Issue 4)** | "รีวิวจากเพื่อน - ... เพิ่ม test กรณีที่ API error แล้วก็เช็ก response ว่ามี id กับ name ครบไหม"<br><br>**My Reflection:** ผลลัพธ์ทำงานได้ดี แต่สอนให้รู้ว่าตอนสั่งควรระบุเงื่อนไขให้ชัดเจนว่าต้องการให้แก้โค้ดที่ไฟล์ไหนบ้าง |