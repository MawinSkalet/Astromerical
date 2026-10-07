"""Local 32-player + presenter WebSocket check; creates test users and one room.

Run: .venv/Scripts/python.exe backend/tests/load_room.py http://localhost:18080
It never deletes data or sends AI requests. Remaining rounds expire normally.
"""
import asyncio,json,sys,time,statistics
from pathlib import Path
import httpx
from websockets.asyncio.client import connect

BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:18080'
if not BASE.startswith(('http://localhost:','http://127.0.0.1:')):raise SystemExit('Only local development servers are supported.')

async def request(client,method,path,**kwargs):
    response=await client.request(method,BASE+'/api'+path,**kwargs)
    response.raise_for_status()
    return response.json()

async def event(socket,name,predicate=lambda message:True):
    async with asyncio.timeout(40):
        while True:
            message=json.loads(await socket.recv())
            if message['event']==name and predicate(message):return message

async def main():
    clients=[httpx.AsyncClient(timeout=60,trust_env=False) for _ in range(34)]
    sockets=[];latencies=[]
    try:
        stamp=int(time.time())
        for index,client in enumerate(clients):await request(client,'POST','/auth/guest',json={'name':f'Live check {stamp} / {index}'})
        room=await request(clients[0],'POST','/quiz/rooms');code=room['code']
        for client in clients[1:33]:
            await request(client,'POST',f'/quiz/rooms/{code}/join')
            await request(client,'PUT',f'/quiz/rooms/{code}/ready',json={'ready':True})
        full=await clients[33].post(BASE+f'/api/quiz/rooms/{code}/join')
        assert full.status_code==409 and 'full' in full.text
        for client in clients[:33]:
            cookie='; '.join(f'{key}={value}' for key,value in client.cookies.items())
            socket=await connect(BASE.replace('http://','ws://')+f'/api/quiz/rooms/{code}/ws',origin=BASE,additional_headers={'Cookie':cookie},max_queue=None,close_timeout=1)
            sockets.append(socket)
            assert (await event(socket,'room_state'))['state']['status']=='lobby'
        state=await request(clients[0],'POST',f'/quiz/rooms/{code}/start',json={'category':'astrology'})
        question_id=state['question_id']
        active=await asyncio.gather(*(event(socket,'room_state',lambda message:message['state']['phase']=='question') for socket in sockets))
        assert active[0]['state']['question']['prompt']
        assert all(message['state']['question'] is None for message in active[1:])
        payload={'action':'SUBMIT_ANSWER','question_id':question_id,'choice_index':0,'request_id':'load-answer'}
        async def submit(socket):
            started=time.perf_counter()
            await socket.send(json.dumps(payload))
            ack=await event(socket,'answer_accepted')
            latencies.append((time.perf_counter()-started)*1000)
            assert ack['accepted'] and 'correct' not in ack
            return ack
        began=time.perf_counter()
        results=await asyncio.gather(*(submit(socket) for socket in sockets[1:]))
        assert all(not result['duplicate'] for result in results)
        duplicates=await asyncio.gather(*(submit(socket) for socket in sockets[1:]))
        assert all(result['duplicate'] for result in duplicates)
        restored=await request(clients[1],'GET',f'/quiz/rooms/{code}')
        assert restored['answered'] and restored['selected_index']==0 and restored['question'] is None
        assert [team['size'] for team in restored['teams']]==[8,8,8,8]
        assert all(team['correct']==team['points']==0 for team in restored['teams'])
        assert sum(team['responses'] for team in restored['teams'])==32
        await sockets[1].close()
        cookie='; '.join(f'{key}={value}' for key,value in clients[1].cookies.items())
        sockets[1]=await connect(BASE.replace('http://','ws://')+f'/api/quiz/rooms/{code}/ws',origin=BASE,additional_headers={'Cookie':cookie},max_queue=None,close_timeout=1)
        snap=(await event(sockets[1],'room_state'))['state']
        assert snap['question'] is None
        if snap['question_id']==question_id:assert snap['answered'] and snap['selected_index']==0
        else:assert snap['question_number']>1 and not snap['answered']
        report={'players':32,'presenters':1,'websockets':33,'accepted_unique_answers':32,'duplicate_retries':32,'extra_player_rejected':True,'player_question_payload_hidden':True,'scores_hidden':True,'reconnect_restored':True,'elapsed_seconds':round(time.perf_counter()-began,3),'answer_latency_ms':{'median':round(statistics.median(latencies),2),'p95':round(sorted(latencies)[int(len(latencies)*.95)-1],2),'max':round(max(latencies),2)},'scope':'One local room, first question. No claim about distributed production capacity.'}
        Path('test-results').mkdir(exist_ok=True)
        Path('test-results/load-32.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report,indent=2))
    finally:
        await asyncio.gather(*(socket.close() for socket in sockets),return_exceptions=True)
        await asyncio.gather(*(client.aclose() for client in clients))

if __name__=='__main__':asyncio.run(main())
