import React, { useState, useEffect } from 'react';
import './App.css'; // 동일한 CSS 파일을 사용한다고 가정합니다.

// --- 1. 플레이리스트 데이터 관리 ---

// localStorage에서 플레이리스트를 불러오는 함수 (앱 시작 시 한 번만 실행)
const loadPlaylistsFromStorage = () => {
    const savedPlaylists = localStorage.getItem('handongMusicPlaylists');
    return savedPlaylists ? JSON.parse(savedPlaylists) : [];
};

// 기본 플레이리스트 이미지
const DEFAULT_PLAYLIST_IMAGE = 'https://via.placeholder.com/60/1DB954/FFFFFF?text=HM';


function App() {
    // --- 2. React 상태(State) 정의 ---

    // 검색 관련 상태 (기존과 동일)
    const [query, setQuery] = useState(''); 
    const [tracks, setTracks] = useState([]); // 'tracks'는 이제 *검색 결과*를 의미합니다.
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요!'); 

    // 플레이리스트 관련 상태
    const [playlists, setPlaylists] = useState(loadPlaylistsFromStorage); // localStorage에서 로드
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null); // 현재 보고 있는 플레이리스트 ID

    // 노래 추가를 위한 컨텍스트 메뉴 상태
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        track: null,
    });

    // --- 3. useEffect를 사용한 데이터 동기화 ---

    // playlists 상태가 변경될 때마다 localStorage에 자동 저장
    useEffect(() => {
        localStorage.setItem('handongMusicPlaylists', JSON.stringify(playlists));
    }, [playlists]); // playlists 배열이 바뀔 때만 실행

    // 컨텍스트 메뉴가 열렸을 때, 외부 클릭 시 닫히도록 이벤트 리스너 추가
    useEffect(() => {
        const handleClickOutside = () => setContextMenu({ visible: false });
        if (contextMenu.visible) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.visible]);


    // --- 4. 검색 핸들러 (수정됨) ---

    // 검색 실행 함수
    const handleSearch = async (event) => {
        event.preventDefault(); 
        if (!query.trim()) return; 

        // 검색을 시작하면 '검색 결과' 뷰로 전환
        setSelectedPlaylistId(null); 
        setMessage(`"${query}" 검색 중... 🎧`);
        setTracks([]);

        // ... (기존 API 호출 로직은 동일) ...
        let accessToken;
        try {
            const response = await fetch('./api/spotify');
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'API 인증 실패');
            accessToken = data.accessToken;
        } catch (error) {
            console.error('Access Token 발급 오류:', error);
            setMessage(error.message);
            return;
        }

        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`; // (URL은 예시로 정식 Spotify API URL로 수정했습니다)
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
                setMessage(''); // 검색 성공 시 메시지 지움
            }
        } catch (error) {
            console.error('노래 검색 오류:', error);
            setMessage('노래를 불러오는 중 오류가 발생했습니다.');
        }
    };

    // --- 5. 플레이리스트 CRUD 핸들러 ---

    // (Create) 새 플레이리스트 생성
    const handleCreatePlaylist = () => {
        const name = prompt('새 플레이리스트 이름을 입력하세요:', '새 플레이리스트');
        if (name && name.trim()) {
            const newPlaylist = {
                id: Date.now().toString(), // 간단한 고유 ID
                name: name.trim(),
                image: DEFAULT_PLAYLIST_IMAGE,
                tracks: [],
            };
            setPlaylists(prev => [...prev, newPlaylist]);
        }
    };

    // (Read) 특정 플레이리스트 선택
    const handleSelectPlaylist = (id) => {
        setSelectedPlaylistId(id);
        // 플레이리스트를 선택하면 검색 관련 상태 초기화
        setMessage('');
        setQuery('');
        // setTracks([]); // 검색 결과를 지우면 안 됨 (검색 뷰로 돌아갈 수 있으므로)
    };

    // 로고 클릭 시 검색 홈(초기 화면)으로 이동
    const handleGoHome = () => {
        setSelectedPlaylistId(null);
        setMessage('듣고 싶은 노래를 검색해 보세요!');
        setTracks([]);
        setQuery('');
    };

    // (Update) 플레이리스트 이름 변경
    const handleRenamePlaylist = (e, id) => {
        e.stopPropagation(); // 이벤트 버블링 방지 (상위의 handleSelectPlaylist 실행 방지)
        const playlist = playlists.find(p => p.id === id);
        const newName = prompt('새 이름을 입력하세요:', playlist.name);
        if (newName && newName.trim() && newName.trim() !== playlist.name) {
            setPlaylists(prev => 
                prev.map(p => (p.id === id ? { ...p, name: newName.trim() } : p))
            );
        }
    };

    // (Update) 플레이리스트 이미지 변경
    const handleChangePlaylistImage = (e, id) => {
        e.stopPropagation();
        const newImage = prompt('새 이미지 URL을 입력하세요:');
        // 간단한 URL 유효성 검사 (http로 시작하는지)
        if (newImage && newImage.trim().startsWith('http')) {
            setPlaylists(prev =>
                prev.map(p => (p.id === id ? { ...p, image: newImage.trim() } : p))
            );
        } else if (newImage) {
            alert('유효한 URL을 입력해주세요 (예: http://... 또는 https://...)');
        }
    };

    // (Delete) 플레이리스트 삭제
    const handleDeletePlaylist = (e, id) => {
        e.stopPropagation();
        if (window.confirm('정말 이 플레이리스트를 삭제하시겠습니까?')) {
            setPlaylists(prev => prev.filter(p => p.id !== id));
            // 만약 현재 선택된 플레이리스트가 삭제되면 홈으로 이동
            if (selectedPlaylistId === id) {
                handleGoHome();
            }
        }
    };


    // --- 6. 플레이리스트 *내부* 노래 관리 핸들러 ---

    // (Create) 노래를 플레이리스트에 추가
    const handleAddTrackToPlaylist = (track, playlistId) => {
        setPlaylists(prev =>
            prev.map(p => {
                if (p.id === playlistId) {
                    // 중복 체크
                    const trackExists = p.tracks.find(t => t.id === track.id);
                    if (trackExists) {
                        alert('이 노래는 이미 플레이리스트에 있습니다.');
                        return p;
                    }
                    // 플레이리스트의 첫 번째 곡 이미지로 커버 자동 업데이트 (선택 사항)
                    const newImage = p.tracks.length === 0 
                        ? (track.album.images[1]?.url || track.album.images[0]?.url) 
                        : p.image;
                    
                    return { ...p, tracks: [...p.tracks, track], image: newImage === DEFAULT_PLAYLIST_IMAGE ? newImage : p.image };
                }
                return p;
            })
        );
        setContextMenu({ visible: false }); // 메뉴 닫기
    };

    // (Delete) 플레이리스트에서 노래 제거
    const handleRemoveTrackFromPlaylist = (trackId) => {
        if (!selectedPlaylistId) return; // 현재 선택된 플레이리스트가 없으면 실행 안 함

        setPlaylists(prev => 
            prev.map(p => {
                if (p.id === selectedPlaylistId) {
                    const updatedTracks = p.tracks.filter(t => t.id !== trackId);
                    return { ...p, tracks: updatedTracks };
                }
                return p;
            })
        );
    };

    // --- 7. 컨텍스트 메뉴 핸들러 ---

    const handleOpenContextMenu = (e, track) => {
        e.preventDefault(); // 기본 우클릭 메뉴 방지
        e.stopPropagation(); // 이벤트 버블링 방지
        setContextMenu({
            visible: true,
            x: e.clientX, // 클릭한 X 좌표
            y: e.clientY, // 클릭한 Y 좌표
            track: track,
        });
    };

    // --- 8. 렌더링 로직 ---

    // 현재 뷰에 표시할 트랙 목록 결정
    const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);
    const tracksToShow = currentPlaylist ? currentPlaylist.tracks : tracks; // 선택된 플레이리스트가 있으면 해당 곡들, 아니면 검색 결과(tracks)

    return (
        <div className="app-container">
            {/* 1. 사이드바 (Navigation) */}
            <nav className="sidebar" aria-label="메인 탐색">
                {/* 로고 클릭 시 홈으로 */}
                <h1 className="logo" onClick={handleGoHome} style={{ cursor: 'pointer' }} title="검색 홈으로">
                    Handong Music
                </h1>
                
                <ul className="playlist-list">
                    {/* 폴더 추가 버튼 */}
                    <li className="playlist-item">
                        <button className="add-folder-btn" aria-label="새 플레이리스트 추가" onClick={handleCreatePlaylist}>
                            <span className="icon" aria-hidden="true">+</span>
                            플레이리스트 추가
                        </button>
                    </li>
                    
                    {/* 저장된 플레이리스트 목록 */}
                    {playlists.map(playlist => (
                        <li 
                            key={playlist.id} 
                            className={`playlist-item ${playlist.id === selectedPlaylistId ? 'active' : ''}`}
                        >
                            <button 
                                className="playlist-button" 
                                onClick={() => handleSelectPlaylist(playlist.id)}
                                title={playlist.name}
                            >
                                <img 
                                    src={playlist.image || DEFAULT_PLAYLIST_IMAGE} 
                                    alt={`${playlist.name} 커버`} 
                                    className="playlist-cover"
                                />
                                <span className="playlist-name">{playlist.name}</span>
                            </button>
                            {/* 플레이리스트 관리 버튼들 */}
                            <div className="playlist-controls">
                                <button onClick={(e) => handleRenamePlaylist(e, playlist.id)} title="이름 변경">✏️</button>
                                <button onClick={(e) => handleChangePlaylistImage(e, playlist.id)} title="커버 URL 변경">🖼️</button>
                                <button onClick={(e) => handleDeletePlaylist(e, playlist.id)} title="삭제">❌</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* 2. 메인 콘텐츠 (Music List) */}
            <main className="main-content">
                {/* 검색 및 필터 영역 */}
                <header className="search-filter-area">
                    <form className="search-bar" role="search" onSubmit={handleSearch}>
                        {/* ... (기존 검색 폼과 동일) ... */}
                        <h2 className="sr-only">검색</h2>
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
                <section className="song-list-body">
                    
                    {/* 현재 뷰(검색 vs 플레이리스트)에 따라 다른 정보 표시 */}
                    {currentPlaylist ? (
                        <div className="playlist-header">
                            <img src={currentPlaylist.image} alt={`${currentPlaylist.name} 커버`} className="playlist-header-image" />
                            <div>
                                <h2>{currentPlaylist.name}</h2>
                                <p>총 {currentPlaylist.tracks.length}곡</p>
                            </div>
                        </div>
                    ) : (
                        // 검색 시 메시지 표시 (기존 로직)
                        message && <p className="message" role="status" aria-live="polite">{message}</p>
                    )}

                    {/* 노래 목록 헤더 */}
                    {tracksToShow.length > 0 && (
                        <div className="song-list-header">
                            {/* ... (기존 헤더와 동일) ... */}
                            <span className="header-col img-col" aria-hidden="true">커버</span>
                            <span className="header-col title-col">제목</span>
                            <span className="header-col artist-col">아티스트</span>
                            <span className="header-col album-col">앨범</span>
                            <span className="header-col duration-col">
                                <span className="icon" role="img" aria-label="재생 시간">⏱️</span>
                            </span>
                            <span className="header-col action-col" aria-hidden="true">동작</span>
                        </div>
                    )}
                    
                    {/* 실제 음악 목록 (tracksToShow 사용) */}
                    <div id="song-list">
                        {tracksToShow.map((track) => {
                            const fullArtistInfo = `${track.artists.map(artist => artist.name).join(', ')} - ${track.album.name}`;

                            return (
                                <div className="song-item" key={track.id} onContextMenu={(e) => !currentPlaylist && handleOpenContextMenu(e, track)}>
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
                                            <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
                                        </svg>
                                    </button>

                                    {/* 뷰에 따라 '추가' 또는 '제거' 버튼 표시 */}
                                    {currentPlaylist ? (
                                        <button 
                                            className="action-button remove-track" 
                                            onClick={() => handleRemoveTrackFromPlaylist(track.id)}
                                            aria-label="플레이리스트에서 제거"
                                        >
                                            -
                                        </button>
                                    ) : (
                                        <button 
                                            className="action-button add-track" 
                                            onClick={(e) => handleOpenContextMenu(e, track)}
                                            aria-label="플레이리스트에 추가"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* 3. 컨텍스트 메뉴 (노래 추가용) */}
            {contextMenu.visible && (
                <div 
                    className="context-menu" 
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()} // 메뉴 클릭 시 닫히는 것 방지
                >
                    <ul role="menu">
                        <li className="context-menu-title" role="presentation">
                            플레이리스트에 추가:
                        </li>
                        {playlists.length > 0 ? (
                            playlists.map(p => (
                                <li 
                                    key={p.id} 
                                    className="context-menu-item"
                                    role="menuitem"
                                    onClick={() => handleAddTrackToPlaylist(contextMenu.track, p.id)}
                                >
                                    {p.name}
                                </li>
                            ))
                        ) : (
                            <li className="context-menu-item disabled" role="presentation">
                                생성된 플레이리스트가 없습니다.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;