// import React, { useState, useEffect } from 'react';
// import { OrganizationManager as OrgManager } from './organizations';
// import * as apiKeyStorage from './apiKeyStorage';

// interface OrganizationManagerProps {
//     adminApiKey: string;
//     onSelectOrganization?: (organizationId: string) => void;
// }

// const OrganizationManager: React.FC<OrganizationManagerProps> = ({
//     adminApiKey,
//     onSelectOrganization
// }) => {
//     const [orgManager, setOrgManager] = useState<OrgManager | null>(null);
//     const [organizations, setOrganizations] = useState<unknown[]>([]);
//     const [storedKeys, setStoredKeys] = useState<Record<string, unknown>>({});
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     // Form state for creating a new organization
//     const [newOrgName, setNewOrgName] = useState('');
//     const [newOrgEmail, setNewOrgEmail] = useState('');
//     const [newOrgPlan, setNewOrgPlan] = useState<'free' | 'starter' | 'business' | 'enterprise'>('free');

//     // Initialize the organization manager
//     useEffect(() => {
//         try {
//             const manager = new OrgManager(adminApiKey);
//             setOrgManager(manager);
//         } catch (error) {
//             console.error('Error initializing organization manager:', error);
//             setError('Failed to initialize organization manager');
//         }
//     }, [adminApiKey]);

//     // Load organizations when the manager is ready
//     useEffect(() => {
//         const loadOrganizations = async () => {
//             if (!orgManager) return;

//             setLoading(true);

//             try {
//                 // Get organizations from the API
//                 const result = await orgManager.listOrganizations();
//                 setOrganizations(result.organizations);

//                 // Load locally stored API keys
//                 const keys = apiKeyStorage.getStoredApiKeys();
//                 setStoredKeys(keys);
//             } catch (error) {
//                 console.error('Error loading organizations:', error);
//                 setError('Failed to load organizations');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadOrganizations();
//     }, [orgManager]);

//     // Create a new organization
//     const handleCreateOrganization = async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!orgManager || !newOrgName || !newOrgEmail) return;

//         setLoading(true);

//         try {
//             const newOrg = await orgManager.createOrganization({
//                 name: newOrgName,
//                 email: newOrgEmail,
//                 plan: newOrgPlan
//             });

//             // Store the API key locally
//             apiKeyStorage.storeApiKey(newOrg.id, newOrg.apiKey, newOrg.name);

//             // Update the state
//             setOrganizations(prev => [...prev, newOrg]);
//             setStoredKeys(apiKeyStorage.getStoredApiKeys());

//             // Reset form
//             setNewOrgName('');
//             setNewOrgEmail('');
//             setNewOrgPlan('free');
//         } catch (error) {
//             console.error('Error creating organization:', error);
//             setError('Failed to create organization');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Regenerate API key for an organization
//     const handleRegenerateApiKey = async (orgId: string) => {
//         if (!orgManager) return;

//         setLoading(true);

//         try {
//             const result = await orgManager.regenerateApiKey(orgId);

//             // Find the organization name
//             const org = organizations.find(o => o.id === orgId);
//             if (org) {
//                 // Update the stored key
//                 apiKeyStorage.storeApiKey(orgId, result.apiKey, org.name);
//                 setStoredKeys(apiKeyStorage.getStoredApiKeys());
//             }
//         } catch (error) {
//             console.error('Error regenerating API key:', error);
//             setError('Failed to regenerate API key');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Select an organization for the chatbot
//     const handleSelectOrganization = (orgId: string) => {
//         if (onSelectOrganization) {
//             onSelectOrganization(orgId);
//         }
//     };

//     // Remove stored API key
//     const handleRemoveApiKey = (orgId: string) => {
//         apiKeyStorage.removeApiKey(orgId);
//         setStoredKeys(apiKeyStorage.getStoredApiKeys());
//     };

//     if (error) {
//         return <div className="error-message">Error: {error}</div>;
//     }

//     return (
//         <div className="organization-manager">
//             <h2>Organization Manager</h2>

//             <div className="organization-list">
//                 <h3>Your Organizations</h3>
//                 {loading ? (
//                     <p>Loading organizations...</p>
//                 ) : (
//                     <ul>
//                         {organizations.map(org => (
//                             <li key={org.id} className="organization-item">
//                                 <div className="organization-info">
//                                     <h4>{org.name}</h4>
//                                     <p>Plan: {org.plan}</p>
//                                     <p>ID: {org.id}</p>
//                                     <p>
//                                         API Key: {storedKeys[org.id] ?
//                                             `${storedKeys[org.id].apiKey.substring(0, 8)}...` :
//                                             'Not stored locally'}
//                                     </p>
//                                 </div>
//                                 <div className="organization-actions">
//                                     <button
//                                         onClick={() => handleSelectOrganization(org.id)}
//                                         disabled={!storedKeys[org.id]}
//                                     >
//                                         Select for Chatbot
//                                     </button>
//                                     <button
//                                         onClick={() => handleRegenerateApiKey(org.id)}
//                                         disabled={loading}
//                                     >
//                                         Regenerate API Key
//                                     </button>
//                                     {storedKeys[org.id] && (
//                                         <button
//                                             onClick={() => handleRemoveApiKey(org.id)}
//                                             className="danger"
//                                         >
//                                             Remove Stored Key
//                                         </button>
//                                     )}
//                                 </div>
//                             </li>
//                         ))}
//                     </ul>
//                 )}
//             </div>

//             <div className="create-organization">
//                 <h3>Create New Organization</h3>
//                 <form onSubmit={handleCreateOrganization}>
//                     <div className="form-group">
//                         <label htmlFor="org-name">Organization Name</label>
//                         <input
//                             id="org-name"
//                             type="text"
//                             value={newOrgName}
//                             onChange={e => setNewOrgName(e.target.value)}
//                             required
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="org-email">Admin Email</label>
//                         <input
//                             id="org-email"
//                             type="email"
//                             value={newOrgEmail}
//                             onChange={e => setNewOrgEmail(e.target.value)}
//                             required
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="org-plan">Plan</label>
//                         <select
//                             id="org-plan"
//                             value={newOrgPlan}
//                             onChange={e => setNewOrgPlan(e.target.value as any)}
//                         >
//                             <option value="free">Free</option>
//                             <option value="starter">Starter</option>
//                             <option value="business">Business</option>
//                             <option value="enterprise">Enterprise</option>
//                         </select>
//                     </div>

//                     <button type="submit" disabled={loading || !newOrgName || !newOrgEmail}>
//                         Create Organization
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default OrganizationManager; 