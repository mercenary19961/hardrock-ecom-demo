<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = $this->findOrCreateUser($googleUser);

            Auth::login($user, true);

            return redirect()->intended('/');
        } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
            Log::warning('Google OAuth invalid state', ['error' => $e->getMessage()]);
            return redirect('/login')->with('error', 'Authentication session expired. Please try again.');
        } catch (\Exception $e) {
            Log::error('Google OAuth error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect('/login')->with('error', 'Unable to login with Google. Please try again.');
        }
    }

    /**
     * Find existing user or create new one from Google data.
     */
    private function findOrCreateUser($googleUser): User
    {
        return DB::transaction(function () use ($googleUser) {
            // Check if user already exists with this email (with lock)
            $user = User::where('email', $googleUser->getEmail())->lockForUpdate()->first();

            if ($user) {
                $this->updateExistingUser($user, $googleUser);
                return $user;
            }

            // Create new user - handle race condition with retry
            try {
                return User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(24)),
                    'email_verified_at' => now(),
                    'verified_via' => 'google',
                    'role' => 'customer',
                ]);
            } catch (QueryException $e) {
                // Unique constraint violation - user was created by concurrent request
                if ($e->errorInfo[1] === 1062) {
                    $user = User::where('email', $googleUser->getEmail())->first();
                    if ($user) {
                        $this->updateExistingUser($user, $googleUser);
                        return $user;
                    }
                }
                throw $e;
            }
        });
    }

    /**
     * Update existing user with Google data if needed.
     */
    private function updateExistingUser(User $user, $googleUser): void
    {
        $updates = [];

        // Update avatar if not set and Google provides one
        if (!$user->avatar && $googleUser->getAvatar()) {
            $updates['avatar'] = $googleUser->getAvatar();
        }

        // Sync verification status - Google emails are verified
        if (!$user->hasVerifiedEmail()) {
            $updates['email_verified_at'] = now();
            $updates['verified_via'] = 'google';
        }

        if (!empty($updates)) {
            $user->update($updates);
        }
    }
}
