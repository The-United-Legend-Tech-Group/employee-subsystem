import { apiClient, ApiResponse } from '../../common/utils/api/client';

// Employee interfaces
export interface Employee {
    profile: any;
    data: any
    _id: string;
    employeeNumber: string;
    fullName: {
        firstName: string;
        middleName?: string;
        lastName: string;
    };
    personalEmail: string;
    companyEmail?: string;
    phoneNumber: string;
    nationalId: string;
    department?: {
        _id: string;
        name: string;
    };
    position?: {
        _id: string;
        title: string;
    };
    hireDate: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
    roles: string[];
}

// Candidate interfaces
export interface Candidate {
    _id: string;
    candidateNumber: string;
    fullName: {
        firstName: string;
        middleName?: string;
        lastName: string;
    };
    personalEmail: string;
    phoneNumber: string;
    nationalId: string;
    status: 'ACTIVE' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
}

// Employee API methods
export const employeeApi = {
    // Get single employee by ID
    async getEmployeebyId(id: string): Promise<Employee> {
        const response = await apiClient.get<Employee>(`/employee/${id}`);
        if (response.error) throw new Error(response.error);
        return response.data!;
    },
    // Get employee by employee number
    async getEmployeeByEmployeeNumber(employeeNumber: string): Promise<Employee> {
        const response = await apiClient.get<any>('/employee', {
            params: { search: employeeNumber, limit: 10 }
        });

        if (response.error) throw new Error(response.error);
        const items = response.data?.items || [];

        const match = items.find((item: any) =>
            item.employeeNumber?.toLowerCase() === employeeNumber.toLowerCase() ||
            item._id === employeeNumber
        );

        if (!match) {
            throw new Error('Employee not found');
        }

        return match;
    },
    // Get all employees (unpaginated)
    async getAllEmployees(): Promise<Employee[]> {
        const response = await apiClient.get<Employee[]>('/employee/s');
        if (response.error) throw new Error(response.error);
        return response.data!;
    },
};
export const candidateApi = {
    // Get candidate by ID (MongoDB ObjectId)
    async getCandidateById(candidateId: string): Promise<Candidate> {
        // This endpoint needs to be added to the backend
        // Possible endpoint: GET /employee/candidate/id/:candidateId
        const response = await apiClient.get<Candidate>(`/employee/candidate/id/${candidateId}`);
        if (response.error) throw new Error(response.error);
        return response.data!;
    },
    // Get all candidates
    async getAllCandidates(): Promise<Candidate[]> {
        // This endpoint needs to be added to the backend
        // Possible endpoint: GET /employee/candidates
        const response = await apiClient.get<Candidate[]>('/employee/candidates');
        if (response.error) throw new Error(response.error);
        return response.data!;
    },
};

// Notification interfaces
export interface Notification {
    _id: string;
    recipientId?: string[];
    type: 'Alert' | 'Info' | 'Success' | 'Warning';
    deliveryType: 'UNICAST' | 'MULTICAST' | 'BROADCAST';
    deliverToRole?: string;
    title: string;
    message: string;
    relatedEntityId?: string;
    relatedModule?: string;
    isRead: boolean;
    readBy: string[];
    createdAt: string;
}

// Organization Structure interfaces
export interface OpenDepartment {
    departmentName: string;
    openPositions: string[];
    recruiters: { name: string; employeeNumber: string }[];
}

// Organization Structure API methods
export const organizationApi = {
    // Get departments with open positions and recruiters
    async getOpenDepartments(): Promise<OpenDepartment[]> {
        const response = await apiClient.get<OpenDepartment[]>('/organization-structure/departments/open');
        if (response.error) throw new Error(response.error);
        return response.data!;
    },
};

// Notification API methods
export const notificationApi = {
    // Get notifications for authenticated user
    async getMyNotifications(): Promise<Notification[]> {
        const response = await apiClient.get<Notification[]>('/notification/my-notifications');
        if (response.error) throw new Error(response.error);
        return response.data!;
    },

    // Mark a notification as read
    async markAsRead(notificationId: string): Promise<any> {
        const response = await apiClient.patch<any>(`/notification/${notificationId}/read`);
        if (response.error) throw new Error(response.error);
        return response.data;
    },

    // Mark all notifications as read
    async markAllAsRead(): Promise<any> {
        const response = await apiClient.patch<any>('/notification/read-all');
        if (response.error) throw new Error(response.error);
        return response.data;
    },
};

export default employeeApi;
