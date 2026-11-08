# IT CAMPUS · 10-сыныптың жылдық курсы

**Осы тармақ — толық 10-сынып жобасының жұмыс орны.**

➡️ **[Жылдық сайтты ашу](https://it-campus-year-course.vercel.app/)** · [II тоқсан](https://it-campus-year-course.vercel.app/?quarter=2)

Тармақ атауы `year-course-pilot`, сервер папкасы `pilot` болып тарихи сақталған. Осы атаулар сайт тек жергілікті сынақта тұр дегенді білдірмейді: жылдық сайт Vercel-де жарияланған, деректер Supabase-та сақталады.

| Жоба | Жарияланған сайт | GitHub тармағы |
|---|---|---|
| **Толық 10-сынып жылдық курс** | [it-campus-year-course.vercel.app](https://it-campus-year-course.vercel.app/) | [year-course-pilot](https://github.com/yersultan1503-hub/it-campus-course/tree/year-course-pilot) |
| **III тоқсан · Classroom курсы** | [it-club-10-course.vercel.app](https://it-club-10-course.vercel.app/) | [main](https://github.com/yersultan1503-hub/it-campus-course/tree/main) |

## Жұмысты қайдан бастау керек?

| Міндет | Папка / нұсқаулық |
|---|---|
| Сайт дизайны, сабақ беттері, профиль, журнал | [pilot/public](pilot/public/) және [сайт README](pilot/README.md) |
| Сервер, кіру, сабақ ашу шарттары, бағалар | [pilot](pilot/) — `app.py`, `server.py`, `postgres_store.py` |
| Жылдық ойын, тоқсан қалашықтары, кейіпкерлер | [game-source](game-source/) және [ойын README](game-source/README.md) |
| Сабақтар мен материалдар | `pilot/course_catalog.json`, `pilot/course_content.py`, `pilot/materials/`, `pilot/public/resources/` |
| Ортақ база | [pilot/CLOUD_DATABASE.md](pilot/CLOUD_DATABASE.md) |
| Ескі III тоқсан материалын алу | [archives](archives/README.md) — мұрағаттық көшірме |

**Негізгі жұмыс папкалары: `pilot` және `game-source`.** `archives/IT_CAMPUS_Q3` ішіндегі өзгеріс жылдық сайтқа автоматты қосылмайды. Оны дайын материал алу немесе бұрынғы жобаны қалпына келтіру үшін пайдаланыңыз.

## Қазіргі іске асқан байланыс

Google арқылы кіру → сабақ материалы → 3D практика → серверлік бағалау → қысқа рефлексия → мұғалім журналы. Оқу нәтижелері мен бағалар ортақ базаға байланысты. Мұғалім бағасы және келесі сабаққа мақұлдау бөлек әрекеттер. Бір аккаунтта бір белсенді сервер сессиясы бар.

2026-11-08: жарияланған сайттағы Google кіруі және мұғалім журналындағы көшірілген нәтижелер тексерілді. Екі тәуелсіз база қосылымындағы нәтижелер салыстырылды; екі нақты құрылғымен толық сценарий тексерісі әлі жүргізілмеген.

## Екі жобаны бөлек ашу

Бір папкада тармақтарды ауыстырғаннан гөрі екі бөлек жұмыс көшірмесін пайдаланыңыз. Жеке репозиторийге рұқсаты бар GitHub аккаунты қажет.

```sh
git clone --branch main --single-branch https://github.com/yersultan1503-hub/it-campus-course.git IT_CAMPUS_Q3
git clone --branch year-course-pilot --single-branch https://github.com/yersultan1503-hub/it-campus-course.git IT_CAMPUS_YEAR
```

- III тоқсан жұмысы: **IT_CAMPUS_Q3**.
- Жылдық сайт пен қалашықтар: **IT_CAMPUS_YEAR**.
- Өзгеріс алдында `git branch --show-current` және `git status` арқылы орынды тексеріңіз.
- Екі тармақты тұтас merge етпеңіз: олардың құрылымы мен сервері бөлек. Қажет материалды жеке көшіріп, жылдық курстағы рұқсат және сабақ ретімен сәйкестендіріңіз.
- GitHub-қа сақтау мен сайтты жариялау — бөлек әрекеттер. Жариялау алдында нақты Vercel жобасын тексеріңіз.

## Жариялау шекарасы

- Жылдық Vercel жобасы: **`it-campus-year-course`**.
- Жинақты дайындау: [pilot/scripts/prepare_cloud_release.py](pilot/scripts/prepare_cloud_release.py). Ол репозиторий түбіріне `year-cloud-release` папкасын жасайды.
- Жылдық сайтқа сол дайын жинақ жарияланады. `archives` папкасын немесе III тоқсанның `01_Сайт` папкасын жылдық сайт орнына жарияламаңыз.
- База құпиялары сервер баптауларында тұрады. GitHub коды база ішіндегі аккаунттар, бағалар және сессиялардың сақтық көшірмесі емес.

## Қысқаша навигация

[Сайт / сервер](pilot/README.md) · [Ойын](game-source/README.md) · [База](pilot/CLOUD_DATABASE.md) · [III тоқсан архиві](archives/README.md)
