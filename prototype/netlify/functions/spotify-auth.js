// axios 패키지가 필요합니다.
// 로컬 터미널에서 `npm install axios` 또는 `yarn add axios`를 실행해주세요.

const axios = require('axios');

exports.handler = async function (event, context) {
    // Netlify 대시보드에 설정한 환경 변수를 가져옵니다.
    // 이 코드에서는 REACT_APP_ 접두사가 없어도 잘 작동합니다.
    const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

    // Spotify 토큰 요청에 필요한 인코딩된 인증 헤더를 만듭니다.
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

        // 성공하면 액세스 토큰을 React 앱으로 전달합니다.
        return {
            statusCode: 200,
            body: JSON.stringify({ accessToken: response.data.access_token }),
        };
    } catch (error) {
        // 에러가 발생하면 에러 정보를 전달합니다.
        console.error('Spotify 토큰 요청 에러:', error.response ? error.response.data : error.message);
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ error: 'Spotify 토큰을 가져오는 데 실패했습니다.' }),
        };
    }
};