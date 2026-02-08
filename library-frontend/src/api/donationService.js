import apiClient from './apiClient';

export const donationService = {

    /**
     * Fetch donation details (QR Code, Appeal, Bank Info).
     * Used by: Public User (Login button area) & Admin Panel.
     */
    async getDonationDetails() {
        try {
            const response = await apiClient.get('/api/donation/');
            return response.data;
        } catch (error) {
            console.error("Error fetching donation details:", error);
            throw error;
        }
    },

    /**
     * Update donation images.
     * Used by: Admin Panel.
     * @param {FormData} formData - Contains qr_code, appeal, bank_details images.
     */
    async updateDonationDetails(formData) {
        try {
            const response = await apiClient.put('/api/donation/update/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error updating donation details:", error);
            throw error;
        }
    }
};