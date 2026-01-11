<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
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

            // Check if user already exists with this email
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Update avatar if not set and Google provides one
                if (!$user->avatar && $googleUser->getAvatar()) {
                    $user->update(['avatar' => null]); // We could download and save the avatar
                }

                Auth::login($user, true);
            } else {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(Str::random(24)), // Random password for OAuth users
                    'email_verified_at' => now(), // Google emails are verified
                    'role' => 'customer',
                ]);

                Auth::login($user, true);
            }

            return redirect()->intended('/');
        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'Unable to login with Google. Please try again.');
        }
    }
}
