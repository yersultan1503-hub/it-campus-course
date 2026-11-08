# Ортақ база

Supabase жобасы: IT CAMPUS Year Course, gtckwzqbrwhaesjacjau, eu-central-1. Пайдаланушы таңдаған ұйым: aiknquhymkzavdssyhlc.

2026-11-08: campus жабық схемасы құрылды: profiles, lessons, enrollments, progress, sessions, audit. profiles Google subject және email бойынша бірегей; progress кілті (student_id, lesson_id); sessions бір user_id-ға бір жол. Әр тоқсанға сабақтар тіркеле алады. Барлық кестеге RLS қосылған, anon/authenticated/public-ке рұқсат жоқ. Қазіргі жағдайдағы no-policy ескертуі әдейі жабық күй; public оқуға рұқсат берілмейді.

МАҢЫЗДЫ: сайт әлі жергілікті SQLite пилотын қолданады. Supabase жобасының ашылғаны app migration аяқталғанын білдірмейді. Нақты оқушы деректері әзірге көшірілген жоқ. Құрылғылар арасында жұмыс істеуі үшін backend Postgres adapter, қорғалған server connection, деректерді тексерілген көшіру, HTTPS домен/Google callback және екі браузердегі бір профиль сынағы қажет. Осы қадамдарсыз синхрондау бар деп көрсетілмейді.

Құрылғы ауыстырғанда жаңа сессия ескісін жарамсыз етеді, бірақ прогресс user_id+lesson_id бойынша сақталуы тиіс. Мұғалім өзі бекітілген оқушыларды көреді; admin кеңірек рұқсат алады. Оқу ресурстарын көру құқығы оқушының сабақты аяқтағанын білдірмейді. Q2/Q4 контенті әлі импортталмаған; staff қолжетімділігі жоқ мазмұнды жасап бермейді.

Ресми құжат: https://supabase.com/docs/guides/database/overview
