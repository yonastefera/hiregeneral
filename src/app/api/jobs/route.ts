// app/api/jobs/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = req.nextUrl

  const query          = searchParams.get('query')          ?? ''
  const location       = searchParams.get('location')       ?? ''
  const daysAgo        = Number(searchParams.get('daysAgo') ?? '30')
  const workMode       = searchParams.get('workMode')       ?? ''
  const employmentType = searchParams.get('employmentType') ?? ''
  const category       = searchParams.get('category')       ?? ''
  const excludeId      = searchParams.get('excludeId')      ?? ''
  const page           = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize       = Math.min(50, Number(searchParams.get('pageSize') ?? '20'))
  const from           = (page - 1) * pageSize
  const to             = from + pageSize - 1

  // Base query — only published, not expired
  let dbQuery = supabase
    .from('jobs')
    .select(`
      id, recruiter_id, company_id,
      company_name, company_logo_url, company_tagline, company_size, company_website,
      title, description, responsibilities, requirements, benefits,
      location, employment_type, work_mode, experience_level, category,
      salary_min, salary_max, salary_currency, skills,
      status, slug, apply_url, source_name,
      posted_at, expires_at,
      job_applicant_counts ( applicant_count )
    `, { count: 'exact' })
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .gte('posted_at', new Date(Date.now() - daysAgo * 86_400_000).toISOString())
    .order('posted_at', { ascending: false })
    .range(from, to)

  // Full-text search using the GIN index
  if (query.trim()) {
    dbQuery = dbQuery.textSearch(
      'title,company_name,description,location',
      query.trim(),
      { type: 'websearch', config: 'english' }
    )
  }

  // Location filter
  if (location.trim()) {
    dbQuery = dbQuery.ilike('location', `%${location.trim()}%`)
  }

  // Work mode filter
  if (workMode) {
    dbQuery = dbQuery.eq('work_mode', workMode)
  }

  // Employment type filter
  if (employmentType) {
    dbQuery = dbQuery.eq('employment_type', employmentType)
  }

  // Category filter (used for related jobs)
  if (category) {
    dbQuery = dbQuery.eq('category', category)
  }

  // Exclude a specific job by id (used for related jobs sidebar)
  if (excludeId) {
    dbQuery = dbQuery.neq('id', excludeId)
  }

  const { data, error, count } = await dbQuery

  if (error) {
    console.error('[GET /api/jobs]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten applicant_count from joined view
  const jobs = (data ?? []).map((job: any) => ({
    ...job,
    applicant_count: job.job_applicant_counts?.[0]?.applicant_count ?? 0,
    job_applicant_counts: undefined,
  }))

  return NextResponse.json({
    data: jobs,
    total: count ?? 0,
    page,
    pageSize,
  })
}
