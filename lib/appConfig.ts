/**
 * Application Configuration
 * 
 * Centralized configuration for the application.
 * Contains static data, event details, and application settings.
 */

export const appConfig = {
    // Event Details
    eventName: 'Tanuku Road Run 2025',
    eventDate: '2025-01-26', // Example date
    eventDescription: 'Official admin dashboard for Tanuku Road Run 2025 event management',
    eventOrganization: 'Tanuku Runners',

    // Authentication (Dummy Credentials)
    auth: {
        username: 'admin@konaseemarunners.com',
        password: 'password123', // Dummy password
        sessionTimeout: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    },

    // Form Options
    constants: {
        genders: [
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Other', label: 'Other' },
        ],
        categories: [
            { value: '3K', label: '3K' },
            { value: '5K', label: '5K' },
            { value: '10K', label: '10K' },
        ],
        shirtSizes: [
            { value: 'XS', label: 'XS' },
            { value: 'S', label: 'S' },
            { value: 'M', label: 'M' },
            { value: 'L', label: 'L' },
            { value: 'XL', label: 'XL' },
            { value: 'XXL', label: 'XXL' },
            { value: 'XXXL', label: 'XXXL' },
        ],
        bloodGroups: [
            { value: 'A+', label: 'A+' },
            { value: 'A-', label: 'A-' },
            { value: 'B+', label: 'B+' },
            { value: 'B-', label: 'B-' },
            { value: 'AB+', label: 'AB+' },
            { value: 'AB-', label: 'AB-' },
            { value: 'O+', label: 'O+' },
            { value: 'O-', label: 'O-' },
        ],
    },
};
