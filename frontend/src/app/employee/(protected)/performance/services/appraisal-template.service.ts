import { AppraisalTemplate, CreateAppraisalTemplateDto, UpdateAppraisalTemplateDto } from '../templates/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export const appraisalTemplateService = {
    async findAll(): Promise<AppraisalTemplate[]> {
        const response = await fetch(`${API_URL}/performance/templates`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    },

    async findOne(id: string): Promise<AppraisalTemplate> {
        const response = await fetch(`${API_URL}/performance/templates/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch template: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    },

    async create(data: CreateAppraisalTemplateDto): Promise<AppraisalTemplate> {
        const response = await fetch(`${API_URL}/performance/templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create template: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    },

    async update(id: string, data: UpdateAppraisalTemplateDto): Promise<AppraisalTemplate> {
        const response = await fetch(`${API_URL}/performance/templates/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update template: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    },

    async remove(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/performance/templates/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete template: ${response.status} ${response.statusText} - ${errorText}`);
        }
    },
};
