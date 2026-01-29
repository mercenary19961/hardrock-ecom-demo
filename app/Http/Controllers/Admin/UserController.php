<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        // Get counts for tabs
        $roleCounts = [
            'all' => User::count(),
            'admin' => User::where('role', 'admin')->count(),
            'customer' => User::where('role', 'customer')->count(),
        ];

        // Pagination
        $perPage = $request->input('per_page', 15);
        $users = $query->orderBy('created_at', 'desc')
                       ->paginate($perPage)
                       ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'per_page']),
            'roleCounts' => $roleCounts,
        ]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->validated());

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function sendResetEmail(User $user)
    {
        // Send the password reset link
        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('success', 'Password reset link sent to ' . $user->email);
        }

        return back()->withErrors(['email' => __($status)]);
    }

    public function sendVerificationEmail(User $user)
    {
        if ($user->hasVerifiedEmail()) {
            return back()->with('info', 'This user\'s email is already verified.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Verification email sent to ' . $user->email);
    }

    public function destroy(User $user)
    {
        // Prevent deleting admins
        if ($user->isAdmin()) {
            return back()->withErrors(['error' => 'Admin users cannot be deleted.']);
        }

        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot delete yourself.']);
        }

        $user->delete(); // Soft delete

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }
}
