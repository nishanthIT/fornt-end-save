import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Account = { id: number; userType: string; name?: string; email?: string };
type Evidence = { messageId?: string; chatId?: string; content: string; senderId: number; senderType: string; createdAt: string; attachmentName?: string; attachmentStatus?: string };
type Report = { id: string; messageId?: string; chatId?: string; reporterId?: number; reporterType: string; reportedUserId?: number; reportedUserType?: string; reporter?: Account; reportedUser?: Account; reason: string; explanation?: string; status: string; createdAt: string; evidence?: Evidence; message?: Evidence & { id: string }; hasAttachmentEvidence: boolean };
type Restriction = { id: string; userId: number; userType: string; scope: string; startedAt: string; until: string; reason: string; moderatorId?: number };
type Action = { id: string; action: string; moderatorId?: number; reason: string; createdAt: string; until?: string };
type Detail = Report & { context: (Evidence & { id: string })[]; history: Action[]; related: Pick<Report, 'id' | 'status' | 'reason' | 'createdAt'>[]; restrictions: Restriction[] };
type Job = { id: string; userId: number; userType: string; status: string; cutoff: string; removed: number; updatedAt: string; lastError?: string };
type Confirmation = { title: string; description: string; route: string; data: object; identity?: string; second?: boolean };
const date = (value?: string) => value ? new Date(value).toLocaleString() : 'Unavailable';
const account = (value: Account | undefined, type?: string, id?: number) => value ? `${value.name || value.userType} · ${value.userType}:${value.id} · ${value.email || 'No email'}` : `${type || 'Unknown'}:${id ?? 'deleted/unknown'} (account unavailable)`;
const statuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];
const label = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
const fieldClass = 'border rounded-md px-3 py-2 bg-background';

export default function Moderation() {
  const client = useQueryClient();
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ q: '', status: '', reporter: '', reportedUser: '', from: '', to: '', sort: 'date', direction: 'desc' });
  const [query, setQuery] = useState(filters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('60');
  const [customMinutes, setCustomMinutes] = useState(60);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [typedIdentity, setTypedIdentity] = useState('');
  const reports = useQuery<Report[]>({ queryKey: ['moderation', 'reports', query, page], queryFn: async () => (await api.get('/chat-safety/reports', { params: { ...Object.fromEntries(Object.entries(query).filter(([,v]) => v)), ...(query.to && { to: `${query.to}T23:59:59.999Z` }), page } })).data, refetchInterval: 30000 });
  const detail = useQuery<Detail>({ queryKey: ['moderation', 'detail', selected], queryFn: async () => (await api.get(`/chat-safety/reports/${selected}`)).data, enabled: !!selected, staleTime: 30000 });
  const restrictions = useQuery<Restriction[]>({ queryKey: ['moderation', 'restrictions'], queryFn: async () => (await api.get('/chat-safety/suspensions')).data, refetchInterval: 30000 });
  const jobs = useQuery<Job[]>({ queryKey: ['moderation', 'jobs'], queryFn: async () => (await api.get('/chat-safety/deletion-jobs')).data, refetchInterval: 5000 });
  const minutes = duration === 'custom' ? customMinutes : Number(duration);
  const valid = !busy && reason.trim().length >= 5 && reason.length <= 1000;
  const validDuration = Number.isInteger(minutes) && minutes >= 1 && minutes <= 43200;
  async function act(route: string, data: object) {
    setBusy(true); setResult('');
    try { const response = await api.post(`/chat-safety/${route}`, data); await client.invalidateQueries({ queryKey: ['moderation'] }); setResult(response.status === 202 ? 'Removal queued. Progress appears in Message removal jobs; keep the backend worker running.' : 'Action recorded.'); setConfirmation(null); }
    catch (error) { const e = error as { response?: { data?: { error?: string } } }; setResult(e.response?.data?.error || 'Action failed. Refresh and retry; success has not been confirmed.'); }
    finally { setBusy(false); }
  }
  function confirm(value: Confirmation) { setTypedIdentity(''); setResult(''); setConfirmation(value); }
  async function attachment(id: string) {
    try {
      const { data } = await api.get(`/chat-safety/reports/${id}/attachment`, { responseType: 'blob' });
      const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = 'reported-attachment'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setResult('Evidence download unavailable. Do not assume the attachment was reviewed.'); }
  }
  function selectReport(id: string) { setSelected(id); setNote(''); setReason(''); setResult(''); }
  const evidence = detail.data?.evidence || detail.data?.message;
  const targetType = detail.data?.reportedUserType || evidence?.senderType;
  const targetId = detail.data?.reportedUserId || evidence?.senderId;
  const target = `${targetType}:${targetId}`;
  const restrict = (scope: 'CHAT' | 'ACCOUNT') => confirm({ title: scope === 'CHAT' ? 'Restrict chat posting?' : 'Temporarily deactivate account?', description: `${target} · ${minutes} minutes. ${scope === 'CHAT' ? 'Shop tools remain available.' : 'All protected account access will be denied. The account and its records are preserved.'} Reason visible to the user: ${reason}`, route: `reports/${selected}/suspension`, data: { scope, minutes, reason } });
  function restrictionControls(r: Restriction) {
    return <div className="flex gap-2 flex-wrap"><Button variant="outline" disabled={!valid || !validDuration} onClick={() => confirm({ title: 'Extend restriction?', description: `${r.scope} · ${r.userType}:${r.userId} by ${minutes} minutes, up to 30 days from now.`, route: `suspensions/${r.id}/extend`, data: { minutes, reason } })}>Extend</Button><Button variant="outline" disabled={!valid} onClick={() => confirm({ title: r.scope === 'CHAT' ? 'Unblock chatting?' : 'Reactivate account?', description: `${r.userType}:${r.userId}. ${reason}`, route: `suspensions/${r.id}/lift`, data: { reason } })}>{r.scope === 'CHAT' ? 'Unblock chat' : 'Reactivate account'}</Button></div>;
  }
  return <main className="container mx-auto p-4 md:p-6 space-y-6">
    <header><h1 className="text-2xl font-bold">Reported Chats</h1><p className="text-muted-foreground mt-2">Confidential reports for authorized platform administrators. Reporter and reported user are shown separately. Changing a report status does not restrict an account.</p></header>
    <p role="status" aria-live="polite">{result}</p>
    <form className="rounded-lg border p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(filters); }}>
      <label>Search name, email, report ID or reason<Input value={filters.q} maxLength={200} onChange={e => setFilters({ ...filters, q:e.target.value })} /></label>
      <label>Status<select className={`${fieldClass} block w-full`} value={filters.status} onChange={e => setFilters({ ...filters, status:e.target.value })}><option value="">All statuses</option>{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
      <label>Reporter (type:id)<Input placeholder="CUSTOMER:12" value={filters.reporter} onChange={e => setFilters({ ...filters, reporter:e.target.value })} /></label>
      <label>Reported user (type:id)<Input placeholder="EMPLOYEE:8" value={filters.reportedUser} onChange={e => setFilters({ ...filters, reportedUser:e.target.value })} /></label>
      <label>From (UTC)<Input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from:e.target.value })} /></label><label>Through (UTC)<Input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to:e.target.value })} /></label>
      <label>Sort<select className={`${fieldClass} block w-full`} value={filters.sort} onChange={e => setFilters({ ...filters, sort:e.target.value })}>{['date','reporter','reportedUser','status'].map(s => <option key={s} value={s}>{s === 'reportedUser' ? 'Reported user ID' : label(s)}</option>)}</select></label>
      <label>Direction<select className={`${fieldClass} block w-full`} value={filters.direction} onChange={e => setFilters({ ...filters, direction:e.target.value })}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      <Button type="submit">Apply filters</Button>
    </form>
    {reports.isPending && <p role="status">Loading reports…</p>}
    {reports.isError && <p role="alert">Reports could not be loaded. <Button onClick={() => reports.refetch()}>Retry</Button></p>}
    <div className="overflow-x-auto border rounded-lg"><table className="w-full text-sm text-left"><thead className="bg-muted"><tr>{['Report / status','Reporter → Reported user','Reported message / conversation','Reason / explanation','Submitted',''].map((h,i) => <th key={i} className="p-3">{h}</th>)}</tr></thead><tbody>{reports.data?.map(r => <tr key={r.id} className="border-t align-top">
      <td className="p-3 break-all">{r.id}<br/><strong>{label(r.status)}</strong></td>
      <td className="p-3 min-w-52"><strong>Reporter:</strong> {account(r.reporter,r.reporterType,r.reporterId)}<br/><strong>Reported user:</strong> {account(r.reportedUser,r.reportedUserType,r.reportedUserId)}</td>
      <td className="p-3 min-w-60"><p className="whitespace-pre-wrap break-words">{(r.evidence || r.message)?.content || 'Evidence unavailable'}</p><small>Message: {date((r.evidence || r.message)?.createdAt)}<br/>Chat: {r.chatId || r.evidence?.chatId || 'Legacy reference unavailable'}</small></td>
      <td className="p-3">{['THREATS','CHILD_SAFETY'].includes(r.reason) && <p className="font-bold text-destructive">Urgent safety triage</p>}{label(r.reason)}<p className="whitespace-pre-wrap">{r.explanation}</p></td><td className="p-3">{date(r.createdAt)}</td><td className="p-3"><Button variant="outline" onClick={() => selectReport(r.id)}>Investigate</Button></td>
    </tr>)}</tbody></table></div>
    {reports.data?.length === 0 && <p>No reports match these filters.</p>}
    <div className="flex gap-3 items-center"><Button variant="outline" disabled={page === 1 || reports.isFetching} onClick={() => setPage(p => p-1)}>Previous</Button><span>Page {page} · 50 per page</span><Button variant="outline" disabled={reports.isFetching || (reports.data?.length || 0) < 50} onClick={() => setPage(p => p+1)}>Next</Button></div>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Active restrictions</h2>
      <p>To lift or extend a restriction, enter a reason below. Chat and account restrictions are independent.</p>
      <label className="block">Reason shown to affected user (5–1,000 characters)<textarea className={`${fieldClass} block w-full`} value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} /></label>
      <label>Duration<select className={`${fieldClass} ml-2`} value={duration} onChange={e => setDuration(e.target.value)}><option value="60">1 hour</option><option value="1440">24 hours</option><option value="10080">7 days</option><option value="43200">30 days</option><option value="custom">Custom</option></select></label>{duration === 'custom' && <label className="block">Minutes (1–43,200)<Input type="number" min={1} max={43200} value={customMinutes} onChange={e => setCustomMinutes(Number(e.target.value))} /></label>}
      {restrictions.isError && <p role="alert">Restrictions could not be loaded.</p>}{restrictions.data?.length === 0 && <p>No active restrictions.</p>}
      {restrictions.data?.map(r => <article key={r.id} className="border rounded p-3 space-y-2"><p><strong>{r.scope} · {r.userType}:{r.userId}</strong> · {date(r.startedAt)} → {date(r.until)} · imposed by ADMIN:{r.moderatorId ?? 'unavailable'}</p><p>{r.reason}</p>{restrictionControls(r)}</article>)}
    </section>
    <section><h2 className="text-xl font-semibold">Message removal jobs</h2><p>Only the selected author's messages created before the job cutoff are removed. New messages and other authors are preserved.</p>{jobs.isError && <p role="alert">Job status unavailable; do not assume completion.</p>}{jobs.data?.length === 0 && <p>No removal jobs.</p>}{jobs.data?.map(j => <p key={j.id} className="border-b py-2">{j.userType}:{j.userId} · {j.status} · {j.removed} removed · cutoff {date(j.cutoff)} · updated {date(j.updatedAt)} · job {j.id}{j.lastError && <strong role="alert" className="block text-destructive">{j.lastError}</strong>}</p>)}</section>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogTitle>Report investigation</DialogTitle><DialogDescription>Confidential evidence and limited conversation context. Do not disclose reporter identity to the reported user.</DialogDescription>
      <p role="status">{result}</p>{detail.isPending && <p>Loading report…</p>}{detail.isError && <p role="alert">Report unavailable. <Button onClick={() => detail.refetch()}>Retry</Button></p>}
      {detail.data && <div className="space-y-4">
        <p>Report {detail.data.id} · {label(detail.data.status)} · {date(detail.data.createdAt)}</p>
        <p><strong>Reporter:</strong> {account(detail.data.reporter,detail.data.reporterType,detail.data.reporterId)}</p><p><strong>Reported user:</strong> {account(detail.data.reportedUser,targetType,targetId)}</p>
        <article className="bg-muted rounded p-4"><h3 className="font-semibold">Exact reported message</h3><p className="whitespace-pre-wrap break-words">{evidence?.content || 'Original evidence unavailable'}</p><p>Message time: {date(evidence?.createdAt)} · Chat: {detail.data.chatId || evidence?.chatId || 'Unavailable'}</p>{evidence?.attachmentName && <p>{evidence.attachmentName} · {evidence.attachmentStatus}</p>}{detail.data.hasAttachmentEvidence && <Button variant="outline" onClick={() => attachment(detail.data.id)}>Download protected evidence</Button>}</article>
        <p><strong>{label(detail.data.reason)}</strong> · {detail.data.explanation || 'No additional explanation'}</p>
        <details><summary>Surrounding context (up to 11 available messages; access audited)</summary>{detail.data.context.map(m => <div className="border-b py-2" key={m.id}><small>{m.senderType}:{m.senderId} · {date(m.createdAt)}</small><p className="whitespace-pre-wrap break-words">{m.content}</p></div>)}</details>
        <label className="block">Internal moderation note (never shown to the reported user)<textarea className={`${fieldClass} block w-full`} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} /></label>
        <div className="flex gap-2 flex-wrap"><Button disabled={busy || note.trim().length < 5} onClick={() => act(`reports/${selected}/notes`,{note})}>Add internal note</Button>{statuses.map(status => <Button variant="outline" key={status} disabled={busy || note.trim().length < 5 || status === detail.data.status} onClick={() => act(`reports/${selected}/status`,{status,note})}>{label(status)}</Button>)}</div>
        <h3 className="text-lg font-semibold">Reported-user controls · {target}</h3>
        <label className="block">Restriction / removal reason (shown to user for restrictions; never include reporter identity)<textarea className={`${fieldClass} block w-full`} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <label>Duration<select className={`${fieldClass} ml-2`} value={duration} onChange={e => setDuration(e.target.value)}><option value="60">1 hour</option><option value="1440">24 hours</option><option value="10080">7 days</option><option value="43200">30 days</option><option value="custom">Custom</option></select></label>{duration === 'custom' && <label className="block">Minutes (1–43,200)<Input type="number" min={1} max={43200} value={customMinutes} onChange={e => setCustomMinutes(Number(e.target.value))} /></label>}
        <div className="flex gap-2 flex-wrap"><Button disabled={!valid || !validDuration || !detail.data.reportedUser || targetType === 'ADMIN'} onClick={() => restrict('CHAT')}>Restrict chatting</Button><Button variant="destructive" disabled={!valid || !validDuration || !detail.data.reportedUser || targetType === 'ADMIN'} onClick={() => restrict('ACCOUNT')}>Temporarily deactivate account</Button></div>
        {detail.data.restrictions.map(r => <article className="border rounded p-3" key={r.id}><p>{r.scope} · {Date.parse(r.until) > Date.now() ? 'Active':'Expired / lifted'} · {date(r.startedAt)} → {date(r.until)} · {r.reason}</p>{Date.parse(r.until) > Date.now() && restrictionControls(r)}</article>)}
        <div className="flex gap-2 flex-wrap"><Button variant="destructive" disabled={!valid || !detail.data.messageId} onClick={() => confirm({ title:'Delete this message?', description:`Remove message ${detail.data.messageId} from all conversation clients. Report evidence and the account remain.`, route:`messages/${detail.data.messageId}/remove`, data:{ reason, confirm:detail.data.messageId } })}>Delete reported message</Button><Button variant="destructive" disabled={!valid || !detail.data.reportedUser || targetType === 'ADMIN'} onClick={() => confirm({ title:'Delete all messages from this user?', description:`Remove ALL existing messages sent by ${target} across every conversation. Preserve other authors, report evidence and the account. This cannot be undone.`, route:`reports/${selected}/delete-user-messages`, data:{ reason, confirm:target, confirmAll:true }, identity:target })}>Delete all messages from {target}</Button></div>
        <details><summary>Other reports for this user (latest 20)</summary>{detail.data.related.map(r => <p key={r.id}><Button variant="link" onClick={() => selectReport(r.id)}>{r.id}</Button> {label(r.reason)} · {label(r.status)} · {date(r.createdAt)}</p>)}</details>
        <h3 className="font-semibold">Action history (latest 100)</h3>{detail.data.history.map(h => <article className="border-b py-2" key={h.id}><p>{label(h.action)} · ADMIN:{h.moderatorId ?? 'unavailable'} · {date(h.createdAt)}</p><p className="whitespace-pre-wrap">{h.reason}</p>{h.until && <small>Expiry {date(h.until)}</small>}</article>)}
      </div>}
    </DialogContent></Dialog>
    <Dialog open={!!confirmation} onOpenChange={open => { if (!open && !busy) setConfirmation(null); }}><DialogContent><DialogTitle>{confirmation?.second ? 'Final confirmation' : confirmation?.title}</DialogTitle><DialogDescription>{confirmation?.description}</DialogDescription>
      {confirmation?.identity && confirmation.second && <label>Type {confirmation.identity} to confirm<Input autoFocus value={typedIdentity} onChange={e => setTypedIdentity(e.target.value)} /></label>}
      <p role="status">{result}</p><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="destructive" disabled={busy || (!!confirmation?.identity && !!confirmation.second && typedIdentity !== confirmation.identity)} onClick={() => { if (!confirmation) return; if (confirmation.identity && !confirmation.second) setConfirmation({ ...confirmation, second:true }); else void act(confirmation.route,confirmation.data); }}>{busy ? 'Saving…' : confirmation?.identity && !confirmation.second ? 'Continue to final confirmation' : 'Confirm action'}</Button></div>
    </DialogContent></Dialog>
  </main>;
}
