<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EditorSensitiveActionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $editorName,
        public readonly string $action,
        public readonly string $subject,
        public readonly ?string $url = null,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable->wantsNotification('email', 'editor_sensitive_action')) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'editor_sensitive_action',
            'title'   => "Editor action: {$this->action}",
            'body'    => "{$this->editorName} {$this->action}: {$this->subject}",
            'url'     => $this->url,
            'editor'  => $this->editorName,
            'action'  => $this->action,
            'subject' => $this->subject,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Editor Action: {$this->action}")
            ->greeting('Admin alert')
            ->line("{$this->editorName} performed a sensitive action: **{$this->action}**")
            ->line("Affected: {$this->subject}");

        if ($this->url) {
            $mail->action('View', url($this->url));
        }

        return $mail;
    }
}
