import axios from 'axios';
const baseURL = 'http://localhost/taskops/public/api';

async function test() {
    try {
        const login = await axios.post(`${baseURL}/auth/login`, {
            email: 'B@GMAIL.COM',
            password: 'password123'
        });
        const token = login.data.token;
        console.log("Logged in!");
        
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const endpoints = [
            '/masters/departments',
            '/users',
            '/masters/task_priorities',
            '/masters/task_categories',
            '/masters/task_statuses'
        ];
        
        for (const ep of endpoints) {
            try {
                const res = await axios.get(`${baseURL}${ep}`, config);
                console.log(`SUCCESS ${ep}: Array length ${Array.isArray(res.data) ? res.data.length : 'NOT ARRAY'} - is_active: ${res.data[0]?.is_active}`);
            } catch (err) {
                console.log(`FAILED ${ep}: ${err.response?.status} - ${err.response?.statusText}`);
                if (err.response?.data) console.log(JSON.stringify(err.response.data));
            }
        }
    } catch(e) {
        console.log("Login failed", e.response?.status);
    }
}
test();
