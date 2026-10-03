import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ImagePlus, Plus, Star, Trash2, Upload, X } from 'lucide-react'
import { Btn, Card, Col, KV, Select, Textarea, Two, cx } from '../../components/admin/ui'
import { FormField, MoneyInput, Spin, SwitchRow, Switch, TextInput, LoadingBlock, toFormData } from '../../components/admin/form'
import { adminApi } from '../../lib/api'
import { confirm, toast } from '../../lib/alert'
import { useAdminItem, useBrandOptions, useCategoryOptions } from '../../lib/adminQueries'
import { useAdminAuth } from '../../context/AuthContext'

const STATUS = [{ value: 'active', label: 'Active — visible on store' }, { value: 'draft', label: 'Draft' }, { value: 'hidden', label: 'Hidden' }]
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const blank = {
  name: '', slug: '', sku: '', description: '', price: '', compare_price: '', cost: '', category_id: '', brand_id: '',
  status: 'active', is_featured: false, badge: '', is_engravable: false, stock: '0', low_stock_threshold: '5', meta_title: '', meta_description: '',
}
const newVariant = () => ({ key: crypto.randomUUID(), name: '', color_hex: '#5C3A21', sku: '', price: '', stock: '0', is_active: true, image: null })

// API product -> form state
function fromProduct(p) {
  return {
    form: {
      name: p.name, slug: p.slug, sku: p.sku, description: p.description ?? '', price: String(p.price ?? ''), compare_price: p.compare_price ? String(p.compare_price) : '',
      cost: p.cost ? String(p.cost) : '', category_id: String(p.category?.id ?? ''), brand_id: p.brand ? String(p.brand.id) : '', status: p.status ?? 'active',
      is_featured: !!p.is_featured, badge: p.badge ?? '', is_engravable: !!p.is_engravable, stock: String(p.stock ?? 0),
      low_stock_threshold: String(p.low_stock_threshold ?? 5), meta_title: p.meta_title ?? '', meta_description: p.meta_description ?? '',
    },
    variants: (p.variants ?? []).map((v) => ({ key: `v${v.id}`, id: v.id, name: v.name, color_hex: v.color_hex || '#5C3A21', sku: v.sku ?? '', price: v.price != null ? String(v.price) : '', stock: String(v.stock), is_active: v.is_active, image: v.image })),
    images: p.images ?? [],
  }
}

function VariantRow({ v, i, errors, onChange, onRemove }) {
  const err = (f) => errors[`variants.${i}.${f}`]
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    if (!(v.image instanceof File)) { setPreview(null); return }
    const url = URL.createObjectURL(v.image); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [v.image])
  const img = preview || (typeof v.image === 'string' ? v.image : null)
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-aline py-3 last:border-0 md:grid-cols-[auto_1.3fr_1fr_0.8fr_0.7fr_auto_auto]">
      <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-aline bg-asoft" title="Colour photo (optional)">
        {img ? <img src={img} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-amute"><ImagePlus className="size-4" /></span>}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ image: f }); e.target.value = '' }} />
      </label>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input type="color" value={v.color_hex} onChange={(e) => onChange({ color_hex: e.target.value.toUpperCase() })} className="size-9 shrink-0 cursor-pointer rounded-md border border-aline bg-white p-0.5" aria-label="Swatch colour" />
          <TextInput value={v.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Colour name, e.g. Cognac" invalid={!!err('name')} aria-label="Colour name" />
        </div>
        {(err('name') || err('color_hex')) && <p className="text-[11px] text-bad">{err('name') || err('color_hex')}</p>}
        {img && <button type="button" onClick={() => onChange({ image: null, removeImage: !!v.id })} className="text-[11px] text-amute underline">Remove photo</button>}
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove colour" className="mt-2.5 text-amute hover:text-bad md:order-last"><Trash2 className="size-4" /></button>
      <div className="col-span-3 grid grid-cols-3 gap-2 md:col-span-1 md:contents">
        <div className="space-y-1"><TextInput value={v.sku} onChange={(e) => onChange({ sku: e.target.value.toUpperCase() })} placeholder="SKU (optional)" invalid={!!err('sku')} aria-label="Variant SKU" />{err('sku') && <p className="text-[11px] text-bad">{err('sku')}</p>}</div>
        <MoneyInput value={v.price} onChange={(price) => onChange({ price })} placeholder="Same" aria-label="Variant price" />
        <div className="space-y-1"><TextInput value={v.stock} inputMode="numeric" onChange={(e) => onChange({ stock: e.target.value.replace(/\D/g, '') })} invalid={!!err('stock')} aria-label="Variant stock" /></div>
      </div>
      <div className="col-span-3 flex items-center gap-2 text-[11px] text-amute md:col-span-1 md:mt-2.5"><Switch checked={v.is_active} onChange={(is_active) => onChange({ is_active })} label="Colour available" /><span className="md:hidden">Available</span></div>
    </div>
  )
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = useAdminAuth()
  const { data: product, isPending: loadingProduct, error: loadError } = useAdminItem('products', id)
  const { options: catOptions } = useCategoryOptions()
  const { options: brandOptions } = useBrandOptions()

  const [form, setForm] = useState(blank)
  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([]) // saved: [{ id, url }]
  const [newFiles, setNewFiles] = useState([]) // File[]
  const [cover, setCover] = useState(null) // saved image id chosen as cover
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // load the product once into local form state
  const [loadedId, setLoadedId] = useState(null)
  if (product && product.id !== loadedId) {
    const s = fromProduct(product)
    setLoadedId(product.id); setForm(s.form); setVariants(s.variants); setImages(s.images); setCover(s.images[0]?.id ?? null); setSlugTouched(true)
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setName = (name) => set({ name, ...(slugTouched ? {} : { slug: slugify(name) }) })
  const hasVariants = variants.length > 0
  const variantStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
  const price = Number(form.price) || 0
  const cost = Number(form.cost) || 0
  const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null

  const previews = useMemo(() => newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [newFiles])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  const removeSavedImage = async (img) => {
    if (!(await confirm({ title: 'Delete this image?', confirmText: 'Delete', danger: true }))) return
    try {
      await adminApi.del(`/admin/products/${id}/images/${img.id}`)
      setImages((list) => list.filter((x) => x.id !== img.id))
      if (cover === img.id) setCover(null)
      toast.success('Image deleted')
    } catch (e) { toast.error(e.message) }
  }

  const save = async (statusOverride) => {
    setSaving(true)
    setErrors({})
    const status = statusOverride || form.status
    const payload = {
      ...form,
      status,
      brand_id: form.brand_id || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      compare_price: form.compare_price || null,
      cost: form.cost || null,
      stock: hasVariants ? variantStock : Number(form.stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      variants: variants.map((v) => ({ id: v.id, name: v.name.trim(), color_hex: v.color_hex, sku: v.sku || null, price: v.price || null, stock: Number(v.stock) || 0, is_active: v.is_active })),
    }
    try {
      const res = isEdit ? await adminApi.put(`/admin/products/${id}`, payload) : await adminApi.post('/admin/products', payload)
      const saved = res.data
      const pid = saved.id

      // new gallery images, then cover order
      if (newFiles.length) await adminApi.post(`/admin/products/${pid}/images`, toFormData({ images: newFiles }))
      if (isEdit && cover && images[0]?.id !== cover) {
        await adminApi.patch(`/admin/products/${pid}/images/reorder`, { order: [cover, ...images.filter((i) => i.id !== cover).map((i) => i.id)] })
      }

      // colour photos: existing rows keep their id; new rows get ids in the order they were added
      const oldIds = new Set(variants.filter((v) => v.id).map((v) => v.id))
      const createdIds = (saved.variants ?? []).map((v) => v.id).filter((vid) => !oldIds.has(vid))
      let n = 0
      for (const v of variants) {
        const vid = v.id ?? createdIds[n++]
        if (!vid) continue
        if (v.image instanceof File) await adminApi.post(`/admin/products/${pid}/variants/${vid}/image`, toFormData({ image: v.image }))
        else if (v.removeImage && !v.image) await adminApi.del(`/admin/products/${pid}/variants/${vid}/image`)
      }

      qc.invalidateQueries({ queryKey: ['admin'] })
      ;['home', 'products', 'product'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
      setNewFiles([])
      if (isEdit) {
        setLoadedId(null) // reload fresh values from the server
        toast.success('Product saved')
      } else {
        toast.success(status === 'active' ? 'Product published' : 'Draft saved')
        navigate(`/admin/products/${pid}/edit`, { replace: true })
      }
    } catch (e) {
      if (e.status === 422) {
        setErrors(e.fields)
        toast.error('Please fix the highlighted fields.')
      } else toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loadingProduct) return <LoadingBlock rows={8} />
  if (isEdit && loadError) return <div className="rounded-xl border border-aline bg-white p-8 text-center text-[13px] text-amute">{loadError.status === 404 ? 'This product no longer exists.' : loadError.message} <Link to="/admin/products" className="font-semibold text-tan">Back to products</Link></div>

  const canSave = can('products', isEdit ? 'edit' : 'create')
  const buttons = isEdit
    ? <Btn onClick={() => save()} disabled={saving || !canSave}>{saving && <Spin />}Save changes</Btn>
    : <><Btn v="white" onClick={() => save('draft')} disabled={saving || !canSave}>Save draft</Btn><Btn onClick={() => save('active')} disabled={saving || !canSave}>{saving && <Spin />}Publish</Btn></>

  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Products</Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold sm:text-[26px]">{isEdit ? form.name || 'Edit product' : 'Add product'}</h1>
            <p className="mt-1 text-[13px] text-amute">{isEdit ? <>SKU {form.sku} · <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-tan">View on store ↗</a></> : 'Fill in the details — it goes live when you publish.'}</p>
          </div>
          <div className="flex gap-2 max-sm:hidden"><Btn v="white" to="/admin/products">{isEdit ? 'Back' : 'Discard'}</Btn>{buttons}</div>
        </div>
      </div>

      <Two ratio="main">
        <Col>
          <Card title="General">
            <FormField label="Product name *" error={errors.name}><TextInput value={form.name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} /></FormField>
            <FormField label="Description" error={errors.description} help="Shown on the product page. Line breaks are kept.">
              <Textarea rows={6} value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </FormField>
          </Card>

          <Card title="Media" sub="First image is the cover · JPG, PNG or WebP · max 4 MB each">
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {images.map((img) => (
                <div key={img.id} className={cx('relative aspect-square overflow-hidden rounded-lg', cover === img.id && 'ring-2 ring-tan ring-offset-2')}>
                  <button type="button" onClick={() => setCover(img.id)} className="size-full" aria-label="Use as cover"><img src={img.url} alt="" className="size-full object-cover" /></button>
                  {cover === img.id && <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">Cover</span>}
                  <button type="button" onClick={() => removeSavedImage(img)} className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white text-ink shadow" aria-label="Delete image"><X className="size-3" /></button>
                </div>
              ))}
              {previews.map((p, i) => (
                <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={p.url} alt="" className="size-full object-cover opacity-90" />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-tan px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>
                  <button type="button" onClick={() => setNewFiles((l) => l.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white text-ink shadow" aria-label="Remove image"><X className="size-3" /></button>
                </div>
              ))}
              {images.length + newFiles.length < 10 && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-tan/60 bg-asoft/60 text-center text-tan">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => {
                    const picked = Array.from(e.target.files || []) // read before clearing the input below
                    setNewFiles((l) => [...l, ...picked].slice(0, 10 - images.length))
                    e.target.value = ''
                  }} />
                  <span className="space-y-1"><Upload className="mx-auto size-4" /><span className="block text-[11px] font-semibold sm:text-xs">Add images</span></span>
                </label>
              )}
            </div>
            {(errors.images || errors['images.0']) && <p className="text-[11px] text-bad">{errors.images || errors['images.0']}</p>}
          </Card>

          <Card title="Pricing" sub="During a flash sale the store shows the sale price automatically">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <FormField label="Price *" error={errors.price}><MoneyInput value={form.price} onChange={(v) => set({ price: v })} invalid={!!errors.price} /></FormField>
              <FormField label="Compare-at price" error={errors.compare_price} help="Shown struck through"><MoneyInput value={form.compare_price} onChange={(v) => set({ compare_price: v })} /></FormField>
              <FormField label="Cost per item" error={errors.cost} help={margin != null ? `Margin ${margin}% · Profit ৳${(price - cost).toLocaleString('en-IN')}` : 'Only staff see this'}><MoneyInput value={form.cost} onChange={(v) => set({ cost: v })} /></FormField>
            </div>
          </Card>

          <Card title="Colours" sub={hasVariants ? `Stock is the total of all colours (${variantStock})` : 'Optional — add colour options with their own stock and photo'}
            right={<Btn v="white" sm icon={Plus} type="button" onClick={() => setVariants((l) => [...l, newVariant()])}>Add colour</Btn>}>
            {hasVariants ? (
              <div>
                <div className="hidden grid-cols-[auto_1.3fr_1fr_0.8fr_0.7fr_auto_auto] gap-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-amute md:grid">
                  <span className="w-11">Photo</span><span>Colour</span><span>SKU</span><span>Price</span><span>Stock</span><span>On</span><span className="w-4" />
                </div>
                {variants.map((v, i) => (
                  <VariantRow key={v.key} v={v} i={i} errors={errors}
                    onChange={(patch) => setVariants((l) => l.map((x) => (x.key === v.key ? { ...x, ...patch } : x)))}
                    onRemove={() => setVariants((l) => l.filter((x) => x.key !== v.key))} />
                ))}
              </div>
            ) : <p className="text-[13px] text-amute">No colours — the product is sold as one item with the stock set under Inventory.</p>}
          </Card>

          <Card title="Search engine listing">
            <div className="rounded-lg bg-asoft p-3.5">
              <p className="truncate text-[11px] text-ok">xerqo.com › product › {form.slug || 'product-url'}</p>
              <p className="mt-0.5 truncate text-[15px] font-semibold text-info">{form.meta_title || `${form.name || 'Product name'} | XERQO`}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-amute">{form.meta_description || form.description || 'Product description shown in Google results.'}</p>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <FormField label="Meta title" error={errors.meta_title}><TextInput value={form.meta_title} onChange={(e) => set({ meta_title: e.target.value })} placeholder={`${form.name || 'Product'} | XERQO`} /></FormField>
              <FormField label="URL handle" error={errors.slug}><TextInput value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }) }} invalid={!!errors.slug} /></FormField>
            </div>
            <FormField label="Meta description" error={errors.meta_description}><Textarea rows={2} maxLength={500} value={form.meta_description} onChange={(e) => set({ meta_description: e.target.value })} /></FormField>
          </Card>
        </Col>

        <Col>
          <Card title="Status">
            <FormField label="Visibility" error={errors.status}><Select options={STATUS} search={false} value={form.status} onChange={(status) => set({ status })} /></FormField>
            <SwitchRow label="Featured product" sub="Shown first in the shop and search" checked={form.is_featured} onChange={(is_featured) => set({ is_featured })} />
            {isEdit && product && <div className="space-y-2.5 border-t border-aline pt-3"><KV k="Rating" v={product.reviews_count ? `${product.rating} ★ · ${product.reviews_count} reviews` : 'No reviews yet'} /><KV k="Created" v={new Date(product.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} /></div>}
          </Card>

          <Card title="Organisation">
            <FormField label="Category *" error={errors.category_id}><Select options={catOptions} placeholder="Choose a category" value={form.category_id} onChange={(category_id) => set({ category_id })} invalid={!!errors.category_id} /></FormField>
            <FormField label="Brand" error={errors.brand_id}><Select options={brandOptions} placeholder="No brand" allowClear value={form.brand_id} onChange={(brand_id) => set({ brand_id })} /></FormField>
            <FormField label="Badge" error={errors.badge} help="Small label on the product photo, e.g. New, Best seller"><TextInput value={form.badge} maxLength={40} onChange={(e) => set({ badge: e.target.value })} /></FormField>
          </Card>

          <Card title="Inventory">
            <FormField label="SKU *" error={errors.sku}><TextInput value={form.sku} onChange={(e) => set({ sku: e.target.value.toUpperCase() })} invalid={!!errors.sku} placeholder="XQ-0001" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Stock" error={errors.stock} help={hasVariants ? 'Total of colours' : isEdit ? 'Or use Inventory to log a reason' : undefined}>
                <TextInput value={hasVariants ? String(variantStock) : form.stock} disabled={hasVariants} inputMode="numeric" onChange={(e) => set({ stock: e.target.value.replace(/\D/g, '') })} />
              </FormField>
              <FormField label="Low-stock alert at" error={errors.low_stock_threshold}><TextInput value={form.low_stock_threshold} inputMode="numeric" onChange={(e) => set({ low_stock_threshold: e.target.value.replace(/\D/g, '') })} /></FormField>
            </div>
          </Card>

          <Card title="Personalisation">
            <SwitchRow label="Allow name engraving" sub="Character limit and fee are set in Settings" checked={form.is_engravable} onChange={(is_engravable) => set({ is_engravable })} />
          </Card>

          {form.is_featured && <p className="flex items-center gap-1.5 px-1 text-[11px] text-amute"><Star className="size-3 fill-amber text-amber" />Featured products appear first in the shop.</p>}
        </Col>
      </Two>

      {/* Mobile action bar, sits above the bottom tabs */}
      <div className="sticky bottom-[72px] z-20 -mx-4 grid grid-cols-2 gap-2.5 border-t border-aline bg-white px-4 py-3 sm:hidden">
        {isEdit ? <><Btn v="white" to="/admin/products">Back</Btn>{buttons}</> : buttons}
      </div>
    </>
  )
}
