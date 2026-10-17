import { useEffect, useState } from 'react';
import { getAdminUrl } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Owner = { id: number; name: string; email: string; subscriptionStatus: string };
type Supermarket = { id: string; name: string; address: string; createdAt: string; employeeCount: number; owners: Owner[] };
type Details = Supermarket & { statistics: Record<string, number>; employeeMemberships: { id: string; status: string; employee: { name: string; email: string } }[] };
async function read<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(getAdminUrl(`/admin${path}`), { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include', signal });
  if (!res.ok) throw new Error('Unable to load customer supermarkets. Check your access and try again.');
  return res.json();
}
export default function Supermarkets() {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt'); const [direction, setDirection] = useState('desc');
  const [data, setData] = useState<{ supermarkets: Supermarket[]; total: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [detail, setDetail] = useState<Details | null>(null); const [detailError, setDetailError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ search, page: String(page), status, sort, direction });
      read<{ supermarkets: Supermarket[]; total: number; limit: number }>(`/supermarkets?${params}`, controller.signal)
        .then(setData).catch((err) => { if (!controller.signal.aborted) setError(err.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page, status, sort, direction, retry]);
  useEffect(() => {
    setDetail(null); setDetailError(''); if (!selected) return;
    const controller = new AbortController();
    read<Details>(`/supermarkets/${encodeURIComponent(selected)}`, controller.signal).then(setDetail).catch((err) => { if (!controller.signal.aborted) setDetailError(err.message); });
    return () => controller.abort();
  }, [selected]);
  return <main className="container mx-auto p-6 space-y-6">
    <div><h1 className="text-3xl font-bold">Customer Supermarkets</h1><p className="text-muted-foreground mt-2">Customer shops, their verified owners and assigned employees.</p></div>
    <Card><CardContent className="p-5 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Search supermarkets or owners" placeholder="Search supermarket, owner or email" className="max-w-md" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select aria-label="Owner account status" className="rounded-md border p-2 bg-background" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All owner accounts</option><option value="free_trial">Free trial</option><option value="premium">Premium</option><option value="expired">Expired</option></select>
        <select aria-label="Sort supermarkets" className="rounded-md border p-2 bg-background" value={`${sort}:${direction}`} onChange={(e) => { const [field, order] = e.target.value.split(':'); setSort(field); setDirection(order); setPage(1); }}><option value="createdAt:desc">Newest first</option><option value="createdAt:asc">Oldest first</option><option value="name:asc">Name A–Z</option><option value="name:desc">Name Z–A</option></select>
      </div>
      {error ? <div role="alert" className="space-y-3"><p>{error}</p><Button variant="outline" onClick={() => setRetry((n) => n + 1)}>Try again</Button></div> : loading ? <div aria-label="Loading supermarkets" className="space-y-3">{[0, 1, 2].map((n) => <div key={n} className="h-14 rounded bg-muted animate-pulse" />)}</div> : <>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b">{['Supermarket', 'Owner', 'Email', 'Location', 'Active employees', 'Owner account', 'Created', 'Actions'].map((label) => <th key={label} className="p-3 whitespace-nowrap">{label}</th>)}</tr></thead><tbody>
          {data?.supermarkets.map((shop) => <tr key={shop.id} className="border-b"><td className="p-3 font-medium">{shop.name}</td><td className="p-3">{shop.owners.map((o) => o.name).join(', ') || 'Ownership needs review'}</td><td className="p-3">{shop.owners.map((o) => o.email).join(', ') || '—'}</td><td className="p-3">{shop.address || '—'}</td><td className="p-3">{shop.employeeCount}</td><td className="p-3">{shop.owners.map((o) => o.subscriptionStatus.replace(/_/g, ' ')).join(', ') || 'Needs review'}</td><td className="p-3 whitespace-nowrap">{new Date(shop.createdAt).toLocaleDateString('en-GB')}</td><td className="p-3"><Button variant="outline" onClick={() => setSelected(shop.id)}>View details</Button></td></tr>)}
        </tbody></table></div>
        {!data?.supermarkets.length && <p className="py-10 text-center text-muted-foreground">No customer supermarkets match your search.</p>}
        <div className="flex items-center justify-between gap-3"><p>{data?.total ?? 0} supermarkets · Page {page}</p><div className="flex gap-2"><Button variant="outline" disabled={page === 1} onClick={() => setPage((n) => n - 1)}>Previous</Button><Button variant="outline" disabled={!data || page * data.limit >= data.total} onClick={() => setPage((n) => n + 1)}>Next</Button></div></div>
      </>}
    </CardContent></Card>
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{detail?.name || 'Supermarket details'}</DialogTitle></DialogHeader>
      {detailError ? <p role="alert">{detailError}</p> : !detail ? <p>Loading details…</p> : <div className="space-y-5"><p>{detail.address || 'Location not provided'} · Created {new Date(detail.createdAt).toLocaleDateString('en-GB')}</p>
        <div><h2 className="font-semibold mb-2">Verified owners</h2>{detail.owners.length ? detail.owners.map((owner) => <p key={owner.id}>{owner.name} · {owner.email} · {owner.subscriptionStatus.replace(/_/g, ' ')}</p>) : <p>Ownership needs review</p>}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Object.entries(detail.statistics).map(([name, count]) => <div className="rounded-lg border p-3" key={name}><p className="text-2xl font-semibold">{count}</p><p className="text-muted-foreground capitalize">{name.replace(/([A-Z])/g, ' $1')}</p></div>)}</div>
        <div><h2 className="font-semibold mb-2">Assigned employees · {detail.employeeCount} active</h2>{detail.employeeMemberships.length ? detail.employeeMemberships.map((membership) => <div key={membership.id} className="border-b py-3 flex flex-wrap justify-between gap-2"><div>{membership.employee.name}<p className="text-muted-foreground">{membership.employee.email}</p></div><span>{membership.status.toLowerCase()}</span></div>) : <p>No assigned employees.</p>}</div>
      </div>}
    </DialogContent></Dialog>
  </main>;
}
