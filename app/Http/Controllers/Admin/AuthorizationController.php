<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Permission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuthorizationController extends Controller
{
    public function index(): Response
    {
        $editors = User::where('role', 'editor')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'permissions', 'created_at']);

        return Inertia::render('Admin/Authorization/Index', [
            'editors' => $editors->map(fn (User $u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'created_at'  => $u->created_at->toDateString(),
                'permissions' => $u->resolvedPermissions(),
            ]),
            'schema'   => Permission::SCHEMA,
            'defaults' => Permission::DEFAULTS,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_if(! $user->isEditor(), 403, 'Only editor permissions can be managed here.');

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
        ]);

        // Sanitize: only allow keys defined in the schema
        $clean = [];
        foreach (Permission::SCHEMA as $section => $actions) {
            foreach ($actions as $action) {
                $clean[$section][$action] = (bool) ($validated['permissions'][$section][$action] ?? false);
            }
        }

        $user->update(['permissions' => $clean]);

        return back()->with('success', "{$user->name}'s permissions updated.");
    }
}
