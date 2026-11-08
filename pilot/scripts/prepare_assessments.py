"""Separate unchanged task pages from teacher-only assessment originals."""
from pathlib import Path
import json
from pypdf import PdfReader,PdfWriter
ROOT=Path(__file__).resolve().parents[1];catalog=json.loads((ROOT/'course_catalog.json').read_text())
for n,pages in [(7,4),(13,3),(15,5)]:
 item=next(x for x in catalog if x['id']==f'q1-{n:02}');source=ROOT/'public/resources/course/q1'/f'{n:02}-01.pdf';target=source.with_name(f'{n:02}-student.pdf')
 reader=PdfReader(source);writer=PdfWriter()
 for page in reader.pages[:pages]:writer.add_page(page)
 with target.open('wb') as out:writer.write(out)
 assert len(PdfReader(target).pages)==pages
 for r in item['resources']:r['staffOnly']=True
 url='/resources/course/q1/'+target.name
 item['resources']=[r for r in item['resources'] if r.get('url')!=url]
 item['resources'].insert(0,{'title':item['title']+' — оқушы тапсырмалары','type':'assessment','url':url,'downloadUrl':url,'previewUrl':url})
(ROOT/'course_catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
print('Assessment task pages: 4 + 3 + 5; full originals staff-only.')
