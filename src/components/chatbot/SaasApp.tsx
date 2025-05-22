// import React, { useState, useEffect } from 'react';
// import OrganizationManager from './OrganizationManager';
// import OrganizationChatbot from './OrganizationChatbot';
// import { getLastUsedOrganizationId } from './apiKeyStorage';
// import type { AppointmentSlot } from './types';

// // Demo SaaS app that integrates the organization management and chatbot components
// const SaasApp: React.FC = () => {
//     // Admin API key (in a real app, this would be stored securely and only accessible to admins)
//     const [adminApiKey, setAdminApiKey] = useState<string>('admin_sk_123456789');

//     // Selected organization for the chatbot
//     const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

//     // App mode: 'admin' for organization management, 'chat' for using the chatbot
//     const [mode, setMode] = useState<'admin' | 'chat'>('chat');

//     // Appointment data for demonstration
//     const [bookedAppointments, setBookedAppointments] = useState<AppointmentSlot[]>([]);

//     // On component mount, try to load the last used organization
//     useEffect(() => {
//         const lastOrgId = getLastUsedOrganizationId();
//         if (lastOrgId) {
//             setSelectedOrgId(lastOrgId);
//         }
//     }, []);

//     // Handle organization selection
//     const handleSelectOrganization = (orgId: string) => {
//         setSelectedOrgId(orgId);
//         setMode('chat'); // Switch to chat mode after selecting an organization
//     };

//     // Handle appointment booking
//     const handleAppointmentBooked = (slot: AppointmentSlot) => {
//         setBookedAppointments(prev => [...prev, slot]);
//     };

//     // Toggle between admin and chat modes
//     const toggleMode = () => {
//         setMode(mode === 'admin' ? 'chat' : 'admin');
//     };

//     return (
//         <div className="saas-app">
//             <header className="app-header">
//                 <h1>ChatBot SaaS Platform</h1>
//                 <div className="app-controls">
//                     <button onClick={toggleMode}>
//                         {mode === 'admin' ? 'Switch to Chat' : 'Manage Organizations'}
//                     </button>
//                 </div>
//             </header>

//             <main className="app-content">
//                 {mode === 'admin' ? (
//                     <OrganizationManager
//                         adminApiKey={adminApiKey}
//                         onSelectOrganization={handleSelectOrganization}
//                     />
//                 ) : (
//                     <div className="chat-container">
//                         {selectedOrgId ? (
//                             <>
//                                 <div className="organization-info">
//                                     <p>Using chatbot for organization: {selectedOrgId}</p>
//                                 </div>
//                                 <OrganizationChatbot
//                                     organizationId={selectedOrgId}
//                                     onAppointmentBooked={handleAppointmentBooked}
//                                 />
//                             </>
//                         ) : (
//                             <div className="no-organization">
//                                 <p>No organization selected. Please select or create an organization first.</p>
//                                 <button onClick={() => setMode('admin')}>
//                                     Manage Organizations
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </main>

//             {bookedAppointments.length > 0 && (
//                 <div className="appointments-summary">
//                     <h3>Your Booked Appointments</h3>
//                     <ul>
//                         {bookedAppointments.map((slot, index) => (
//                             <li key={index}>
//                                 {slot.day} at {slot.time} (ID: {slot.id})
//                             </li>
//                         ))}
//                     </ul>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default SaasApp; 