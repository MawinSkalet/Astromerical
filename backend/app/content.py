"""Curated educational content adapted from the user's two course PDFs.

Maya ordinary counting is vigesimal; calendar place values use 1, 20, 360.
Ketu is the descending lunar node, not the planet Neptune.
"""
import random
from functools import lru_cache
from fastapi import HTTPException
from .db import mongo, DEVELOPMENT

SIGNS = [
    ('Aries','Mesh','เมษ','♈','courage and new beginnings'),('Taurus','Vrishabha','พฤษภ','♉','patience and appreciation'),
    ('Gemini','Mithuna','เมถุน','♊','curiosity and communication'),('Cancer','Karka','กรกฎ','♋','care and belonging'),
    ('Leo','Simha','สิงห์','♌','creativity and generosity'),('Virgo','Kanya','กันย์','♍','attention and practical care'),
    ('Libra','Tula','ตุลย์','♎','balance and cooperation'),('Scorpio','Vrishchika','พิจิก','♏','depth and transformation'),
    ('Sagittarius','Dhanu','ธนู','♐','exploration and learning'),('Capricorn','Makara','มกร','♑','patience and responsibility'),
    ('Aquarius','Kumbha','กุมภ์','♒','independence and community'),('Pisces','Meena','มีน','♓','imagination and empathy')]

def slide(title, body, example, note, title_th='', body_th='', visual='numerals'):
    return dict(title=title, body=body, example=example, note=note, title_th=title_th or title, body_th=body_th or body, visual=visual)

LESSONS = [
dict(slug='thai-astrology',title='Thai Astrology',title_th='โหราศาสตร์ไทย',subtitle='The movement of time, the rhythm of life.',subtitle_th='การเคลื่อนของเวลา จังหวะของชีวิต',system='astrology',
    intro='Read the sky through a different lens. Discover the signs, symbols, and celestial stories behind Thai astrology.',
    terms=[['Zodiac','Twelve equal sections of the ecliptic, each spanning 30°.'],['Ascendant','The zodiac sign rising on the eastern horizon at a specific time and place.'],['Ecliptic','The Sun’s apparent annual path across the sky.']],
    source='Doc1.4 Thai Astrology, Atichart Kettapun, LASC, pp. 5–22',
    slides=[
        slide('A map of the sky','Thai horoscope records capture the sky at a moment in time. You can find them in temple records, city foundations, and traditional calendars.','A horoscope can record a temple’s founding, rather than a person’s birth.','The calculations and cultural interpretations are different kinds of knowledge.','แผนที่ของท้องฟ้า','บันทึกดวงแบบไทยแสดงตำแหน่งบนท้องฟ้า ณ เวลาหนึ่ง พบได้ในวัดและปฏิทินดั้งเดิม', 'wheel'),
        slide('Follow the ecliptic','From Earth, the Sun appears to trace a path across the sky over a year. This path is the ecliptic. The zodiac divides it into twelve equal sectors.','360° ÷ 12 = 30° per sign','Equal zodiac signs are not the same as the uneven astronomical constellations.','เส้นสุริยวิถี','สุริยวิถีคือเส้นทางปรากฏของดวงอาทิตย์ในรอบปี แบ่งเป็น 12 ส่วนเท่า ๆ กัน', 'wheel'),
        slide('Twelve signs, one sky','The twelve zodiac signs give us a way to describe positions in the sky. Select a sign on the wheel to explore its English and Thai names.','Aries (Mesh / เมษ) is followed by Taurus (Vrishabha / พฤษภ).','A sign describes a 30° sector; it does not establish someone’s personality.','สิบสองราศี ท้องฟ้าเดียวกัน','ราศีทั้งสิบสองช่วยอธิบายตำแหน่งบนท้องฟ้า เลือกราศีบนวงล้อเพื่อดูชื่อภาษาอังกฤษและภาษาไทย','wheel'),
        slide('Numbers become planets','In Thai astrology, a digit may name a celestial body rather than a quantity. ๑ is the Sun, ๒ is the Moon, and ๓ is Mars.','๑ Sun · ๒ Moon · ๓ Mars · ๔ Mercury','Always read a symbol in its context. The same ๑ can also simply mean one.','ตัวเลขแทนดวงดาว','ในโหราศาสตร์ไทย ตัวเลขอาจแทนดวงดาว เช่น ๑ คืออาทิตย์ ๒ คือจันทร์ และ ๓ คืออังคาร','planets'),
        slide('The planetary key','Continue the key with ๕ Jupiter, ๖ Venus, and ๗ Saturn. Their recorded sign tells you where they appeared at that moment.','๕ Jupiter · ๖ Venus · ๗ Saturn','Planetary numbers name bodies; they do not measure distance.','กุญแจดวงดาว','๕ แทนพฤหัสบดี ๖ แทนศุกร์ และ ๗ แทนเสาร์','planets'),
        slide('Rahu and Ketu','Rahu and Ketu refer to the intersections of the Moon’s orbit with the ecliptic: the ascending and descending lunar nodes. They lie opposite each other.','๘ Rahu · ๙ Ketu · ๐ Uranus','Terminology varies. Ketu, a lunar node, must not be confused with the planet Neptune.','ราหูและเกตุ','ราหูและเกตุเกี่ยวข้องกับจุดตัดวงโคจรจันทร์กับสุริยวิถี อยู่ตรงข้ามกัน','planets'),
        slide('Meet your ascendant','The ascendant is the zodiac sign crossing the eastern horizon at the chosen time and place. Thai records often mark it with ล.','ล = ลัคนา = ascendant','An accurate time and location matter: the rising sign changes roughly every two hours.','รู้จักลัคนา','ลัคนาคือราศีที่ขึ้นทางขอบฟ้าทิศตะวันออกในเวลาและสถานที่ที่กำหนด','wheel'),
        slide('Different celestial rhythms','Different bodies cross signs at different rates. The Moon takes roughly 2½ days per sign; the Sun about a month; Saturn about 2½ years.','Moon: days · Sun: a month · Saturn: years','These are average rates. Apparent motion is not uniform.','จังหวะของดวงดาว','ดวงดาวใช้เวลาผ่านแต่ละราศีต่างกัน จันทร์ราว 2½ วัน อาทิตย์ราวหนึ่งเดือน เสาร์ราว 2½ ปี','wheel'),
        slide('Read a temple record','The course’s Wat Ram Poeng example places the Sun and Mars in Aries, the Moon and Venus in Taurus, and the ascendant in Gemini.','๑ + ๓ in Aries; ๒ + ๖ in Taurus; ล in Gemini','Read the sign sector first, then identify the digits inside it.','อ่านบันทึกวัดรํ่าเปิง','ตัวอย่างในเอกสารระบุอาทิตย์และอังคารอยู่เมษ จันทร์และศุกร์อยู่พฤษภ ลัคนาอยู่เมถุน','wheel'),
        slide('Eclipses and alignment','A solar eclipse needs the Moon between Earth and the Sun, near a lunar node. A lunar eclipse needs Earth between the Sun and Moon, again near a node.','Solar: new Moon near a node. Lunar: full Moon near a node.','An ordinary new or full Moon does not always cause an eclipse.','คราสและแนวเรียงตัว','สุริยุปราคาเกิดใกล้จันทร์ดับและจันทรุปราคาเกิดใกล้จันทร์เพ็ญ โดยต้องอยู่ใกล้จุดโหนด','wheel'),
        slide('Calculation and interpretation','Traditional astrology brings together sky calculations, interpretations, and rituals. In this app, calculated positions and reflective descriptions are kept distinct.','Position: a calculation. Meaning: a cultural interpretation.','Astrological personality readings are not scientifically established predictions.','การคำนวณและการตีความ','แยกตำแหน่งดวงดาวที่คำนวณได้ออกจากการตีความตามวัฒนธรรม','wheel'),
        slide('Bring the sky into focus','You can now identify signs, read planetary digits, and explain the ascendant. Try the chart explorer to see calculated Sun, Moon, and rising placements.','Look for ๑, ๒, and ล in a chart. What does each one mean?','Use astrology for reflection and entertainment, not certainty.','สำรวจท้องฟ้าด้วยตัวคุณ','ลองสร้างแผนผังเพื่อดูตำแหน่งอาทิตย์ จันทร์ และลัคนา ใช้เพื่อเรียนรู้และความบันเทิง','wheel'),
    ]),
dict(slug='thai-numerals',title='Thai Numeral Systems',title_th='ระบบเลขไทย',subtitle='Familiar values, a beautiful new script.',subtitle_th='ค่าเดิมในสัญลักษณ์ใหม่',system='thai',intro='Learn the ten Thai digits and the decimal place values they share with Hindu-Arabic numerals.',terms=[['Digit','A symbol used to write a number.'],['Place value','A digit’s value depends on its position.'],['Zero','A number and a placeholder.']],source='Decimal place value: Doc1.1 Numeral Systems, pp. 16–25. Thai glyphs: standard Thai digits.',slides=[
slide('Ten digits, endless possibilities','Thai numerals use ten distinct symbols for zero through nine. They write the same quantities as the digits 0–9.','๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙','Learn each shape before reading long numbers.','สิบสัญลักษณ์','เลขไทยมีสิบสัญลักษณ์แทนค่าศูนย์ถึงเก้า'),
slide('Meet the digits','Read the symbols from left to right, just as you read a decimal number.','๑ = 1 · ๒ = 2 · ๓ = 3 · ๔ = 4 · ๕ = 5','Do not confuse ๓ (3) and ๗ (7).','รู้จักตัวเลข','อ่านสัญลักษณ์จากซ้ายไปขวาเช่นเดียวกับเลขฐานสิบ'),
slide('Position gives value','Thai numerals use decimal place value. Starting at the right, places are ones, tens, hundreds, and thousands.','๒๕๖ = 2 × 100 + 5 × 10 + 6 = 256','The symbol ๒ is worth 200 in the hundreds place.','ค่าประจำหลัก','จากขวาไปซ้ายคือหลักหน่วย สิบ ร้อย และพัน'),
slide('Give zero its place','๐ preserves empty places. Without it, the other digits move and the number changes.','๓๐๗ = 307; ๓๗ = 37','An empty hundreds or tens place still needs its zero.','บทบาทของศูนย์','๐ ช่วยรักษาตำแหน่งที่ไม่มีค่า ถ้าละศูนย์ ค่าของจำนวนจะเปลี่ยน'),
slide('Read a year','Years on Thai inscriptions often use Thai digits. The Buddhist Era year is commonly 543 greater than the Gregorian year.','พ.ศ. ๒๕๖๗ = 2567 BE = 2024 CE','A numeral script and a calendar era are separate ideas.','อ่านปีพุทธศักราช','ปีพุทธศักราชโดยทั่วไปมากกว่าคริสต์ศักราช 543 ปี'),
slide('Your turn to translate','Read each digit, keep its position, and rebuild the number.','๑๒๐๖ = 1 × 1000 + 2 × 100 + 0 × 10 + 6 = 1206','Check every place, including zero.','ลองแปลงเลข','อ่านแต่ละตัวโดยคงตำแหน่ง และตรวจสอบศูนย์ทุกหลัก')]),
dict(slug='mayan',title='Mayan Numerals',title_th='ตัวเลขมายา',subtitle='A dot, a bar, a whole world of numbers.',subtitle_th='จุด ขีด และโลกของจำนวน',system='mayan',intro='Discover a vertical numeral system with a remarkable symbol for zero.',terms=[['Dot','One unit.'],['Bar','Five units.'],['Vigesimal','A system with base 20.']],source='Doc1.1 Numeral Systems, pp. 35–41; ordinary base-20 counting is distinguished from calendar notation.',slides=[
slide('A number in three symbols','Maya numerals use a dot for one, a bar for five, and a shell-like symbol for zero.','•••• over two bars = 4 + 5 + 5 = 14','Read all dots and bars within one level together.','สามสัญลักษณ์','จุดแทนหนึ่ง ขีดแทนห้า และสัญลักษณ์เปลือกหอยแทนศูนย์'),
slide('Build zero through nineteen','A single level holds a digit from 0 to 19. Use up to four dots and three bars.','19 = 4 dots + 3 bars','Five dots should become one bar.','สร้างศูนย์ถึงสิบเก้า','หนึ่งระดับแทนค่า 0 ถึง 19 ใช้ได้ถึงสี่จุดและสามขีด'),
slide('Read from the bottom','Ordinary Maya counting uses powers of twenty, stacked vertically. The bottom is ones; above it are twenties; above those, four hundreds.','Top 2, bottom 3 → 2 × 20 + 3 = 43','Do not read vertical levels as decimal digits.','อ่านจากล่างขึ้นบน','เลขมายาทั่วไปใช้กำลังของยี่สิบ ระดับล่างเป็นหน่วย ถัดขึ้นมาเป็นยี่สิบและสี่ร้อย'),
slide('Zero holds a level','A shell in a level means zero units in that place. Keep that level when calculating.','Top 1, middle 0, bottom 4 → 1 × 400 + 0 × 20 + 4 = 404','Removing a zero level changes the place values.','ศูนย์รักษาตำแหน่ง','ระดับที่มีเปลือกหอยมีค่าเป็นศูนย์แต่ยังต้องรักษาตำแหน่ง'),
slide('The calendar exception','Maya Long Count calendar notation uses 1, 20, 360, 7200… as day-based place values. Its third place is 18 × 20, rather than 20 × 20.','1 tun = 18 uinal = 360 days','The games use ordinary base-20 counting unless explicitly marked as calendar notation.','ข้อยกเว้นปฏิทิน','ปฏิทินนับยาวใช้ค่าประจำหลัก 1, 20, 360, 7200 ต่างจากฐานยี่สิบทั่วไป'),
slide('Make the connection','For each level, count its dots and bars, multiply by its place value, then add the products.','Levels 1, 2, 3 → 400 + 40 + 3 = 443','Always identify the counting convention first.','เชื่อมโยงความเข้าใจ','นับจุดและขีดในแต่ละระดับ คูณค่าประจำหลัก แล้วรวมกัน')]),
dict(slug='babylonian',title='Babylonian Numerals',title_th='ตัวเลขบาบิโลน',subtitle='Written in clay. Still present in our clocks.',subtitle_th='เขียนบนดินเหนียว อยู่ในนาฬิกาวันนี้',system='babylonian',intro='Explore the base-60 system behind minutes, seconds, and the degrees of a circle.',terms=[['Sexagesimal','A system with base 60.'],['Unit wedge','A vertical wedge worth one.'],['Ten wedge','A corner wedge worth ten.']],source='Doc1.1 Numeral Systems, pp. 27–34.',slides=[
slide('Two shapes in clay','Babylonian scribes pressed wedges into wet clay. Unit wedges and ten wedges combine to represent digits from 1 to 59.','3 ten wedges + 4 unit wedges = 34','The orientation of a wedge matters.','สองรูปบนดินเหนียว','ลิ่มหน่วยและลิ่มสิบรวมกันเพื่อแทนค่า 1 ถึง 59'),
slide('Groups become digits','A group of wedges forms one base-60 digit. Read the tens first, then the ones within each group.','〈〈 followed by 𒁹𒁹𒁹 represents 23','Spaces between groups separate place values.','กลุ่มสัญลักษณ์','หนึ่งกลุ่มเป็นหนึ่งหลักฐานหกสิบ แยกกลุ่มเพื่อแยกค่าประจำหลัก'),
slide('The power of sixty','Read places from right to left as 1, 60, 3600, and higher powers of 60.','Groups 2 : 14 → 2 × 60 + 14 = 134','A group worth 14 is still one base-60 digit.','กำลังของหกสิบ','จากขวาไปซ้าย ค่าประจำหลักคือ 1, 60, 3600 และกำลังถัดไป'),
slide('Where is zero?','Early notation lacked a consistent zero placeholder. Later scribes developed a placeholder, but historical context could still be necessary.','1 : 0 : 2 → 1 × 3600 + 0 × 60 + 2 = 3602','Our learning diagrams show an explicit 0 to remove historical ambiguity.','ศูนย์อยู่ที่ไหน','เดิมไม่มีศูนย์ที่ชัดเจน ต่อมามีสัญลักษณ์เว้นหลัก ในแอปแสดง 0 เพื่อความชัดเจน'),
slide('Look at your clock','Sixty divides into many useful whole-number parts. We still measure hours, minutes, and seconds with divisions of sixty.','1 hour = 60 minutes = 3600 seconds','Clock notation is a helpful analogy, not a perfect copy of clay numerals.','มองนาฬิกา','หนึ่งชั่วโมงมีหกสิบนาที และมีสามพันหกร้อยวินาที'),
slide('Read a larger number','Find each group’s value and multiply it by its power of sixty.','1 : 2 : 3 → 3600 + 120 + 3 = 3723','Do not multiply the left group by ten. This is base sixty.','อ่านจำนวนที่มากขึ้น','หาค่าแต่ละกลุ่ม คูณกำลังของหกสิบ แล้วรวมผลลัพธ์')]),
dict(slug='roman',title='Roman Numerals',title_th='ตัวเลขโรมัน',subtitle='Seven letters. Centuries of stories.',subtitle_th='เจ็ดตัวอักษร เรื่องราวหลายศตวรรษ',system='roman',intro='Read the numerals on clock faces, monuments, and the closing credits of films.',terms=[['Additive notation','Larger symbols followed by smaller ones add together.'],['Subtractive pair','A smaller symbol before a larger one can subtract.'],['Canonical form','The modern standardized way of writing a numeral.']],source='Doc1.1 Numeral Systems, pp. 58–70.',slides=[
slide('Meet the seven symbols','Roman numerals use letters with fixed values, rather than positional digits.','I = 1 · V = 5 · X = 10 · L = 50 · C = 100 · D = 500 · M = 1000','There is no standard Roman digit for zero.','เจ็ดสัญลักษณ์','ตัวเลขโรมันใช้ตัวอักษรเจ็ดตัวที่มีค่าคงที่ และไม่มีศูนย์แบบมาตรฐาน'),
slide('Add as you read','When values descend from left to right, add them together.','XVI = 10 + 5 + 1 = 16','V, L, and D are not repeated in canonical form.','อ่านแล้วบวก','เมื่อค่าเรียงจากมากไปน้อย ให้รวมค่าของแต่ละตัว'),
slide('A little subtraction','A smaller symbol before a larger one can form a subtractive pair. Learn the six permitted pairs.','IV = 4 · IX = 9 · XL = 40 · XC = 90 · CD = 400 · CM = 900','IC is not a valid way to write 99. Use XCIX.','การลบ','มีคู่ลบที่ใช้ได้หกคู่: IV, IX, XL, XC, CD และ CM'),
slide('Decode XIV','Split the numeral into X and IV, then add their values.','XIV = X + IV = 10 + 4 = 14','Only the I in IV subtracts. X remains positive.','ถอดรหัส XIV','แยกเป็น X และ IV แล้วรวมค่า 10 กับ 4 ได้ 14'),
slide('Write a year','Separate a year into thousands, hundreds, tens, and ones, then write each part.','1994 = 1000 + 900 + 90 + 4 = MCMXCIV','Use no more than three consecutive I, X, C, or M in modern notation.','เขียนเลขปี','แยกปีเป็นพัน ร้อย สิบ และหน่วย แล้วเขียนทีละส่วน'),
slide('Spot the common mistakes','Modern notation permits only one smaller symbol in a subtractive pair. Historical inscriptions can use different conventions.','8 = VIII, not IIX; 49 = XLIX, not IL','Some clock faces show IIII. Historical practice and modern rules can differ.','ข้อผิดพลาดที่พบบ่อย','คู่ลบใช้ตัวเล็กเพียงหนึ่งตัว นาฬิกาบางแบบใช้ IIII ตามธรรมเนียม')])]

def roman(n):
    out=''
    for v,s in [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]:
        q,n=divmod(n,v); out+=s*q
    return out

from .translations import adapt_lessons,explain_th
adapt_lessons(LESSONS)
from .lesson_curriculum import enrich_lessons
enrich_lessons(LESSONS)

def representation(n, system):
    if system == 'roman': return {'text':roman(n),'levels':[]}
    if system == 'thai': return {'text':str(n).translate(str.maketrans('0123456789','๐๑๒๓๔๕๖๗๘๙')),'levels':[]}
    base=20 if system=='mayan' else 60
    levels=[]
    while n:
        n,d=divmod(n,base); levels.insert(0,d)
    return {'text':'', 'levels':levels or [0]}

def explanation(n,system):
    if system=='roman':
        return f'{roman(n)} = {n}. Read larger values additively and subtract only in IV, IX, XL, XC, CD, or CM.'
    if system=='thai': return f'{representation(n,system)["text"]} = {n}. Keep the same decimal place values while changing the digit shapes.'
    base=20 if system=='mayan' else 60
    levels=representation(n,system)['levels']
    terms=[f'{d} × {base**(len(levels)-i-1)}' for i,d in enumerate(levels)]
    return f'{" + ".join(terms)} = {n}. '+('Read vertical levels from bottom (ones) upward; ordinary base 20 is used here.' if system=='mayan' else 'Read each wedge group as one base-60 digit.')

@lru_cache(maxsize=1)
def generated_bank():
    bank=[]
    for system in ['roman','mayan','babylonian','thai']:
        for i in range(1,301):
            n=(14 if i==1 else 1 if i==14 else i) if i<=100 else (101+(i-101)*37%900 if i<=200 else 1001+(i-201)*37%2999)
            r=random.Random(f'{system}:{i}')
            options=list(set([n,max(1,n-2),n+2,n+5])); r.shuffle(options)
            bank.append(dict(id=f'{system}-{i}',system=system,kind='decode',difficulty='beginner' if n<=100 else ('intermediate' if n<=1000 else 'advanced'),prompt='Which modern number does this numeral represent?',prompt_th='สัญลักษณ์นี้แทนจำนวนใด?',representation=representation(n,system),answer=str(n),choices=[str(x) for x in options],explanation=explanation(n,system),explanation_th=explain_th(n,system,representation(n,system)),hint='Split the numeral into its symbols or place-value groups.',hint_th='แยกสัญลักษณ์หรือกลุ่มตามค่าประจำหลัก แล้วรวมค่า',tags=[system,'conversion','place-value'],version=1))
    from .astrology_game import astrology_questions
    return bank+astrology_questions()

def get_lessons():
    if mongo is not None: return list(mongo.lesson_modules.find({}, {'_id':0}))
    if DEVELOPMENT: return LESSONS
    raise HTTPException(503,'The lesson database is unavailable. Please try again.')

def get_lesson(slug):
    if mongo is not None: lesson=mongo.lesson_modules.find_one({'slug':slug},{'_id':0})
    else: lesson=next((x for x in get_lessons() if x['slug']==slug),None)
    if not lesson: raise HTTPException(404,'Lesson not found')
    return lesson

def bank_questions(system=None,difficulty=None):
    if mongo is not None:
        query={'kind':'astroquest' if system=='astrology' else 'decode'}
        if system: query['system']=system
        if difficulty: query['difficulty']=difficulty
        return list(mongo.question_bank.find(query,{'_id':0}).limit(1500))
    if DEVELOPMENT: return [q for q in generated_bank() if (not system or q['system']==system) and (not difficulty or q['difficulty']==difficulty)]
    raise HTTPException(503,'The question database is unavailable.')

EVENTS=[('Babylonian clay numerals',-1800),('Roman numerals develop',-500),('Classical Maya civilization',300),('Liber Abaci published',1202),('Printing spreads decimal numerals in Europe',1450),('A Roman numeral year: MCMLVII',1957),('A Thai numeral year: พ.ศ. ๒๕๖๗',2024)]

def make_activity(activity,system,difficulty,seed):
    rng=random.Random(seed)
    if activity=='astroquest':
        pool=bank_questions('astrology',difficulty)
        if len(pool)<10:raise HTTPException(503,'Astrology practice questions are unavailable. Please seed the content database.')
        return rng.sample(pool,10)
    pool=bank_questions(system,difficulty)
    if not pool: raise HTTPException(503,'No questions available at this difficulty.')
    if activity=='decode':
        # Include the course's worked example, generated by the same converter.
        if system=='roman' and difficulty=='beginner':
            example=next(q for q in pool if q['answer']=='14')
            chosen=[example]+rng.sample([q for q in pool if q['id']!=example['id']],9)
        else: chosen=rng.sample(pool,min(10,len(pool)))
        return chosen
    questions=[]
    for i in range(10):
        q=dict(id=f'{seed}-{i}',kind=activity,system=system,choices=[],hint='Use the reference key and work through one item at a time.')
        if activity=='match':
            qs=rng.sample(pool,4); values=[x['answer'] for x in qs]; options=values.copy(); rng.shuffle(options)
            q.update(prompt='Match each ancient numeral to its modern value.',prompt_th='จับคู่สัญลักษณ์โบราณกับค่าปัจจุบัน',symbols=[x['representation'] for x in qs],options=options,answer=','.join(values),explanation='; '.join(x['explanation'] for x in qs),explanation_th='; '.join(x['explanation_th'] for x in qs))
        elif activity=='timeline':
            events=rng.sample(EVENTS,4); rng.shuffle(events)
            q.update(prompt='Arrange these moments from earliest to latest.',prompt_th='เรียงเหตุการณ์จากเก่าสุดไปใหม่สุด',events=[{'label':x[0],'year':f'{abs(x[1])} {"BCE" if x[1]<0 else "CE"}' if difficulty!='advanced' else 'Recall the historical order'} for x in events],answer=','.join(str(x) for x in sorted(range(4),key=lambda j:events[j][1])),explanation=' → '.join(x[0] for x in sorted(events,key=lambda x:x[1])),hint='BCE dates come before CE dates. Larger BCE numbers are earlier.',hint_th='ปีก่อนคริสต์ศักราช (BCE) มาก่อนคริสต์ศักราช (CE) ยิ่งตัวเลข BCE มาก ยิ่งเก่า')
        else:
            y=rng.randint(1900,2026); m=rng.randint(1,12); d=rng.randint(1,28)
            q.update(prompt='Build this Gregorian date in modern digits.',prompt_th='ประกอบวันที่คริสต์ศักราชด้วยตัวเลขปัจจุบัน',date_parts=[representation(x,system) for x in [d,m,y]],answer=f'{y:04}-{m:02}-{d:02}',explanation=f'Day {d}, month {m}, year {y}. The date is {y:04}-{m:02}-{d:02}.',explanation_th=f'วันที่ {d} เดือน {m} ปี {y} → {y:04}-{m:02}-{d:02}',hint='The symbols show day, month, and year, in that order. Use ordinary counting, not the Maya calendar.',hint_th='สัญลักษณ์แสดงวัน เดือน ปี ตามลำดับ ใช้การนับทั่วไป ไม่ใช่ปฏิทินมายา')
        q.setdefault('hint_th','ใช้ตารางอ้างอิง แล้วพิจารณาทีละส่วน')
        q.setdefault('explanation_th',q['explanation'])
        questions.append(q)
    return questions

def public_question(q): return {k:v for k,v in q.items() if k not in ('answer','answer_th','explanation','explanation_th')}
