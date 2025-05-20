import { ChatApi } from './api';

export interface Organization {
    id: string;
    name: string;
    apiKey: string;
    plan: 'free' | 'starter' | 'business' | 'enterprise';
    createdAt: Date;
    settings: {
        allowFileUploads: boolean;
        maxFileSizeMB: number;
        maxVectorEntries: number;
        maxChatSessionsPerDay: number;
    };
}

// Admin API configuration
const ADMIN_API_URL = 'http://127.0.0.1:8000/admin';

export class OrganizationManager {
    private adminApiKey: string;

    constructor(adminApiKey: string) {
        this.adminApiKey = adminApiKey;
    }

    // Create a new organization
    async createOrganization(data: {
        name: string;
        plan?: 'free' | 'starter' | 'business' | 'enterprise';
        email: string;
    }): Promise<Organization> {
        try {
            const response = await fetch(`${ADMIN_API_URL}/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-API-Key': this.adminApiKey
                },
                body: JSON.stringify({
                    name: data.name,
                    plan: data.plan || 'free',
                    email: data.email
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating organization:', error);
            throw error;
        }
    }

    // Get organization details
    async getOrganization(orgId: string): Promise<Organization> {
        try {
            const response = await fetch(`${ADMIN_API_URL}/organizations/${orgId}`, {
                headers: {
                    'X-Admin-API-Key': this.adminApiKey
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting organization:', error);
            throw error;
        }
    }

    // Update organization details
    async updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization> {
        try {
            const response = await fetch(`${ADMIN_API_URL}/organizations/${orgId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-API-Key': this.adminApiKey
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating organization:', error);
            throw error;
        }
    }

    // Regenerate API key for an organization
    async regenerateApiKey(orgId: string): Promise<{ apiKey: string }> {
        try {
            const response = await fetch(`${ADMIN_API_URL}/organizations/${orgId}/regenerate-key`, {
                method: 'POST',
                headers: {
                    'X-Admin-API-Key': this.adminApiKey
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error regenerating API key:', error);
            throw error;
        }
    }

    // List all organizations (admin only)
    async listOrganizations(page = 1, limit = 50): Promise<{ organizations: Organization[], total: number }> {
        try {
            const response = await fetch(`${ADMIN_API_URL}/organizations?page=${page}&limit=${limit}`, {
                headers: {
                    'X-Admin-API-Key': this.adminApiKey
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error listing organizations:', error);
            throw error;
        }
    }

    // Upload knowledge base document for an organization
    async uploadDocument(orgId: string, file: File, metadata?: Record<string, any>): Promise<{ success: boolean, documentId: string }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (metadata) {
                formData.append('metadata', JSON.stringify(metadata));
            }

            const response = await fetch(`${ADMIN_API_URL}/organizations/${orgId}/documents`, {
                method: 'POST',
                headers: {
                    'X-Admin-API-Key': this.adminApiKey
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    }

    // Get organization usage statistics
    async getUsageStats(orgId: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<{
        chatSessions: number;
        apiCalls: number;
        documentUploads: number;
        vectorStoreSize: number;
        appointments: number;
    }> {
        try {
            const queryParams = period ? `?period=${period}` : '';
            const response = await fetch(`${ADMIN_API_URL}/organizations/${orgId}/usage${queryParams}`, {
                headers: {
                    'X-Admin-API-Key': this.adminApiKey
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting usage stats:', error);
            throw error;
        }
    }
}

// Create client API instance for a specific organization
export function createOrganizationClient(apiKey: string): ChatApi {
    return new ChatApi({ apiKey });
}

export default OrganizationManager; 