"""Course-grounded astrology practice. Symbol knowledge, never personal predictions."""
import random

SIGNS=[('Aries','เมษ','♈'),('Taurus','พฤษภ','♉'),('Gemini','เมถุน','♊'),('Cancer','กรกฎ','♋'),('Leo','สิงห์','♌'),('Virgo','กันย์','♍'),('Libra','ตุลย์','♎'),('Scorpio','พิจิก','♏'),('Sagittarius','ธนู','♐'),('Capricorn','มกร','♑'),('Aquarius','กุมภ์','♒'),('Pisces','มีน','♓')]
PLANETS=[('๑','Sun','อาทิตย์'),('๒','Moon','จันทร์'),('๓','Mars','อังคาร'),('๔','Mercury','พุธ'),('๕','Jupiter','พฤหัสบดี'),('๖','Venus','ศุกร์'),('๗','Saturn','เสาร์'),('๘','Rahu','ราหู'),('๙','Ketu','เกตุ'),('๐','Uranus','มฤตยู'),('ล','Ascendant','ลัคนา')]

def astrology_questions():
    questions=[]
    def add(key,difficulty,prompt,prompt_th,answer,answer_th,alternatives,explanation,explanation_th,glyph='✧',hint='Recall the signs and planetary symbols from the Thai astrology lesson.',hint_th='ทบทวนลำดับราศีและสัญลักษณ์ดาวในบทโหราศาสตร์ไทย'):
        choices=[(answer,answer_th)]+alternatives[:3]
        random.Random(key).shuffle(choices)
        questions.append(dict(id='astrology-'+key,system='astrology',kind='astroquest',difficulty=difficulty,prompt=prompt,prompt_th=prompt_th,representation={'text':glyph+'\uFE0E','levels':[]},answer=answer,choices=[x[0] for x in choices],choices_th=[x[1] for x in choices],explanation=explanation,explanation_th=explanation_th,hint=hint,hint_th=hint_th,tags=['thai-astrology','course-practice',difficulty],version=1))
    for i,(name,thai,glyph) in enumerate(SIGNS):
        other=[(SIGNS[(i+j)%12][0],SIGNS[(i+j)%12][1]) for j in (2,5,8)]
        add('sign-'+str(i),'beginner','Which zodiac sign uses this symbol?','สัญลักษณ์นี้เป็นของราศีใด?',name,thai,other,f'{glyph} is the symbol for {name}. The zodiac has twelve equal signs.',f'{glyph} คือสัญลักษณ์ราศี{thai} จักรราศีแบ่งเป็น 12 ราศี',glyph)
        following=SIGNS[(i+1)%12]
        add('next-'+str(i),'intermediate',f'Which sign comes immediately after {name}?',f'ราศีใดอยู่ถัดจากราศี{thai}?',following[0],following[1],[(SIGNS[(i+j)%12][0],SIGNS[(i+j)%12][1]) for j in (0,3,6)],f'The order is {name} → {following[0]}. After Pisces the sequence returns to Aries.',f'ลำดับคือ {thai} → {following[1]} หลังมีนจะวนกลับไปเมษ',glyph)
        longitude=i*30+17
        add('longitude-'+str(i),'advanced',f'In the equal-sign zodiac, which sign contains longitude {longitude}°?',f'ในจักรราศีแบ่งเท่ากัน ลองจิจูด {longitude}° อยู่ในราศีใด?',name,thai,other,f'{name} spans {i*30}° up to (but not including) {(i+1)*30}°. {longitude}° falls inside that sector.',f'ราศี{thai} เริ่มที่ {i*30}° ถึงก่อน {(i+1)*30}° ดังนั้น {longitude}° อยู่ในราศี{thai}',f'{longitude}°',hint='Aries starts at 0°. Each sign spans 30°; count forward.',hint_th='เมษเริ่มที่ 0° แต่ละราศีกว้าง 30° ให้นับตามลำดับราศี')
    for i,(digit,name,thai) in enumerate(PLANETS):
        other=[(PLANETS[(i+j)%11][1],PLANETS[(i+j)%11][2]) for j in (2,5,8)]
        add('planet-'+str(i),'beginner','What does this symbol represent in a Thai horoscope?','สัญลักษณ์นี้แทนอะไรในดวงโหราศาสตร์ไทย?',name,thai,other,f'In a Thai horoscope, {digit} represents {name}. Its meaning depends on the chart context.',f'ในดวงโหราศาสตร์ไทย {digit} แทน{thai} ต้องอ่านตามบริบท ไม่ใช่เป็นจำนวนเสมอไป',digit)
        add('digit-'+str(i),'intermediate',f'Which Thai horoscope symbol represents {name}?',f'สัญลักษณ์ใดแทน{thai}ในดวงโหราศาสตร์ไทย?',digit,digit,[(PLANETS[(i+j)%11][0],PLANETS[(i+j)%11][0]) for j in (2,5,8)],f'{name} is marked {digit} in this course’s Thai horoscope convention.',f'{thai}ใช้สัญลักษณ์ {digit} ตามรูปแบบดวงในบทเรียน',name if name=='Ascendant' else '☼')
    facts=[
        ('horizon','Where is the ascendant measured?','ลัคนาอยู่ที่ขอบฟ้าด้านใด?','Eastern horizon','ขอบฟ้าทิศตะวันออก',[('Western horizon','ขอบฟ้าทิศตะวันตก'),('North pole','ขั้วโลกเหนือ'),('Earth’s centre','ศูนย์กลางโลก')],'The ascendant is the zodiac sign rising on the eastern horizon at a particular time and place.','ลัคนาคือราศีที่ขึ้นทางขอบฟ้าทิศตะวันออก ณ เวลาและสถานที่หนึ่ง'),
        ('sector','How wide is one equal zodiac sign?','หนึ่งราศีที่แบ่งเท่ากันกว้างกี่องศา?','30°','30°',[('12°','12°'),('60°','60°'),('90°','90°')],'360° divided by 12 signs is 30° per sign.','360° ÷ 12 ราศี = ราศีละ 30°'),
        ('ecliptic','What is the ecliptic?','สุริยวิถีคืออะไร?','The Sun’s apparent annual path','เส้นทางปรากฏของดวงอาทิตย์ในรอบปี',[('Earth’s equator','เส้นศูนย์สูตรโลก'),('The Moon’s surface','พื้นผิวดวงจันทร์'),('A city boundary','เขตเมือง')],'Seen from Earth, the Sun appears to move along the ecliptic during the year.','เมื่อมองจากโลก ดวงอาทิตย์มีเส้นทางปรากฏในรอบปีเรียกว่าสุริยวิถี'),
        ('node','What is Ketu in this course’s clarified convention?','เกตุในคำอธิบายที่แก้ให้ชัดเจนหมายถึงอะไร?','The descending lunar node','จุดโหนดขาลงของดวงจันทร์',[('Neptune','ดาวเนปจูน'),('The Sun','ดวงอาทิตย์'),('A zodiac sign','ชื่อราศี')],'Ketu is a lunar node, not the planet Neptune. This clarifies an inconsistency in the source.','เกตุคือจุดโหนดขาลงของดวงจันทร์ ไม่ใช่ดาวเนปจูน เป็นการชี้แจงคำที่คลาดเคลื่อนในเอกสาร'),
        ('inputs','Which details are needed for an ascendant calculation?','การคำนวณลัคนาต้องใช้ข้อมูลใด?','Date, time, and place','วัน เวลา และสถานที่',[('Name only','ชื่ออย่างเดียว'),('Favourite colour','สีที่ชอบ'),('Age only','อายุอย่างเดียว')],'The eastern horizon depends on the time and geographic location, so the date, local time, and place matter.','ขอบฟ้าตะวันออกสัมพันธ์กับเวลาและตำแหน่งบนโลก จึงต้องใช้วัน เวลาเกิด และสถานที่'),
        ('certainty','How should a reflective horoscope be used?','ควรใช้คำอ่านดวงอย่างไร?','For reflection and entertainment','เพื่อทบทวนตนเองและความบันเทิง',[('As a guaranteed prediction','เป็นคำทำนายที่รับประกัน'),('As a medical diagnosis','ใช้วินิจฉัยโรค'),('As a scientific personality test','เป็นแบบทดสอบบุคลิกทางวิทยาศาสตร์')],'Chart positions are calculations; personality interpretations are cultural reflections, not established scientific predictions.','ตำแหน่งดาวเป็นผลคำนวณ ส่วนคำตีความเป็นมุมมองตามวัฒนธรรม ไม่ใช่คำทำนายทางวิทยาศาสตร์ที่รับประกัน')]
    for difficulty in ['beginner','intermediate','advanced']:
        for key,p,pt,a,at,other,e,et in facts:add(key+'-'+difficulty,difficulty,p,pt,a,at,other,e,et)
    return questions
