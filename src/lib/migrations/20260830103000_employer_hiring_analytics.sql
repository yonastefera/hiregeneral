-- Privacy-preserving company hiring analytics derived from operational records.
CREATE OR REPLACE FUNCTION public.employer_hiring_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  target_company UUID;
  bounded_days INTEGER := LEAST(GREATEST(p_days, 7), 365);
  result JSONB;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'recruiter') THEN
    RAISE EXCEPTION 'Employer access required' USING ERRCODE = '42501';
  END IF;

  SELECT company_id INTO target_company
  FROM public.employer_team_members
  WHERE user_id = actor
  ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  IF target_company IS NULL THEN
    RETURN jsonb_build_object(
      'days', bounded_days,
      'applications', 0,
      'previousApplications', 0,
      'averageFirstResponseHours', NULL,
      'funnel', jsonb_build_object(
        'applied', 0, 'reviewed', 0, 'interviewed', 0, 'offered', 0, 'rejected', 0
      ),
      'dailyApplications', '[]'::JSONB,
      'jobPerformance', '[]'::JSONB
    );
  END IF;

  WITH
  company_jobs AS (
    SELECT id, title
    FROM public.jobs
    WHERE company_id = target_company
  ),
  period_applications AS (
    SELECT application.id, application.job_id, application.created_at
    FROM public.applications AS application
    JOIN company_jobs ON company_jobs.id = application.job_id
    WHERE application.created_at >= now() - make_interval(days => bounded_days)
  ),
  previous_applications AS (
    SELECT count(*)::INTEGER AS count
    FROM public.applications AS application
    JOIN company_jobs ON company_jobs.id = application.job_id
    WHERE application.created_at >= now() - make_interval(days => bounded_days * 2)
      AND application.created_at < now() - make_interval(days => bounded_days)
  ),
  reached AS (
    SELECT
      application.id,
      EXISTS (
        SELECT 1 FROM public.application_status_events AS event
        WHERE event.application_id = application.id AND event.status <> 'submitted'
      ) AS reviewed,
      EXISTS (
        SELECT 1 FROM public.application_status_events AS event
        WHERE event.application_id = application.id AND event.status IN ('interview', 'offer')
      ) AS interviewed,
      EXISTS (
        SELECT 1 FROM public.application_status_events AS event
        WHERE event.application_id = application.id AND event.status = 'offer'
      ) AS offered,
      EXISTS (
        SELECT 1 FROM public.application_status_events AS event
        WHERE event.application_id = application.id AND event.status = 'rejected'
      ) AS rejected,
      (
        SELECT min(event.created_at)
        FROM public.application_status_events AS event
        WHERE event.application_id = application.id AND event.status <> 'submitted'
      ) AS first_response_at
    FROM period_applications AS application
  ),
  funnel AS (
    SELECT
      count(*)::INTEGER AS applied,
      count(*) FILTER (WHERE reviewed)::INTEGER AS reviewed,
      count(*) FILTER (WHERE interviewed)::INTEGER AS interviewed,
      count(*) FILTER (WHERE offered)::INTEGER AS offered,
      count(*) FILTER (WHERE rejected)::INTEGER AS rejected,
      round((
        avg(
          extract(epoch FROM (first_response_at - application.created_at)) / 3600
        ) FILTER (WHERE first_response_at IS NOT NULL)
      )::NUMERIC, 1) AS response_hours
    FROM period_applications AS application
    JOIN reached USING (id)
  ),
  daily_counts AS (
    SELECT day::DATE AS date, count(application.id)::INTEGER AS applications
    FROM generate_series(
      current_date - (bounded_days - 1), current_date, interval '1 day'
    ) AS day
    LEFT JOIN period_applications AS application
      ON application.created_at >= day
      AND application.created_at < day + interval '1 day'
    GROUP BY day
  ),
  daily AS (
    SELECT jsonb_agg(
      jsonb_build_object('date', date, 'applications', applications)
      ORDER BY date
    ) AS data
    FROM daily_counts
  ),
  job_counts AS (
    SELECT
      company_job.id AS job_id,
      company_job.title,
      count(application.id)::INTEGER AS applications,
      count(application.id) FILTER (WHERE reached.interviewed)::INTEGER AS interviews,
      count(application.id) FILTER (WHERE reached.offered)::INTEGER AS offers
    FROM company_jobs AS company_job
    LEFT JOIN period_applications AS application ON application.job_id = company_job.id
    LEFT JOIN reached ON reached.id = application.id
    GROUP BY company_job.id, company_job.title
  ),
  ranked_jobs AS (
    SELECT *
    FROM job_counts
    ORDER BY applications DESC, title
    LIMIT 10
  ),
  job_metrics AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'jobId', job_id,
        'title', title,
        'applications', applications,
        'interviews', interviews,
        'offers', offers
      ) ORDER BY applications DESC, title
    ) AS data
    FROM ranked_jobs
  )
  SELECT jsonb_build_object(
    'days', bounded_days,
    'applications', funnel.applied,
    'previousApplications', previous_applications.count,
    'averageFirstResponseHours', funnel.response_hours,
    'funnel', jsonb_build_object(
      'applied', funnel.applied,
      'reviewed', funnel.reviewed,
      'interviewed', funnel.interviewed,
      'offered', funnel.offered,
      'rejected', funnel.rejected
    ),
    'dailyApplications', COALESCE(daily.data, '[]'::JSONB),
    'jobPerformance', COALESCE(job_metrics.data, '[]'::JSONB)
  ) INTO result
  FROM funnel, previous_applications, daily, job_metrics;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.employer_hiring_analytics(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employer_hiring_analytics(INTEGER) TO authenticated;
