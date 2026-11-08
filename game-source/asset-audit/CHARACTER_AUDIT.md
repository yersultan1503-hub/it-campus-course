> Кейінгі интеграция жаңартуы: ата-чат нақты Naruto/Jerry/Tom/Optimus GLB файлдарын public/assets ішіне қосты. Төмендегі құжат — архивтер алынғанға дейінгі зерттеу receipt-і; қазіргі runtime бөгеті емес. Active asset/credits және соңғы тексеру үшін HANDOFF.md мен public/assets/CREDITS.txt қараңыз.

# 2026-11-08 — модельдер интеграцияланды

Naruto, Jerry, Tom және Optimus ресми Sketchfab download интерфейсі арқылы жүктелді. Авторлар/CC BY 4.0 сілтемелері public/assets/CREDITS.txt ішінде. Төмендегі бастапқы аудит тарихи күй ретінде сақталды; 401 бөгеті шешілді.

- Naruto: 0.65 секундтық жүгіру, көлденең root motion алынды; тыныш қалып бөлек жасалды. Таңдалатын player және NPC.
- Jerry: файлдағы жалғыз клип ұзақтығы 0 (T-pose), сондықтан жаңа distance-driven сүйек жүрісі жасалды. Таңдалатын player және NPC.
- Tom: дайын жүріс жоқ; кіреберістегі тыныс алу/бас/құйрық қимылы бар статикалық қонақ.
- Optimus: 8.33 секундтық көлікке айналу клипі, ping-pong көрініс. Жүретін player емес. 1k текстуралар 512-ге кішірейтіліп, файл 29.47 MB → 10.04 MB.
- Модельдер өзіндік GLB: сыртқы texture URI жоқ. Ешқандай жүктелген скрипт орындалмады.
- Негізгі production және Classroom өзгертілмеді; тек year-pilot.

---

# Naruto · Tom and Jerry · Transformers актив аудиті

Тексеру күні: 2026-11-08. Күйі: **нақты кандидаттар табылды; жаңа кейіпкер файлдары алынбаған, runtime-ға қосылмаған**.

Кейіпкерлердің атауы іздеуді/қолдануды тоқтатуға себеп ретінде алынған жоқ. Төмендегі шектеулер нақты файлға қолжетімділік, көрсетілген лицензия, активтің шығу тегі және animation clips туралы дәлелге қатысты.

## Дәлел деңгейі

1. Модель беттері іздеу индексіндегі primary listing мазмұнымен қаралды. Sketchfab беттерін тікелей web open осы ортада 403 қайтарды; оны «модель жоқ» деп түсіндіруге болмайды.
2. **Ресми public Data API сегіз модель үшін HTTP 200 қайтарды.** `isDownloadable`, `animationCount`, face/vertex counts, license URL және uploader сол API-ден алынды. Receipt: `sketchfab-metadata.json`.
3. Сол модельдердің ресми `/v3/models/<UID>/download` endpoint-тері авторизациясыз **HTTP 401**, «Authentication credentials were not provided.» қайтарды. OAuth/account қолданылған жоқ. Sketchfab [ресми жүктеу құжаты](https://sketchfab.com/developers/download-api/downloading-models) жүктеуге аккаунт авторизациясын талап етеді.
4. `isDownloadable:true` — модель иесі жүктеуге ашқанын көрсетеді; бұл осы ортада архив жүктелгенін білдірмейді. `animationCount:1` — бір анимация бар деген metadata, бірақ оның Walk/Idle/Run атауы мен сүйек үйлесімділігі бинарлық файлсыз расталмайды.

Аудит `scripts/audit-character-candidates.py` арқылы қайталанады: тек public JSON және авторизациясыз download жауабы оқылады. Токен, cookie, пароль, модель архиві, бөгде скрипт немесе Maya/Blender коды алынған/орындалған жоқ.

## Тексерілген кандидаттар

| Кейіпкер / нақты дереккөз | Uploader / жарияланған шығу тегі | API лицензиясы | API геометрия / анимация | Қазіргі шешім |
|---|---|---|---|---|
| [Low Poly Naruto with Rig and Running Animation](https://sketchfab.com/3d-models/low-poly-naruto-with-rig-and-running-animation-db14fc3de5b34b738e49ec3cdb83770a) | ronildo.facanha; сипаттамада rig және Naruto running pose көрсетілген | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 9 060 faces; 7 960 vertices; **1 animation** | Ең ықшам Naruto кандидаты. Download 401. Жүру/idle бар деп айтылмайды; автор T-pose reset туралы ескертеді. Файл алынса rig/clip тексеру және қажет retarget/bake жұмысы бар. |
| [Naruto Walking 3D Animation by SG Studio](https://sketchfab.com/3d-models/naruto-walking-3d-animation-by-sg-studio-505860183544421a898c132d09dcd2b7) | Nytherix uploader; сипаттамада SG Studio / Sujit Guchhait автор деп берілген | CC BY 4.0 | 10 000 faces; 4 986 vertices; **1 animation** | Loopable walk сипаттамасы бар; FBX/GLB үйлесімділігі listing-де айтылған. Нақты архив форматы/clip bytes тексерілмеді. Download 401; автор атрибуция тізбегін сақтап алу керек. |
| [Tom — Tom And Jerry](https://sketchfab.com/3d-models/tom-tom-and-jerry-a554a10be2d64d1aac1ea401275e5357) | Guilherme Navarro; сипаттама War of the Whiskers ойынын атайды | CC BY 4.0 | 4 420 faces; 2 274 vertices; **0 animation** | Дайын анимациялы ауыстыру емес. Ойыннан алынған активтің қайта қолдану құқығы listing белгісінен бөлек расталмаған. Download 401. |
| [Jerry — Tom And Jerry](https://sketchfab.com/3d-models/jerry-tom-and-jerry-a73d5990e2da43c4a478cc15f0d7ad92) | Guilherme Navarro; War of the Whiskers ойыны аталған | CC BY 4.0 | 3 751 faces; 1 901 vertices; **0 animation** | Дайын цикл жоқ; provenance жоғарыдағыдай game-derived. Download 401. |
| [Tom Rig V2 — Multiversus](https://sketchfab.com/3d-models/tom-rig-v2-multiversus-tom-and-jerry-dc60af62b20c49228584fd91451008a9) | Guilherme Navarro; сипаттамада DiMickFoxed64/The-DoomGuySFM rip және SAB64 edit нақты аталған | CC BY 4.0 | 19 884 faces; 10 025 vertices; **0 animation** | «Rig V2» атауы animation clip бар деген сөз емес. Қайта тарату рұқсаты тізбегі және циклдер расталмаған. Қосылған жоқ; download 401. |
| [Jerry (from Tom and Jerry) (rigged)](https://sketchfab.com/3d-models/jerry-from-tom-and-jerry-rigged-1b778cbc0c7f4a93b05cd38a06fbd5ce) | Here's Annoying Orange; қосымша авторлық сипаттама жоқ | CC BY 4.0 | 3 751 faces; 1 901 vertices; **1 animation** | Jerry үшін зерттеуге болатын шағын кандидат. Бір клиптің жүру екені/rig шығу тегі дәлелденбеген; нақты файл қажет. Download 401. |
| [Bumblebee — Optimus Prime Transform Animation](https://sketchfab.com/3d-models/bumblebee-optimus-prime-transform-animation-35f9cb09b1b248c7bd6b12912ac8cd3a) | DIO; title екі кейіпкерді атайды, сипаттамада OptimusPrime transform делінген | CC BY 4.0 | 64 556 faces; 39 955 vertices; **1 animation** | Transformers үшін transform кандидаты. Бірден Bumblebee не Optimus деп runtime-да бекітуге нақты mesh preview қажет. Transform — walk/run емес. Download 401. |
| [Optimus Prime — Transformers Animated](https://sketchfab.com/3d-models/optimus-prime-transformers-animated-1c8b5934bc8347b9b63cb1b10e4d3726) | Angel300 Animations; авторлық модель емес port екені және noncommercial шарты сипаттамада айтылған | **CC BY-NC 4.0** | 8 871 faces; 4 765 vertices; **0 animation** | «Animated» бұл жерде сериал атауы: API анимация санын 0 деп берді. Rigged Blend айтылған, alt mode жоқ. Дайын жүретін NPC емес; download 401. |

Геометрия мәндері public API-ден алынды; listing көрсететін дөңгелектелген мәндермен шатастырмау керек. CC белгілері uploader ұсынған шарт ретінде тіркелді; uploader өзі түпнұсқа модельді жасағанын не барлық бастапқы рұқсатты иеленетінін API растамайды. Сондықтан ашық game-rip ретінде сипатталған нұсқалар «clear-provenance usable» деп белгіленбеді.

## Шығу тегі анығырақ, бірақ дайын runtime ауыстыру емес баламалар

- [Artem Dubyna — Tom (rig for Maya)](https://temaroots.gumroad.com/l/Tom): автордың өз беті, $0+; жанкүйерлерге/анимация үйренушілерге арналған free rig деп көрсетілген. Бұл бет дайын GLB Walk/Idle/Run жинағын немесе веб-ойында қайта тарату лицензиясын жария түрде растамайды. Maya → baked GLB экспорт және нақты қолдану шарты қажет. Сатып алу/checkout жасалмады.
- [B.R.W. Productions — Naruto Animated Rigged](https://bsamb.artstation.com/store/ekYeb/naruto-animated-rigged-3d-model): listing-де GLB, rig/animation, 390 МБ ZIP және $20 Standard Use нұсқасы көрсетілген; 1 жобаға 2 000 sales/20 000 views шегі берілген. Ақылы сатып алу жасалмады. Clip мазмұны/мобильді көлемі тек файл алынса тексеріледі.
- [Sinh Nguyen — Tom and Jerry](https://www.artstation.com/marketplace/p/Yg9mV/tom-and-jerry): $5.50 listing, OBJ/STL/ZTL баспа активтері. Қажетті rig/animation жинағы емес; жай формат түрлендіру skeleton жасамайды. Сондықтан осы тапсырмаға алынбады.
- [Fantasy999d — Tom Cat](https://www.renderhub.com/fantasy999d/tom-cat-tom-and-jerry): rigged FBX/Blend бар, бірақ listing нақты **NO animation** дейді; Personal Use Only / Editorial шектеуі көрсетілген. Дайын анимациялы оқу сайты активі ретінде таңдалмады.

Бағалар/шарттар 2026-11-08 күнгі беттерден; тапсырыс бағасы/рұқсат қайта тексерілмей сатып алу ұсынылмайды. «Jerry» деп аталатын кез келген rig-ті шатастырмау керек: Truong-ның cartoon male моделі және Agora flour sack моделі — Tom and Jerry тышқаны емес; олар бұл тізімге алмастыру ретінде кірмеді.

## Нақты бөгет және келесі интеграция

Қазіргі бөгет — **ресми архивтер жоқ: барлық тексерілген Sketchfab download 401**. Осы себеппен mesh/textures, embedded scripts бар-жоғы, skins, нақты clip атаулары/ұзақтығы, root motion және жүктеу көлемі тексерілмеді. Tom үшін қосымша бөгет: тексерілген ықшам listing-терде 0 animation; альтернатив авторлық Maya rig-ке baked анимация және веб қолдану шарты қажет.

Орталық чат ресми аккаунт арқылы жүктелген, атрибуциясы/лицензиясы бірге алынған GLB/glTF архивтерін бергенде:

1. Модель, textures және лицензия құжаттарын ғана тексеру; бөтен executable/scene startup script-терді орындамау.
2. Bytes hash, түпнұсқа URL, автор, license және өзгерістерді provenance тізіліміне қосу.
3. GLTFParser арқылы skins/clips, geometry/texture бюджеті, сыртқы URL және root motion тексеру. Алдымен бір Naruto моделінен бастау.
4. Walk/Idle/Run бар болса engine states-ке сәйкестендіру; жоқ болса «бар» деп көрсетпей, нақты rig-ке retarget/bake жасау.
5. NPC болмаса player ретінде қосу алдында turn/foot contact/камера/mobile тесті. Transformers transform циклін еркін жүріске автоматты алмастырмау.
6. Тек содан кейін Q1 roster нақты атауларымен ауыстырылады. Қазіргі student/RobotExpressive атаулары Naruto/Tom/Jerry/Transformers деп өзгертілмеді.

Кез келген түрлендіру сайт API келісімін немесе сабақтың ашылу шартын өзгертпейді. Бұл аудит сатып алу, сыртқы авторға хабарлама жіберу не жариялау жасамайды.
