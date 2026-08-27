// Formats a lead's deal estimate for display. Caller must already be gating
// this behind isOwner — hourlyRate/budget are stripped server-side for
// everyone else, so this would just render "—" for them anyway.
export function formatEstimate(lead: { estimateType?: string; budget?: number | null; hourlyRate?: number | null; estimatedWeeklyHours?: number | null }): string {
  if (lead.estimateType === 'Hourly') {
    if (!lead.hourlyRate) return '—';
    const weekly = lead.estimatedWeeklyHours ? ` · ${lead.estimatedWeeklyHours}h/wk` : '';
    return `$${lead.hourlyRate}/hr${weekly}`;
  }
  return lead.budget ? `$${lead.budget.toLocaleString()}` : '—';
}
