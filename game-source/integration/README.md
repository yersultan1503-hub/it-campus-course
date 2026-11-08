# Q3 ішкі құлыптарын біріктіру

## Ойын чаты дайындағаны

1. `dist/client` — `/game/` сыртқы каталогын сервер рұқсатымен құлыптайды, рұқсатсыз Q3 iframe-ді жүктемейді. Рұқсат берілген iframe жүктелген соң сол origin ішіндегі DOM адаптерін қосады: station/map/mode/quest buttons disabled; жабық 3D ғимарат таңдалса толық ішкі curtain; студенттің unguarded E/У shortcut-ы жабылады. WASD/Shift/камера сақталады. Staff үшін `/api/course` барлық деңгейге true бергенде бәрі ашық.
2. `dist/client/legacy-access.js` — direct legacy URL үшін де дәл сол тексеруді орындайтын standalone module. Me/course, same-origin cookies, 20s refresh, stale/error fail closed. Grade/XP жинамайды.
3. `legacy-q3-entry-guard.patch` және `legacy-q3-App.guarded.jsx` — нақты түпнұсқа App.jsx-тен алынған entry guard. Бұл чат түпнұсқаны және year-pilot көшірмесін өзгертпеген.

## Ата-чат қолданатын міндетті hook

`/Users/ersultan/Documents/Codex/2026-10-02/rh/year-pilot/public/legacy-q3/game/index.html` ішіне:

```html
<script type="module" src="/game/legacy-access.js"></script>
```

Бұл жол **direct `/legacy-q3/game/?lesson=...` кіруін** де қорғайды. `/game/?lesson=q3-xx` iframe wrapper-і бұл hook жоқ болса да өз адаптерін қосады, бірақ direct URL wrapper-ден өтпейді: сондықтан индекс hook міндетті.

Legacy bundle-ды next rebuild кезінде:

- Read-only `/Users/ersultan/Desktop/IT_CAMPUS/02_Ойын_коды` ішінен бөлек source көшірме жасаңыз.
- Сол көшірменің `src/App.jsx` файлына patch қолданыңыз немесе `legacy-q3-App.guarded.jsx` мазмұнын қойыңыз. Негізгі Desktop source-қа қолданбаңыз.
- Ескі campus build base/asset rewrite талаптарын сақтап қайта build жасап, тек интеграция legacy көшірмесін ауыстырыңыз. Standalone `legacy-access.js` hook-ін сақтаңыз.

Patch `openZone(i)` ішінде нақты i key-ін, `beginMode()` ішінде нақты selected key-ін тексереді. Canvas selection callback және HTML station/map батырмалары да guard алады. Бұл E арқылы жақындағы locked building-ке кіру жолын нақты engine деңгейінде жабады. Patch барын `window.__campusLegacyEntryGuarded=true` белгісімен хабарлайды; bridge сонда E пернесін тұтас өшірмей, engine guard-қа береді.

Guard API: `window.__campusLegacyAccess.canOpen('html'|'table'|'links'|'css'|'media'|'js'|'quiz'|'db')`. Bridge дайын емес кезде undefined → deny. Бұл мән сервер snapshot-ынан ғана толтырылады; localStorage XP қолданылмайды. Client JS/DOM өзгертетін адам UI-ды бұза алады, сондықтан нақты баға/келесі сабақ ашу бәрібір серверде тексеріледі. Ескі static bundle сұрақтарын құпия емтихан банкі деп санауға болмайды.

## Message hook

Ішкі adapter тек navigation intent жібереді:

```js
parent.postMessage({type:'campus:legacy-selection', lessonId:'q3-02'}, location.origin);
```

Outer тек event.origin, iframe contentWindow identity, белгілі q3 ID және жаңа server snapshot-тағы unlocked=true сәйкес болса ғана таңдайды. Passed/score/XP/role/allowed сияқты iframe message-тер авторизацияға пайдаланылмайды.

## Сервер

`/api/me` және `/api/course` өз origin-де қолжетімді болуы тиіс; course lesson-дерінде `kind:'lesson'`, нақты `unlocked:boolean` міндетті. Me user role staff болуы ғана курс flags-ін айналып өтуге негіз емес. Teacher/admin үшін backend flags true беруі тиіс.

Қосымша defense: direct legacy document GET кезінде query key-ін q3-ID-ге map жасап, server lesson access тексеруін қолданыңыз; invalid key/401/403 кезінде контент орнына түсінікті кіру/құлып экранын қайтарыңыз. Бұл статикалық offline XP-ді ешқашан progress ретінде қабылдамау талабын алмастырмайды.
