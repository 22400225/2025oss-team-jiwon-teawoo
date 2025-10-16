const axios = require('axios');

exports.handler = async function (event, context) {
    const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
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

        return {
            statusCode: 200,
            body: JSON.stringify({ accessToken: response.data.access_token }),
        };
    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        console.error('Spotify 토큰 요청 에러:', errorMessage);
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ error: 'Spotify 토큰을 가져오는 데 실패했습니다.' }),
        };
    }
};