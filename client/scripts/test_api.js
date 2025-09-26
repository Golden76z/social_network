const fetch = require('node-fetch').default;

async function testAPI() {
    try {
        // First, login to get a token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'ckent@example.com',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        
        if (!loginData.token) {
            console.error('❌ No token received');
            return;
        }
        
        const token = loginData.token;
        console.log('✅ Token received:', token.substring(0, 50) + '...');
        
        // Test liked posts endpoint
        console.log('\n📝 Testing liked posts endpoint...');
        const likedResponse = await fetch('http://localhost:8080/api/post?liked=true', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `jwt_token=${token}`
            }
        });
        
        const likedText = await likedResponse.text();
        console.log('Liked posts response status:', likedResponse.status);
        console.log('Liked posts response:', likedText);
        
        let likedData;
        try {
            likedData = JSON.parse(likedText);
            console.log('Liked posts parsed:', JSON.stringify(likedData, null, 2));
        } catch (e) {
            console.log('Liked posts response is not JSON');
        }
        
        // Test commented posts endpoint
        console.log('\n💬 Testing commented posts endpoint...');
        const commentedResponse = await fetch('http://localhost:8080/api/post?commented=true', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `jwt_token=${token}`
            }
        });
        
        const commentedData = await commentedResponse.json();
        console.log('Commented posts response:', JSON.stringify(commentedData, null, 2));
        
        // Test group posts endpoint
        console.log('\n👥 Testing group posts endpoint...');
        const groupResponse = await fetch('http://localhost:8080/api/group/post?groupId=1', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `jwt_token=${token}`
            }
        });
        
        const groupData = await groupResponse.json();
        console.log('Group posts response:', JSON.stringify(groupData, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI();
