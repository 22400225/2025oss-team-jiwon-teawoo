// /api/spotify.js

const axios = require('axios');

// Vercel의 서버리스 함수 형식으로 변경
module.exports = async (req, res) => {
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID; // REACT_APP_ 접두사 제거
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET; // REACT_APP_ 접두사 제거
    const authHeader = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                },
            }
        );

        // 성공 시, res.status().json()으로 응답
        res.status(200).json({ accessToken: response.data.access_token });

    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        console.error('Spotify 토큰 요청 에러:', errorMessage);
        
        // 실패 시, res.status().json()으로 응답
        const statusCode = error.response ? error.response.status : 500;
        res.status(statusCode).json({ error: 'Spotify 토큰을 가져오는 데 실패했습니다.' });
    }
};