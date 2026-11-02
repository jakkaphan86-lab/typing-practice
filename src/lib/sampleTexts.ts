import type { Language } from './types'

export interface SampleText {
  /** Short label for the language switch. */
  label: string
  title: string
  text: string
}

/** Built-in fallback passages, long enough to span several static blocks. */
export const SAMPLE_TEXTS: Readonly<Record<Language, SampleText>> = {
  th: {
    label: 'ไทย',
    title: 'ฝึกพิมพ์สัมผัส (ตัวอย่าง)',
    text: `การฝึกพิมพ์สัมผัสอย่างสม่ำเสมอจะช่วยให้คุณพิมพ์ได้เร็วและแม่นยำมากขึ้น
      เริ่มต้นด้วยการวางนิ้วบนแป้นเหย้าให้ถูกตำแหน่ง แล้วค่อย ๆ เพิ่มความเร็วทีละน้อย
      อย่าก้มมองแป้นพิมพ์ระหว่างพิมพ์ ให้เชื่อมั่นในความจำของกล้ามเนื้อ
      เมื่อพิมพ์ผิดให้หยุดสักครู่ แล้วแก้ไขอย่างใจเย็น ความแม่นยำสำคัญกว่าความเร็วเสมอ
      เพราะความเร็วจะตามมาเองเมื่อนิ้วของคุณคุ้นเคยกับตำแหน่งของตัวอักษรทุกตัว
      การฝึกวันละสิบห้านาทีอย่างต่อเนื่องดีกว่าการฝึกนานหลายชั่วโมงเพียงครั้งเดียว
      ลองตั้งเป้าหมายเล็ก ๆ ในแต่ละวัน แล้วคุณจะประหลาดใจกับพัฒนาการของตัวเอง`,
  },
  en: {
    label: 'EN',
    title: 'Touch typing (sample)',
    text: `Touch typing is a skill that rewards patience more than speed. Rest your
      fingers on the home row, keep your eyes on the screen, and let each key find
      its own rhythm. Accuracy comes first, because speed follows naturally once
      your hands stop second-guessing themselves. Short, focused sessions every day
      beat a single marathon on the weekend. Notice which letters slow you down,
      practice them on purpose, and before long the keyboard will feel like an
      extension of your thoughts rather than an obstacle between them and the page.`,
  },
}
