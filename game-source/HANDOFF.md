# Соңғы handoff: Q2 және Q3 серверлік құлыптар

2026-11-08: **dist/client соңғы build дайын, 56/56 тест өтті.** Көшіруге болады; нақты blocker жоқ.

- Canonical artifact: осы source ішіндегі `dist/client/` толық мазмұны → `/game/`. `legacy-access.js` жалғыз емес: оның `assets/legacyAccess-BRn1LVcH.js` dependency-сін де көшіріңіз. Негізгі entry `assets/campus-CdfAr516.js`.
- Q2: q2-01…q2-05 үшін бөлек CodingDistrict, бес ғимарат, басқа жол/ландшафт/NPC құрамы. Тек сервердің generic question banks/attempts API қолданылады; импортталған Q2 HTML орындалмайды. Q1 guests және бірінші NetworkMission evidence өзгермеді.
- Q3: сыртқы каталог, iframe loading, ішкі station/map/mode және actual zone entry сервердің unlocked flags-іне байланған. localStorage XP рұқсат бермейді. /api/me + /api/course сәтсіз не ескіргенде fail closed; 20s/focus refresh.
- Parent интеграциясының міндетті екінші бөлігі: `integration/legacy-q3-App.guarded.jsx` файлын isolated legacy source-қа қолданып rebuild; legacy index.html-ге `<script type="module" src="/game/legacy-access.js"></script>` қосу. Нақты patch және түсіндірме: `integration/README.md`. Parent өзінің direct legacy HTTP guard-ын да қосқанын хабарлады. Бұл чат year-pilot файлын өзгертпеді.
- Тесттер: нақты React catalogue — student 22 locked/3 open, staff server flags бойынша 25 open; direct locked Q3 iframe жоқ; seeded XP/role рұқсат бермейді; inner canvas lock/mode/E hook/revocation; Q2 geometry және бес server mission contract. Браузерде Q2 ашылды, console errors жоқ. Дәлел: `qa/q2-coding-district.jpg`. Нақты баға submit жасалмады.
- Бұрынғы `outputs/game-build` жаңартылмаған; оны көшірмеңіз. Түпнұсқа Desktop, production, GitHub өзгермеді.

Төменде Q1 және бұрынғы функциялардың сақталған техникалық жазбалары.

# Q1 обсерваториясы және жылдық ойын интеграциясы

Күні: 2026-11-08. Күйі: **іске асырылған; соңғы build және 56/56 тест дайын**. Жариялау/commit жасалған жоқ. Түпнұсқа Desktop IT_CAMPUS, production және интеграцияның year-pilot файлдары өзгертілмеді.

## Ата-чатқа берілетін артефакт

Canonical build: `/Users/ersultan/Documents/Codex/2026-11-08/it-campus-year-game/outputs/game-source/dist/client`.

Осы каталогтың ішін ортақ сервердің `public/game/` ішіне ата-чат көшіреді. Build base `/game/`. Бұл итерацияда ескі `outputs/game-build` жаңартылмады: соңғы нұсқа **game-source/dist/client** ішінде. `dist/server`/`.openai` retained Sites packaging артефакттары Python серверге қосылмайды.

Build `--emptyOutDir false` арқылы орындалды, жергілікті файлдар жойылған жоқ. HTML ағымдағы hashed JS/CSS-ке ғана сілтейді; ескі hashed файлдар сақталуы мүмкін. Source ішіндегі `work/` — preview config және оқшау QA деректері; public build-ке немесе GitHub-қа қоспау керек. `.gitignore` оларды, node_modules пен dist-ті қамтиды. Жұмыс қалтасындағы SQLite QA fixture ортақ оқушы базасы емес.

## Q1: нақты Three.js обсерваториясы

Референс: ата-чаттың `public/assets/observatory-night.png` суреті тек оқылды; оның өзі фон ретінде көшірілген жоқ. Көрініс нақты Three.js объектілерімен жасалды:

- Негізгі зертхана төбесіндегі ашық күмбез, металл меридиан қабырғалары, жиек сақинасы, телескоп түтігі және жылы ішкі жарық.
- Түнгі аспан, 1050 жұлдыз нүктесі, ай, артқы тау силуэттері. Бұлар физикалық сахнада орналасқан, ауыр postprocessing жоқ.
- Алдыңғы/бүйір қасбеттердегі жылы emissive терезелер; биік ғимараттағы жарық қабаттар; cyan fibre магистралі, корпус жиектері және бар packet анимациясы.
- 72 instanced ағаш діңі және 216 тәж деңгейі бар периметр; бар rain garden-дерге қосымша жапырақ/бұта/гүл детальдары.
- Төрт shadowless path light + күмбездің бір жарығы; арзан shader ground pools. Жеңіл режимде екі path light, жарты орман, 350 жұлдыз, ground pools және көлеңке сөндіріледі.
- Бояу/металл/PBR paving профилі, қолданыстағы normal/roughness текстуралары, bevel қырлар сақталды. Күн/түнде material түстері мен emissive мөлшері нақты өзгереді.

Сахна күн/түн таңдауы сайтпен ортақ **localStorage `campus-theme`: `light` / `dark`** кілтін пайдаланады. Storage event басқа беттен келген таңдауды да қабылдайды. Кілт болмаса Q1 әдепкіде түнгі көрініспен ашылады. Q3-те бұл таңдау тек сыртқы панель түсіне қатысты деп аталады; түпнұсқа legacy renderer өзгертілмеген.

Бұл иллюстрацияның pixel-perfect/photorealistic көшірмесі деген мәлімдеме емес. Нақты FPS мектеп құрылғысында өлшенген жоқ. High нысанасы 60 FPS/DPR cap 1.85, low 30 FPS/DPR 1; VRM/Optimus көлемі және үлкен JS chunk әлі өнімділік факторы.

## Кейіпкерлер мен камера сақталды

Ата-чат қосқан **нақты** `naruto.glb`, `jerry.glb`, `tom.glb`, `optimus.glb` және CREDITS өзгертілмеді. `guestCharacters.js` өзгертілмеді:

`71e3b4e6d224bea2faac6839843e97252e3b1ee09d4adeebf33aa4e7553ecf87`

Naruto/Jerry player және NPC таңдаулары, Naruto idle/run blend пен horizontal root-motion removal, Jerry gait, Tom (-5,-11) қонағы және Optimus transform көрінісі сақталған. Tom/Optimus-қа жалған walk clip қосылған жоқ. Бұрынғы asset-audit-тегі «файл алынбаған» қорытындысы осы ата-чат импортынан кейін runtime күйін сипаттамайды; қазіргі active файлдар — public/assets ішіндегі нақты GLB-лер.

WASD/ЦФЫВ/бағыт, Shift, trackpad orbit/pan/pinch, follow/overview және camera obstruction fade сақталған. Fade theme өзгергенде де түпнұсқа материалдың түсі/emissive мәнімен жаңарады. Кедергі камераны/ойыншыны жылжытпай, нақты баған/ғимарат бөлшегін уақытша мөлдірлейді.

Portrait overview ауданға орын қалдыру үшін кеңейтіледі және жоғары кадрға орналастырылады; follow камерасының бастапқы қашықтығы өзгермеген. Mobile белгілерінің көрінетін көлемі кемінде 34px, қосымша hit area бар. 390×844 шолуда сегізі де кадрға сыйды; толық атаулар accessible name/title ішінде.

## Q1: 12 оқу миссиясы

Ойын ID-лері: `q1-network-01`, `q1-02`, `q1-03`, `q1-04`, `q1-05`, `q1-06`, `q1-08`, `q1-09`, `q1-10`, `q1-11`, `q1-12`, `q1-14`.

**q1-07 / q1-13 / q1-15 бағалау ресурстары ойынға қосылмайды.** БЖБ/ТЖБ сайтта қалады. Тоқсанның дайын емес сабақтары ойдан қосылған жоқ.

Қаланың сегіз орны — зертхана бағыттары, сабақ нөмірлері емес. Алғашқы жетеуі желі/қауіпсіздікке, соңғысы санау жүйелері мен логиканың бес сабағына бағыттайды. Бұрынғы бос expansion pad енді функционал Logic Observatory корпусына ауысты. «Сабақтар» панелінде екі Q1 топ бар, сервер тізіліміндегі атаулар/locked/progress күйлері `/api/course` арқылы жаңарады. Ашық екені туралы шешім клиентте қабылданбайды: кез келген миссияны ашқанда сервер қайта тексереді.

Алғашқы `NetworkMission` және оның exact evidence келісімі өзгерген жоқ. Hash-тер:

- `NetworkMission.jsx`: `9c5d2afb8a47e92e63427c7923511e8f4290ed888798cb8a8ac8eecbd37e769f`
- `campusApi.js`: `58ecce2155ea6b8215c22a8664f001f0137fc7e1c532b868c9fe95251eef5fa4`

Қалған 11 Q1 сабағы және 8 Q3 сабағы `GenericMission` қолданады:

1. `/api/me`: аккаунт/пароль ауыстыру талабы.
2. `GET /api/lesson/:id`: title/objective/missionId және сервер берген questions/options. 401/403 экранда дұрыс көрсетіледі; жабық сабақтың attempts сұрауы жасалмайды.
3. Оқушы басқанда `POST /api/attempts {lessonId, missionId}`.
4. `POST /api/attempts/:attemptId/submit {answers:{questionId:optionId}}`.
5. **Тек сервердің `passed === true` жауабы** табыс болып саналады. Клиентте жауап кілті, ұпай есептеу, XP арқылы ашу немесе localStorage прогресі жоқ. Қате жауаптан кейін өзгертіп сол әрекетпен қайта жіберуге болады. Желі қатесінде жауаптар жоғалмайды.
6. Материал/рефлексия/мұғалім қадамы үшін `/?lesson=<id>#result` сілтемесі бар. Толық сабақ аяқталды не келесі сабақ ашылды деп клиент өзі шешпейді.

Барлық сұраулар бұрынғы same-origin credentials + POST JSON/`X-Campus-Request: 1` келісімін сақтайды. `courseMissions.js` белгілі ID-лерді/сұрақ пішімін тексереді, бірақ дұрыс жауапты білмейді. Сұрақтар React мәтіні ретінде шығады; HTML орындалмайды.

## Q3: басқа қала және бөлек checkpoint

`/game/?lesson=q3-01` … `q3-08` Q1 World компонентін жүктемейді. Ата-чат берген ескі кампус iframe арқылы ашылады:

`/legacy-q3/game/?lesson=html|table|links|css|media|js|quiz|db`

Сервердің `legacyGameUrl` мәні осы known mapping-пен сәйкес local path болса қабылданады; сыртқы/басқа URL-ға iframe бағытталмайды. Ағымдағы бекітілген mapping fallback ретінде бар. Legacy файлдарды бұл чат өзгертпейді және бұл build-ке көшірмейді — ортақ серверде оларды ата-чат береді.

Айқын «Сабаққа оралу» және «Серверлік миссияға кіру» сыртқы панельде тұрады. Iframe XP/localStorage/postMessage **бағаға не unlock-қа кірмейді**. Q3 checkpoint та дәл generic API арқылы серверде тексеріледі. Q3 суреті `qa/q3-mobile.jpg` ішінде оның басқа қала екенін көрсетеді.

## Файлдар

Жаңа: `GenericMission.jsx`, `courseMissions.js`, `courseTheme.js`, `CameraPanel.jsx`, `observatoryAtmosphere.js`, `tests/course-missions.test.mjs`, `tests/observatory.test.mjs`.

Өзгерген: `App.jsx`, `World.jsx`, `NetworkDistrict.js`, `districts/q1.js`, `content.js`, `styles.css`, `cameraControls.js`, `cameraOcclusion.js` және оларға қатысты tests. AGENTS/DISTRICTS осы жұмысқа сай жаңартылды. DOM регрессия тесттері үшін jsdom 26.1.0 devDependency қосылды; pnpm-lock.yaml жаңартылды.

## Қабылдау тексеруі

Соңғы build + packaging + барлық тесттер: **56/56 өтті**. Қамтылғаны:

- 12 Q1 / 8 Q3 ID, assessments exclusion, әр generic сабаққа дұрыс lessonId/missionId, тек answers жіберу, сервердің false/pass және 401/403/error жағдайлары.
- Registry атауы/құлып күйі, кеңістіктегі топты client дерегінің ауыстырмауы, Q3 local iframe URL шектеуі.
- Actual GLB/VRM құрылымы мен authored clips, gait, камера/keyboard, mobile overview, 350ms W кедергі regression-ы.
- Күмбез/телескоп/жарық терезелердің геометриясы, night/day theme ауысуы, low режиміндегі light/instance шектері, mission entry/коллайдерлердің сақталуы.

Нақты backend `Store` оқшау QA SQLite арқылы қолданылып, **19 public generic lesson payload** алынды: 11 Q1 + 8 Q3. Бәрі frontend validator/evidence serializer арқылы өтті, private correct/feedback кілттері payload-та болмады. Ортақ оқу нәтижесіне тест бағасы жазылған жоқ. Бұл тест дүкені `work/` ішінде, public емес.

Жеке localhost 8897 preview браузерде тексерілді:

- Түнгі/күндізгі нақты сахна және theme батырмасы.
- 390×844: сегіз marker кадрда, header/intro батырмалары сыйды; viewport соңында қалпына келтірілді.
- Reduced motion + low графика checkbox-тары, Naruto-мен бастапқы кіру/W350ms қозғалысы; фондық қозғалыс тоқтайды, player controls жұмыс істейді.
- Жанды `/api/course` атаулары, Q1-14 mission title/objective/start экраны.
- Q3-01 iframe: шын legacy кампус және жеке серверлік checkpoint батырмасы.
- Console errors тізімі бос болды. Нақты оқу бағаларын өзгерту үшін браузерде submit орындалған жоқ; бұл ағынның сервер бағалауын ата-чаттың backend tests-і және frontend contract tests жабады.

Скриншоттар: `qa/q1-observatory-night.jpg`, `qa/q1-mobile-night.jpg`, `qa/q1-day.jpg`, `qa/q3-mobile.jpg`.

## Интеграцияның соңғы тексеруі

Parent `dist/client`-ті `/game/` ішіне көшіргеннен кейін own origin-де staff/student рөлдерімен:

1. Q1 first exact network → қате/дұрыс нәтиже → сайт рефлексиясы.
2. Құлыптаулы Q1-02 student-ке 403; алдыңғысы мақұлданған соң generic begin/submit.
3. Q1-09/14 логика миссиялары; Q1-07/13/15 gameUrl жоқ.
4. Q3-01/08 бөлек iframe және generic checkpoint; iframe XP unlock жасамайды.
5. Күн/түн site↔game синхроны, портрет mobile labels, low/reduced және нақты мектеп құрылғысындағы FPS.

Жеке preview сервері аяқталғанда тоқтатылды. Жариялау, GitHub write, түпнұсқа жобаға өзгеріс немесе жергілікті файл жою жасалған жоқ.
