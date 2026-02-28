# Plan: Transforming `indicatorMath_ULTRA_Rust` into WebAssembly (Wasm) for CPU & GPU

แผนแม่บทฉบับนี้จัดทำขึ้นเพื่อเตรียมความพร้อมวิวัฒนาการขั้นต่อไปของไลบรารี `indicatorMath_ULTRA_Rust` ในการกระโดดข้ามจากระบบฝั่ง Server สู่หน้าบ้าน (Frontend) และอุปกรณ์ของผู้ใช้แบบเต็มรูปแบบ โดยตั้งเป้ารองรับการประมวลผลทั้งบน **CPU ปกติ** และ **การ์ดจอ (GPU)** บนเว็บทิพย์ผ่าน WebAssembly

---

## ⚡ กลยุทธ์การประมวลผลแบบขนาน (Parallelism Strategy) ในหน้าเว็บ
เนื่องจาก WebAssembly รันในเบราว์เซอร์ที่มีข้อจำกัดด้าน Thread (ไม่เหมือนบน Server ที่ใช้ `tokio` หรือ `rayon` ได้ตรงๆ) เราจึงวางแผนจะใช้ 2 แนวทางนี้เพื่อเอาชนะข้อจำกัดและทำให้ระบบวิเคราะห์หลายสิบคู่เหรียญพร้อมกันได้:

1. **วิธีมาตรฐาน: ใช้ Web Workers (สำหรับงานบน CPU)**
   มอบหมายให้ JavaScript เป็นผู้สร้าง `Web Workers` (เปรียบเสมือนการเปิด CPU หลาย Core) แล้วแบ่งโหลดให้แต่ละ Worker โหลดไฟล์ Wasm ไปรันแยกกัน เช่น แบ่งให้ Worker A คำนวณ 10 เหรียญ Worker B คำนวณอีก 10 เหรียญ วิธีนี้เสถียรที่สุด ใช้ง่าย และเบราว์เซอร์ทุกเจ้าในตลาดรองรับ 100%

2. **ข้ามขีดจำกัด: ใช้ WebGPU (สำหรับการคำนวณมหาศาลข้ามโลก)**
   หากโปรเจคใหญ่ถึงขั้นจะประมวลผล 1,000 คู่เหรียญพร้อมกันในหน้าจอเดียว เราจะไม่พึ่ง CPU แล้ว แต่จะเขียนอัลกอริทึมส่งตรงเข้า **การ์ดจอ (GPU)** เพื่อทำขนานแบบ Parallel Array ให้จบในเสี้ยววินาที

---

## 🎯 Phase 1: Wasm For CPU (นำสิ่งที่สร้างไว้ไปสู่ผู้ใช้ทันที)
**ความยาก: 🟢 ต่ำ-ปานกลาง** | **เป้าหมาย:** นำลอจิกคณิตศาสตร์และการประมวลผล Tick/Candle แบบปัจจุบัน ไปฝังลงในหน้าเว็บโดยให้ Browser (JS) เรียกใช้งานได้โดยตรง

### เครื่องมือที่ต้องใช้ (Tech Stack):
- `wasm-pack` (เครื่องมือช่วย Build)
- `wasm-bindgen` (คู่หูที่ช่วยแปลง Rust Struct/Function เป็น JavaScript Interface)

### ขั้นตอนการดำเนินงาน:
1. **เตรียม `Cargo.toml` ใหม่:**
   เพิ่ม Setting บอก Compiler ให้รู้ว่านี่จะเป็นไลบรารีแบบ Dynamic สำหรับแปลงเป็นระบบอื่น:
   ```toml
   [lib]
   crate-type = ["cdylib", "rlib"]

   [dependencies]
   wasm-bindgen = "0.2"
   ```
2. **สร้าง Wasm Wrapper API:**
   ครอบฟังก์ชันและ Struct ที่มีอยู่ด้วยมาโคร `#[wasm_bindgen]` เพื่อให้ฝั่ง JavaScript มองเห็นและเรียกใช้ตัวแปรต่างๆ ของ Rust ได้ เช่น:
   ```rust
   use wasm_bindgen::prelude::*;

   #[wasm_bindgen]
   pub struct WasmAnalysisGenerator {
       internal: AnalysisGenerator,
   }

   #[wasm_bindgen]
   impl WasmAnalysisGenerator {
       #[wasm_bindgen(constructor)]
       pub fn new(...) -> WasmAnalysisGenerator { ... }

       pub fn append_tick(&mut self, price: f64, time: u64) -> JsValue { ... }
   }
   ```
3. **จัดโครงสร้างระบบ (Re-architecture):**
   - **หยุด** ให้ Rust เป็นตัวดึง WebSocket ตรงๆ เนื่องจากในโลกหน้าเว็บเบราว์เซอร์ การจัดการคิว Network ทำบน JS จะเสถียรและราบรื่นกว่า 
   - ให้ฝั่ง **JavaScript/TypeScript** เป็นผู้รับผิดชอบการต่อคิวเว็บซ็อกเก็ต `wss://...` แล้วโยนเพียงกระแสข้อมูลราคา (Tick Data) เข้าสู่ท่อ Wasm ฟังก์ชัน `append_tick` ให้ Rust คายผลลัพธ์อินดิเคเตอร์ออกมาโชว์ขึ้นกราฟแทน

---

## 🚀 Phase 2: Wasm For GPU (รีดเร้นพลังกราฟิก พลิกอุตสาหกรรมการคำนวณ)
**ความยาก: 🔴 สูง** | **เป้าหมาย:** นำการคำนวณแท่งเทียนลึกลงระดับ 10,000 แท่งพร้อมกัน หรือกว่า 1,000 คู่เหรียญ (ฉบับ Batch Array) โยนเข้าการ์ดจอผู้เล่นให้จบใน 1 มิลลิวินาที

แทนที่จะวนลูปทำทีละตัว หรือพึ่ง CPU ที่มีคอร์จำกัด เราจะใช้เทคโนโลยี **WebGPU**

### เครื่องมือที่ต้องใช้ (Tech Stack):
- `wgpu` (WebGPU implementation ใน Rust)
- `WGSL` (WebGPU Shading Language - ภาษาสำหรับคุยกับ GPU)

### ขั้นตอนการดำเนินงาน:
1. **วิเคราะห์สิ่งที่ควรลง GPU:**
   - แบบ "เรียลไทม์ 1 Tick ล่าสุด" (Incremental) **ไม่เหมาะสม** กับ GPU เพราะการรับส่งตัวเลข 1 ตัวระหว่า CPU/GPU จะมีคอขวด 
   - การคำนวณประวัติศาสตร์แบบหลายพันแท่ง (History Batching เช่น ดึงประวัติมาย้อนหลังเปิดจอเทรด) คือจุดที่ **สมบูรณ์แบบ**
2. **เขียน Compute Shaders (WGSL):**
   แปลงสูตรคณิตศาสตร์ก้อนโตจาก Rust (อย่าง EMA, RSI, Bollinger Bands) ไปเป็นภาษา Shader เช่น:
   ```wgsl
   @group(0) @binding(0) var<storage, read> prices: array<f32>;
   @group(0) @binding(1) var<storage, read_write> ema_result: array<f32>;

   @compute @workgroup_size(64)
   fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
       let curr_idx = global_id.x;
       // ... ลอจิกการทอนน้ำหนักแบบขนานอิสระ ... 
   }
   ```
3. **จัดตั้ง GPGPU Pipeline ใน Rust (`wgpu`):**
   - เขียนโค้ด Rust ส่งอาร์เรย์ OHLC เข้าไปใน GPU Buffer Memory
   - สั่งให้เกิดการบรรจุงาน (Dispatch Compute Workgroups) ตามจำนวนข้อมูลที่มี
   - ดูดผลลัพธ์ตาราง EMA, RSI ก้อนมหึมากลับมาในเสี้ยววิ

---

## 🧭 ลำดับความสำคัญที่แนะนำสำหรับวันหน้า (Roadmap)
- [ ] **Step 1:** เพิ่มฟีเจอร์ Wasm CPU แบบพื้นฐาน เพื่อให้สามารถทดลองรันตัวคำนวณกราฟในโปรเจค React/Vue ใดๆ แบบเบาหวิวได้ทันที
- [ ] **Step 2:** สร้างหน้า Dashboard โชว์ผลของ Wasm ดูว่าเฟรมเรทหรือเมมโมรี่ไหวไหม 
- [ ] **Step 3:** หากต้องทำเว็บไซต์รวมศูนย์ที่ดูสัญญาณทุกเหรียญในโลกคริปโต 5,000 คู่พร้อมกัน ค่อยพัฒนาโหมด GPU แยกออกมาอีกหนึ่ง Module เพื่อความข้นคลั่กของอารยธรรม!
