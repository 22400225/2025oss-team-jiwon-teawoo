import React, { useState } from 'react';
import './App.css';

function App() {
    // React 상태(state)를 사용하여 데이터 관리
    const [query, setQuery] = useState(''); // 검색어 상태
    const [tracks, setTracks] = useState([]); // 노래 목록 상태
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요!'); // 메시지 상태

    // 1. 검색 실행 함수 (수정됨)
    const handleSearch = async (event) => {
        event.preventDefault(); // 폼 제출 시 새로고침 방지
        if (!query) return; // 검색어가 없으면 실행하지 않음

        setMessage(`"${query}" 검색 중... 🎧`);
        setTracks([]); // 이전 검색 결과 초기화

        let accessToken;
        try {
            // 백엔드 역할을 하는 Netlify 함수를 호출해서 Access Token을 받아옵니다.
            const response = await fetch('/.netlify/functions/spotify-auth');
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'API 인증에 실패했습니다.');
            }
            accessToken = data.accessToken;
        } catch (error) {
            console.error('Access Token 발급 오류:', error);
            setMessage(error.message);
            return;
        }

        // Spotify API 검색 요청
        const searchUrl = `https://api.spotify.com/v1/search?q=$${encodeURIComponent(query)}&type=track&limit=50`;
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

    // 2. 화면을 그리는 부분 (JSX - 변경 없음)
    return (
        <div className="container">
            <div id="search-container">
                <h1>🎵 Handong Music 노래 검색</h1>
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
                                    Handong Music에서 듣기
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