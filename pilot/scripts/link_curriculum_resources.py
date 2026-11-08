# -*- coding: utf-8 -*-
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1];p=R/'course_catalog.json';cat=json.loads(p.read_text())
video={**{f'q2-{n:02}':('QspwAPmbkJU','Жолдармен жұмыс · бейнесабақ') for n in [5,6,7]},**{f'q2-{n:02}':('7MVM3Ut_bSo','Файлдармен жұмыс · Өрлеу') for n in [8,9]},**{f'q2-{n:02}':('iQSzTV-Ny-A','Сұрыптау әдістері · 10-сынып') for n in [10,11]},**{f'q2-{n:02}':('rlNKFSsRLCc','Графтардағы алгоритмдер · Өрлеу') for n in [12,13,14]},'q4-01':('9uOBL0ke2bY','Big Data дегеніміз не? · Таңшолпан'),'q4-02':('jO0_19I_ZTQ','Деректер қорының негізгі ұғымдары'),'q4-03':('jO0_19I_ZTQ','Деректер қорының негізгі ұғымдары'),**{f'q4-{n:02}':('Cm3pR0Dnq28','Деректер қорын әзірлеу · Думан Ахметов') for n in [4,5,6]},'q4-07':('jmQmzaIWllg','Формалар · Access үлгісі'),'q4-09':('z1OMXBr5V-w','Сұраныстар · 10-сынып')}
slides={
 'strings':'https://ust.kz/powerpoint/joldarmen_jumys_10_synyp-359474.html',
 'files':'https://view.genially.com/6ad202d98b34ad7439206ddd',
 'sort':'https://www.ektu.kz/files/DistanceEducation/Resource/1115266/9-10%20%D0%9C%D0%B0%D1%81%D1%81%D0%B8%D0%B2%D1%8B.pdf',
 'graph':'https://infourok.ru/graftarda%D2%93y-algoritmder-ta%D2%9Byrybyna-prezentaciya-10-synyp-4683078.html',
 'big':'https://infourok.ru/prezentaciya-bigdata-10-synyp-informatika-5180547.html',
 'db':'https://prezi.com/p/3we4lw0fch66/presentation/',
 'sql':'https://anyflip.com/exwhv/bmgo/basic',
}
for l in cat:
 lid=l['id'];quarter=l['quarter'];n=l['order']
 l['resources']=[r for r in l['resources'] if not r.get('curriculumAdded')]
 def add(title,typ,url,**extra):l['resources'].append({'title':title,'type':typ,'url':url,'status':'linked-source','curriculumAdded':True,**extra})
 if lid in video:
  vid,title=video[lid];add(title,'video','https://www.youtube.com/watch?v='+vid,sourceUrl='https://www.youtube.com/watch?v='+vid,sourceTitle='YouTube · автордың түпнұсқа жарияланымы')
 if quarter==2 and n>=6:
  group='strings' if n<=7 else 'files' if n<=9 else 'sort' if n<=11 else 'graph'
  add('Тақырыптық презентация · сыртқы автор материалы','slides',slides[group],sourceUrl=slides[group],sourceTitle='Түпнұсқа презентация; сайтта кіру/жүктеу шарты болуы мүмкін')
  if n in (10,11):add('Сұрыптау · қосымша интерактивті квиз','game','https://view.genially.com/6ae088d81f2bd3a2cb0e7c2b')
  add('Python ресми анықтамасы','reference','https://docs.python.org/3/tutorial/inputoutput.html' if n in (8,9) else 'https://docs.python.org/3/tutorial/datastructures.html')
 if quarter==4:
  group='big' if n==1 else 'db' if n<=3 else 'sql'
  add('Қосымша презентация · '+group,'slides',slides[group],sourceUrl=slides[group],sourceTitle='Сыртқы автордың материалы')
  add('Деректер қоры: ұғымдарды сәйкестендіру','game','https://wordwall.net/resource/54495304')
  add('PostgreSQL ресми оқу құралы','reference','https://www.postgresql.org/docs/current/tutorial.html')
 if quarter in (2,3,4):
  l['curriculumSource']='https://adilet.zan.kz/kaz/docs/V2200029767'
  l['durationMinutes']=45
  l['curriculumNote']='№399, 108-қосымша. Сабақтарға бөлу — IT CAMPUS авторлық жоспарлауы; мектептің бекітілген КТЖ-сын алмастырмайды.'
 if lid=='q3-08':l['objective']='10.3.3.2 web-парақша мен деректер қорының байланысын орнату (мақсаттар жүйесі); ҰМЖ кестесінде 10.3.3.3 деп берілген'
 if lid=='q2-05':l['objective']='10.5.1.1; 10.5.1.2 — функциялар арқылы жолдарды өңдеу; рекурсия — тереңдету'
p.write_text(json.dumps(cat,ensure_ascii=False,indent=2))
