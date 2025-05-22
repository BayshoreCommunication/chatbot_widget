// import { OrganizationManager, createOrganizationClient } from './organizations';

// /**
//  * This is a demo script showing how to use the multi-tenant SaaS chatbot API
//  */

// // Admin operations
// async function adminDemo() {
//     console.log('--- ADMIN OPERATIONS DEMO ---');

//     // Initialize the organization manager with admin API key
//     const adminApiKey = 'admin_sk_123456789';
//     const orgManager = new OrganizationManager(adminApiKey);

//     // Create a new organization
//     console.log('Creating new organization...');
//     const newOrg = await orgManager.createOrganization({
//         name: 'Acme Corporation',
//         plan: 'business',
//         email: 'admin@acmecorp.com'
//     });
//     console.log('Organization created:', newOrg);

//     // Get organization details
//     console.log('Getting organization details...');
//     const org = await orgManager.getOrganization(newOrg.id);
//     console.log('Organization details:', org);

//     // Update organization settings
//     console.log('Updating organization settings...');
//     const updatedOrg = await orgManager.updateOrganization(org.id, {
//         settings: {
//             ...org.settings,
//             maxFileSizeMB: 25,
//             maxChatSessionsPerDay: 1000
//         }
//     });
//     console.log('Updated organization:', updatedOrg);

//     // Upload knowledge base document
//     console.log('Uploading knowledge base document...');
//     // In a real application, you would use a real file object
//     // This is just for demonstration purposes
//     const mockFile = new File(['sample content'], 'company-handbook.pdf', { type: 'application/pdf' });
//     const uploadResult = await orgManager.uploadDocument(org.id, mockFile, {
//         title: 'Company Handbook 2023',
//         category: 'policies'
//     });
//     console.log('Document uploaded:', uploadResult);

//     // Get usage statistics
//     console.log('Getting usage statistics...');
//     const stats = await orgManager.getUsageStats(org.id, 'month');
//     console.log('Monthly usage stats:', stats);

//     return org;
// }

// // Client operations (organization-specific)
// async function clientDemo(orgApiKey: string) {
//     console.log('--- CLIENT OPERATIONS DEMO ---');

//     // Create a client instance for this organization
//     const chatApi = createOrganizationClient(orgApiKey);

//     // Generate a random session ID for this visitor
//     const sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
//     console.log('Session ID:', sessionId);

//     // Send a message to the chatbot
//     console.log('Sending message to chatbot...');
//     const response = await chatApi.sendMessage({
//         message: 'Hello, I need help with your product',
//         sessionId
//     });
//     console.log('Chatbot response:', response);

//     // Continue the conversation
//     console.log('Continuing conversation...');
//     const followUpResponse = await chatApi.sendMessage({
//         message: 'I want to book an appointment with a consultant',
//         sessionId
//     });
//     console.log('Chatbot response:', followUpResponse);

//     // Parse appointment slots if available
//     const slots = chatApi.parseAppointmentSlots(followUpResponse.answer);
//     if (slots && slots.length > 0) {
//         console.log('Available appointment slots:', slots);

//         // Confirm an appointment slot
//         console.log('Confirming appointment slot...');
//         const slot = slots[0];
//         const confirmResponse = await chatApi.confirmAppointmentSlot({
//             slotId: slot.id,
//             sessionId,
//             day: slot.day,
//             time: slot.time
//         });
//         console.log('Appointment confirmation response:', confirmResponse);
//     }
// }

// // Run the demo
// async function runDemo() {
//     try {
//         // First, run the admin operations
//         const org = await adminDemo();

//         // Then, run the client operations with the org's API key
//         await clientDemo(org.apiKey);

//         console.log('Demo completed successfully!');
//     } catch (error) {
//         console.error('Error in demo:', error);
//     }
// }

// // Uncomment to run the demo
// // runDemo();

// export { adminDemo, clientDemo, runDemo }; 