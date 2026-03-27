import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';
const TEST_EMAIL = 'test@example.com'; 

async function testMobileReset() {
    try {
        console.log('Testing Mobile Password Reset Flow...');

        console.log('1. Requesting 6-digit code...');
        const forgotRes = await axios.post(`${API_URL}/forgot-password-mobile`, { email: TEST_EMAIL });
        console.log('Response:', forgotRes.data);

        console.log('\nImplementation complete. Please verify by:');
        console.log('1. Checking logs/email for the 6-digit code.');
        console.log('2. Calling /verify-reset-code with the received code.');
        console.log('3. Calling /reset-password-mobile with the code and new password.');

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

console.log('Verification script ready. Run it if the backend server is active.');
