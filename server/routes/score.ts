export const handleScore: RequestHandler = async (_req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !serviceRole) return res.status(500).json({ error: "Supabase not configured" });

    // Compute average score from evaluation_reports in last 30 days
    const q = `${supabaseUrl}/rest/v1/evaluation_reports?select=score,comments&created_at=gte.${encodeURIComponent(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString())}`;
    const resp = await fetch(q, { headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` } });
    if (!resp.ok) {
      const dt = await resp.text();
      return res.status(500).json({ error: 'Failed to query reports', detail: dt });
    }

    const reports = await resp.json();
    if (!Array.isArray(reports) || reports.length === 0) return res.json({ score: null, note: 'No recent reports' });

    // Simple algorithm: average score plus small boost for longer comments
    let sum = 0;
    let weight = 0;
    for (const r of reports) {
      const s = Number(r.score) || 0;
      const len = (r.comments || '').length;
      const w = 1 + Math.min(1, len / 200); // up to 2x weight
      sum += s * w;
      weight += w;
    }
    const avg = sum / weight;
    const final = Math.round(avg);

    return res.json({ score: final, reports_count: reports.length });
  } catch (err: any) {
    console.error('score error', err);
    return res.status(500).json({ error: err?.message || 'unknown' });
  }
};
