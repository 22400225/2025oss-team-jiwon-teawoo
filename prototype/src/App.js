import React, { useState } from 'react';
import './App.css';
// ... (기존 핸들러 함수들: handleSearch 등은 생략)

function App() {
    // React 상태(state)를 사용하여 데이터 관리 (기존 코드와 동일)
    const [query, setQuery] = useState(''); 
    const [tracks, setTracks] = useState([]); 
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요!'); 

    // 검색 실행 함수 (기존 코드와 동일)
    const handleSearch = async (event) => {
        // ... (API 호출 및 상태 업데이트 로직)
        event.preventDefault(); // 폼 제출 시 새로고침 방지
        if (!query.trim()) return; 

        setMessage(`"${query}" 검색 중... 🎧`);
        setTracks([]);

        let accessToken;
        try {
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

        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`; // 수정된 URL
        try {
            const response = await fetch(searchUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('API 요청 실패');
            const data = await response.json();

            if (data.tracks.items.length === 0) {
                setMessage(`"${query}"에 대한 검색 결과가 없습니다. 😥`);
            } else {
                setTracks(data.tracks.items);
                setMessage('');
            }
        } catch (error) {
            console.error('노래 검색 오류:', error);
            setMessage('노래를 불러오는 중 오류가 발생했습니다.');
        }
    };

    // 재생 시간을 '분:초' 형식으로 변환하는 헬퍼 함수
    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // 화면을 그리는 부분 (JSX) - 시맨틱/접근성 개선
    return (
        <div className="app-container">
            {/* 1. 사이드바 (Navigation) - <nav> 시맨틱 태그 사용, aria-label 제공 */}
            <nav className="sidebar" aria-label="메인 탐색">
                <h1 className="logo">Handong Music</h1>
                <ul className="playlist-list">
                    <li className="playlist-item">
                        {/* 폴더 추가 버튼 */}
                        <button className="add-folder-btn" aria-label="새 폴더 추가">
                            <span className="icon" aria-hidden="true">+</span>
                            폴더 추가
                        </button>
                    </li>
                    {/* 여기에 다른 플레이리스트 항목이 map으로 들어갈 수 있습니다. */}
                </ul>
            </nav>

            {/* 2. 메인 콘텐츠 (Music List) - <main> 시맨틱 태그 사용 */}
            <main className="main-content">
                {/* 검색 및 필터 영역 - <header>와 <form> 시맨틱 조합 */}
                <header className="search-filter-area">
                    {/* 검색 폼 - role="search"는 <form>에 포함되므로 생략 가능 */}
                    <form className="search-bar" role="search" onSubmit={handleSearch}>
                        <h2 className="sr-only">검색</h2> {/* 스크린 리더를 위한 숨겨진 제목 */}
                        <input 
                            type="search" 
                            id="music-search" 
                            placeholder="아티스트, 노래 제목, 앨범명 검색..."
                            aria-label="음악 검색 입력" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" className="search-icon-btn" aria-label="검색 실행">
                            <span className="icon" aria-hidden="true">🔍</span>
                        </button>
                    </form>
                    
                    <div className="controls-area">
                        <button className="settings-btn" aria-label="설정 열기">
                            <span className="icon" aria-hidden="true">⚙️</span>
                        </button>
                    </div>
                </header>

                {/* 음악 목록 표시 영역 */}
                <section className="music-list-body">
                    {/* 결과 메시지 표시 */}
                    {message && <p className="message" role="status" aria-live="polite">{message}</p>}

                    {/* 노래 목록 헤더 - 목록의 메타데이터이므로 <header> 사용이 시맨틱함 */}
                    {tracks.length > 0 && (
                        <div className="music-list-header">
                            <span className="header-col img-col" aria-hidden="true">커버</span>
                            <span className="header-col title-col">제목</span>
                            <span className="header-col artist-col">아티스트</span>
                            <span className="header-col album-col">앨범</span>
                            <span className="header-col duration-col">
                                <span className="icon" role="img" aria-label="재생 시간">⏱️</span>
                            </span>
                        </div>
                    )}
                    
                    {/* 실제 음악 목록 - 시맨틱한 순서 없는 목록 <ul> 사용 */}
                    <ul className="music-list" role="list">
                        {tracks.map((track) => {
                            const fullArtistInfo = `${track.artists.map(artist => artist.name).join(', ')} - ${track.album.name}`;
                            const duration = formatDuration(track.duration_ms);

                            return (
                                <li className="music-item" key={track.id} aria-label={`${track.name} by ${track.artists[0].name}, ${track.album.name}, 길이 ${duration}`}>
                                    {/* 앨범 커버 */}
                                    <img
                                        src={track.album.images[1]?.url || track.album.images[0]?.url || 'https://via.placeholder.com/100'}
                                        alt={`${track.album.name} 앨범 커버`}
                                        className="album-cover"
                                    />
                                    {/* 노래 정보 */}
                                    <div className="song-info">
                                        <h3 className="track-title" title={track.name}>{track.name}</h3>
                                        <p className="track-details" title={fullArtistInfo}>
                                            {track.artists.map(artist => artist.name).join(', ')} - <em>{track.album.name}</em>
                                        </p>
                                    </div>
                                    
                                    {/* 재생 시간 */}
                                    <span className="track-duration">{duration}</span>
                                    
                                    {/* 재생 버튼 */}
                                    <button
                                        className="play-button"
                                        onClick={() => window.open(track.external_urls.spotify, '_blank')}
                                        aria-label={`${track.name} Spotify에서 재생하기`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" aria-hidden="true">
                                            <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
                                        </svg>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </main>
        </div>
    );
}

export default App;