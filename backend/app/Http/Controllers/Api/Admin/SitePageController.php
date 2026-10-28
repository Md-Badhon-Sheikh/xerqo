<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Support\Html;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Admin → Pages: create and edit the store's own pages (policies, FAQ, gifting…), shown at /pages/{slug}.
 */
class SitePageController extends Controller
{
    /**
     * GET /api/admin/site-pages
     */
    public function index(): JsonResponse
    {
        $pages = Page::orderBy('sort_order')->orderBy('title')->get(['id', 'title', 'slug', 'type', 'is_published', 'sort_order', 'updated_at']);

        return response()->json(['data' => $pages->map(fn (Page $p) => [
            ...$p->only(['id', 'title', 'slug', 'type', 'is_published', 'sort_order']),
            'url' => '/pages/'.$p->slug,
            'updated_at' => $p->updated_at?->toIso8601String(),
        ])]);
    }

    public function show(Page $page): JsonResponse
    {
        return response()->json(['data' => $page->toPublicArray()]);
    }

    public function store(Request $request): JsonResponse
    {
        $page = Page::create([...$this->validated($request), 'sort_order' => (int) Page::max('sort_order') + 1]);

        return response()->json(['data' => $page->toPublicArray()], 201);
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $page->update($this->validated($request, $page));

        return response()->json(['data' => $page->fresh()->toPublicArray()]);
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Page $page = null): array
    {
        $request->merge(['slug' => Str::slug((string) ($request->input('slug') ?: $request->input('title')))]);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('pages', 'slug')->ignore($page?->id)],
            'type' => ['required', Rule::in([Page::TYPE_PAGE, Page::TYPE_FAQ])],
            'content' => ['nullable', 'string', 'max:100000'],
            'faqs' => ['nullable', 'array', 'max:200'],
            'faqs.*.group' => ['nullable', 'string', 'max:60'],
            'faqs.*.question' => ['required', 'string', 'max:300'],
            'faqs.*.answer' => ['required', 'string', 'max:3000'],
            'meta_title' => ['nullable', 'string', 'max:70'],
            'meta_description' => ['nullable', 'string', 'max:170'],
            'is_published' => ['required', 'boolean'],
        ], [
            'slug.unique' => 'Another page already uses this address.',
            'slug.required' => 'Enter a title or a page address.',
            'faqs.*.question.required' => 'Required.',
            'faqs.*.answer.required' => 'Required.',
        ]);

        return [
            ...$data,
            'content' => $data['type'] === Page::TYPE_PAGE ? Html::clean($data['content'] ?? null) : null,
            'faqs' => $data['type'] === Page::TYPE_FAQ
                ? array_values(array_map(fn ($f) => [
                    'group' => trim((string) ($f['group'] ?? '')) ?: null,
                    'question' => trim($f['question']),
                    'answer' => trim($f['answer']),
                ], $data['faqs'] ?? []))
                : null,
        ];
    }
}
