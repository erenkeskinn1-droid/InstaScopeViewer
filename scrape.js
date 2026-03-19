const https = require('https');
const fs = require('fs');
https.get('https://www.instagram.com/frat_sabotajj/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
}, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        fs.writeFileSync('c:\\Users\\erenk\\Desktop\\InstagramProfileViewer\\anon_profile.html', data);
        console.log('Saved HTML');
    });
});
