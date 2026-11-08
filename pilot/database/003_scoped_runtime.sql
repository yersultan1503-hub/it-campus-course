-- Runtime has no ownership, DDL, public-schema or old campus-schema privileges.
-- Every private table uses explicit request-scoped RLS, never USING(true).
CREATE ROLE campus_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT USAGE ON SCHEMA campus_live TO campus_runtime;
CREATE FUNCTION campus_live.actor_id() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,campus_live AS $$
 SELECT u.id FROM campus_live.users u WHERE u.active=1 AND (
 EXISTS(SELECT 1 FROM campus_live.sessions s WHERE s.user_id=u.id AND s.token_hash=current_setting('campus.session_hash',true) AND s.expires>extract(epoch from now()) AND s.seen>extract(epoch from now())-1800)
 OR EXISTS(SELECT 1 FROM campus_live.oauth_pending p WHERE p.user_id=u.id AND p.token_hash=current_setting('campus.pending_hash',true) AND p.expires>extract(epoch from now()))
 OR (u.email=current_setting('campus.google_email',true) AND (u.google_sub=current_setting('campus.google_sub',true) OR (u.google_sub IS NULL AND u.auth_source='google-invited')))) LIMIT 1
$$;
CREATE FUNCTION campus_live.actor_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,campus_live AS $$ SELECT role FROM campus_live.users WHERE id=campus_live.actor_id() $$;
CREATE FUNCTION campus_live.can_read_student(target text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,campus_live AS $$
 SELECT target=campus_live.actor_id() OR EXISTS(SELECT 1 FROM campus_live.users a JOIN campus_live.users t ON t.id=target WHERE a.id=campus_live.actor_id() AND (a.role='admin' OR (a.role='teacher' AND t.role='student' AND a.class_id=t.class_id)))
$$;
REVOKE ALL ON FUNCTION campus_live.actor_id(),campus_live.actor_role(),campus_live.can_read_student(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION campus_live.actor_id(),campus_live.actor_role(),campus_live.can_read_student(text) TO campus_runtime;
GRANT SELECT,INSERT,UPDATE ON campus_live.users TO campus_runtime;
CREATE POLICY profile_read ON campus_live.users FOR SELECT TO campus_runtime USING(campus_live.can_read_student(id) OR email=current_setting('campus.google_email',true));
CREATE POLICY google_registration ON campus_live.users FOR INSERT TO campus_runtime WITH CHECK(role='student' AND auth_source='google' AND password='google-managed' AND email=current_setting('campus.google_email',true) AND google_sub=current_setting('campus.google_sub',true));
CREATE POLICY profile_write ON campus_live.users FOR UPDATE TO campus_runtime USING(id=campus_live.actor_id() OR campus_live.actor_role()='admin') WITH CHECK(id=campus_live.actor_id() OR campus_live.actor_role()='admin');
-- Guard protected columns independently of the RLS row filter.
CREATE FUNCTION campus_live.protect_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,campus_live AS $$ BEGIN
 IF current_user='campus_runtime' THEN RAISE EXCEPTION 'unreachable'; END IF;
 IF session_user='campus_runtime' AND campus_live.actor_role() IS DISTINCT FROM 'admin' THEN
  IF (NEW.role,NEW.active,NEW.class_id,NEW.password,NEW.id) IS DISTINCT FROM (OLD.role,OLD.active,OLD.class_id,OLD.password,OLD.id) THEN RAISE EXCEPTION 'protected profile fields'; END IF;
  IF (NEW.google_sub,NEW.auth_source,NEW.verified,NEW.email) IS DISTINCT FROM (OLD.google_sub,OLD.auth_source,OLD.verified,OLD.email) AND NOT (NEW.email=current_setting('campus.google_email',true) AND NEW.google_sub=current_setting('campus.google_sub',true) AND NEW.auth_source='google' AND NEW.verified=1) THEN RAISE EXCEPTION 'verified Google identity required'; END IF;
 END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION campus_live.protect_profile() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_profile BEFORE UPDATE ON campus_live.users FOR EACH ROW EXECUTE FUNCTION campus_live.protect_profile();
GRANT SELECT,INSERT,UPDATE,DELETE ON campus_live.sessions,campus_live.oauth_pending TO campus_runtime;
CREATE POLICY session_scope ON campus_live.sessions TO campus_runtime USING(user_id=campus_live.actor_id() OR campus_live.actor_role()='admin') WITH CHECK(user_id=campus_live.actor_id());
CREATE POLICY pending_scope ON campus_live.oauth_pending TO campus_runtime USING(token_hash=current_setting('campus.pending_hash',true) OR user_id=campus_live.actor_id() OR campus_live.actor_role()='admin') WITH CHECK(user_id=campus_live.actor_id());
GRANT SELECT,INSERT,DELETE ON campus_live.oauth_state TO campus_runtime;
CREATE POLICY oauth_read ON campus_live.oauth_state FOR SELECT TO campus_runtime USING(token_hash=current_setting('campus.oauth_hash',true));
CREATE POLICY oauth_insert ON campus_live.oauth_state FOR INSERT TO campus_runtime WITH CHECK(token_hash=current_setting('campus.oauth_hash',true));
CREATE POLICY oauth_delete ON campus_live.oauth_state FOR DELETE TO campus_runtime USING(token_hash=current_setting('campus.oauth_hash',true) OR expires<extract(epoch from now()));
GRANT SELECT,INSERT,UPDATE ON campus_live.limits TO campus_runtime;
CREATE POLICY limit_scope ON campus_live.limits TO campus_runtime USING(key=current_setting('campus.limit_key',true)) WITH CHECK(key=current_setting('campus.limit_key',true));
GRANT SELECT,INSERT,UPDATE ON campus_live.attempts,campus_live.submissions,campus_live.lesson_submissions,campus_live.teacher_requests,campus_live.practice_grades TO campus_runtime;
CREATE POLICY attempt_read ON campus_live.attempts FOR SELECT TO campus_runtime USING(campus_live.can_read_student(user_id));
CREATE POLICY attempt_insert ON campus_live.attempts FOR INSERT TO campus_runtime WITH CHECK(user_id=campus_live.actor_id());
CREATE POLICY attempt_update ON campus_live.attempts FOR UPDATE TO campus_runtime USING(user_id=campus_live.actor_id()) WITH CHECK(user_id=campus_live.actor_id());
CREATE POLICY submission_scope ON campus_live.submissions TO campus_runtime USING(campus_live.can_read_student(user_id)) WITH CHECK(campus_live.can_read_student(user_id));
CREATE POLICY reflection_scope ON campus_live.lesson_submissions TO campus_runtime USING(campus_live.can_read_student(user_id)) WITH CHECK(campus_live.can_read_student(user_id));
CREATE POLICY teacher_request_scope ON campus_live.teacher_requests TO campus_runtime USING(user_id=campus_live.actor_id() OR campus_live.actor_role()='admin') WITH CHECK(user_id=campus_live.actor_id() OR campus_live.actor_role()='admin');
CREATE POLICY grade_read ON campus_live.practice_grades FOR SELECT TO campus_runtime USING(campus_live.can_read_student(user_id));
CREATE POLICY grade_insert ON campus_live.practice_grades FOR INSERT TO campus_runtime WITH CHECK(campus_live.actor_role() IN ('teacher','admin') AND campus_live.can_read_student(user_id) AND grader=campus_live.actor_id());
CREATE POLICY grade_update ON campus_live.practice_grades FOR UPDATE TO campus_runtime USING(campus_live.actor_role() IN ('teacher','admin') AND campus_live.can_read_student(user_id)) WITH CHECK(campus_live.actor_role() IN ('teacher','admin') AND campus_live.can_read_student(user_id) AND grader=campus_live.actor_id());
GRANT INSERT ON campus_live.audit TO campus_runtime;
GRANT USAGE ON SEQUENCE campus_live.audit_id_seq TO campus_runtime;
CREATE POLICY audit_append ON campus_live.audit FOR INSERT TO campus_runtime WITH CHECK(actor=campus_live.actor_id());
