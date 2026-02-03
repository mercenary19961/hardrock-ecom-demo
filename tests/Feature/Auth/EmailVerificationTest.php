<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/verify-email');

        $response->assertStatus(200);
    }

    public function test_email_can_be_verified(): void
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    }

    public function test_email_verification_sets_verified_via_to_email(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $this->actingAs($user)->get($verificationUrl);

        $user->refresh();
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertEquals('email', $user->verified_via);
    }

    public function test_email_is_not_verified_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')]
        );

        $this->actingAs($user)->get($verificationUrl);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_already_verified_user_is_redirected(): void
    {
        $user = User::factory()->verifiedViaEmail()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    }

    public function test_google_verified_user_keeps_google_verification_status(): void
    {
        // User verified via Google should retain that status
        $user = User::factory()->verifiedViaGoogle()->create();

        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertEquals('google', $user->verified_via);
    }

    public function test_verification_notification_can_be_resent(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)
            ->post('/email/verification-notification');

        $response->assertSessionHas('status', 'verification-link-sent');
    }

    public function test_verification_notification_is_throttled(): void
    {
        $user = User::factory()->unverified()->create();

        // Make 6 requests (rate limit is 6 per minute)
        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($user)->post('/email/verification-notification');
        }

        // 7th request should be throttled
        $response = $this->actingAs($user)->post('/email/verification-notification');
        $response->assertStatus(429); // Too Many Requests
    }

    public function test_session_is_regenerated_after_verification(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $sessionIdBefore = session()->getId();

        $this->actingAs($user)->get($verificationUrl);

        // Session should be regenerated (security measure)
        $this->assertNotEquals($sessionIdBefore, session()->getId());
    }
}
