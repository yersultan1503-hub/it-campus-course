# Access update — 2026-11-08

Current endpoints: POST /api/teacher-request {reason}; GET /api/profile includes teacherRequest; GET /api/admin/users includes pending requests; POST /api/admin/review-request {userId,approved,note}; POST /api/admin/change-role {userId,role:student|teacher}; POST /api/admin/remove-user, restore-user, revoke-session {userId}. Server checks admin role, prevents changing/removing the sole admin; all role/access mutations revoke target sessions and pending login confirmations. Password login disabled by default; allow_test_login only explicit isolated tests. Existing permissions/progress logic preserved. Removal is reversible project-access revocation, not erasure of learning evidence. Database remains local SQLite; Supabase migration is pending.

Historical contract below (old role/login restrictions superseded):

# AUTH UPDATE — Google replaces SMS

2026-11-08 user changed requirement to Google account registration. Phone/SMS/password recovery/admin password reset endpoints below are SUPERSEDED, retained only as planning history. Live contract: GoogleIdentity in server.py; GET /api/config {googleConfigured,localTestLogin,registration:google}; GET /api/auth/google/start, callback; POST /api/auth/google/confirm {replaceSession:true}; POST /api/auth/google/cancel. GET /api/me user.email not phone. POST /api/auth/login only local-test email/password, never Google password. Admin revoke only. All learning endpoints unchanged. See README.md.

# Quarter 1 pilot v1 — 2026-11-08

Owner integration chat 01a0fc24-2c1f-7321-956e-a0884ece6225. Main original /Users/ersultan/Desktop/IT_CAMPUS stays read-only. This pilot runs separately at http://127.0.0.1:8890. No production deployment this iteration. Backend Python stdlib + SQLite persistent local pilot, upgrade hosting before production. All API same origin; HttpOnly SameSite cookie. No token storage in browser.

Website chat owns ONLY its own outputs/web folder; integration copies it to pilot/public. Game chat owns ONLY own outputs/game-source and outputs/game-build. Integration builds server, tests, resource registry. Never edit each other's files.

Lesson id q1-network-01, mission id network-connect-01. Topic: Компьютерлік желілердің жұмыс жасау принциптері. Objective 10.6.1.1 network components purpose (nodes, router, switch). Source Classroom https://classroom.google.com/c/ODg5MzQxNDQ4ODkw. Materials registry will be provided separately; never invent video IDs. Next lesson q1-network-02 network components; displayed as upcoming, not implemented yet.

All successful POST/GET responses JSON. Errors {error: Kazakh message, code: string}, non-2xx. Fetch credentials same-origin. POST application/json and X-Campus-Request: 1 (CSRF checked server-side). Login may return 409 code session_active when another session active. No silent new-device login. User can authenticate with phone/password + replaceSession:true to revoke previous session; old cookies then fail server checks.

## Auth
GET /api/config -> {smsConfigured:boolean, mode:'local-pilot', registration:'sms', ...}. If false SMS button explains setup required; NEVER show fake SMS success. No demo password in public bundle.
POST /api/auth/sms/start {phone,purpose:'register'|'recover'} -> {sent:true}. Real provider adapter integration pending credentials. Phone E.164 normalization (KZ +7 / 8 aliases supported), UNIQUE in database.
POST /api/auth/register {phone,code,password,name} -> {user}. SMS check required; role always student, classId default pilot class. Creates cookie session. Registration password >=12 chars.
POST /api/auth/login {phone,password,replaceSession?:boolean} -> {user}.
POST /api/auth/recover {phone,code,password} -> {ok:true}; SMS approved; revoke old sessions, return to login.
POST /api/auth/logout {} -> {ok:true}.
GET /api/me -> {user:{id,name,phone,role:'student'|'teacher'|'admin',mustChangePassword:boolean},progress:{missionPassed:boolean,reflectionSubmitted:boolean,reviewStatus:'none'|'pending'|'approved'|'revise',completed:boolean,nextUnlocked:boolean},submission?:{explanation,reflection,feedback}}. If mustChangePassword redirect to change form, other API restricted.
POST /api/auth/password {currentPassword,newPassword} -> {ok:true}; reset sessions.

## Learning
GET /api/lesson/q1-network-01 -> {id,title,objective,resources:[{title,type,url,...}],missionId}. Authentication required.
POST /api/attempts {lessonId:'q1-network-01',missionId:'network-connect-01'} -> {attemptId}. Resume unsubmitted attempt allowed.
POST /api/attempts/<attemptId>/submit {roles:{switch:'local',router:'networks',node:'endpoint'},links:[['pc1','switch'],['pc2','switch'],['switch','router']],fault:'cable'} -> {passed:boolean,criteria:[{id,passed,feedback}],progress}. Server checks evidence against mission criteria, ignores client score/pass. Failed attempt can retry; accepted retry idempotent. Role correct mappings defined above; links order irrelevant; fault is unplugged uplink.
GET /api/progress -> same progress object as /api/me.
POST /api/submission {lessonId:'q1-network-01',explanation:string,reflection:string} -> {ok:true,progress}; missionPassed required, texts 20..2000 chars. Teacher review pending; reflection alone not unlock.
GET /api/lesson/q1-network-02 ->403 locked until completed, then {id,title,status:'coming-soon'} (next lesson not ready, don't fake content).

## Teacher/admin
GET /api/teacher/students -> {students:[{id,name,phone,progress,submission:{explanation,reflection,feedback}}]}. Teacher only assigned class; admin all. No password field.
POST /api/teacher/review {studentId,approved:boolean,feedback:string} -> {ok:true}; must have mission+submission. approved unlocks next. Feedback >=3 chars. Audit logged.
GET /api/admin/users -> {users:[{id,name,phone,role,classId,mustChangePassword}]}. Admin only.
POST /api/admin/reset-password {userId} -> {temporaryPassword:string}; generated random returned ONCE, hash only stored, must change next login, revoke sessions. Admin can reset student/teacher only; no plaintext password retrieval. Audit excludes password.
POST /api/admin/revoke-session {userId} -> {ok:true}.

## UI/game route
Website / ; lesson /?lesson=q1-network-01 (simple route fine). Game /game/?lesson=q1-network-01; return /?lesson=q1-network-01#result. Game must load /api/me and create attempt, then submit evidence (not scores). If 401 show login return. Keep visible 3D entry and camera controls; do not auto-open task before campus visible. One playable network lab + buildings marked future. Existing original game copied locally, no source edits. Accessibility fallback same exercise allowed in site/game using same API, not duplicate extra homework.

## Phone policy
User explicitly chose SMS verification. Adapter planned Twilio Verify using server-only environment credentials; live SMS awaits account/provider configuration and budget, no purchase or SMS sends until configured. No bypass self-registration. For automated tests use injected fake verification service only; don't expose a fixed code or fake login endpoint in running app. Local staff/student fixtures can be created with a CLI and random secrets in non-public private file, clearly labeled test data. One active server session per account (browser profiles are sessions, not hardware fingerprint); multiple tabs within same browser share one session.
