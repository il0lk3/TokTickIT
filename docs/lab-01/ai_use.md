# Lab 1 — AI Use and Reflection  

I used the Antigravity coding agent. I mainly used Gemini 2.0 Flash as the LLM with a thinking level of Medium.

**Selected Key Prompts:**

| Prompt Name | Actual Prompt Text |
|-------------|--------------------|
| **Git and Branching Workflow** | "คำสั่ง Git ที่ใช้สร้าง branch ใหม่สำหรับ Issue1 คืออะไรอะ commit my changes, and push it to the github "<br><br>**My Reflection:** ตอนแรกผมยังไม่ค่อยแน่ใจกับคำสั่ง Git เวลาแตก Branch เลยได้ศึกษาคำสั่งที่ใช้เกี่ยวกับ Git มาครบ และทำให้เข้าใจลำดับการ Commit และ Push มากขึ้น |
| **Fixing Issue 2 Feedback** | "มีเพื่อนมารีวิวให้ว่า 'Add an else condition for online: false' ควรแก้ไขฟังก์ชัน checkSystem() ใน App.tsx ยังไงดีอะ"<br><br>**My Reflection:** ต้องเอาข้อความรีวิวของเพื่อนมาใส่ให้ครบ AI ถึงจะเข้าใจ Context และช่วยแก้โค้ด Error ได้ตรงจุดมาก ๆ |
| **GitHub PR Management** | "How can I dismiss or remove an old approval from a reviewer on a GitHub Pull Request after making new changes"<br><br>**My Reflection:** เนื่องจากเพื่อน review มาให้ผม แต่ผมยังไม่ได้แก้ไขและตอบกลับอะไรไปเลย แล้วเพื่อนก็ approve มาให้เลยอีกรอบ ทำให้สถานะ PR ดูแปลกๆ ผมเลยมาถาม AI |
| **Database Docker Setup** | "Can you create a docker-compose.yml file to run a PostgreSQL database for this project? Please expose it on port 5435."<br><br>**My Reflection:** เวิร์คตั้งแต่ครั้งแรก เพราะระบุ Port ที่ต้องการไปในคำสั่งชัดเจน ทำให้ได้ไฟล์พร้อมรันทันที |
| **Addressing Clean Code** | "เพื่อนที่มารีวิวแนะนำว่าให้ลบข้อความ TODO และคำสั่ง console.log ที่ไม่ได้ใช้งานออก ทำแบบนี้ดีไหมอะ ควรลบออกก่อนที่จะ merge ไหม"<br><br>**My Reflection:** การแนบรีวิวของเพื่อนให้ AI วิเคราะห์ ช่วยคอนเฟิร์มว่าการลบโค้ดขยะ (TODO) เป็น Best practice ที่ควรทำ |
| **Verifying Outdated Reviews** | "มี review issue4 มาอีกกกกกก 
โดยรวมทำได้ครบทั้งฝั่ง API และ UI และมีการเพิ่ม test สำหรับกรณี Online/Offline ด้วย แต่ใน client/src/api.ts ตรง return { online: true, categories: [] }; ยังอยู่ก่อน fetch("/api/categories") ทำให้ function return ออกไปก่อน และโค้ด fetch ด้านล่างจะไม่ถูกเรียก แนะนำให้ลบ return ตัวเดิมออก เพื่อให้สามารถดึง category จาก API มาแสดงผลได้จริง
คือ รีวิวเหมือนที่แก้ไปก่อนหน้านี้เลยปะ ช่วยดูหน่อย"<br><br>**My Reflection:** เพื่อตรวจสอบสถานะโค้ดปัจจุบันว่าอัปเดตแล้ว แทนที่จะให้ AI แก้โค้ดซ้ำ เนื่องจากก่อนหน้ามีเพื่อนมารีวิวให้แก้ไข ซึ่งแก้ไปแล้วเรียบร้อย แต่มีเพื่อนอีกคนมารีวิวให้แก้ในเรื่องเดิมอีก |
| **Generating Peer Review Logs** | "Please format these raw peer review comments into a Markdown structure for my docs/lab-01/reviewer.md file."<br><br>**My Reflection:** ป้อนข้อมูลดิบไปแล้ว AI จัดตารางให้ในครั้งเดียว ถือว่าช่วยประหยัดเวลาทำเอกสารได้เยอะมาก |
| **Improving API Tests** | "เพื่อนที่มารีวิวอยากให้เพิ่มกรณีทดสอบสำหรับข้อผิดพลาดของ API และตรวจสอบว่าการตอบกลับมี 'id' และ 'name' อยู่ด้วย ชั้นจะอัปเดต categories.test.ts โดยใช้ Supertest ได้ยังไงอะ"<br><br>**My Reflection:** ผลลัพธ์ทำงานได้ดี แต่สอนให้รู้ว่าตอนสั่งควรระบุเงื่อนไขให้ชัดเจนว่าต้องการให้แก้โค้ดที่ไฟล์ไหนบ้าง |