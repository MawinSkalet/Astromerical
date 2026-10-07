from app.content import LESSONS
from app.quiz_questions import astrology_slide_questions,numeral_slide_questions


def test_every_live_question_has_a_teaching_slide_in_both_languages():
    questions=astrology_slide_questions()+numeral_slide_questions()
    lessons={lesson['slug']:lesson for lesson in LESSONS}
    covered={topic for lesson in LESSONS for slide in lesson['slides'] for topic in slide['quiz_topics']}
    assert len(questions)==38 and covered=={q['id'] for q in questions}
    for question in questions:
        slide=lessons[question['source_lesson']]['slides'][question['source_slide']-1]
        assert question['id'] in slide['quiz_topics']
        assert slide['title']==question['source_title'] and slide['title_th']==question['source_title_th']
        assert slide['body'] and slide['body_th']!=slide['body']
        assert question['explanation'] and question['explanation_th']


def test_assessed_rules_are_visible_without_opening_examples():
    lessons={lesson['slug']:lesson['slides'] for lesson in LESSONS}
    checks={
        ('thai-astrology',1):('360°','12','30°'),
        ('thai-astrology',5):('๘','๙','๐','180°'),
        ('thai-astrology',6):('ล',),
        ('thai-numerals',2):('๒๕๖','200','50','256'),
        ('thai-numerals',4):('543','2567','2024'),
        ('thai-numerals',5):('๑๒๐๖','1206'),
        ('mayan',2):('20','400','43'),
        ('mayan',4):('18','360','400'),
        ('babylonian',2):('60','3600','134'),
        ('roman',0):('D=500','M=1000'),
        ('roman',2):('IV=4','IX=9','XL=40','XC=90','CD=400','CM=900'),
        ('roman',5):('99','XCIX','IC','VIII','IIX'),
    }
    for (slug,index),facts in checks.items():
        for language in ('body','body_th'):
            assert all(fact in lessons[slug][index][language] for fact in facts),(slug,index,language)
    ascendant=lessons['thai-astrology'][6]
    assert all(word in ascendant['body'] for word in ('eastern','date','local birth time','birthplace'))
    assert all(word in ascendant['body_th'] for word in ('ตะวันออก','วันเกิด','เวลาเกิด','สถานที่เกิด'))
