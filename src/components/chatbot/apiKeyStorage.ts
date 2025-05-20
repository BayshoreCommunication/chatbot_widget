/**
 * Utility for securely storing and retrieving API keys
 */

// Local storage key for API keys
const API_KEY_STORAGE_KEY = 'chatbot_api_keys';

// Interface for stored API key data
interface StoredApiKey {
    organizationId: string;
    apiKey: string;
    organizationName: string;
    createdAt: string;
    lastUsed: string;
}

/**
 * Store an API key for an organization
 */
export function storeApiKey(organizationId: string, apiKey: string, organizationName: string): void {
    try {
        // Get existing keys
        const existingKeys = getStoredApiKeys();

        // Add or update key
        const updatedKeys = {
            ...existingKeys,
            [organizationId]: {
                organizationId,
                apiKey,
                organizationName,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            }
        };

        // Save back to storage
        localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(updatedKeys));
    } catch (error) {
        console.error('Error storing API key:', error);
    }
}

/**
 * Get all stored API keys
 */
export function getStoredApiKeys(): Record<string, StoredApiKey> {
    try {
        const storedData = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!storedData) {
            return {};
        }

        return JSON.parse(storedData);
    } catch (error) {
        console.error('Error retrieving API keys:', error);
        return {};
    }
}

/**
 * Get API key for a specific organization
 */
export function getApiKey(organizationId: string): string | null {
    try {
        const keys = getStoredApiKeys();
        const orgData = keys[organizationId];

        if (!orgData) {
            return null;
        }

        // Update last used timestamp
        storeApiKey(organizationId, orgData.apiKey, orgData.organizationName);

        return orgData.apiKey;
    } catch (error) {
        console.error('Error getting API key:', error);
        return null;
    }
}

/**
 * Remove an API key
 */
export function removeApiKey(organizationId: string): void {
    try {
        const keys = getStoredApiKeys();

        if (keys[organizationId]) {
            delete keys[organizationId];
            localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(keys));
        }
    } catch (error) {
        console.error('Error removing API key:', error);
    }
}

/**
 * Clear all stored API keys
 */
export function clearAllApiKeys(): void {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing API keys:', error);
    }
}

/**
 * Get the last used organization ID (if any)
 */
export function getLastUsedOrganizationId(): string | null {
    try {
        const keys = getStoredApiKeys();
        const orgIds = Object.keys(keys);

        if (orgIds.length === 0) {
            return null;
        }

        // Sort by last used timestamp (newest first)
        orgIds.sort((a, b) => {
            const dateA = new Date(keys[a].lastUsed).getTime();
            const dateB = new Date(keys[b].lastUsed).getTime();
            return dateB - dateA;
        });

        return orgIds[0];
    } catch (error) {
        console.error('Error getting last used organization:', error);
        return null;
    }
}

export default {
    storeApiKey,
    getApiKey,
    getStoredApiKeys,
    removeApiKey,
    clearAllApiKeys,
    getLastUsedOrganizationId
}; 