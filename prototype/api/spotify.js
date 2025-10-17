const axios = require('axios');

exports.handler = async function (event, context) {
    const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    const authHeader = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;

    try {
        console.log('📡 Spotify 토큰 요청 시작');
        console.log('CLIENT_ID:', CLIENT_ID ? '✅ 존재함' : '❌ 없음');
        console.log('CLIENT_SECRET:', CLIENT_SECRET ? '✅ 존재함' : '❌ 없음');

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

        console.log('✅ Spotify 토큰 요청 성공');
        console.log('응답 상태 코드:', response.status);
        console.log('응답 데이터:', response.data);

        return {
            statusCode: 200,
            body: JSON.stringify({ accessToken: response.data.access_token }),
        };
    } catch (error) {
        console.error('❌ Spotify 토큰 요청 실패');

        if (error.response) {
            // 서버가 응답했지만 상태 코드가 2xx가 아닌 경우
            console.error('🔸 상태 코드:', error.response.status);
            console.error('🔸 응답 헤더:', error.response.headers);
            console.error('🔸 응답 데이터:', error.response.data);
        } else if (error.request) {
            // 요청은 전송되었지만 응답이 없는 경우
            console.error('🚫 응답 없음');
            console.error('🔸 요청 객체:', error.request);
        } else {
            // 요청 설정 중 오류가 발생한 경우
            console.error('⚙️ 요청 설정 오류:', error.message);
        }

        console.error('🔍 전체 오류 객체:', JSON.stringify(error, null, 2));

        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({
                error: 'Spotify 토큰을 가져오는 데 실패했습니다.',
                details: error.message,
            }),
        };
    }
};
