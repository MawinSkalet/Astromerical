import pytest

from app.content import get_lessons
from app.tutor import _openrouter_model_route, _tutor_provider_config, course_guide_answer, retrieve_course_chunks


RETRIEVAL_CASES = [
    ('thai-astrology', 'Follow the ecliptic', 'What is the ecliptic, and how many degrees does each zodiac sector cover?'),
    ('thai-astrology', 'Twelve signs, one sky', 'Why are zodiac sectors equal even though real constellations are not?'),
    ('thai-astrology', 'Numbers become planets', 'บนแผนผังดวง เลข ๑ ๒ ๓ ๔ หมายถึงดาวอะไรบ้าง'),
    ('thai-astrology', 'The planetary key', 'What does number 6 mean on a Thai chart, and what does its zodiac sector tell us?'),
    ('thai-astrology', 'Rahu and Ketu', 'ราหูกับเกตุเป็นดาวเคราะห์จริงไหม ต่างกันอย่างไร'),
    ('thai-astrology', 'Meet your ascendant', 'What details are needed to calculate the ascendant, and how often does it change?'),
    ('thai-astrology', 'Different celestial rhythms', 'Which changes sign fastest: Moon, Sun, or Saturn? Give approximate times.'),
    ('thai-astrology', 'Read a temple record', 'ในตัวอย่างวัดร่ำเปิง ราศีเมษและพฤษภมีดาวอะไรอยู่บ้าง'),
    ('thai-astrology', 'Eclipses and alignment', 'What alignment causes a solar eclipse, and why not every new moon?'),
    ('thai-astrology', 'Calculation and interpretation', 'ตำแหน่งดาวกับคำทำนายบุคลิกเป็นข้อมูลชนิดเดียวกันหรือไม่'),
    ('thai-numerals', 'Ten digits, endless possibilities', 'Do Thai numerals use different quantities or just different written shapes from 0–9?'),
    ('thai-numerals', 'Meet the digits', 'เลขไทย ๓ กับ ๗ ต้องอ่านค่าอย่างไร และมีค่าเท่าเลขสากลไหม'),
    ('thai-numerals', 'Position gives value', 'Explain the hundreds, tens and ones in ๒๕๖.'),
    ('thai-numerals', 'Give zero its place', 'Why is ๓๐๗ different from ๓๗?'),
    ('thai-numerals', 'Read a year', 'How do I convert พ.ศ. ๒๕๖๗ to the modern CE year?'),
    ('thai-numerals', 'Your turn to translate', 'แปลงเลขไทย ๑๒๐๖ เป็นเลขสากล พร้อมบอกว่าศูนย์ทำหน้าที่อะไร'),
    ('thai-numerals', 'Meet the digits', 'In what direction should Thai numerals be read, and how do you identify each digit?'),
    ('thai-numerals', 'Position gives value', 'In 256, what value does the 2 contribute?'),
    ('thai-numerals', 'Read a year', 'When converting a modern Buddhist Era year to CE, should I add or subtract 543?'),
    ('thai-numerals', 'Your turn to translate', 'What place-value contributions do ๑, ๒, ๐, and ๖ make in ๑๒๐๖?'),
    ('mayan', 'A number in three symbols', 'What values do a Maya dot, bar, and shell represent?'),
    ('mayan', 'Build zero through nineteen', 'How can Maya symbols represent 19, and what happens when counting reaches 20?'),
    ('mayan', 'Read from the bottom', 'In ordinary Maya base 20, what number is top level 2 and bottom level 3?'),
    ('mayan', 'Zero holds a level', 'Why does a shell between 1 and 4 make 404 instead of 24?'),
    ('mayan', 'The calendar exception', 'What are the Maya Long Count place values, and how does the third place differ from ordinary base 20?'),
    ('mayan', 'Make the connection', 'เลขมายาที่ซ้อนจากบนลงล่างเป็น 1, 2, 3 มีค่าเท่าไร คิดอย่างไร'),
    ('mayan', 'A number in three symbols', 'How many dots and bars make 14 at one Maya level?'),
    ('mayan', 'Build zero through nineteen', 'Why can a single Maya level not contain a value of 20?'),
    ('mayan', 'Read from the bottom', 'What are the first three place values in ordinary Maya base 20?'),
    ('mayan', 'The calendar exception', 'Is the third Maya calendar place 400 or 360, and why?'),
    ('babylonian', 'Two shapes in clay', 'How do Babylonian unit and ten wedges combine to make 34?'),
    ('babylonian', 'Groups become digits', 'Does a space separate tens from units or separate base-60 place groups?'),
    ('babylonian', 'The power of sixty', 'List Babylonian place values from right to left.'),
    ('babylonian', 'The power of sixty', 'Why does 2 : 14 mean 134 instead of decimal 214?'),
    ('babylonian', 'Where is zero?', 'Compare 1:0:2 with 1:2 in Babylonian base 60.'),
    ('babylonian', 'Where is zero?', 'Was a zero placeholder always present in the earliest Babylonian records?'),
    ('babylonian', 'Look at your clock', 'How does the clock’s division of hours and minutes connect to sexagesimal counting?'),
    ('babylonian', 'Read a larger number', 'คำนวณ 1 : 2 : 3 ในระบบฐานหกสิบได้เท่าไร'),
    ('babylonian', 'Groups become digits', 'What value is one group containing two ten wedges and three unit wedges?'),
    ('babylonian', 'Two shapes in clay', 'How does wedge orientation distinguish a unit wedge from a ten wedge?'),
    ('roman', 'Meet the seven symbols', 'What are the fixed values of the seven Roman numeral symbols?'),
    ('roman', 'Add as you read', 'How is XVI calculated when values descend from left to right?'),
    ('roman', 'A little subtraction', 'Which standard Roman subtractive pair represents 90, and are all smaller-before-larger pairs allowed?'),
    ('roman', 'Decode XIV', 'XIV แทนเลขอะไร แยกวิธีคำนวณให้ดู'),
    ('roman', 'Write a year', 'How do you write 1994 in standard Roman numerals?'),
    ('roman', 'Spot the common mistakes', 'Why is 99 written XCIX rather than IC?'),
    ('roman', 'Add as you read', 'Which Roman symbols may repeat up to three times, and which cannot repeat?'),
    ('roman', 'Meet the seven symbols', 'Do standard Roman numerals have a symbol for zero or decimal place values?'),
    ('roman', 'A little subtraction', 'When reading IV, which symbol is subtracted from which?'),
    ('roman', 'Spot the common mistakes', 'Is IIX a valid modern way to write 8? Explain the standard form.'),
]


@pytest.mark.parametrize(('lesson_slug', 'expected_title', 'question'), RETRIEVAL_CASES)
def test_course_retrieval_includes_the_expected_slide(lesson_slug, expected_title, question):
    passages = retrieve_course_chunks(get_lessons(), question, 'all', limit=5)

    assert any(item['lesson_slug'] == lesson_slug and item.get('title') == expected_title for item in passages)


def test_thai_question_with_roman_identifier_ranks_the_roman_slide_first():
    passages = retrieve_course_chunks(get_lessons(), 'XIV แทนเลขอะไร แยกวิธีคำนวณให้ดู', 'all', limit=5)

    assert passages[0]['lesson_slug'] == 'roman'
    assert passages[0]['title'] == 'Decode XIV'


def test_fallback_answer_omits_unrelated_cross_course_passages():
    question = 'XIV แทนเลขอะไร แยกวิธีคำนวณให้ดู'
    passages = retrieve_course_chunks(get_lessons(), question, 'all', limit=5)
    answer = course_guide_answer(passages, get_lessons(), 'th', question=question)

    assert 'XIV = X + IV = 10 + 4 = 14' in answer['answer']
    assert 'การคำนวณและการตีความ' not in answer['answer']
    assert answer['evidence'] == [{
        'lesson': 'Roman Numerals',
        'slide': 'Decode XIV',
        'source': 'Doc1.1 Numeral Systems, pp. 58–70.',
    }]


def test_openrouter_fallback_models_keep_configured_priority(monkeypatch):
    monkeypatch.setenv('OPENROUTER_TUTOR_MODEL', 'qwen/qwen3.8-27b:free')
    monkeypatch.setenv('OPENROUTER_TUTOR_FALLBACK_MODELS', 'google/gemma-4-31b-it:free, qwen/qwen3.8-27b:free')

    assert _openrouter_model_route() == [
        'qwen/qwen3.8-27b:free',
        'google/gemma-4-31b-it:free',
    ]


def test_azure_deployment_is_selected_ahead_of_openrouter(monkeypatch):
    monkeypatch.setenv('AZURE_OPENAI_ENDPOINT', 'https://math-tutor.openai.azure.com')
    monkeypatch.setenv('AZURE_OPENAI_API_KEY', 'test-azure-key')
    monkeypatch.setenv('AZURE_OPENAI_DEPLOYMENT', 'tutor-gpt')
    monkeypatch.setenv('OPENROUTER_API_KEY', 'test-openrouter-key')
    monkeypatch.setenv('AI_PROVIDER_KEY', '')

    assert _tutor_provider_config() == (
        'azure',
        'https://math-tutor.openai.azure.com/openai/v1/chat/completions',
        'test-azure-key',
        'tutor-gpt',
    )

    monkeypatch.setenv('AZURE_OPENAI_ENDPOINT', 'https://math-tutor.openai.azure.com/openai/v1/')
    assert _tutor_provider_config()[1] == 'https://math-tutor.openai.azure.com/openai/v1/chat/completions'
