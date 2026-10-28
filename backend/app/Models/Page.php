<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A page of the store's own (Admin → Pages): shown at /pages/{slug}.
 * type "page" has rich text content (sanitised HTML); type "faq" has a list of questions.
 */
class Page extends Model
{
    public const TYPE_PAGE = 'page';

    public const TYPE_FAQ = 'faq';

    protected $fillable = [
        'title',
        'slug',
        'type',
        'content',
        'faqs',
        'meta_title',
        'meta_description',
        'is_published',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'faqs' => 'array',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'type' => $this->type,
            'content' => $this->content,
            'faqs' => $this->faqs ?? [],
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'is_published' => $this->is_published,
            'sort_order' => $this->sort_order,
            'url' => '/pages/'.$this->slug,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
