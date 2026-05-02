// app/api/jobs/[slug]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data, error } = await supabase
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
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const job = {
    ...data,
    applicant_count: (data as any).job_applicant_counts?.[0]?.applicant_count ?? 0,
    job_applicant_counts: undefined,
  }

  return NextResponse.json(job)
}
