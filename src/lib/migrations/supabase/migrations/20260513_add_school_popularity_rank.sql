alter table public.schools
add column if not exists popularity_rank integer not null default 10;

create index if not exists schools_popularity_rank_idx
on public.schools (popularity_rank);

update public.schools
set popularity_rank = 1
where name in (
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'University of Southern California',
  'New York University',
  'Columbia University in the City of New York',
  'University of Pennsylvania',
  'Cornell University',
  'University of Michigan-Ann Arbor',
  'University of Washington-Seattle Campus',
  'University of Texas at Austin',
  'Arizona State University Campus Immersion',
  'Pennsylvania State University-Main Campus',
  'Ohio State University-Main Campus',
  'University of Florida',
  'Florida State University',
  'Georgia Institute of Technology-Main Campus',
  'Georgia State University',
  'University of Maryland-College Park',
  'Boston University',
  'Northeastern University',
  'Duke University',
  'Yale University',
  'Princeton University',
  'Northwestern University',
  'University of Chicago',
  'Johns Hopkins University',
  'Carnegie Mellon University'
);

update public.schools
set popularity_rank = 2
where name ilike 'University of California%'
   or name ilike 'California State University%'
   or name ilike 'University of Texas%'
   or name ilike 'State University of New York%'
   or name ilike 'Florida International University%'
   or name ilike 'University of Illinois%'
   or name ilike 'University of North Carolina%'
   or name ilike 'Texas A & M University%'
   or name ilike 'Purdue University%'
   or name ilike 'Rutgers University%';