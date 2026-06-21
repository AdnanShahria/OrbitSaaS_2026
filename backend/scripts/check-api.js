async function testApi() {
    try {
        console.log('Fetching /api/hello from 127.0.0.1:6969...');
        const res = await fetch('http://127.0.0.1:6969/api/hello');
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

testApi();
