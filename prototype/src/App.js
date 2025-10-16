import React, { useState, useEffect } from 'react';
import axios from 'axios'; // API 호출을 위해 axios 사용

function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [artistInfo, setArtistInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // 1. 우리 앱의 백엔드(Netlify 함수)에 토큰을 요청하는 함수
        const getAccessToken = async () => {
            try {
                // 우리가 만든 서버리스 함수를 호출합니다.
                const response = await fetch('/.netlify/functions/spotify-auth');

                if (!response.ok) {
                    throw new Error('서버에서 토큰을 가져오지 못했습니다.');
                }

                const data = await response.json();
                setAccessToken(data.accessToken);

            } catch (err) {
                setError('인증에 실패했습니다. 잠시 후 다시 시도해주세요.');
                console.error(err);
            }
        };

        getAccessToken();
    }, []); // 컴포넌트가 처음 렌더링될 때 한 번만 실행

    useEffect(() => {
        if (!accessToken) return; // 토큰이 없으면 아무것도 하지 않음

        // 2. 받아온 토큰으로 Spotify API에 실제 데이터 요청
        const getArtistData = async () => {
            try {
                // 예시: 아이유(IU)의 아티스트 정보 가져오기
                const artistId = '3HqSLMAZ3g3d5poNaI7GOU';
                const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                setArtistInfo(response.data);
            } catch (err) {
                setError('Spotify에서 데이터를 가져오는 데 실패했습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        getArtistData();
    }, [accessToken]); // accessToken이 설정되면 이 useEffect 실행

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>에러: {error}</div>;
    }

    return (
        <div>
            <h1>Spotify API 연동 성공!</h1>
            {artistInfo && (
                <div>
                    <h2>{artistInfo.name}</h2>
                    <img src={artistInfo.images[0]?.url} alt={artistInfo.name} width="200" />
                    <p>팔로워: {artistInfo.followers.total.toLocaleString()}명</p>
                    <p>장르: {artistInfo.genres.join(', ')}</p>
                </div>
            )}
        </div>
    );
}

export default App;