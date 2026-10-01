<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base class for admin form requests. Access control is done by the "admin:{module}" route
 * middleware; this class adds helpers for multipart/form-data payloads.
 */
abstract class AdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isStaff();
    }

    protected function isUpdate(): bool
    {
        return $this->isMethod('PUT') || $this->isMethod('PATCH');
    }

    /**
     * Multipart forms send booleans as "true"/"false"/"on" strings; convert them to real booleans.
     *
     * @param  array<int, string>  $keys
     */
    protected function normalizeBooleans(array $keys): void
    {
        $data = [];

        foreach ($keys as $key) {
            if ($this->has($key) && is_string($this->input($key))) {
                $value = filter_var($this->input($key), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($value !== null) {
                    $data[$key] = $value;
                }
            }
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    /**
     * Turn empty strings into null for optional fields sent by HTML forms.
     *
     * @param  array<int, string>  $keys
     */
    protected function emptyToNull(array $keys): void
    {
        $data = [];

        foreach ($keys as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $data[$key] = null;
            }
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }
}
