"""Visible bilingual teaching points aligned to the complete live-quiz bank.

Keep slide indices stable for saved progress and the illustrated lesson stages.
The examples expand the explanation; assessed facts also appear in the main body.
"""

# Each entry is (English body, Thai body, assessed topic identifiers).
CURRICULUM={
    'thai-astrology':[
        ('A Thai horoscope records the sky at one moment: a birth, a city foundation, or a temple’s founding. Read the zodiac sector first, then identify the planetary symbols inside it.',
         'ดวงแบบไทยบันทึกท้องฟ้า ณ ช่วงเวลาหนึ่ง ใช้ได้ทั้งเวลาเกิด การตั้งเมือง และการสร้างวัด เริ่มอ่านจากราศี แล้วจึงดูสัญลักษณ์ดาวภายในราศีนั้น', []),
        ('The ecliptic is the Sun’s apparent annual path across the sky as seen from Earth. Divide its 360° circle into 12 equal zodiac sectors: each sign spans 30°. The Moon and planets are recorded against this same reference.',
         'สุริยวิถีคือเส้นทางปรากฏของดวงอาทิตย์บนท้องฟ้าในรอบปี เมื่อมองจากโลก วงกลม 360° แบ่งเป็น 12 ราศีเท่า ๆ กัน ราศีละ 30° ใช้เป็นแนวอ้างอิงตำแหน่งจันทร์และดาวเคราะห์ด้วย', ['astro-ecliptic','astro-sector-width']),
        ('Each zodiac sign spans 30°; real constellations have unequal sizes. The order begins Aries → Taurus → Gemini. Select a sign to explore its longitude range.',
         'ราศีเป็นส่วนกว้าง 30° เท่ากัน แต่กลุ่มดาวจริงมีขนาดไม่เท่ากัน ลำดับเริ่มจากเมษ → พฤษภ → เมถุน เมษอยู่ช่วง 0° ถึงก่อน 30° พฤษภ 30° ถึงก่อน 60° เลือกราศีเพื่อดูช่วงองศาและราศีถัดไป', ['astro-sign-following','astro-sign-sector']),
        ('On a horoscope, ๑ names the Sun, ๒ the Moon, ๓ Mars, and ๔ Mercury. In an ordinary number, these same symbols mean 1, 2, 3, and 4. Decide whether the context is a chart or a quantity before interpreting a digit.',
         'บนดวงโหราศาสตร์ ๑ แทนอาทิตย์ ๒ แทนจันทร์ ๓ แทนอังคาร และ ๔ แทนพุธ แต่เมื่อเขียนจำนวน สัญลักษณ์เดียวกันมีค่า 1, 2, 3, 4 จึงต้องดูบริบทก่อนว่าเป็นดวงดาวหรือจำนวน', ['astro-digit-context']),
        ('Continue the planetary key: ๕ is Jupiter, ๖ is Venus, and ๗ is Saturn. A digit identifies the body; the surrounding zodiac sector identifies its sign. For example, ๖ inside Taurus means Venus is recorded in Taurus, not six planets.',
         'กุญแจดาวชุดต่อไปคือ ๕ พฤหัสบดี ๖ ศุกร์ และ ๗ เสาร์ ตัวเลขบอกชื่อดาว ส่วนราศีรอบตัวเลขบอกตำแหน่ง เช่น ๖ ในพฤษภ หมายถึงดาวศุกร์อยู่พฤษภ ไม่ใช่ดาวหกดวง', ['astro-planet-key']),
        ('๘ Rahu is the ascending lunar node; ๙ Ketu is the descending node. These orbital intersections with the ecliptic lie 180° apart. Nodes are points, rather than physical planets. The additional symbol ๐ names Uranus; Ketu must not be confused with Neptune.',
         '๘ ราหูคือโหนดจันทร์ขาขึ้น และ ๙ เกตุคือโหนดขาลง เป็นจุดตัดวงโคจรจันทร์กับสุริยวิถีที่ห่างกัน 180° โหนดเป็นจุด ไม่ใช่ดาวเคราะห์ ส่วน ๐ แทนมฤตยู และเกตุไม่ใช่ดาวเนปจูน', ['astro-nodes']),
        ('ล marks the ascendant: the sign rising on the eastern horizon. Use the birth date, local birth time, and birthplace together. It changes roughly every two hours.',
         'ล คือ ลัคนา หมายถึงราศีที่กำลังขึ้นทางขอบฟ้าทิศตะวันออก ต้องใช้วันเกิด เวลาเกิดตามเวลาท้องถิ่น และสถานที่เกิดร่วมกัน ลัคนาเปลี่ยนโดยประมาณทุกสองชั่วโมง จึงใช้เพียงวันเกิดระบุไม่ได้', ['astro-ascendant-symbol','astro-ascendant-place','astro-ascendant-inputs']),
        ('Average time per sign: Moon ≈ 2½ days; Sun ≈ one month; Saturn ≈ 2½ years. The Moon changes signs fastest of these three. Actual apparent speeds vary.',
         'เปรียบเทียบเวลาเฉลี่ยต่อหนึ่งราศี: จันทร์ประมาณ 2½ วัน อาทิตย์ประมาณหนึ่งเดือน และเสาร์ประมาณ 2½ ปี ในสามดวงนี้จันทร์เปลี่ยนราศีเร็วที่สุด ตัวเลขเป็นค่าเฉลี่ย ไม่ใช่ความเร็วคงที่ตลอดวงโคจร', ['astro-fastest-rhythm']),
        ('Wat Ram Poeng: Aries has ๑ Sun + ๓ Mars; Taurus has ๒ Moon + ๖ Venus; Gemini has ล, the ascendant. Identify the sign first, then translate its digits.',
         'อ่านบันทึกวัดร่ำเปิงโดยดูราศีก่อนแล้วแปลตัวเลข: เมษมี ๑ อาทิตย์กับ ๓ อังคาร พฤษภมี ๒ จันทร์กับ ๖ ศุกร์ และเมถุนมี ล ลัคนา ดาวสองดวงในช่องเดียวกันจึงอยู่ราศีเดียวกัน', ['astro-wat-ram-poeng']),
        ('Solar eclipse: Sun → Moon → Earth, at new Moon near a node. Lunar eclipse: Sun → Earth → Moon, at full Moon near a node. The Moon’s tilted orbit means not every new or full Moon causes an eclipse.',
         'สุริยุปราคาเรียง อาทิตย์ → จันทร์ → โลก จันทร์อยู่ระหว่างโลกกับอาทิตย์ในช่วงจันทร์ดับใกล้โหนด ส่วนจันทรุปราคาเรียง อาทิตย์ → โลก → จันทร์ ในช่วงจันทร์เพ็ญใกล้โหนด ความเอียงของวงโคจรทำให้ไม่ได้เกิดคราสทุกเดือน', ['astro-solar-eclipse']),
        ('Sky positions are calculated from a date, time, and place. Personality and life meanings are interpretations within an astrological tradition. Recognize which type of statement you are reading.',
         'การหาตำแหน่งดาวจากวัน เวลา และสถานที่เป็นการคำนวณ ส่วนการเชื่อมตำแหน่งกับบุคลิกหรือเรื่องชีวิตเป็นการตีความตามตำราโหราศาสตร์ เวลาอ่านดวงให้แยกว่าข้อความใดบอกตำแหน่ง และข้อความใดอธิบายความหมาย', ['astro-calculation-vs-meaning']),
        ('Read a chart in three steps: locate the 30° sign, translate its planetary digits, and find ล. Enter your date, local time, and birthplace to explore your chart, then try Astro Quest.',
         'ทบทวนด้วยการหาราศีกว้าง 30° แปลเลขดาว และตรวจ ล ที่ขอบฟ้าตะวันออก เมื่อต้องการสำรวจดวงของตนเอง ให้กรอกวันเกิด เวลาท้องถิ่น และสถานที่เกิด แล้วลองฝึกอ่านต่อใน Astro Quest', []),
    ],
    'thai-numerals':[
        ('Thai digits ๐–๙ represent the same values as 0–9. Changing the script changes the shapes, not the quantity or the decimal place-value system. For example, ๑๔ and 14 are two ways to write the same number.',
         'เลขไทย ๐–๙ มีค่าเดียวกับ 0–9 การเปลี่ยนรูปตัวเลขไม่ได้เปลี่ยนจำนวนหรือระบบค่าประจำหลักฐานสิบ เช่น ๑๔ และ 14 เขียนต่างรูป แต่มีค่าเท่ากัน', ['thai-script']),
        ('Read a Thai number from left to right. Match each symbol to its digit before calculating: ๐=0, ๑=1, ๒=2, ๓=3, ๔=4, ๕=5, ๖=6, ๗=7, ๘=8, ๙=9. Pay particular attention to the different shapes of ๓ and ๗.',
         'อ่านเลขไทยจากซ้ายไปขวา โดยจับคู่รูปกับค่า: ๐=0, ๑=1, ๒=2, ๓=3, ๔=4, ๕=5, ๖=6, ๗=7, ๘=8, ๙=9 สังเกตความต่างของรูป ๓ กับ ๗ ให้ชัดก่อนอ่านจำนวนหลายหลัก', []),
        ('From right to left, decimal places are 1, 10, 100, 1000. In ๒๕๖, the ๒ is in the hundreds place and contributes 200. The ๕ contributes 50, and the ๖ contributes 6: 200 + 50 + 6 = 256.',
         'ค่าประจำหลักจากขวาไปซ้ายคือ 1, 10, 100, 1000 ใน ๒๕๖ ตัว ๒ อยู่หลักร้อยจึงมีค่า 200 ตัว ๕ มีค่า 50 และ ๖ มีค่า 6 รวมเป็น 200 + 50 + 6 = 256', ['thai-decode-256','thai-hundreds']),
        ('Zero holds an empty place. In ๓๐๗, ๐ means no tens, so the value is 300 + 0 + 7 = 307. Removing it gives ๓๗ = 37: the ๓ moves from hundreds to tens. Keep zero even though it adds no value.',
         'ศูนย์รักษาหลักที่ว่าง ใน ๓๐๗ ตัว ๐ หมายถึงไม่มีหลักสิบ จึงได้ 300 + 0 + 7 = 307 ถ้าลบศูนย์จะกลายเป็น ๓๗ = 37 เพราะ ๓ ย้ายจากหลักร้อยเป็นหลักสิบ แม้ศูนย์ไม่เพิ่มค่า ก็ต้องคงตำแหน่งไว้', ['thai-zero']),
        ('First translate the Thai digits, then convert the era. For the modern Buddhist Era convention, CE = BE − 543. Thus พ.ศ. ๒๕๖๗ becomes 2567 − 543 = 2024 CE. Reversing the conversion adds 543; changing digit shapes alone does not change the era.',
         'แปลงรูปเลขไทยก่อน แล้วจึงแปลงศักราช สำหรับปี พ.ศ. แบบปัจจุบัน ใช้ ค.ศ. = พ.ศ. − 543 เช่น พ.ศ. ๒๕๖๗ → 2567 − 543 = ค.ศ. 2024 ถ้าแปลงกลับให้บวก 543 การเปลี่ยนรูปเลขอย่างเดียวไม่ใช่การเปลี่ยนศักราช', ['thai-era']),
        ('Keep every place: ๑๒๐๖ contributes 1000 + 200 + 0 + 6 = 1206. The ๐ holds the empty tens place. Check by translating each digit back into Thai.',
         'ประกอบจำนวนโดยรักษาทุกหลัก ใน ๑๒๐๖ แต่ละตัวมีค่า 1000, 200, 0 สิบ และ 6 รวมได้ 1206 ตรวจคำตอบโดยแปลงกลับเป็นเลขไทยทีละตัว และอย่าลืมศูนย์', ['thai-rebuild']),
    ],
    'mayan':[
        ('Within one Maya level, a dot is 1, a bar is 5, and the shell symbol is 0. Add the dots and bars in that level: four dots over two bars give 4 + 5 + 5 = 14. Stacked place-value levels are calculated separately.',
         'ภายในหนึ่งระดับของเลขมายา จุดมีค่า 1 ขีดมีค่า 5 และเปลือกหอยมีค่า 0 รวมจุดกับขีดในระดับเดียวกัน เช่น สี่จุดเหนือสองขีดได้ 4 + 5 + 5 = 14 ส่วนระดับค่าประจำหลักที่ซ้อนกันต้องคิดแยก', ['mayan-dotbar']),
        ('One level represents a digit from 0 to 19. Use at most four dots and three bars: 19 = 4 + 3 × 5. Five dots become a bar. At 20, start a new level above the units rather than packing another bar into the same digit.',
         'หนึ่งระดับแทนเลขได้ตั้งแต่ 0 ถึง 19 ใช้ได้ไม่เกินสี่จุดและสามขีด เช่น 19 = 4 + 3 × 5 เมื่อครบห้าจุดให้เปลี่ยนเป็นหนึ่งขีด และเมื่อครบ 20 ต้องขึ้นระดับใหม่เหนือหลักหน่วย', ['mayan-range']),
        ('Ordinary base-20 counting stacks places upward: bottom 1, next 20, next 400. Multiply each level’s digit by its place. With 2 in the upper level and 3 at the bottom, the value is 2 × 20 + 3 = 43, not 23.',
         'การนับฐานยี่สิบทั่วไปเรียงหลักจากล่างขึ้นบนเป็น 1, 20, 400 นำเลขแต่ละระดับคูณค่าประจำหลัก ถ้าชั้นบนเป็น 2 และชั้นล่างเป็น 3 จะได้ 2 × 20 + 3 = 43 ไม่ใช่ 23', ['mayan-place','mayan-43']),
        ('A shell preserves a zero level. Top 1, middle shell, bottom 4 means 1 × 400 + 0 × 20 + 4 = 404. If you remove the middle level, the top 1 shifts to the twenties place, giving 24 instead.',
         'เปลือกหอยรักษาระดับศูนย์ไว้ ชั้นบน 1 ชั้นกลางเปลือกหอย ชั้นล่าง 4 หมายถึง 1 × 400 + 0 × 20 + 4 = 404 ถ้าลบชั้นกลาง เลข 1 จะย้ายมาอยู่หลักยี่สิบ ทำให้เหลือเพียง 24', ['mayan-zero-level']),
        ('Ordinary base 20 uses places 1, 20, 400. The Long Count calendar uses 1, 20, 360, 7200: its third place is 18 × 20 = 360 days. Games use ordinary counting unless calendar notation is specified.',
         'ตรวจรูปแบบก่อนคิด: ฐานยี่สิบทั่วไปใช้หลัก 1, 20, 400 แต่ปฏิทินนับยาวใช้หลักวัน 1, 20, 360, 7200 เพราะหลักที่สามคือ 18 × 20 = 360 วัน ไม่ใช่ 400 เกมใช้การนับทั่วไป เว้นแต่ระบุว่าเป็นปฏิทิน', ['mayan-calendar']),
        ('Multiply each level by 1, 20, 400… from the bottom, then add. Top-to-bottom digits 1, 2, 3 give 400 + 40 + 3 = 443. A shell still occupies its level.',
         'อ่านจุดและขีดของแต่ละระดับ แล้วคูณด้วย 1, 20, 400… จากล่างขึ้นบนก่อนรวมค่า เช่น เลขจากบนลงล่าง 1, 2, 3 ให้ค่า 400 + 40 + 3 = 443 และต้องคงระดับเปลือกหอยไว้เสมอ', []),
    ],
    'babylonian':[
        ('A unit wedge is 1; a ten wedge is 10. Add wedges within a group to make a base-60 digit from 1 to 59. Three ten wedges and four unit wedges give 3 × 10 + 4 = 34. The wedge’s orientation distinguishes its value.',
         'ลิ่มหน่วยมีค่า 1 และลิ่มสิบมีค่า 10 รวมลิ่มภายในกลุ่มเพื่อสร้างเลข 1 ถึง 59 เช่น ลิ่มสิบ 3 ตัวกับลิ่มหน่วย 4 ตัวได้ 3 × 10 + 4 = 34 ทิศทางของลิ่มช่วยแยกค่าหน่วยกับสิบ', ['babylonian-wedges']),
        ('Read tens and units together within each wedge group: two tens plus three ones make the digit 23. A space between groups separates base-60 places, not tens from ones. First find each group’s digit; then apply its place value.',
         'อ่านลิ่มสิบกับลิ่มหน่วยภายในกลุ่มเดียวกัน เช่น สองสิบกับสามหน่วยรวมเป็น 23 ช่องว่างระหว่างกลุ่มแยกค่าประจำหลักฐานหกสิบ ไม่ได้แยกสิบออกจากหน่วย หาค่าแต่ละกลุ่มก่อนแล้วจึงคูณค่าประจำหลัก', ['babylonian-groups']),
        ('Babylonian places, from right to left, are 1, 60, 3600, then higher powers of 60. Each whole group is one digit. Groups 2 : 14 therefore mean 2 × 60 + 14 = 134. Do not read them as decimal 214.',
         'ค่าประจำหลักบาบิโลนจากขวาไปซ้ายคือ 1, 60, 3600 และกำลังถัดไปของ 60 หนึ่งกลุ่มเป็นหนึ่งหลัก ดังนั้น 2 : 14 หมายถึง 2 × 60 + 14 = 134 ไม่ใช่เลขฐานสิบ 214', ['babylonian-base','babylonian-134']),
        ('A zero placeholder keeps an empty place distinct: 1 : 0 : 2 = 3602, while 1 : 2 = 62. Later scribes introduced placeholders, but old records may still require context.',
         'สัญลักษณ์เว้นหลักช่วยบอกตำแหน่งที่ว่าง เช่น 1 : 0 : 2 = 3600 + 0 + 2 = 3602 แต่ 1 : 2 = 62 การเขียนยุคแรกยังไม่มีศูนย์ที่แน่นอน ต่อมาจึงมีสัญลักษณ์เว้นหลัก แต่บางครั้งยังต้องอาศัยบริบท', ['babylonian-zero']),
        ('Divisions of sixty are familiar in time: 1 hour = 60 minutes, and 1 minute = 60 seconds. Therefore 1 hour = 3600 seconds. This is a useful way to remember sexagesimal places, although a modern clock is not an exact copy of a clay numeral.',
         'การแบ่งด้วย 60 ยังพบในเวลา: 1 ชั่วโมง = 60 นาที และ 1 นาที = 60 วินาที จึงได้ 1 ชั่วโมง = 3600 วินาที ใช้ช่วยจำระบบฐานหกสิบได้ แม้นาฬิกาสมัยใหม่จะไม่ได้เขียนเหมือนเลขบนดินเหนียวทุกอย่าง', ['babylonian-clock']),
        ('Multiply each group by its power of 60, then add: 1 : 2 : 3 = 3600 + 120 + 3 = 3723. Three groups occupy three places, even when a group contains several wedges.',
         'นำแต่ละกลุ่มคูณกำลังของ 60 แล้วรวม เช่น 1 : 2 : 3 ได้ 1 × 3600 + 2 × 60 + 3 × 1 = 3723 จำนวนสามกลุ่มใช้สามหลัก แม้บางกลุ่มจะประกอบด้วยลิ่มหลายตัว', []),
    ],
    'roman':[
        ('Learn the seven fixed values: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. A letter keeps its value wherever it appears; Roman numerals do not use decimal place values. There is no standard Roman digit for zero.',
         'จำค่าคงที่เจ็ดตัว: I=1, V=5, X=10, L=50, C=100, D=500, M=1000 ตัวอักษรยังมีค่าเดิมไม่ว่าจะอยู่ตำแหน่งใด เลขโรมันไม่ใช้ค่าประจำหลักฐานสิบ และไม่มีสัญลักษณ์ศูนย์แบบมาตรฐาน', ['roman-symbol']),
        ('When symbols descend in value from left to right, add them: XVI = 10 + 5 + 1 = 16. Repeated I, X, C, and M can also add, up to three consecutive copies in modern notation. Do not repeat V, L, or D.',
         'เมื่อค่าเรียงจากมากไปน้อยให้นำมาบวก เช่น XVI = 10 + 5 + 1 = 16 ตัว I, X, C, M ที่ซ้ำก็บวกกันได้ แต่ในรูปมาตรฐานเขียนติดกันไม่เกินสามตัว ส่วน V, L, D ไม่เขียนซ้ำ', ['roman-additive']),
        ('Only six subtractive pairs are standard: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900. Subtract the smaller symbol from the larger within each pair. This permission does not apply to every smaller-before-larger combination: IL and IC are not standard pairs.',
         'คู่ลบมาตรฐานมีหกคู่: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900 ให้นำค่าตัวเล็กลบจากตัวใหญ่ภายในคู่เท่านั้น ไม่ใช่ว่าตัวเล็กอยู่หน้าตัวใหญ่แล้วลบได้เสมอ เช่น IL และ IC ใช้เป็นคู่ลบไม่ได้', ['roman-pair','roman-90']),
        ('Group the valid subtractive pair before adding the remaining symbols. In XIV, X contributes 10 and IV contributes 5 − 1 = 4. The result is 10 + 4 = 14. Reading every symbol as additive would incorrectly give 16.',
         'จับคู่ลบที่ถูกต้องก่อน แล้วบวกส่วนที่เหลือ ใน XIV ตัว X มีค่า 10 และ IV มีค่า 5 − 1 = 4 จึงได้ 10 + 4 = 14 ถ้าบวกทุกตัวโดยไม่ดูคู่ลบจะได้ 16 ซึ่งผิด', ['roman-decode-xiv']),
        ('Split a year into thousands, hundreds, tens, and ones; write each part with permitted symbols and pairs. For 1994: 1000 + 900 + 90 + 4 becomes M + CM + XC + IV = MCMXCIV. Read it back by grouping the same pairs.',
         'แยกปีเป็นพัน ร้อย สิบ และหน่วย แล้วใช้สัญลักษณ์หรือคู่ลบที่ถูกต้อง เช่น 1994 = 1000 + 900 + 90 + 4 → M + CM + XC + IV = MCMXCIV ตรวจกลับโดยแยกคู่เดิมแล้วรวมค่า', []),
        ('Build 99 as 90 + 9: XC + IX = XCIX, not IC. Only one smaller symbol can subtract in a permitted pair; 8 is VIII, not IIX, and 49 is XLIX, not IL. Historical clock faces may use IIII, while this quiz uses modern standard notation.',
         'เขียน 99 เป็น 90 + 9 → XC + IX = XCIX ไม่ใช่ IC คู่ลบใช้ตัวเล็กเพียงตัวเดียวและต้องเป็นคู่ที่อนุญาต ดังนั้น 8 = VIII ไม่ใช่ IIX และ 49 = XLIX ไม่ใช่ IL นาฬิกาเก่าบางเรือนใช้ IIII แต่ควิซใช้รูปมาตรฐานสมัยใหม่', ['roman-99']),
    ],
}

def enrich_lessons(lessons):
    for lesson in lessons:
        for slide,(english,thai,topics) in zip(lesson['slides'],CURRICULUM[lesson['slug']],strict=True):
            slide.update(body=english,body_th=thai,quiz_topics=['live-'+topic for topic in topics])
    roman=next(lesson for lesson in lessons if lesson['slug']=='roman')['slides'][5]
    roman.update(example='99 = XC + IX = 90 + 9 = 99; 8 = VIII; 49 = XLIX',example_th='99 = XC + IX = 90 + 9; 8 = VIII; 49 = XLIX')
