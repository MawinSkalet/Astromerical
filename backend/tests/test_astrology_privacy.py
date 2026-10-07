import json,math
from datetime import datetime,timezone
import astronomy
from sqlalchemy import inspect
from app import astrology
from app.astrology import calculate,ChartInput
from app.db import Base,engine

def test_chart_is_deterministic_transient_and_location_aware(client):
    payload={'birth_date':'2001-04-15','birth_time':'14:30','location_id':'bangkok'}
    before={table:len(Base.metadata.tables[table].columns) for table in Base.metadata.tables}
    one=client.post('/api/astrology/chart',json=payload)
    assert one.status_code==200,one.text
    assert one.json()==client.post('/api/astrology/chart',json=payload).json()
    assert len(one.json()['placements'])==3
    different=client.post('/api/astrology/chart',json=payload|{'location_id':'london'}).json()
    assert different['placements'][2]['longitude']!=one.json()['placements'][2]['longitude']
    assert all(value not in one.text for value in payload.values())
    for table in inspect(engine).get_table_names():
        assert not any('birth' in c['name'] for c in inspect(engine).get_columns(table))
    assert before=={table:len(Base.metadata.tables[table].columns) for table in Base.metadata.tables}

def test_private_invalid_inputs_not_reflected(client):
    r=client.post('/api/astrology/chart',json={'birth_date':'SECRET-BIRTH-INPUT','birth_time':'14:30','location_id':'bangkok'})
    assert r.status_code==422 and 'SECRET-BIRTH-INPUT' not in r.text
    r=client.post('/api/astrology/chart',json={'birth_date':'2099-01-01','birth_time':'14:30','location_id':'bangkok'})
    assert r.status_code==422

def test_daylight_saving_invalid_and_ambiguous(client):
    r=client.post('/api/astrology/chart',json={'birth_date':'2024-03-10','birth_time':'02:30','location_id':'new-york'})
    assert r.status_code==422 and 'did not exist' in r.text
    payload={'birth_date':'2024-11-03','birth_time':'01:30','location_id':'new-york'}
    assert client.post('/api/astrology/chart',json=payload).status_code==422
    one=client.post('/api/astrology/chart',json=payload|{'fold':0}).json()
    two=client.post('/api/astrology/chart',json=payload|{'fold':1}).json()
    assert one['placements'][2]['longitude']!=two['placements'][2]['longitude']

def test_reading_translation_only_sends_generated_text(client,monkeypatch):
    monkeypatch.setenv('OPENROUTER_API_KEY','test-key')
    monkeypatch.setenv('OPENROUTER_MODEL','test/model')
    captured={}
    translated={
        'personality':'A translated personality reading.',
        'love':'A translated love reading.',
        'career_money':'A translated work and money reading.',
        'opportunities':'A translated opportunity reading.',
        'challenges':'A translated challenges reading.',
        'overall':'A translated overall summary.',
    }

    class FakeResponse:
        def raise_for_status(self): pass
        def json(self):
            return {'model':'test/model','choices':[{'finish_reason':'stop','message':{'content':json.dumps(translated)}}]}

    class FakeAsyncClient:
        def __init__(self,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def post(self,url,headers,json):
            captured.update(url=url,headers=headers,request=json)
            return FakeResponse()

    monkeypatch.setattr(astrology.httpx,'AsyncClient',FakeAsyncClient)
    original={'personality':'Source personality.','love':'Source love.','career_money':'Source work.','opportunities':'Source opportunity.','challenges':'Source caution.'}
    response=client.post('/api/astrology/translate-reading',json={
        'language':'en','reading':original,'overall':'Source summary.',
    })

    assert response.status_code==200,response.text
    assert response.json()=={'reading':{key:translated[key] for key in original},'overall':translated['overall']}
    request_text=json.dumps(captured['request'],ensure_ascii=False)
    assert 'Source personality.' in request_text and 'Source summary.' in request_text
    assert not any(term in request_text for term in ('birth_date','birth_time','location_id'))

def test_ascendant_on_eastern_horizon():
    payload=ChartInput(birth_date='2001-04-15',birth_time='14:30',location_id='bangkok')
    result=calculate(payload)
    t=astronomy.Time.Make(2001,4,15,7,30,0)
    offset=23.85306+1.397*t.ut/36525
    lon=math.radians((result['placements'][2]['longitude']+offset)%360)
    eps=math.radians(23.439291-.0130042*t.ut/36525)
    ra=math.degrees(math.atan2(math.sin(lon)*math.cos(eps),math.cos(lon)))%360/15
    dec=math.degrees(math.asin(math.sin(lon)*math.sin(eps)))
    horizon=astronomy.Horizon(t,astronomy.Observer(13.7563,100.5018),ra,dec,astronomy.Refraction.Airless)
    assert abs(horizon.altitude)<.05
    assert 45<horizon.azimuth<135
