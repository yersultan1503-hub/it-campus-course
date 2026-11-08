"""Copy observed Classroom attachments; never modify the original course."""
from pathlib import Path
import json,re,unicodedata
ROOT=Path(__file__).resolve().parents[1]
raw=json.loads((ROOT/'materials/classroom-q2-raw.json').read_text())
out=ROOT/'public/resources/course/q2';out.mkdir(parents=True,exist_ok=True)
jobs=[]
for item in raw:
 n=int(re.search(r'тоқсан (\d+) сабақ',item['heading'])[1])
 for j,r in enumerate(item['resources'],1):
  if 'drive.google.com/file/d/' in r['url']:
   fid=r['url'].split('/d/')[1].split('/')[0];ext=Path(r['title']).suffix
   jobs.append((r,out/f'{n:02}-{j:02}{ext}',fid))
def download(job):
 r,p,fid=job
 source=next(x for x in Path('/Users/ersultan/Downloads').iterdir() if unicodedata.normalize('NFC',x.name)==unicodedata.normalize('NFC',r['title']))
 data=source.read_bytes()
 if p.suffix in ('.docx','.pptx') and not data.startswith(b'PK'):raise ValueError('Not Office file: '+r['title'])
 if p.suffix=='.pdf' and not data.startswith(b'%PDF'):raise ValueError('Not PDF: '+r['title'])
 p.write_bytes(data)
 r['downloadUrl']='/resources/course/q2/'+p.name
 if p.suffix=='.pdf':r['previewUrl']=r['downloadUrl']
 return p.name
for job in jobs:print(download(job),flush=True)
(ROOT/'materials/quarter2.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2))
titles=['Функциялар мен процедуралар','Параметр және аргумент','Мән қайтаратын функция — return','Декомпозиция және тестілеу','Рекурсия және жолдарды өңдеу']
catalog=[x for x in json.loads((ROOT/'course_catalog.json').read_text()) if x['quarter']!=2]
for item in raw:
 n=int(re.search(r'тоқсан (\d+) сабақ',item['heading'])[1]);resources=[]
 for r in item['resources']:
  name=r['title'].lower();ext=Path(name).suffix
  typ='video' if 'youtube.com' in r['url'] else 'practice' if ext=='.html' else 'task' if 'тапсырма' in name else 'qmj' if ('қмж' in name or 'кмж' in name or 'qmj' in name) else 'slides'
  resources.append({**r,'type':typ,**({'staffOnly':True} if typ=='qmj' else {})})
  if n==5 and typ=='slides' and (out/'05-04.pdf').exists():resources[-1]['previewUrl']='/resources/course/q2/05-04.pdf'
 catalog.append({'id':f'q2-{n:02}','quarter':2,'order':n,'title':titles[n-1],'objective':'10.5.1.1 — функциялар мен процедураларды пайдаланып бағдарламалау тілінде код жазу' if n<5 else '10.5.1.2 — жолдарды өңдеу үшін процедуралар мен функцияларды пайдалану','kind':'lesson','resources':resources,'sourceAuthor':'Тұрдалы А.Е. (ҚМЖ); Classroom жариялаушысы — Мерей Тұрсынбай','sourceCourse':'https://classroom.google.com/c/ODg5NjE4NzI1NjQ1'})
catalog.sort(key=lambda x:(x['quarter'],x['order']))
(ROOT/'course_catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
