import * as React from 'react';
import NotificationsPage from "@/common/material-ui/dashboard/components/NotificationsPage";
import { fetchServer } from '@/lib/api-server';

export default async function Page() {
    let notifications = [];

    try {
        const res = await fetchServer('/notification/my-notifications', {
            cache: 'no-store'
        });
        if (res.ok) {
            notifications = await res.json();
        }
    } catch (error) {
        console.error('Error fetching server notifications:', error);
    }

    return <NotificationsPage initialNotifications={notifications} />;
}
