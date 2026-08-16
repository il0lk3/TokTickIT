# Lab 1 — Test Plan and Evidence  

**โฟลเดอร์ที่เก็บไฟล์เทสต์:** ไฟล์เทสต์ทั้งหมดอยู่ในโฟลเดอร์ `server/tests/lab-01/` และ `client/tests/lab-01/`

### ตารางสรุปรายการ Test Cases (Test Plan)

| Test File | Tool | Test Description |
|-----------|------|------------------|
| `server/tests/lab-01/health.test.ts` | Supertest | **API-01:** ทดสอบ Endpoint `/api/health` ต้องคืนค่าสถานะ HTTP 200 พร้อม JSON `{ "status": "ok", "service": "TokTickIT API" }` |
| `server/tests/lab-01/categories.test.ts` | Supertest | **API-02:** ทดสอบ Endpoint `/api/categories` ต้องดึงข้อมูลทั้ง 4 หมวดหมู่ที่ Seed ไว้จาก Database ออกมาได้ถูกต้อง |
| `client/tests/lab-01/App.test.tsx` | Vitest | **UI-01:** ทดสอบการ Render แสดงผลส่วนหัวข้อ TokTickIT บนหน้าเว็บ |
| `client/tests/lab-01/App.test.tsx` | Vitest | **UI-02:** ทดสอบสถานะ Loading ขณะร้องขอข้อมูล และการเปลี่ยนไปแสดงผลรายการ Categories เมื่อสำเร็จ |
| `client/tests/lab-01/App.test.tsx` | Vitest | **UI-03:** ทดสอบกรณี API ทำงานล้มเหลว (Failure) หน้าเว็บจะต้องแสดงข้อความ Error แจ้งเตือนที่เหมาะสม |

### หลักฐานผลการรัน (Passing Terminal Output)
ผลลัพธ์ข้อความจาก Terminal เพื่อยืนยันว่าการรันเทสต์ทั้งหมดผ่านครบถ้วนบน Branch main:

```
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 /Users/karn/Downloads/toktickit/server
 ✓ tests/lab-01/health.test.ts (1 test) 9ms
 ✓ tests/lab-01/categories.test.ts (1 test) 94ms

 Test Files  2 passed (2)
      Tests  3 passed (3)

> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 /Users/karn/Downloads/toktickit/client
 ✓ tests/lab-01/App.test.tsx (3 tests) 22ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```
