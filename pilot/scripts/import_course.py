"""Import existing course copies without changing the source Classroom or Desktop project."""
from pathlib import Path
import json,shutil,re,html,urllib.parse,hashlib
ROOT=Path(__file__).resolve().parents[1];OLD=Path('/Users/ersultan/Desktop/IT_CAMPUS/01_Сайт');OUT=ROOT/'public/resources/course';OUT.mkdir(parents=True,exist_ok=True)
q1=json.loads((ROOT/'materials/quarter1.json').read_text());lessons=[];copied=0
for i,item in enumerate(q1,1):
 lid='q1-network-01' if i==1 else f'q1-{i:02}';resources=[]
 for j,r in enumerate(item['resources']):
  r={k:v for k,v in r.items() if k!='localPath'};source=item['resources'][j].get('localPath')
  if source and (ROOT/source).is_file():
   src=ROOT/source;target=OUT/'q1'/f'{i:02}-{j+1:02}{src.suffix.lower()}';target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,target);copied+=1
   r['downloadUrl']='/resources/course/q1/'+target.name
   if target.suffix.lower()=='.pdf':r['previewUrl']=r['downloadUrl']
  if r.get('type')=='qmj':r['staffOnly']=True
  if 'жауап' in r['title'].lower() and 'жауапсыз' not in r['title'].lower():r['staffOnly']=True
  resources.append(r)
 title=' '.join(item['title'].split())
 if i==15:title='ТЖБ — 1-тоқсан'
 lessons.append({'id':lid,'quarter':1,'order':i,'title':title,'objective':item['objective'].strip(),'kind':'assessment' if i in [7,13,15] else 'lesson','resources':resources,'sourceAuthor':item['sourceAuthor'],'sourceCourse':item['sourceCourse']})
keys=['html','table','links','css','media','js','quiz','db']
for i,key in enumerate(keys,1):
 page=(OLD/'07_Оқу_бағыты'/f'{i:02}.html').read_text();title=html.unescape(re.search(r'<h1>(.*?)</h1>',page,re.S)[1]);resources=[]
 for typ,source,titleR in [('slides',OLD/'media'/f'{i:02}_slides.pdf','Презентация'),('video',OLD/'media'/f'{i:02}_video.mp4','Авторлық бейнесабақ'),('qmj',OLD/'qmj'/f'{i:02}_ҚМЖ.docx','Қысқа мерзімді жоспар')]:
  if not source.exists():
   if typ=='qmj':
    candidates=list((OLD/'qmj').glob(f'{i:02}*'));source=candidates[0] if candidates else source
  if source.is_file():
   target=OUT/'q3'/source.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target);copied+=1
   url='/resources/course/q3/'+urllib.parse.quote(target.name);r={'title':titleR,'type':typ,'url':url,'downloadUrl':url}
   if typ=='slides':r['previewUrl']=url
   if typ=='qmj':r['staffOnly']=True
   resources.append(r)
 theory=re.search(r'<section id="theory">(.*?)</section>',page,re.S)[1]
 summary=' '.join(html.unescape(re.sub('<[^>]+>',' ',theory)).split())
 lessons.append({'id':f'q3-{i:02}','quarter':3,'order':i,'title':title,'objective':('10.4.2.1 — веб-парақшаларды әзірлеуде HTML тегтерін қолдану' if i<=3 else {4:'10.4.2.2 — веб-парақшаларды жасауда CSS қолдану',5:'10.4.2.4 — веб-бетте мультимедиа нысандарын енгізу үшін HTML тегтерін қолдану'}.get(i,'10.4.2.3 — веб-беттерді әзірлеу кезінде дайын скрипттерді пайдалану')),'summary':summary,'kind':'lesson','resources':resources,'legacyGameUrl':'/legacy-q3/game/?lesson='+key,'sourceAuthor':'IT CAMPUS — авторлық 10-сынып курсы','sourceCourse':'https://classroom.google.com/c/ODg5MDc1NDM0NTcz'})
# Isolated legacy game copy. Exclude hidden deployment metadata and source-only extras.
legacy=ROOT/'public/legacy-q3/game';shutil.copytree(OLD/'game',legacy,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.*','node_modules'))
for p in legacy.rglob('*'):
 if p.suffix in ['.html','.js','.css']:
  t=p.read_text();t=t.replace('"/game/','"/legacy-q3/game/').replace("'/game/","'/legacy-q3/game/")
  p.write_text(t)
(ROOT/'course_catalog.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2))
print({'lessons':len(lessons),'q1':len(q1),'q3':8,'copiedResources':copied})

# Preserve original game return links inside the isolated course.
returns=ROOT/'public/legacy-q3/07_Оқу_бағыты';returns.mkdir(parents=True,exist_ok=True)
for i in range(1,9):
 (returns/f'{i:02}.html').write_text(f'<meta charset="utf-8"><script>top.location.href="/?lesson=q3-{i:02}#submission"</script>')
# Run prepare_assessments.py next to split pupil tasks from staff answer keys.
