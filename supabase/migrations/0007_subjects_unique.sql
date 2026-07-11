-- Give `subjects` a per-user uniqueness guard so concurrent adds that resolve to
-- the SAME subject name can no longer each insert a duplicate row and fragment
-- the grid (the class session 15 cleaned up by hand). This covers the common
-- races: two adds of the exact same title, and the degraded "Ideas" fallback
-- where every add files into the literal subject "Ideas".
--
-- LIMITATION: this is a byte-exact unique(user_id, name). The app dedups
-- case/whitespace-insensitively (normalize() lowercases + collapses whitespace),
-- so case-variant labels of a brand-NEW subject during a concurrent add (e.g.
-- "Sci-Fi" vs "sci-fi") can still both insert. That narrower race is rare (it
-- needs the model to emit different casing for the same new subject on two
-- simultaneous adds) and is caught by the existing hand-merge (scripts/merge-dupes.mjs).
-- A fully normalize-aware guard would be a functional unique index on
-- lower(regexp_replace(btrim(name), '\s+', ' ', 'g')), and would REQUIRE making
-- createSubject's 23505 re-select case-insensitive too. Deferred: not worth the
-- JS/SQL normalize-parity risk for a rare race that already has a cleanup path.
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
