import React, { useState } from 'react';
import './App.css';

function App() {
    // React 상태(state)를 사용하여 데이터 관리
    const [query, setQuery] = useState(''); // 검색어 상태
    const [tracks, setTracks] = useState([]); // 노래 목록 상태
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요!'); // 메시지 상태

    // Spotify API 키를 .env 파일에서 불러오기
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

    // 1. Access Token 발급 함수
    const getAccessToken = async () => {
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const authString = btoa(`${clientId}:${clientSecret}`);
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'grant_type=client_credentials',
            });
            if (!response.ok) throw new Error('인증 실패');
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Access Token 발급 오류:', error);
            setMessage('API 인증에 실패했습니다. 키를 확인해주세요.');
            return null;
        }
    };

    // 2. 검색 실행 함수
    const handleSearch = async (event) => {
        event.preventDefault(); // 폼 제출 시 새로고침 방지
        if (!query) return; // 검색어가 없으면 실행하지 않음

        setMessage(`"${query}" 검색 중... 🎧`);
        setTracks([]); // 이전 검색 결과 초기화

        const accessToken = await getAccessToken();
        if (!accessToken) return;

        // Spotify API 검색 요청
        const searchUrl = `https://api.spotify.com/v1/search?q=$${encodeURIComponent(query)}&type=track&limit=50`; // 50곡만 가져오도록 단순화
        try {
            const response = await fetch(searchUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('API 요청 실패');
            const data = await response.json();

            if (data.tracks.items.length === 0) {
                setMessage(`"${query}"에 대한 검색 결과가 없습니다.`);
            } else {
                setTracks(data.tracks.items);
                setMessage(''); // 결과가 있으면 메시지 숨김
            }
        } catch (error) {
            console.error('노래 검색 오류:', error);
            setMessage('노래를 불러오는 중 오류가 발생했습니다.');
        }
    };

    // 3. 화면을 그리는 부분 (JSX)
    return (
        <div className="container">
            <div id="search-container">
                <h1>🎵 Spotify 노래 검색</h1>
                <form id="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        id="search-input"
                        placeholder="아티스트, 노래 제목, 앨범명 검색..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" id="search-button">검색</button>
                </form>
            </div>

            <div id="song-list-container">
                {message && <p className="message">{message}</p>}
                <div id="song-list">
                    {tracks.map((track) => (
                        <div className="song-item" key={track.id}>
                            <img
                                src={track.album.images[1]?.url || track.album.images[0]?.url}
                                alt={`${track.album.name} 앨범 커버`}
                                className="album-cover"
                            />
                            <div className="song-info">
                                <h3>{track.name}</h3>
                                <p>{track.artists.map(artist => artist.name).join(', ')} - <em>{track.album.name}</em></p>
                                <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                                    Spotify에서 듣기
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;