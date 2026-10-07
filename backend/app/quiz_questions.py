"""Slide-grounded live quiz sets with balanced category and topic coverage."""
import random
from .content import LESSONS, representation

CATEGORIES=('astrology','numerals','mixed')


def _source(lesson_slug, slide_index):
    lesson=next(item for item in LESSONS if item['slug']==lesson_slug)
    slide=lesson['slides'][slide_index]
    return {
        'source_lesson':lesson_slug,
        'source_slide':slide_index+1,
        'source_title':slide['title'],
        'source_title_th':slide['title_th'],
    }


def _number_question(key, system, prompt, prompt_th, choices, answer, explanation,
                     explanation_th, lesson_slug, slide_index, numeral=None):
    rng=random.Random(key)
    options=list(choices)
    rng.shuffle(options)
    labels={english:thai for english,thai in options}
    question={
        'id':'live-'+key,
        'kind':'slide-knowledge',
        'system':system,
        'category':'numerals',
        'prompt':prompt,
        'prompt_th':prompt_th,
        'answer':answer,
        'answer_th':labels[answer],
        'choices':[english for english,_ in options],
        'choices_th':[thai for _,thai in options],
        'explanation':explanation,
        'explanation_th':explanation_th,
        'hint':'Recall the example or rule from this lesson slide.',
        'hint_th':'ทบทวนตัวอย่างหรือกฎจากสไลด์บทเรียนนี้',
        'tags':['live-quiz','course-slides',system],
        **_source(lesson_slug,slide_index),
    }
    if numeral is not None:
        question['representation']=representation(numeral,system)
    return question


def numeral_slide_questions():
    q=[]
    # Thai numeral slides: symbols, place value, zero, era conversion, and reading.
    q.extend([
        _number_question('thai-decode-256','thai','Which number is written as ๒๕๖?','๒๕๖ เขียนแทนจำนวนใด?', [('256','๒๕๖'),('265','๒๖๕'),('526','๕๒๖'),('206','๒๐๖')], '256','Thai digits keep the same decimal place values: ๒๕๖ = 256.','เลขไทยใช้ค่าประจำหลักฐานสิบเหมือนเดิม: ๒๕๖ = 256','thai-numerals',2,256),
        _number_question('thai-hundreds','thai','In ๒๕๖, what is the value of ๒?','ใน ๒๕๖ เลข ๒ มีค่าเท่าใด?', [('200','๒๐๐'),('20','๒๐'),('2','๒'),('2000','๒๐๐๐')], '200','The ๒ is in the hundreds place, so its value is 200.','เลข ๒ อยู่ในหลักร้อย จึงมีค่า 200','thai-numerals',2),
        _number_question('thai-zero','thai','Why does ๓๐๗ differ from ๓๗?','เหตุใด ๓๐๗ จึงต่างจาก ๓๗?', [('Zero holds the tens place','ศูนย์รักษาตำแหน่งหลักสิบ'),('Zero means ten','ศูนย์หมายถึงสิบ'),('๓ changes to ๓๐','๓ เปลี่ยนค่าเป็น ๓๐'),('Both are the same value','ทั้งสองจำนวนมีค่าเท่ากัน')], 'Zero holds the tens place','Zero keeps the empty tens place in 307; removing it changes the number to 37.','ศูนย์รักษาหลักสิบที่ว่างใน 307 เมื่อตัดออกจะกลายเป็น 37','thai-numerals',3),
        _number_question('thai-era','thai','พ.ศ. ๒๕๖๗ corresponds to which Gregorian year?','พ.ศ. ๒๕๖๗ ตรงกับปีคริสต์ศักราชใด?', [('2024','2024'),('2025','2025'),('1981','1981'),('2567','2567')], '2024','The Buddhist Era year is commonly 543 greater, so 2567 − 543 = 2024.','ปีพุทธศักราชโดยทั่วไปมากกว่า 543 ปี: 2567 − 543 = 2024','thai-numerals',4),
        _number_question('thai-rebuild','thai','What value does ๑๒๐๖ represent?','๑๒๐๖ มีค่าเท่าใด?', [('1206','๑๒๐๖'),('126','๑๒๖'),('1026','๑๐๒๖'),('1200','๑๒๐๐')], '1206','Keep every place, including the zero tens place: 1,206.','คงค่าทุกหลัก รวมทั้งศูนย์ในหลักสิบ จึงได้ 1,206','thai-numerals',5,1206),
        _number_question('thai-script','thai','What changes when a number is written with Thai digits?','เมื่อเขียนจำนวนด้วยเลขไทย สิ่งใดเปลี่ยนไป?', [('The digit shapes','รูปร่างของสัญลักษณ์ตัวเลข'),('The place-value system','ระบบค่าประจำหลัก'),('The quantity itself','ค่าของจำนวน'),('The reading direction','ทิศทางการอ่าน')], 'The digit shapes','Thai numerals use different glyphs while keeping the same decimal values and positions.','เลขไทยเปลี่ยนรูปร่างสัญลักษณ์ แต่คงค่าประจำหลักฐานสิบเดิม','thai-numerals',0),
    ])
    # Maya slides: dot/bar composition, vigesimal place values, zero, and calendar notation.
    q.extend([
        _number_question('mayan-dotbar','mayan','Four dots over two bars represent which value?','จุดสี่จุดเหนือขีดสองขีดแทนค่าใด?', [('14','๑๔'),('9','๙'),('12','๑๒'),('24','๒๔')], '14','Each dot is one and each bar is five: 4 + 5 + 5 = 14.','จุดละหนึ่งและขีดละห้า: 4 + 5 + 5 = 14','mayan',0,14),
        _number_question('mayan-range','mayan','What range fits in a single ordinary Maya numeral level?','หนึ่งระดับของเลขมายาทั่วไปแทนค่าในช่วงใด?', [('0 through 19','0 ถึง 19'),('1 through 20','1 ถึง 20'),('0 through 59','0 ถึง 59'),('1 through 9','1 ถึง 9')], '0 through 19','A single ordinary base-20 level holds one digit from 0 to 19.','หนึ่งระดับในระบบฐานยี่สิบทั่วไปแทนเลขหลักเดียวตั้งแต่ 0 ถึง 19','mayan',1),
        _number_question('mayan-place','mayan','In ordinary Maya counting, what is the place value just above ones?','การนับเลขมายาทั่วไป หลักที่อยู่เหนือหลักหน่วยมีค่าเท่าใด?', [('20','๒๐'),('10','๑๐'),('18','๑๘'),('60','๖๐')], '20','Ordinary Maya numerals use powers of twenty, so the next place is 20.','เลขมายาทั่วไปใช้กำลังของยี่สิบ หลักถัดจากหน่วยจึงมีค่า 20','mayan',2),
        _number_question('mayan-43','mayan','Top level 2 and bottom level 3 make which number?','ระดับบนเป็น 2 และระดับล่างเป็น 3 รวมเป็นจำนวนใด?', [('43','๔๓'),('23','๒๓'),('4003','๔๐๐๓'),('8','๘')], '43','The bottom level is ones and the top is twenties: 2 × 20 + 3 = 43.','ระดับล่างเป็นหน่วย ระดับบนเป็นยี่สิบ: 2 × 20 + 3 = 43','mayan',2,43),
        _number_question('mayan-zero-level','mayan','What does a shell in a middle level tell you?','สัญลักษณ์เปลือกหอยในระดับกลางบอกอะไร?', [('That place has zero units but must stay','หลักนั้นเป็นศูนย์แต่ต้องคงตำแหน่งไว้'),('That the whole number is zero','จำนวนทั้งหมดเป็นศูนย์'),('That the next level is ignored','ไม่ต้องนับระดับถัดไป'),('That the level is worth five','ระดับนั้นมีค่าเป็นห้า')], 'That place has zero units but must stay','A zero level is a placeholder; removing it changes the higher place values.','ระดับศูนย์ทำหน้าที่รักษาตำแหน่ง หากตัดออกค่าของหลักอื่นจะเปลี่ยน','mayan',3),
        _number_question('mayan-calendar','mayan','In the Long Count calendar, the third place is how many days?','ในปฏิทินนับยาว หลักที่สามมีค่าเท่ากับกี่วัน?', [('360','๓๖๐'),('400','๔๐๐'),('20','๒๐'),('7200','๗๒๐๐')], '360','The calendar uses 18 × 20 = 360 for its third place, unlike ordinary base-20 counting.','ปฏิทินใช้ 18 × 20 = 360 ในหลักที่สาม ต่างจากฐานยี่สิบทั่วไป','mayan',4),
    ])
    # Babylonian slides: wedge values, base-60 groups, placeholders, and clock links.
    q.extend([
        _number_question('babylonian-wedges','babylonian','Three ten-wedges and four unit-wedges make what digit?','ลิ่มสิบ 3 ตัวกับลิ่มหน่วย 4 ตัวรวมเป็นเลขใด?', [('34','๓๔'),('43','๔๓'),('7','๗'),('13','๑๓')], '34','Three tens plus four ones make 34.','สามสิบรวมกับสี่หน่วยได้ 34','babylonian',0),
        _number_question('babylonian-groups','babylonian','What do spaces between wedge groups separate?','ช่องว่างระหว่างกลุ่มลิ่มใช้แยกอะไร?', [('Place values','ค่าประจำหลัก'),('Different calendars','ปฏิทินคนละแบบ'),('Different tablets','แผ่นดินเหนียวคนละแผ่น'),('Units from tens','หน่วยออกจากหลักสิบ')], 'Place values','Each group is one base-60 digit; spaces distinguish its place from the next group.','แต่ละกลุ่มเป็นหนึ่งหลักฐานหกสิบ ช่องว่างช่วยแยกค่าประจำหลัก','babylonian',1),
        _number_question('babylonian-base','babylonian','Which sequence lists Babylonian place values from right to left?','ลำดับใดเรียงค่าประจำหลักบาบิโลนจากขวาไปซ้าย?', [('1, 60, 3600','1, 60, 3600'),('1, 10, 100','1, 10, 100'),('1, 20, 400','1, 20, 400'),('60, 120, 180','60, 120, 180')], '1, 60, 3600','Babylonian numerals are sexagesimal: each place is a power of sixty.','เลขบาบิโลนเป็นฐานหกสิบ แต่ละหลักจึงเป็นกำลังของ 60','babylonian',2),
        _number_question('babylonian-134','babylonian','Groups 2 : 14 represent which value?','กลุ่ม 2 : 14 มีค่าเท่าใด?', [('134','๑๓๔'),('214','๒๑๔'),('74','๗๔'),('1214','๑๒๑๔')], '134','The left group counts sixties: 2 × 60 + 14 = 134.','กลุ่มซ้ายมีค่าหกสิบ: 2 × 60 + 14 = 134','babylonian',2,134),
        _number_question('babylonian-zero','babylonian','Why is a zero placeholder useful in a group sequence?','เหตุใดสัญลักษณ์แทนศูนย์จึงมีประโยชน์ในชุดกลุ่มตัวเลข?', [('It keeps an empty place distinct','ช่วยรักษาหลักที่ว่างให้ชัดเจน'),('It changes the base to ten','เปลี่ยนระบบเป็นฐานสิบ'),('It means sixty wedges','หมายถึงลิ่มหกสิบตัว'),('It removes the need for spaces','ทำให้ไม่ต้องเว้นช่องระหว่างกลุ่ม')], 'It keeps an empty place distinct','A placeholder clarifies which place is empty, though older Babylonian notation can require context.','สัญลักษณ์แทนศูนย์ช่วยบอกหลักที่ว่าง แม้การเขียนโบราณบางแบบยังต้องดูบริบท','babylonian',3),
        _number_question('babylonian-clock','babylonian','Which modern time measure still uses divisions of sixty?','หน่วยเวลาใดในปัจจุบันยังใช้การแบ่งฐานหกสิบ?', [('Minutes in an hour','นาทีในหนึ่งชั่วโมง'),('Days in a month','วันในหนึ่งเดือน'),('Months in a year','เดือนในหนึ่งปี'),('Hours in a day','ชั่วโมงในหนึ่งวัน')], 'Minutes in an hour','One hour has 60 minutes, a familiar use of sexagesimal division.','หนึ่งชั่วโมงมี 60 นาที เป็นตัวอย่างของการแบ่งฐานหกสิบ','babylonian',4),
    ])
    # Roman slides: fixed-value symbols, additive reading, subtraction, and canonical form.
    q.extend([
        _number_question('roman-decode-xiv','roman','Which modern number is XIV?','XIV แทนจำนวนใด?', [('14','๑๔'),('16','๑๖'),('19','๑๙'),('9','๙')], '14','X is 10 and IV is 4, so XIV is 14.','X มีค่า 10 และ IV มีค่า 4 ดังนั้น XIV = 14','roman',3,14),
        _number_question('roman-additive','roman','When Roman numeral values descend from left to right, what do you do?','เมื่อค่าตัวเลขโรมันเรียงจากมากไปน้อย ควรทำอย่างไร?', [('Add the values','นำค่ามาบวกกัน'),('Subtract every value','นำทุกค่ามาลบ'),('Multiply the values','นำค่ามาคูณกัน'),('Read them as place values','อ่านเป็นค่าประจำหลัก')], 'Add the values','Descending Roman numeral values are read additively.','เมื่อตัวเลขโรมันเรียงจากค่ามากไปน้อย ให้อ่านโดยการบวก','roman',1),
        _number_question('roman-pair','roman','Which is a permitted subtractive pair for 40?','คู่ลบใดใช้แทนค่า 40 ได้ถูกต้อง?', [('XL','XL'),('IL','IL'),('XD','XD'),('VX','VX')], 'XL','The six modern subtractive pairs include XL for 40.','คู่ลบมาตรฐานมี XL แทนค่า 40','roman',2),
        _number_question('roman-90','roman','Which standard Roman numeral represents 90?','เลขโรมันมาตรฐานใดแทนค่า 90?', [('XC','XC'),('IC','IC'),('VC','VC'),('LC','LC')], 'XC','XC is the permitted subtractive pair for 90; IC is not standard.','XC เป็นคู่ลบมาตรฐานของ 90 ส่วน IC ไม่ใช่รูปแบบมาตรฐาน','roman',2),
        _number_question('roman-99','roman','Which is the modern canonical form for 99?','รูปแบบมาตรฐานสมัยใหม่ของ 99 คือข้อใด?', [('XCIX','XCIX'),('IC','IC'),('VCIV','VCIV'),('LXXXXVIIII','LXXXXVIIII')], 'XCIX','Write 99 as 90 + 9, or XC + IX = XCIX.','เขียน 99 เป็น 90 + 9 หรือ XC + IX = XCIX','roman',5),
        _number_question('roman-symbol','roman','Which Roman symbol has a fixed value of 500?','สัญลักษณ์โรมันใดมีค่าคงที่เท่ากับ 500?', [('D','D'),('C','C'),('L','L'),('V','V')], 'D','The Roman symbol values include D = 500.','ค่าของสัญลักษณ์โรมันกำหนดให้ D = 500','roman',0),
    ])
    return q


def _astro_question(key, prompt, prompt_th, choices, answer, explanation,
                    explanation_th, slide_index, glyph=None):
    options=list(choices)
    random.Random(key).shuffle(options)
    labels={english:thai for english,thai in options}
    question={
        'id':'live-astro-'+key,
        'kind':'slide-knowledge',
        'system':'astrology',
        'category':'astrology',
        'prompt':prompt,
        'prompt_th':prompt_th,
        'answer':answer,
        'answer_th':labels[answer],
        'choices':[english for english,_ in options],
        'choices_th':[thai for _,thai in options],
        'explanation':explanation,
        'explanation_th':explanation_th,
        'hint':'Use the named course slide to recall the rule or example.',
        'hint_th':'นึกถึงกฎหรือตัวอย่างจากสไลด์ที่ระบุ',
        'tags':['live-quiz','course-slides','thai-astrology'],
        **_source('thai-astrology',slide_index),
    }
    if glyph:
        question['representation']={'text':glyph,'levels':[]}
    return question


def astrology_slide_questions():
    """Fresh live-quiz prompts from distinct Thai Astrology lesson slides."""
    return [
        _astro_question('ecliptic','What is the ecliptic?','สุริยวิถีคืออะไร?',[
            ('The Sun’s apparent path across the sky each year','เส้นทางปรากฏของดวงอาทิตย์บนท้องฟ้าในรอบปี'),
            ('Earth’s equator','เส้นศูนย์สูตรโลก'),('The Moon’s surface','พื้นผิวดวงจันทร์'),('A planet’s orbit around Earth','วงโคจรของดาวเคราะห์รอบโลก')],
            'The Sun’s apparent path across the sky each year','From Earth, the Sun appears to trace the ecliptic over a year.','เมื่อมองจากโลก ดวงอาทิตย์มีเส้นทางปรากฏตามสุริยวิถีในรอบปี',1),
        _astro_question('sector-width','How wide is one equal zodiac sign?','ราศีหนึ่งในจักรราศีแบบแบ่งเท่ากันกว้างกี่องศา?',[
            ('30°','30°'),('12°','12°'),('60°','60°'),('90°','90°')],
            '30°','The ecliptic has 360 degrees divided among twelve equal signs: 360 ÷ 12 = 30.','สุริยวิถี 360° แบ่งเป็น 12 ราศีเท่ากัน: 360 ÷ 12 = 30',1),
        _astro_question('sign-following','In the course’s sign order, which sign follows Aries?','ตามลำดับราศีในบทเรียน ราศีใดตามหลังเมษ?',[
            ('Taurus','พฤษภ'),('Gemini','เมถุน'),('Pisces','มีน'),('Cancer','กรกฎ')],
            'Taurus','The slide example names Aries (Mesh) followed by Taurus (Vrishabha).','ตัวอย่างในสไลด์เรียงเมษ (Mesh) แล้วตามด้วยพฤษภ (Vrishabha)',2,'♈'),
        _astro_question('sign-sector','What does a zodiac sign describe in this lesson?','ในบทเรียนนี้ ราศีใช้บรรยายสิ่งใด?',[
            ('A 30° sector of the ecliptic','ส่วน 30° ของสุริยวิถี'),('A person’s guaranteed personality','บุคลิกที่รับประกันของบุคคล'),('One astronomical constellation exactly','กลุ่มดาวจริงหนึ่งกลุ่มแบบตรงตัว'),('A planet’s distance from Earth','ระยะห่างของดาวจากโลก')],
            'A 30° sector of the ecliptic','The lesson defines each equal sign as a 30° sector, distinct from uneven constellations.','บทเรียนกำหนดให้ราศีละ 30° และแยกจากกลุ่มดาวจริงที่มีขนาดไม่เท่ากัน',2),
        _astro_question('digit-context','What can the digit ๑ name inside a Thai horoscope?','เลข ๑ อาจใช้แทนสิ่งใดเมื่ออยู่ในดวงโหราศาสตร์ไทย?',[
            ('The Sun','ดวงอาทิตย์'),('The number of planets','จำนวนดาวเคราะห์'),('The eastern horizon','ขอบฟ้าทิศตะวันออก'),('A zodiac sign','ราศีหนึ่ง')],
            'The Sun','In chart context, ๑ marks the Sun; the same glyph can still mean the quantity one elsewhere.','ในบริบทของดวง ๑ แทนดวงอาทิตย์ แต่ในบริบทอื่นอาจเป็นจำนวนหนึ่ง',3,'๑'),
        _astro_question('planet-key','Which celestial body is marked by ๖ in the planetary key?','ในกุญแจดวงดาว สัญลักษณ์ ๖ แทนดาวใด?',[
            ('Venus','ดาวศุกร์'),('Jupiter','ดาวพฤหัสบดี'),('Saturn','ดาวเสาร์'),('Mercury','ดาวพุธ')],
            'Venus','The course’s planetary key maps ๕ to Jupiter, ๖ to Venus, and ๗ to Saturn.','กุญแจดวงดาวในบทเรียนกำหนด ๕ แทนพฤหัสบดี ๖ แทนศุกร์ และ ๗ แทนเสาร์',4,'๖'),
        _astro_question('nodes','How are Rahu and Ketu related in the course explanation?','ตามคำอธิบายในบทเรียน ราหูกับเกตุสัมพันธ์กันอย่างไร?',[
            ('They are opposite lunar nodes','เป็นจุดโหนดของดวงจันทร์ที่อยู่ตรงข้ามกัน'),('They are two zodiac signs','เป็นราศีสองราศี'),('They are names for Neptune and Uranus','เป็นชื่อดาวเนปจูนและยูเรนัส'),('They are the Sun and Moon','เป็นดวงอาทิตย์และดวงจันทร์')],
            'They are opposite lunar nodes','Rahu and Ketu mark the ascending and descending lunar nodes, opposite each other.','ราหูและเกตุแทนจุดโหนดขาขึ้นและขาลงของดวงจันทร์ ซึ่งอยู่ตรงข้ามกัน',5),
        _astro_question('ascendant-symbol','Which mark is used for the ascendant in the lesson?','บทเรียนใช้สัญลักษณ์ใดแทนลัคนา?',[
            ('ล','ล'),('๘','๘'),('๐','๐'),('๒','๒')],
            'ล','Thai chart records often mark the ascendant with ล.','ดวงแบบไทยมักใช้ ล แทนลัคนา',6,'ล'),
        _astro_question('ascendant-place','Where is the ascendant measured?','ลัคนาวัดจากบริเวณใด?',[
            ('The eastern horizon','ขอบฟ้าทิศตะวันออก'),('The western horizon','ขอบฟ้าทิศตะวันตก'),('The Earth’s equator','เส้นศูนย์สูตรโลก'),('The Moon’s orbit','วงโคจรของดวงจันทร์')],
            'The eastern horizon','The ascendant is the sign crossing the eastern horizon at a chosen time and place.','ลัคนาคือราศีที่กำลังขึ้นทางขอบฟ้าตะวันออก ณ เวลาและสถานที่หนึ่ง',6),
        _astro_question('ascendant-inputs','Which details affect the ascendant?','ข้อมูลใดมีผลต่อการคำนวณลัคนา?',[
            ('Date, local time, and place','วัน เวลาในท้องถิ่น และสถานที่'),('Name and favourite colour','ชื่อและสีที่ชอบ'),('Age only','อายุเท่านั้น'),('Birth month only','เดือนเกิดเท่านั้น')],
            'Date, local time, and place','The rising sign depends on the sky’s position at a particular time and geographic location.','ราศีที่กำลังขึ้นขึ้นอยู่กับตำแหน่งท้องฟ้า ณ เวลาและสถานที่นั้น',6),
        _astro_question('fastest-rhythm','Which body takes the shortest average time to cross one sign?','โดยเฉลี่ย วัตถุใดใช้เวลาผ่านหนึ่งราศีน้อยที่สุด?',[
            ('The Moon','ดวงจันทร์'),('The Sun','ดวงอาทิตย์'),('Saturn','ดาวเสาร์'),('The ecliptic','สุริยวิถี')],
            'The Moon','The lesson compares about 2½ days for the Moon, one month for the Sun, and 2½ years for Saturn.','บทเรียนเปรียบเทียบจันทร์ราว 2½ วัน อาทิตย์ราวหนึ่งเดือน และเสาร์ราว 2½ ปี',7),
        _astro_question('wat-ram-poeng','In the Wat Ram Poeng example, which pair is placed in Taurus?','ตัวอย่างวัดร่ำเปิงวางดาวคู่ใดไว้ในราศีพฤษภ?',[
            ('Moon and Venus','จันทร์และศุกร์'),('Sun and Mars','อาทิตย์และอังคาร'),('Jupiter and Saturn','พฤหัสบดีและเสาร์'),('Rahu and Ketu','ราหูและเกตุ')],
            'Moon and Venus','The example places Sun and Mars in Aries, Moon and Venus in Taurus, and the ascendant in Gemini.','ตัวอย่างวางอาทิตย์และอังคารในเมษ จันทร์และศุกร์ในพฤษภ และลัคนาในเมถุน',8),
        _astro_question('solar-eclipse','Which alignment is needed for a solar eclipse?','สุริยุปราคาต้องมีการเรียงตัวแบบใด?',[
            ('The Moon between Earth and the Sun near a node','ดวงจันทร์อยู่ระหว่างโลกกับดวงอาทิตย์ใกล้จุดโหนด'),('Earth between the Sun and Moon','โลกอยู่ระหว่างดวงอาทิตย์กับดวงจันทร์'),('Saturn between Earth and the Sun','ดาวเสาร์อยู่ระหว่างโลกกับดวงอาทิตย์'),('A full Moon far from every node','จันทร์เพ็ญที่อยู่ไกลจากจุดโหนด')],
            'The Moon between Earth and the Sun near a node','A solar eclipse requires a new Moon near a lunar node, aligned between Earth and the Sun.','สุริยุปราคาต้องมีจันทร์ดับใกล้จุดโหนดและอยู่ระหว่างโลกกับดวงอาทิตย์',9),
        _astro_question('calculation-vs-meaning','Which pair correctly separates chart calculation from interpretation?','ข้อใดแยกการคำนวณแผนผังออกจากการตีความได้ถูกต้อง?',[
            ('A planet’s position is calculated; its meaning is interpreted','ตำแหน่งดาวเป็นผลคำนวณ ส่วนความหมายเป็นการตีความ'),('Both are guaranteed predictions','ทั้งสองอย่างเป็นคำทำนายที่รับประกัน'),('A personality meaning is an ephemeris','ความหมายบุคลิกคือปฏิทินดาว'),('Rituals determine the planet’s coordinates','พิธีกรรมกำหนดพิกัดของดาว')],
            'A planet’s position is calculated; its meaning is interpreted','The lesson keeps measured positions distinct from cultural or reflective meanings.','บทเรียนแยกตำแหน่งที่คำนวณได้ออกจากความหมายเชิงวัฒนธรรมหรือการทบทวนตนเอง',10),
    ]


def _balanced_by_group(pool, count, group_key, rng):
    groups={}
    for question in pool:
        groups.setdefault(group_key(question),[]).append(question)
    names=list(groups)
    rng.shuffle(names)
    for items in groups.values():
        rng.shuffle(items)
    chosen=[]
    while len(chosen)<count and names:
        remaining=[]
        for name in names:
            if groups[name] and len(chosen)<count:
                chosen.append(groups[name].pop())
            if groups[name]:
                remaining.append(name)
        names=remaining
    return chosen


def live_quiz_questions(category):
    if category not in CATEGORIES:
        raise ValueError('Unsupported live quiz category.')
    rng=random.Random()
    if category=='astrology':
        numerals_count,astrology_count=0,10
    elif category=='numerals':
        numerals_count,astrology_count=10,0
    else:
        numerals_count,astrology_count=7,8

    chosen=[]
    if astrology_count:
        chosen.extend(_balanced_by_group(astrology_slide_questions(),astrology_count,lambda q:q['source_title'],rng))
    if numerals_count:
        chosen.extend(_balanced_by_group(numeral_slide_questions(),numerals_count,lambda q:q['system'],rng))
    rng.shuffle(chosen)
    return chosen
