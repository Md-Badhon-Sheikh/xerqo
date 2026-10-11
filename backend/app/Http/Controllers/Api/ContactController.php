<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Services\AdminNotifier;
use App\Support\Media;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContactController extends Controller
{
    /**
     * POST /api/contact (multipart) — the "Send us a message" form on the Contact page.
     */
    public function store(Request $request): JsonResponse
    {
        $request->merge(['phone' => Phone::normalize($request->input('phone'))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'regex:'.Phone::REGEX],
            'subject' => ['nullable', 'string', 'max:60'],
            'order_number' => ['nullable', 'string', 'max:30'],
            'message' => ['required', 'string', 'min:5', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'phone.regex' => 'Enter a valid mobile number like 01712345678.',
        ]);

        $message = ContactMessage::create([
            ...collect($data)->except('photo')->all(),
            'user_id' => $request->user('sanctum')?->id,
            'attachment' => $request->hasFile('photo') ? Media::store($request->file('photo'), 'messages') : null,
            'ip' => $request->ip(),
        ]);

        app(AdminNotifier::class)->notify(
            'contact',
            "Message from {$message->name}",
            ($message->subject ? "{$message->subject} · " : '').Str::limit($message->message, 80),
            '/admin/messages',
        );

        return response()->json(['message' => 'Thanks! We got your message and will get back to you soon.'], 201);
    }
}
