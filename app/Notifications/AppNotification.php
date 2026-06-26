<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Services\TwilioService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * G13: General-purpose app notification.
 * Fires via mail (always), database (for in-app bell), and WhatsApp (if phone is present).
 *
 * Usage:
 *   $user->notify(new AppNotification(
 *       subject: 'Payment Received',
 *       body: 'We received your lease payment of ₦35,000. Thank you!',
 *       level: 'success', // info | success | warning | error
 *   ));
 */
class AppNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $subject,
        public readonly string $body,
        public readonly string $level = 'info',
        public readonly ?string $actionText = null,
        public readonly ?string $actionUrl = null,
    ) {}

    /**
     * @return array<string>
     */
    public function via(mixed $notifiable): array
    {
        $channels = ['mail', 'database'];

        // Only add WhatsApp channel if the user has a phone number
        if (! empty($notifiable->phone)) {
            $channels[] = WhatsAppChannel::class;
        }

        return $channels;
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->subject)
            ->line($this->body)
            ->greeting("Hello {$notifiable->name},");

        if ($this->actionText && $this->actionUrl) {
            $mail->action($this->actionText, $this->actionUrl);
        }

        return match ($this->level) {
            'success' => $mail->success(),
            'error' => $mail->error(),
            default => $mail,
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(mixed $notifiable): array
    {
        return [
            'subject' => $this->subject,
            'body' => $this->body,
            'level' => $this->level,
            'action_text' => $this->actionText,
            'action_url' => $this->actionUrl,
        ];
    }

    public function toWhatsApp(mixed $notifiable): bool
    {
        $phone = $notifiable->phone ?? null;

        if (! $phone) {
            return false;
        }

        $message = "*{$this->subject}*\n\n{$this->body}";

        if ($this->actionText && $this->actionUrl) {
            $message .= "\n\n{$this->actionText}: {$this->actionUrl}";
        }

        return app(TwilioService::class)->sendWhatsApp($phone, $message);
    }
}
