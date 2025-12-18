import * as React from 'react';
import { fetchServer } from '@/lib/api-server';
import CalendarClient, { Notification } from './CalendarClient';

export default async function CalendarPage() {
    let notifications: Notification[] = [];

    try {
        const res = await fetchServer('/notification/my-notifications', {
            cache: 'no-store'
        });
        if (res.ok) {
            notifications = await res.json();
        }
    } catch (error) {
        // Log error but render page with empty notifications
        console.error('Error fetching server notifications:', error);
    }

    return <CalendarClient initialNotifications={notifications} />;
}
