<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Permission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(): Response
    {
        $members = User::whereIn('role', ['admin', 'editor'])
            ->orderByRaw("FIELD(role, 'admin', 'editor')")
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at', 'email_verified_at']);

        return Inertia::render('Admin/Team/Index', [
            'members' => $members->map(fn (User $u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'verified'   => $u->email_verified_at !== null,
                'created_at' => $u->created_at->toDateString(),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Team/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'role'  => ['required', 'in:admin,editor'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'role'              => $validated['role'],
            'password'          => Hash::make($validated['password']),
            'email_verified_at' => now(),
            'permissions'       => $validated['role'] === 'editor' ? Permission::DEFAULTS : null,
        ]);

        return redirect()->route('admin.team.index')
            ->with('success', "{$user->name} added to the team.");
    }

    public function edit(User $team): Response
    {
        abort_if($team->isCustomer(), 404);

        return Inertia::render('Admin/Team/Edit', [
            'member' => [
                'id'    => $team->id,
                'name'  => $team->name,
                'email' => $team->email,
                'role'  => $team->role,
            ],
        ]);
    }

    public function update(Request $request, User $team): RedirectResponse
    {
        abort_if($team->isCustomer(), 404);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', "unique:users,email,{$team->id}"],
            'role'     => ['required', 'in:admin,editor'],
            'password' => ['nullable', Password::defaults(), 'confirmed'],
        ]);

        $data = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
            'role'  => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        if ($validated['role'] === 'editor' && $team->permissions === null) {
            $data['permissions'] = Permission::DEFAULTS;
        }

        $team->update($data);

        return redirect()->route('admin.team.index')
            ->with('success', "{$team->name} updated.");
    }

    public function destroy(User $team): RedirectResponse
    {
        abort_if($team->isCustomer(), 404);
        abort_if($team->id === auth()->id(), 403, 'You cannot delete your own account.');

        $name = $team->name;
        $team->delete();

        return redirect()->route('admin.team.index')
            ->with('success', "{$name} removed from the team.");
    }
}
