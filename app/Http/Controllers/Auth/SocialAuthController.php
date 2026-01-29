<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

            // Use transaction to prevent race conditions
            $user = DB::transaction(function () use ($googleUser) {
                // Check if user already exists with this email (with lock)
                $user = User::where('email', $googleUser->getEmail())->lockForUpdate()->first();

                if ($user) {
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

                    return $user;
                }

                // Create new user
                return User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(24)), // Random password for OAuth users
                    'email_verified_at' => now(), // Google emails are verified
                    'verified_via' => 'google',
                    'role' => 'customer',
                ]);
            });

            Auth::login($user, true);

            return redirect()->intended('/');
        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'Unable to login with Google. Please try again.');
        }
    }
}
