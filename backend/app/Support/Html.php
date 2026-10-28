<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Cleans rich text from the admin page editor: keeps simple formatting (headings, paragraphs, lists, bold,
 * italic, underline, links, quotes) and drops every other tag, attribute, script and style.
 */
class Html
{
    // tag => attributes it may keep
    private const ALLOWED = [
        'p' => [], 'br' => [], 'h2' => [], 'h3' => [], 'h4' => [], 'strong' => [], 'b' => [], 'em' => [], 'i' => [],
        'u' => [], 'ul' => [], 'ol' => [], 'li' => [], 'blockquote' => [], 'hr' => [], 'a' => ['href'],
    ];

    // removed together with everything inside them
    private const DROP = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'svg', 'math', 'template', 'noscript', 'head', 'title', 'meta', 'link'];

    public static function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $doc = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8"><div id="root">'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $doc->getElementById('root');
        if (! $root) {
            return null;
        }
        self::walk($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $doc->saveHTML($child);
        }
        $out = trim($out);

        return strip_tags($out) === '' && ! str_contains($out, '<hr') ? null : $out;
    }

    private static function walk(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child->nodeType === XML_COMMENT_NODE || $child->nodeType === XML_PI_NODE) {
                $node->removeChild($child);

                continue;
            }
            if (! $child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);
            if (in_array($tag, self::DROP, true)) {
                $node->removeChild($child);

                continue;
            }

            self::walk($child);

            if (! array_key_exists($tag, self::ALLOWED)) {
                // keep the text, lose the tag (e.g. <span>, <div>, <font>)
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);

                continue;
            }

            foreach (iterator_to_array($child->attributes) as $attr) {
                if (! in_array(strtolower($attr->name), self::ALLOWED[$tag], true)) {
                    $child->removeAttribute($attr->name);
                }
            }

            if ($tag === 'a') {
                $href = trim($child->getAttribute('href'));
                if (! self::safeLink($href)) {
                    $child->removeAttribute('href');
                }
            }
        }
    }

    // http(s), mailto, tel, site paths and #anchors only — never javascript: or data:
    private static function safeLink(string $href): bool
    {
        return $href !== '' && (bool) preg_match('#^(https?://|mailto:|tel:|/(?!/)|\#)#i', $href);
    }
}
