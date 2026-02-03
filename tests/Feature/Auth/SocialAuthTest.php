<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    protected function mockSocialiteUser(array $data = []): SocialiteUser
    {
        $user = Mockery::mock(SocialiteUser::class);
        $user->shouldReceive('getId')->andReturn($data['id'] ?? '123456789');
        $user->shouldReceive('getName')->andReturn($data['name'] ?? 'Test User');
        $user->shouldReceive('getEmail')->andReturn($data['email'] ?? 'test@example.com');
        $user->shouldReceive('getAvatar')->andReturn($data['avatar'] ?? 'https://lh3.googleusercontent.com/a/default-user');

        return $user;
    }

    public function test_google_redirect_route_exists(): void
    {
        $response = $this->get('/auth/google');

        // Should redirect to Google OAuth
        $response->assertRedirect();
    }

    public function test_google_oauth_creates_new_user(): void
    {
        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'newuser@example.com',
            'name' => 'New Google User',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $response = $this->get('/auth/google/callback');

        // Should create user and redirect
        $response->assertRedirect('/');

        // Verify user was created
        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'name' => 'New Google User',
            'verified_via' => 'google',
        ]);

        // Verify user is authenticated
        $this->assertAuthenticated();
    }

    public function test_google_oauth_sets_verified_via_to_google(): void
    {
        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'googleuser@example.com',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        $user = User::where('email', 'googleuser@example.com')->first();

        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('google', $user->verified_via);
    }

    public function test_google_oauth_sets_role_to_customer(): void
    {
        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'customer@example.com',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        $user = User::where('email', 'customer@example.com')->first();

        $this->assertEquals('customer', $user->role);
    }

    public function test_google_oauth_logs_in_existing_unverified_user(): void
    {
        // Create existing unverified user
        $existingUser = User::factory()->unverified()->create([
            'email' => 'existing@example.com',
        ]);

        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'existing@example.com',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        // User should now be verified via Google
        $existingUser->refresh();
        $this->assertNotNull($existingUser->email_verified_at);
        $this->assertEquals('google', $existingUser->verified_via);
    }

    public function test_google_oauth_preserves_existing_avatar(): void
    {
        // Create user with custom avatar
        $existingUser = User::factory()->create([
            'email' => 'hasavatar@example.com',
            'avatar' => 'custom-avatar.jpg',
        ]);

        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'hasavatar@example.com',
            'avatar' => 'https://google.com/new-avatar.jpg',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        // Avatar should not be overwritten
        $existingUser->refresh();
        $this->assertEquals('custom-avatar.jpg', $existingUser->avatar);
    }

    public function test_google_oauth_sets_avatar_for_user_without_one(): void
    {
        // Create user without avatar
        $existingUser = User::factory()->create([
            'email' => 'noavatar@example.com',
            'avatar' => null,
        ]);

        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'noavatar@example.com',
            'avatar' => 'https://google.com/avatar.jpg',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        // Avatar should be set from Google
        $existingUser->refresh();
        $this->assertEquals('https://google.com/avatar.jpg', $existingUser->avatar);
    }

    public function test_google_oauth_does_not_override_verified_email_user(): void
    {
        // Create user already verified via email
        $existingUser = User::factory()->verifiedViaEmail()->create([
            'email' => 'emailverified@example.com',
        ]);

        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'emailverified@example.com',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        // User should still be verified via email (not changed to google)
        $existingUser->refresh();
        $this->assertEquals('email', $existingUser->verified_via);
    }

    public function test_google_oauth_handles_invalid_state_gracefully(): void
    {
        Socialite::shouldReceive('driver->user')
            ->andThrow(new \Laravel\Socialite\Two\InvalidStateException('Invalid state'));

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect('/login');
        $response->assertSessionHas('error');
        $this->assertGuest();
    }

    public function test_google_oauth_handles_general_exception_gracefully(): void
    {
        Socialite::shouldReceive('driver->user')
            ->andThrow(new \Exception('Something went wrong'));

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect('/login');
        $response->assertSessionHas('error');
        $this->assertGuest();
    }

    public function test_admin_cannot_be_created_via_google_oauth(): void
    {
        // Even if somehow the email matches an admin pattern, new users are always customers
        $socialiteUser = $this->mockSocialiteUser([
            'email' => 'admin-wannabe@example.com',
            'name' => 'Admin Wannabe',
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);

        $this->get('/auth/google/callback');

        $user = User::where('email', 'admin-wannabe@example.com')->first();

        // Should always be customer, never admin
        $this->assertEquals('customer', $user->role);
    }
}
