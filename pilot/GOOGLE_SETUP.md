# Google кіруін баптау күйі

2026-11-08: жеке Google Cloud жобасы IT CAMPUS Year Course (`crucial-axon-514110-g3`) және «IT CAMPUS — 10-сынып» branding құрылды. User Data Policy пайдаланушының нақты келісімімен қабылданды. Бұрынғы CodeQuest Tutor және production курс өзгертілмеді.

Web OAuth client: IT CAMPUS local pilot. Redirect: `http://127.0.0.1:8890/api/auth/google/callback`. Client ID/secret `data/google-oauth.json` ішінде, тек иесіне қолжетімді (0600); public пен Git құрамына кірмейді. Орта айнымалылары файлдағы мәндерден басым. Сервер жаңадан іске қосылды, Google аккаунт таңдау терезесіне нақты өту тексерілді.

Scopes: openid email profile ғана. Gmail, Drive, Classroom API рұқсаты жоқ. Audience: External / testing. Нақты Google аккаунтпен кіру және callback арқылы сайтқа сәтті қайту браузерде тексерілді: аккаунт аты және «Шығу» батырмасы көрінді. Алғашқы профиль оқушы рөлімен құрылды.

7 backend тесті өтті: Google provider жауабы тестте модельденеді; state, nonce байланысы, бір реттік state, тұрақты Google identity, сессия ауыстыру, рөлдер және оқу барысы тексеріледі.

Бұл loopback пилот. Production үшін HTTPS callback, Secure cookies, жергілікті тест кіруін өшіру және тұрақты сервер орналастыру бөлек қажет. Google паролі сақталмайды және админге көрсетілмейді.
