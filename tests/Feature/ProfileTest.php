<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile/update', [
                'name' => 'Updated Name',
                'phone' => '1234567890',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $user->refresh();

        $this->assertSame('Updated Name', $user->name);
        $this->assertSame('1234567890', $user->phone);
    }

    public function test_profile_name_is_required(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile/update', [
                'name' => '',
            ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_phone_can_be_null(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['phone' => '1234567890']);

        $response = $this
            ->actingAs($user)
            ->patch('/profile/update', [
                'name' => $user->name,
                'phone' => null,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertNull($user->fresh()->phone);
    }

    public function test_password_can_be_updated(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile/password', [
                'current_password' => 'password',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();
    }

    public function test_password_update_requires_current_password(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile/password', [
                'current_password' => 'wrong-password',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertSessionHasErrors('current_password');
    }

    public function test_user_can_delete_their_account(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        // User model uses SoftDeletes, so check for soft delete
        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_verification_status_is_preserved_after_profile_update(): void
    {
        // Profile update (name/phone) should NOT affect verification status
        /** @var User $user */
        $user = User::factory()->verifiedViaEmail()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile/update', [
                'name' => 'New Name',
                'phone' => '9876543210',
            ]);

        $response->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('email', $user->verified_via);
    }

    public function test_google_verified_user_keeps_status_after_profile_update(): void
    {
        /** @var User $user */
        $user = User::factory()->verifiedViaGoogle()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile/update', [
                'name' => 'New Name',
            ]);

        $response->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('google', $user->verified_via);
    }
}
