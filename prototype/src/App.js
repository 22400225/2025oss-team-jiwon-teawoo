import React, { useState, useEffect } from 'react';
import './App.css';

//플레이리스트 생성 모달 컴포넌트
function CreatePlaylistModal({ onClose, onCreate }) {
    // ... (모달 코드는 동일)
    const [name, setName] = useState('');
    const [cover, setCover] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, cover);
            onClose(); // 생성 후 모달 닫기
        }
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>새 플레이리스트 생성</h2>
                <form className="modal-form" onSubmit={handleSubmit}>

                    <label htmlFor="playlist-name">이름</label>
                    <input id="playlist-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="플레이리스트 이름" required />

                    <label htmlFor="playlist-cover">커버 이미지 URL (선택 사항)</label>
                    <input id="playlist-cover" type="text" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://example.com/image.jpg" />

                    <div className="modal-actions">
                        <button type="button" className="modal-button cancel" onClick={onClose}>취소</button>
                        <button type="submit" className="modal-button confirm">생성</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

//플레이리스트 수정 모달 컴포넌트(Update)
function EditPlaylistModal({ onClose, onUpdate, playlist }) {
    // ... (모달 코드는 동일)
    const [name, setName] = useState(playlist.name);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && name !== playlist.name) {
            onUpdate(playlist.id, name);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>플레이리스트 이름 수정</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <label htmlFor="edit-playlist-name">새 이름</label>
                    <input id="edit-playlist-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="플레이리스트 이름" required />

                    <div className="modal-actions">
                        <button type="button" className="modal-button cancel" onClick={onClose}>취소</button>
                        <button type="submit" className="modal-button confirm">수정</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

//노래를 플레이리스트에 추가하는 모달 컴포넌트
function AddToPlaylistModal({ onClose, onSelectPlaylist, playlists, track }) {
    // ... (모달 코드는 동일)
    if (!track) return null;
    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>플레이리스트에 추가</h2>
                <div className="add-song-info">
                    <img src={track.album.images[2]?.url || 'https://via.placeholder.com/64'} alt={track.name} />
                    <div>
                        <strong>{track.name}</strong>
                        <span>{track.artists.map(a => a.name).join(', ')}</span>
                    </div>
                </div>
                <ul className="modal-playlist-list">
                    {playlists.map(playlist => (
                        <li key={playlist.id} className="modal-playlist-item" onClick={() => onSelectPlaylist(playlist.id)} role="button" tabIndex="0">
                            <img src={playlist.cover} alt={`${playlist.name} cover`} className="playlist-cover" />
                            <span>{playlist.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function App() {
    // ... (기존 상태 관리 코드는 동일)
    const [query, setQuery] = useState('');
    const [tracks, setTracks] = useState([]);
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요! 🎧');
    const [playlists, setPlaylists] = useState(() => {
        try {
            const savedPlaylists = localStorage.getItem('myPlaylists');
            return savedPlaylists ? JSON.parse(savedPlaylists) : [];
        } catch (e) {
            console.error("Failed to load playlists from localStorage", e);
            return [];
        }
    });
    const [activeView, setActiveView] = useState({ type: 'search' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
    const [trackToAdd, setTrackToAdd] = useState(null);
    const [notification, setNotification] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ... (useEffect 코드는 동일)
    useEffect(() => {
        try {
            localStorage.setItem('myPlaylists', JSON.stringify(playlists));
        } catch (e) {
            console.error("Failed to save playlists to localStorage", e);
        }
    }, [playlists]);

    const showNotification = (text) => {
        setNotification(text);
        setTimeout(() => setNotification(''), 3000);
    };

    // [추가] 1. 밀리초(ms)를 "분:초" (mm:ss) 형식으로 변환하는 함수
    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        // 3:5 -> 3:05 처럼 0을 채워줍니다.
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    //노래 검색 함수(Read)
    const handleSearch = async (event) => {
        // ... (함수 내용은 동일)
        event.preventDefault();
        if (!query.trim()) return;
        setActiveView({ type: 'search' });
        setMessage(`"${query}" 검색 중...`);
        setTracks([]);
        try {
            const response = await fetch('/.netlify/functions/spotify-auth');
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'API 인증에 실패했습니다.');
            const accessToken = data.accessToken;
            const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`;
            const searchResponse = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!searchResponse.ok) throw new Error('API 요청 실패');
            const searchData = await searchResponse.json();
            if (searchData.tracks.items.length === 0) {
                setMessage(`"${query}"에 대한 검색 결과가 없습니다.`);
            } else {
                setTracks(searchData.tracks.items);
                setMessage('');
            }
        } catch (error) {
            console.error('노래 검색 오류:', error);
            setMessage(`오류가 발생했습니다: ${error.message} 🛑`);
        }
    };

    // ... (handleCreatePlaylist, handleUpdatePlaylistName, handleDeletePlaylist, handleAddSongClick, handleAddSongToPlaylist, handleRemoveTrackFromPlaylist, handlePlaylistClick 함수들은 모두 동일) ...
    //플레이리스트 생성 함수(Create)
    const handleCreatePlaylist = (name, cover) => {
        const newPlaylist = {
            id: Date.now(),
            name,
            cover: cover || `https://via.placeholder.com/100?text=${encodeURIComponent(name.substring(0, 1))}`,
            tracks: [],
        };
        setPlaylists([...playlists, newPlaylist]);
        setIsCreateModalOpen(false);
        showNotification(`'${name}' 플레이리스트가 생성되었습니다. ✅`);
    };

    //플레이리스트 이름 수정 함수(Update)
    const handleUpdatePlaylistName = (id, newName) => {
        setPlaylists(playlists.map(p =>
            p.id === id ? { ...p, name: newName } : p
        ));
        setIsEditModalOpen(false);
        showNotification(`플레이리스트 이름이 '${newName}'(으)로 수정되었습니다. ✏️`);
        if (activeView.type === 'playlist' && activeView.id === id) {
            // 수정 후 현재 플레이리스트 뷰를 유지하기 위해 강제 업데이트
            setActiveView({ type: 'playlist', id: id });
        }
    };

    //플레이리스트 삭제 함수 (Delete)
    const handleDeletePlaylist = (id, name) => {
        if (window.confirm(`정말로 플레이리스트 '${name}'을(를) 삭제하시겠습니까?`)) {
            setPlaylists(playlists.filter(p => p.id !== id));
            if (activeView.type === 'playlist' && activeView.id === id) {
                setActiveView({ type: 'search' });
                setMessage('플레이리스트가 삭제되었습니다.');
            }
            showNotification(`'${name}' 플레이리스트가 삭제되었습니다. 🗑️`);
            setIsSidebarOpen(false);
        }
    };

    const handleAddSongClick = (track) => {
        if (playlists.length === 0) {
            showNotification('먼저 플레이리스트를 생성해주세요! 💡');
            return;
        }
        setTrackToAdd(track);
        setIsAddSongModalOpen(true);
    };

    const handleAddSongToPlaylist = (playlistId) => {
        if (!trackToAdd) return;
        let songAdded = false;
        let playlistName = '';

        setPlaylists(playlists.map(p => {
            if (p.id === playlistId) {
                playlistName = p.name;
                if (p.tracks.some(t => t.id === trackToAdd.id)) {
                    showNotification('이미 추가된 노래입니다. ⚠️');
                    return p;
                }
                songAdded = true;
                return { ...p, tracks: [...p.tracks, trackToAdd] };
            }
            return p;
        }));

        if (songAdded) {
            showNotification(`'${trackToAdd.name}'을(를) '${playlistName}'에 추가했습니다. 👍`);
        }

        setIsAddSongModalOpen(false);
        setTrackToAdd(null);
    };

    //플레이리스트에서 노래 삭제 함수 (Delete)
    const handleRemoveTrackFromPlaylist = (playlistId, trackId, trackName) => {
        setPlaylists(playlists.map(p => {
            if (p.id === playlistId) {
                const newTracks = p.tracks.filter(t => t.id !== trackId);
                showNotification(`'${trackName}'을(를) '${p.name}'에서 제거했습니다. ➖`);
                return { ...p, tracks: newTracks };
            }
            return p;
        }));
    };

    const handlePlaylistClick = (playlistId) => {
        setActiveView({ type: 'playlist', id: playlistId });
        setIsSidebarOpen(false); //플레이리스트 선택 시 사이드바 닫기
    };


    // [수정] 2. renderSongItem 함수 내부에 재생 시간 <span> 추가
    const renderSongItem = (track, isPlaylistView = false, playlistId = null) => (
        <article className="song-item" key={track.id}>
            <img src={track.album.images[1]?.url || track.album.images[0]?.url || 'https://via.placeholder.com/100'} alt={`${track.album.name} 앨범 커버`} className="album-cover" />
            <div className="song-info">
                <h3 title={track.name}>{track.name}</h3>
                <p title={`${track.artists.map(artist => artist.name).join(', ')} - ${track.album.name}`}>
                    {track.artists.map(artist => artist.name).join(', ')} - <em>{track.album.name}</em>
                </p>
            </div>
            
            {/* --- [추가] 노래 재생 시간 --- */}
            <span className="track-duration">
                {formatDuration(track.duration_ms)}
            </span>
            {/* --- [추가] 끝 --- */}

            <div className="song-actions">
                <button className="action-button play-button" onClick={() => window.open(track.external_urls.spotify, '_blank')} aria-label={`${track.name} Spotify에서 재생`}>
                    <svg viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" /></svg>
                </button>
                {isPlaylistView ? ( //플레이리스트 보기일 경우 삭제 버튼 렌더링
                    <button
                        className="action-button remove-song-btn"
                        onClick={() => handleRemoveTrackFromPlaylist(playlistId, track.id, track.name)}
                        aria-label={`${track.name}을(를) 플레이리스트에서 제거`}
                    >
                        <svg viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                    </button>
                ) : (
                    //검색 결과 보기일 경우 추가 버튼 렌더링
                    <button className="action-button add-song-btn" onClick={() => handleAddSongClick(track)} aria-label={`${track.name}을(를) 플레이리스트에 추가`}>
                        <svg viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
                    </button>
                )}
            </div>
        </article>
    );

    const renderContent = () => {
        // ... (함수 내용은 동일)
        if (activeView.type === 'playlist') {
            const playlist = playlists.find(p => p.id === activeView.id);
            if (!playlist) return <p className="message">플레이리스트를 찾을 수 없습니다.</p>;

            return (
                <>
                    <div className="playlist-header">
                        <h2 style={{ color: 'var(--text-primary)' }}>{playlist.name}</h2>
                        <div className="playlist-actions">
                            <button className="edit-btn" onClick={() => setIsEditModalOpen(true)} aria-label="플레이리스트 이름 수정">
                                수정
                            </button>
                            <button className="delete-btn" onClick={() => handleDeletePlaylist(playlist.id, playlist.name)} aria-label="플레이리스트 삭제">
                                삭제
                            </button>
                        </div>
                    </div>

                    {playlist.tracks.length > 0
                        ? <div id="song-list" role="list">{playlist.tracks.map(track => renderSongItem(track, true, playlist.id))}</div>
                        : <p className="message">이 플레이리스트에 노래가 없습니다.</p>
                    }
                    {isEditModalOpen && <EditPlaylistModal onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdatePlaylistName} playlist={playlist} />}
                </>
            );
        }
        return (
            <>
                {message && <p className="message">{message}</p>}
                <div id="song-list" role="list">{tracks.map(track => renderSongItem(track))}</div>
            </>
        );
    };

    return (
        // ... (전체 JSX return 문은 동일)
        <>
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}

            <div className="app-layout">
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <h2>플레이리스트</h2>
                    <ul className="playlist-list" role="menu">
                        <li className="playlist-item create-new" onClick={() => setIsCreateModalOpen(true)} role="menuitem" tabIndex="0">
                            <span className="add-icon">+</span>
                            <span>새 플레이리스트 생성</span>
                        </li>
                        {playlists.map(p => (
                            <li
                                key={p.id}
                                className={`playlist-item ${activeView.type === 'playlist' && activeView.id === p.id ? 'active' : ''}`}
                                onClick={() => handlePlaylistClick(p.id)}
                                role="menuitem"
                                tabIndex="0"
                            >
                                <img src={p.cover} alt={`${p.name} 커버`} className="playlist-cover" />
                                <span>{p.name}</span>
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="main-content">
                    <header className="header" role="banner">
                        <div className="header-left">
                            <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label={isSidebarOpen ? "메뉴 닫기" : "메뉴 열기"}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" /></svg>
                            </button>
                            <h1 onClick={() => setActiveView({ type: 'search' })} role="link" tabIndex="0">Handong Music</h1>
                        </div>
                    </header>
                    <nav id="search-container" aria-label="음악 검색">
                        <form id="search-form" role="search" onSubmit={handleSearch}>
                            <label htmlFor="search-input" className="sr-only">검색어를 입력하세요</label>
                            <input type="text" id="search-input" placeholder="아티스트, 노래 제목, 앨범명 검색..." value={query} onChange={(e) => setQuery(e.target.value)} />
                            <button type="submit" id="search-button">검색</button>
                        </form>
                    </nav>

                    <div id="song-list-container">
                        {renderContent()}
                    </div>
                </main>

                {isCreateModalOpen && <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreatePlaylist} />}
                {isAddSongModalOpen && <AddToPlaylistModal onClose={() => setIsAddSongModalOpen(false)} onSelectPlaylist={handleAddSongToPlaylist} playlists={playlists} track={trackToAdd} />}
                <div className={`notification ${notification ? 'show' : ''}`}>{notification}</div>
            </div>
        </>
    );
}

export default App;