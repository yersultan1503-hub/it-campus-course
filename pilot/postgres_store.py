"""Small PostgreSQL compatibility boundary for the existing, server-only Store.
No browser has database credentials. Every unit of work commits or rolls back.
"""
import re
import psycopg
from psycopg.rows import dict_row

class Connection:
 def __init__(self,url):
  self.connection=psycopg.connect(url,row_factory=dict_row,connect_timeout=15,prepare_threshold=None,sslrootcert=str(__import__('pathlib').Path(__file__).parent/'database/supabase-ca.crt'))
  self.connection.execute('SET LOCAL search_path TO campus_live, pg_catalog')
  # The pilot used BEGIN IMMEDIATE. Preserve that serialization across workers,
  # including one-session-per-user and read/check/write unlock decisions.
  self.connection.execute('SELECT pg_advisory_xact_lock(214031014)')
 def context(self,**values):
  for key,value in values.items():
   if key not in {'session_hash','pending_hash','google_email','google_sub','oauth_hash','limit_key'}:raise ValueError('unknown context')
   self.connection.execute("SELECT set_config(%s,%s,true)",('campus.'+key,str(value)))
 def __enter__(self):return self
 def __exit__(self,kind,value,tb):
  try:
   if kind:self.connection.rollback()
   else:self.connection.commit()
  finally:self.connection.close()
 def execute(self,sql,parameters=()):
  if not sql.lstrip().upper().startswith('SELECT'):self.learner_cache={}
  if sql=='BEGIN IMMEDIATE':return self.connection.execute('SELECT 1')
  if sql.startswith('INSERT OR REPLACE INTO limits'):
   sql='INSERT INTO limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=EXCLUDED.count,until=EXCLUDED.until'
  elif sql.startswith('INSERT OR REPLACE INTO sessions'):
   sql='INSERT INTO sessions VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,created=EXCLUDED.created,seen=EXCLUDED.seen,expires=EXCLUDED.expires'
  sql=sql.replace('AS gradedAt','AS "gradedAt"')
  # Store statements are fixed SQL: no question-mark literals or dynamic SQL.
  sql=sql.replace('?','%s')
  return self.connection.execute(sql,parameters)
