import React, { useState } from 'react';
import './App.css';

function App() {
    // React 상태(state)를 사용하여 데이터 관리
    const [query, setQuery] = useState(''); // 검색어 상태
    const [tracks, setTracks] = useState([]); // 노래 목록 상태
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요!'); // 메시지 상태

    // 검색 실행 함수
    const handleSearch = async (event) => {
        event.preventDefault(); // 폼 제출 시 새로고침 방지
        if (!query.trim()) return; // 검색어가 없으면 실행하지 않음

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
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`;
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

    // 화면을 그리는 부분 (JSX)
    return (
        <div className="layout-wrapper"> {/* 전체 레이아웃을 감싸는 div 추가 */}
            {/* 1. Logo 및 검색 영역 (Header) */}
            <header className="main-header">
                {/* Logo 영역 */}
                <div className="logo-area">
                    <a href="/" aria-label="Handong Music 메인 페이지로 이동">
                        <img
                            src="hml2.png"
                            alt="Handong Music"
                            className="logo-image"
                        />
                    </a>
                </div>

                {/* 검색 컨테이너 (기존 #search-container) */}
                <div className="search-container-wrapper">
                    <nav id="search-container" aria-label="음악 검색">
                        {/* 기존 H1 제거: Header 내 Logo 영역에 제목 역할이 포함됨 */}
                        <form id="search-form" role="search" onSubmit={handleSearch}>
                            <label htmlFor="search-input" className="sr-only">검색어 입력</label>
                            <input
                                type="text"
                                id="search-input"
                                placeholder="아티스트, 노래 제목, 앨범명 검색..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button type="submit" id="search-button">검색</button>
                        </form>
                    </nav>
                </div>
            </header>

            {/* 2. 노래 목록 영역 (Main Content) */}
            <main id="song-list-container" aria-live="polite"> {/* 검색 결과가 동적으로 업데이트되므로 aria-live="polite" 추가 */}
                {message && <p className="message">{message}</p>}

                {/* 목록 자체는 ul/ol이 더 시맨틱하지만, 디자인 유연성을 위해 div를 유지하고 
                각 항목에 article/li 역할을 부여할 수 있음. 여기서는 기존 구조를 유지. */}
                <div id="song-list">
                    {tracks.map((track) => {
                        // ... (노래 항목 렌더링 코드 유지)
                        const fullArtistInfo = `${track.artists.map(artist => artist.name).join(', ')} - ${track.album.name}`;
                        return (
                            <article className="song-item" key={track.id}> {/* div를 article로 변경하여 독립된 콘텐츠임을 명시 */}
                                {/* ... (앨범 커버, 노래 정보, 재생 버튼 코드 유지) ... */}
                                <img
                                    src={track.album.images[1]?.url || track.album.images[0]?.url || 'https://via.placeholder.com/100'}
                                    alt={`${track.album.name} 앨범 커버`}
                                    className="album-cover"
                                />
                                <div className="song-info">
                                    <h3 title={track.name}>{track.name}</h3>
                                    <p title={fullArtistInfo}>
                                        {track.artists.map(artist => artist.name).join(', ')} - <em>{track.album.name}</em>
                                    </p>
                                </div>
                                <button
                                    className="play-button"
                                    onClick={() => window.open(track.external_urls.spotify, '_blank')}
                                    aria-label={`${track.name} Spotify에서 재생`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                                        <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                    </svg>
                                </button>
                            </article>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}

export default App;

