<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;

class WhatsAppChannel
{
    /**
     * Send the given notification.
     */
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (method_exists($notification, 'toWhatsApp')) {
            $notification->toWhatsApp($notifiable);
        }
    }
}
