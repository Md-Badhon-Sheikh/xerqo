import { Link } from 'react-router-dom'
import { ExternalLink, FileText, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Btn, Card, PageHead } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock } from '../../components/admin/form'
import { ago } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { confirmAndRun, toast } from '../../lib/alert'
import { adminApi } from '../../lib/api'
import { useAdminList } from '../../lib/adminQueries'
import { useQueryClient } from '@tanstack/react-query'

/* Admin › Pages: the store's own pages (policies, FAQ, gifting…) shown at /pages/{slug} */
export default function AdminSitePages() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const { data, isPending } = useAdminList('site-pages')
  const pages = data?.data ?? []

  const remove = (p) => confirmAndRun(
    { title: `Delete “${p.title}”?`, text: 'The page and its address stop working. Remove its footer link too (About · Contact · Footer → Footer).', confirmText: 'Delete', danger: true },
    async () => {
      await adminApi.del(`/admin/site-pages/${p.id}`)
      qc.invalidateQueries({ queryKey: ['admin', 'site-pages'] })
      toast.success('Page deleted')
    },
  )

  return (
    <>
      <PageHead
        title="Pages"
        sub="Policies, FAQ and any other page of your own · shown at /pages/…"
        actions={can('content', 'create') && <Btn icon={Plus} to="/admin/site-pages/new">New page</Btn>}
      />
      <Card pad={false}>
        {isPending ? <div className="p-4"><LoadingBlock /></div> : !pages.length ? (
          <div className="p-4"><EmptyBlock title="No pages yet" text="Create a page for your policies, FAQ, size guide…" action={can('content', 'create') && <Btn sm icon={Plus} to="/admin/site-pages/new">New page</Btn>} /></div>
        ) : (
          <ul className="divide-y divide-aline">
            {pages.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-asoft text-amute">{p.type === 'faq' ? <HelpCircle className="size-[17px]" /> : <FileText className="size-[17px]" />}</span>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/site-pages/${p.id}`} className="block truncate text-[13px] font-semibold hover:text-tan">{p.title}</Link>
                  <p className="truncate text-[11px] text-amute">{p.url} · updated {ago(p.updated_at)}</p>
                </div>
                <span className="flex gap-1.5">
                  {p.type === 'faq' && <Badge tone="blue">FAQ</Badge>}
                  <Badge tone={p.is_published ? 'green' : 'gray'}>{p.is_published ? 'Published' : 'Hidden'}</Badge>
                </span>
                <span className="flex gap-1">
                  {p.is_published && <a href={p.url} target="_blank" rel="noreferrer" title="View on the website" className="grid size-8 place-items-center rounded-md text-amute hover:bg-asoft hover:text-ink"><ExternalLink className="size-4" /></a>}
                  <Link to={`/admin/site-pages/${p.id}`} title="Edit" className="grid size-8 place-items-center rounded-md text-amute hover:bg-asoft hover:text-ink"><Pencil className="size-4" /></Link>
                  {can('content', 'delete') && <button type="button" onClick={() => remove(p)} title="Delete" className="grid size-8 place-items-center rounded-md text-amute hover:bg-asoft hover:text-bad"><Trash2 className="size-4" /></button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-amute">The About page, Contact page and footer have their own editor: <Link to="/admin/pages" className="font-semibold text-tan">About · Contact · Footer</Link>. To show a page in the footer, add its address there.</p>
    </>
  )
}
