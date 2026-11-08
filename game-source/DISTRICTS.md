# Жылдық аудандардың ағымдағы бөлінуі

2026-11-08 жаңартуы: Q1 — 12 instructional mission бар observatory аудан; Q3 — ата-чат ұсынған бөлек original legacy campus және 8 server checkpoint. Q2 — бес серверлік миссиясы бар бөлек CodingDistrict; Q4 — бөлек DatabaseDistrict деректер айлағы, төрт физикалық hub; тақырыптар тек сервер тізілімінен.

Q1 scene factory: `NetworkDistrict.js` + `observatoryAtmosphere.js`; plan/roster: `districts/q1.js`. Network/security корпустары және logic observatory тақырыптары материал тізіліміне сәйкес.

Q3 routes: `/game/?lesson=q3-01..08` → тек `/legacy-q3/game/?lesson=html|table|links|css|media|js|quiz|db` iframe. Q1 scene жүктелмейді. Legacy XP оқу нәтижесін алмастырмайды; generic checkpoint серверге answers жібереді.

Q4-тің street graph, архитектура silhouette, су арналары, index plaza және NPC құрамы бөлек іске асырылды. Q1/Q3 моделін тұтас көшіріп, тек түсін ауыстыру қабылданбайды. Материалдар түгенделмей тақырып/сабақ саны ойдан бекітілмейді.

Ортақ камера, қозғалыс, authored gait, қолжетімді mission panel және same-origin API қайта қолданылуы мүмкін. Әр аудан өзінің дерек жоспарын, scene factory-сін, active asset/credits тізімін және collision/route/mobile/performance қабылдауын береді. Ағымдағы night/day `campus-theme` келісімі Q1 сахнасына және outer UI-ға қолданылады; Q3 original renderer өзгертілмейді.

Толық соңғы күй, тексерулер және интеграция шектері: `HANDOFF.md`.

Q2 архитектурасы: f(x) workshop, argument bridge, return tower, test foundry, recursion stack; basalt/violet/brass materials, zigzag boulevard, broadleaf perimeter және бөлек VRM/robot roster. Q1 observatory/guest scene-і көшірілмейді.

Q2/Q4 instructional lesson саны hardcode емес: /api/course арқылы кеңейеді; station index бес/төрт physical hub бойынша бөлінеді. Әр сабақ өз missionId және сервер сұрақтарымен жеке бағаланады. Q4 official topics жергілікті файлға ойдан енгізілмейді.

2026-11-08 толық тізім: Q2 14 ID (01…05 функциялар,06…07 жолдар,08…09 файлдар,10…11 сұрыптау,12…14 графтар); Q4 10 ID (01/04 мұрағат,02/03 байланыстар,05/06/09 сұраныстар,07/08/10 қойма). Тақырып/сұрақ/баға API-ден. registryStation() осы hub сәйкестігін береді; белгісіз болашақ IDs қауіпсіз index fallback-пен өз тоқсанында қалады.
