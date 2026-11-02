import type { Language } from './types'

/*
 * Built-in word lists for adaptive drills. Thai covers every consonant class,
 * the floating vowels (ิ ี ึ ื ุ ู ั ำ) and all tone marks (่ ้ ๊ ๋) plus ็ and ์;
 * English covers a–z with extra q/z/x/j/k/v words.
 */

const THAI_WORDS = `
กิน ข้าว น้ำ บ้าน ไป มา ดี ใจ รัก คน เรา เขา ที่ นี่ นั่น ได้ ไม่ ใช่ มี เป็น อยู่ คือ จะ ให้ กับ และ
หรือ แต่ ว่า ถ้า เมื่อ ทำ งาน เรียน รู้ เห็น ฟัง พูด อ่าน เขียน เดิน วิ่ง นั่ง นอน ตื่น ซื้อ ขาย ใหม่ เก่า
ใหญ่ เล็ก มาก น้อย สวย ร้อน หนาว เย็น สุข สนุก ง่าย ยาก เร็ว ช้า ใกล้ ไกล เช้า คืน วัน ปี เดือน เวลา
พ่อ แม่ พี่ น้อง เพื่อน ครู หมอ ร้าน ตลาด ถนน รถ เรือ ป่า ทะเล ภูเขา ฝน ลม ไฟ ดิน หิน ไม้ ดอก ผัก
ปลา ไก่ หมู นก แมว หมา ช้าง ม้า วัว ควาย ข่าว หนังสือ โต๊ะ เก้าอี้ ประตู ห้อง ครัว ทุ่ง นา สวน ท้อง
ฟ้า เมฆ ดาว จันทร์ ภาษา ไทย ความ สำคัญ จำ คำ ทำไม ฉัน ผม คุณ ด้วย ช่วย ค่ะ ครับ ก๋วยเตี๋ยว
เดี๋ยว ตั๋ว จ๋า ก็ หญิง ชาย ฉลาด ซ้าย ขวา ฆ่า ระฆัง ศึกษา ธง ภาพ ฝัน ฟัน ถาม ผ้า กีฬา ฤดู กฎ ฐาน
ปฏิบัติ ผู้เฒ่า ญาติ เณร ห่วง หมื่น ล้าน พัน ร้อย สิบ หนึ่ง สอง สาม สี่ ห้า หก เจ็ด แปด เก้า อร่อย
หวาน เค็ม เปรี้ยว ขม เผ็ด ส้ม กล้วย มะม่วง แตงโม ทุเรียน ฮา นกฮูก โอ่ง เอว แก้ว จาน ช้อน ส้อม
`

const ENGLISH_WORDS = `
the be to of and a in that have it for not on with he as you do at this but his by from they we say
her she or an will my one all would there their what so up out if about who get which go me when make
can like time no just him know take people into year your good some could them see other than then now
look only come its over think also back after use two how our work first well way even new want because
any these give day most us is was are been has had were said did made find long down very still own
place great quick brown fox jumps lazy dog zebra quiz jazz box six next text quite equal queen square
judge just enjoy object major join keep kind black knock walk voice give every never seven over above
puzzle size zero frozen amaze extra mix wax exact fix quality question unique request liquid require
practice typing keyboard finger rhythm accuracy speed steady focus calm breathe simple small light
`

const toWordList = (raw: string): readonly string[] => [...new Set(raw.trim().split(/\s+/))]

export const DRILL_DICTIONARY: Readonly<Record<Language, readonly string[]>> = {
  th: toWordList(THAI_WORDS),
  en: toWordList(ENGLISH_WORDS),
}
