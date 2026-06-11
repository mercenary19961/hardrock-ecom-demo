<?php

namespace Tests\Unit\Payments;

use App\Services\Payments\Tamara\TamaraClient;
use Tests\TestCase;

class TamaraClientTest extends TestCase
{
    private string $token = 'notification-secret';

    private function client(): TamaraClient
    {
        return new TamaraClient(
            apiToken: 'api-token',
            notificationToken: $this->token,
            baseUrl: 'https://api-sandbox.tamara.co',
        );
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function makeJwt(array $payload = [], ?string $signingKey = null, string $alg = 'HS256'): string
    {
        $signingKey ??= $this->token;
        $header = $this->base64Url(json_encode(['alg' => $alg, 'typ' => 'JWT']));
        $body = $this->base64Url(json_encode($payload));
        $signature = $this->base64Url(hash_hmac('sha256', "{$header}.{$body}", $signingKey, true));

        return "{$header}.{$body}.{$signature}";
    }

    public function test_accepts_a_correctly_signed_token(): void
    {
        $jwt = $this->makeJwt(['order_id' => 'abc', 'exp' => time() + 600]);

        $this->assertTrue($this->client()->verifyNotificationToken($jwt));
    }

    public function test_rejects_a_token_signed_with_the_wrong_key(): void
    {
        $jwt = $this->makeJwt(['order_id' => 'abc'], signingKey: 'attacker-key');

        $this->assertFalse($this->client()->verifyNotificationToken($jwt));
    }

    public function test_rejects_an_expired_token(): void
    {
        $jwt = $this->makeJwt(['order_id' => 'abc', 'exp' => time() - 10]);

        $this->assertFalse($this->client()->verifyNotificationToken($jwt));
    }

    public function test_rejects_a_non_hs256_token(): void
    {
        $jwt = $this->makeJwt(['order_id' => 'abc'], alg: 'none');

        $this->assertFalse($this->client()->verifyNotificationToken($jwt));
    }

    public function test_rejects_null_or_malformed_tokens(): void
    {
        $client = $this->client();

        $this->assertFalse($client->verifyNotificationToken(null));
        $this->assertFalse($client->verifyNotificationToken('not-a-jwt'));
        $this->assertFalse($client->verifyNotificationToken('a.b'));
    }
}
