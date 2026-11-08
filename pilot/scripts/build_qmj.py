# -*- coding: utf-8 -*-
import json,sys,re,copy
from pathlib import Path
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.enum.section import WD_ORIENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R));from course_content import BANK,SUMMARIES
cat=json.loads((R/'course_catalog.json').read_text());ext=json.loads((R/'materials/extended-content.json').read_text());out=R/'public/resources/qmj';out.mkdir(exist_ok=True)
Q={2:'Алгоритмдеу және программалау',3:'Веб-жобалау',4:'Ақпараттық жүйелер'}
TASKS={
'q2-01':'salem() функциясын анықтап, үш рет шақырады.',
'q2-02':'Екі параметрлі қосу функциясын құрып, екі түрлі аргументпен тексереді.',
'q2-03':'Квадратты return арқылы қайтаратын функция жазып, нәтижесін айнымалыда сақтайды.',
'q2-04':'Орташа балл есептеу есебін екі функцияға бөліп, шекаралық мәнді тексереді.',
'q2-05':'Жолды кері айналдыратын функцияны бос жол және бір таңбамен тексереді.',
'q3-01':'Тақырып, абзац және тізімі бар дұрыс HTML құжат жасайды.',
'q3-02':'Екі жолды кесте және балама мәтіні бар сурет енгізеді.',
'q3-03':'Ішкі және сыртқы сілтеме жасап, мақсатты мекенжайын тексереді.',
'q3-04':'CSS класы арқылы түс, қаріп және аралықтарды өзгертіп, оқылуын тексереді.',
'q3-05':'Басқару батырмалары бар видео мен аудио енгізіп, ойналуын тексереді.',
'q3-06':'Дайын JavaScript арқылы батырма басылғанда мәтін өзгеруін іске асырады.',
'q3-07':'Форма мен жауап әрекеті бар шағын веб-жоба жасап, екі енгізу жағдайын тексереді.',
'q3-08':'Браузер–сервер–ДҚ байланысын сызбада көрсетіп, дайын дерек сұрауын түсіндіреді.'}
OBJECTIVES={'10.5.1.2':'жолдарды өңдеу үшін процедуралар мен функцияларды пайдалану','10.5.1.3':'ақпаратты оқу және жазу үшін файлдарды пайдалану','10.5.1.4':'практикалық есептерді шешу үшін сұрыптау алгоритмдерін іске асыру','10.5.1.5':'практикалық есептерді шешу үшін графтардағы алгоритмдерді іске асыру','10.3.1.4':'Bigdata оң және теріс әсерлерін бағалау','10.3.1.1; 10.3.1.2':'реляциялық деректер қорын түсіндіру; жол, жазба, индекс ұғымдарын ажырату','10.3.1.3':'деректер қорында бірінші кілтті анықтау','10.3.2.1':'деректер қорында мәліметтер типін анықтау (SQL)','10.3.2.2':'біркестелі деректер қорын құру (SQL)','10.3.2.3':'көпкестелі деректер қорын құру (SQL)','10.3.2.4':'деректерді енгізуге арналған форма жасау (SQL)','10.3.2.5':'алынған мәліметтерді қолдана отырып, есептерді жасау (SQL)','10.3.3.1':'конструктор көмегімен іріктеу сұраныстарын жасау','10.3.3.2':'web-парақша мен деректер қорының байланысын орнату'}

def new():
 d=Document();s=d.sections[0];s.orientation=WD_ORIENT.LANDSCAPE;s.page_width=Cm(29.7);s.page_height=Cm(21);s.top_margin=s.bottom_margin=Cm(1.1);s.left_margin=s.right_margin=Cm(1.25)
 st=d.styles['Normal'];st.font.name='Arial';st.font.size=Pt(9);st.paragraph_format.space_after=Pt(3)
 for k in ['Title','Heading 1','Heading 2']:
  d.styles[k].font.name='Arial';d.styles[k].font.color.rgb=RGBColor(0,0,0)
 d.styles['Title'].font.size=Pt(16)
 for node in list(d.styles['Title'].element.iter(qn('w:pBdr'))):node.getparent().remove(node)
 return d

def table(d,rows,widths):
 t=d.add_table(rows=0,cols=len(widths));t.autofit=False
 for col,w in zip(t.columns,widths):col.width=Cm(w)
 for ri,row in enumerate(rows):
  cells=t.add_row().cells
  for c,w,text in zip(cells,widths,row):
   c.width=Cm(w);c.text=text;tc=c._tc.get_or_add_tcPr();b=OxmlElement('w:tcBorders')
   for edge in ['top','bottom','left','right']:
    z=OxmlElement('w:'+edge);z.set(qn('w:val'),'single');z.set(qn('w:sz'),'4');z.set(qn('w:color'),'B9C1C9');b.append(z)
   tc.append(b)
   if ri==0:
    sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EDF1F4');tc.append(sh)
    for run in c.paragraphs[0].runs:run.bold=True
  trpr=t.rows[-1]._tr.get_or_add_trPr();no=OxmlElement('w:cantSplit');trpr.append(no)
 return t

def link(p,text,url):
 h=OxmlElement('w:hyperlink');h.set(qn('r:id'),p.part.relate_to(url,RT.HYPERLINK,is_external=True));r=OxmlElement('w:r');pr=OxmlElement('w:rPr');color=OxmlElement('w:color');color.set(qn('w:val'),'154B80');pr.append(color);r.append(pr);t=OxmlElement('w:t');t.text=text;r.append(t);h.append(r);p._p.append(h)

def lesson(d,l):
 lid=l['id'];quarter=l['quarter'];bank=BANK[lid];unit=ext.get(lid,{});task=unit.get('task',TASKS.get(lid,''));summary=SUMMARIES.get(lid,l.get('summary',l['title'])).split('\n')[0]
 d.add_paragraph(f'Қысқа мерзімді сабақ жоспары {lid.upper().replace(chr(45),chr(32))}',style='Title')
 objective=l['objective']
 if quarter==3:
  code=objective.split(' ')[0]
  text={'10.4.2.1':'web-парақшаларды әзірлеуде HTML тегтерін қолдану','10.4.2.2':'web-парақшаларды жасауда CSS қолдану','10.4.2.3':'web-беттерді әзірлеу кезінде дайын скрипттерді пайдалану','10.4.2.4':'web-бетке мультимедиа нысандарын енгізу үшін HTML тегтерін қолдану','10.3.3.2':OBJECTIVES['10.3.3.2']}[code]
  objective=code+' — '+text
 else:objective=objective+' — '+OBJECTIVES[objective] if objective in OBJECTIVES else objective
 summary=re.sub(r'^01 / ТҮСІНУ.*?Бүгінгі нәтиже','',summary).strip()
 goal=task+' Ойынның үш жағдайына дұрыс шешім таңдап, қатесін түзетеді.'
 table(d,[['Білім беру ұйымы: ____________________','Педагогтің Т.А.Ә.: ____________________','Күні: ____________'],[f'Бөлім: {Q[quarter]}',f'Сынып: 10, ЖМБ · {quarter}-тоқсан','Қатысушылар: ____  Қатыспағандар: ____'],['Сабақтың тақырыбы',l['title'],'Ұзақтығы: 45 минут']], [8.8,12.3,6.1])
 p=d.add_paragraph();p.add_run('Оқу бағдарламасына сәйкес оқыту мақсаттары: ').bold=True;p.add_run(objective)
 p=d.add_paragraph();p.add_run('Сабақтың мақсаты: ').bold=True;p.add_run(goal)
 rows=[['Кезең / уақыт','Педагогтің әрекеті','Оқушының әрекеті','Бағалау','Ресурстар'],
 ['Басы\n0–5 мин','Сабақ мақсаты мен бағалау өлшемдерін таныстырады. «'+bank[0]['prompt']+'» сұрағын қояды.','Алдын ала болжамын айтады; алдыңғы білімін еске түсіреді.','Бастапқы жауап бағасыз; қате түсініктерді анықтау.','Сайттағы сабақ кіріспесі'],
 ['Түсіну\n5–15 мин','Бейне/презентацияны тоқтатып, мысалын түсіндіреді. '+summary.split('Мысал:')[0][:210].rsplit(' ',1)[0]+'…','Бейне не слайдты қарайды; мысалдың нәтижесін болжайды және салыстырады.','«Неге?» сұрағына ауызша дәлел; қажет жерде нақтылау.','Сабақ видеосы, презентация, түсіндірме'],
 ['Қолдану\n15–25 мин','Практикалық нәтижені көрсетіп, орындау ретін модельдейді. Қажет оқушыға қадамдық тірек береді.','Жұппен не жеке: '+task,'Құрылым/алгоритм дұрыс — 3 б.; нәтиже дұрыс — 4 б.; тексеру мен түзету — 3 б.','Компьютер, тақырып үлгісі'],
 ['Ойын миссиясы\n25–40 мин','IT CAMPUS-та осы сабақ миссиясын ашады. Оқушы шешімін және қате критерийлерін бақылайды.','Үш жағдайды шешеді. Кеңесті қарап, қате шешімді қайта түзетеді. Дайын жұмысын мұғалімге көрсетеді.','Сервер: дұрыс жауап / 3 × 10, бүтінге дөңгелектеу. Мұғалім 0–10 балын бөлек қояды.','Осы сабақтың 3D қалашығы; интернетсіз — төмендегі үш жағдай'],
 ['Соңы\n40–45 мин','Қысқа рефлексияны қарайды; қолдау қажет оқушыны белгілейді. Баға мен қабылдауды жеке бекітеді.','«Түсіндім / Жаттығамын / Көмек керек» таңдайды; қиын тұсын белгілейді.','Ұзақ мәтін міндетті емес. Келесі сабақ қабылдаудан соң ашылады.','Сайттағы жылдам рефлексия']]
 table(d,rows,[2.0,8.0,7.3,6.5,3.4])
 p=d.add_paragraph();p.add_run('Саралау және қолжетімділік: ').bold=True;p.add_run('қадамдық үлгі, үлкейтілген мәтін, жұптық қолдау; жылдам оқушыға жаңа дерекпен сынау. Ерекше қажеттілік болса, мектеп мақұлдаған жеке бағдарламаға бейімдеу. Экранмен жұмыста қысқа көз жаттығуы.')
 p=d.add_paragraph();p.add_run('Интернетсіз миссия / мұғалім кілті: ').bold=True
 p.add_run(' | '.join(f"{i+1}. {x['prompt']} → {next(o['label'] for o in x['options'] if o['id']==x['correct'])}" for i,x in enumerate(bank)))
 p=d.add_paragraph();p.add_run('Ресурстар: ').bold=True
 link(p,'Сабақ (жергілікті пилот)','http://127.0.0.1:8890/?lesson='+lid);p.add_run(' · ');link(p,'Ойын (жергілікті пилот)','http://127.0.0.1:8890/game/?lesson='+lid)
 for typ,label in [('video','Бейне'),('slides','Презентация')]:
  res=next((r for r in l['resources'] if r['type']==typ),None)
  if res:
   url=res.get('previewUrl') or res.get('downloadUrl') or res['url'];url='http://127.0.0.1:8890'+url if url.startswith('/') else url;p.add_run(' · ');link(p,label,url)
 p.add_run(' · ');link(p,'№130 нысаны','https://adilet.zan.kz/kaz/docs/V2000020317');p.add_run(' · ');link(p,'№399 / 108-қосымша','https://adilet.zan.kz/kaz/docs/V2200029767')
 p=d.add_paragraph('Авторлық цифрлық курс жоспары. Мектеп, педагог, күн толтырылмай қалдырылды. 08.11.2026 тексерілген нысан. Пилот сілтемелері тек осы компьютерде ашылады; жарияланған мекенжаймен кейін ауыстырылады.');p.paragraph_format.space_after=Pt(0)
 for r in p.runs:r.font.size=Pt(7)

collections={q:new() for q in Q};counts={q:0 for q in Q}
for l in cat:
 if l['quarter'] not in Q or l['kind']!='lesson':continue
 d=new();lesson(d,l);d.save(out/(l['id']+'.docx'))
 c=collections[l['quarter']]
 if counts[l['quarter']]:c.add_page_break()
 lesson(c,l);counts[l['quarter']]+=1
 # Replace only revised plan links, retain original teacher plans marked as source.
 l['resources']=[r for r in l['resources'] if not r.get('updatedQmj')]
 for r in l['resources']:
  if r.get('type') in ['qmj','lesson_plan']:r['staffOnly']=True
 l['resources'].insert(0,{'title':'Жаңартылған ҚМЖ · Word және PDF','type':'qmj','url':'/resources/qmj/'+l['id']+'.docx','downloadUrl':'/resources/qmj/'+l['id']+'.docx','previewUrl':'/resources/qmj/'+l['id']+'.pdf','staffOnly':True,'updatedQmj':True,'references':[{'title':'№130 · ҚМЖ нысаны','url':'https://adilet.zan.kz/kaz/docs/V2000020317'},{'title':'№399 · оқу бағдарламасы','url':'https://adilet.zan.kz/kaz/docs/V2200029767'}]})
for q,d in collections.items():d.save(out/f'Q{q}_ҚМЖ_жинағы.docx')
(R/'course_catalog.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2));print(counts)
