-- Give `subjects` the same per-user uniqueness guard that `facets` already has
-- (see 0001_init.sql), so two concurrent adds that resolve to the same new
-- subject can no longer each insert a row and fragment the grid (the class that
-- session 15 had to clean up by hand).
--
-- PREREQUISITE: ADD CONSTRAINT fails if duplicate (user_id, name) rows already
-- exist. Before applying, find and merge any dupes by hand (repoint the losers'
-- topics onto the keeper, delete the empty losers). See the pattern in
-- scripts/merge-dupes.mjs and qc-audit/OWNER_ACTIONS.md section 4. Only apply
-- this once the following returns zero rows:
--
--   select user_id, name, count(*)
--   from subjects
--   group by user_id, name
--   having count(*) > 1;

alter table subjects
  add constraint subjects_user_id_name_key unique (user_id, name);
