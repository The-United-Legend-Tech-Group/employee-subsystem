import { Department, Position } from '../templates/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export const organizationService = {
    async getDepartments(): Promise<Department[]> {
        const response = await fetch(`${API_URL}/organization-structure/departments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch departments');
        }
        return response.json();
    },

    async getPositions(): Promise<Position[]> {
        const response = await fetch(`${API_URL}/organization-structure/positions`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch positions');
        }
        return response.json();
    },
};
