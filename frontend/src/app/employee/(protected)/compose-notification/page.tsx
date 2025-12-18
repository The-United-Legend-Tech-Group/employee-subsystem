import ComposeNotificationPage from "@/common/material-ui/dashboard/components/ComposeNotificationPage";
import { fetchServer } from "@/lib/api-server";

export default async function Page() {
    let initialEmployees = [];
    let initialPositions = [];

    try {
        const [empRes, posRes] = await Promise.all([
            fetchServer('/employee?limit=100'),
            fetchServer('/organization-structure/positions')
        ]);

        if (empRes.ok) {
            const data = await empRes.json();
            initialEmployees = data.items || [];
        }

        if (posRes.ok) {
            initialPositions = await posRes.json();
        }

    } catch (error) {
        console.error("Error fetching initial data for notification page", error);
        // Fallback to empty, client side might fetch or just show empty
    }

    return (
        <ComposeNotificationPage
            initialEmployees={initialEmployees}
            initialPositions={initialPositions}
        />
    );
}
