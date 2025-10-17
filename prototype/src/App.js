import React, { useState } from 'react';
import './App.css';

// 플레이리스트 생성 모달 컴포넌트
function CreatePlaylistModal({ onClose, onCreate }) {
    const [name, setName] = useState('');
    const [cover, setCover] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, cover);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>새 플레이리스트 생성</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <label htmlFor="playlist-name">이름</label>
                    <input
                        id="playlist-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="플레이리스트 이름"
                        required
                    />
                    <label htmlFor="playlist-cover">커버 이미지 URL (선택 사항)</label>
                    <input
                        id="playlist-cover"
                        type="text"
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                    />
                    <div className="modal-actions">
                        <button type="button" className="modal-button cancel" onClick={onClose}>취소</button>
                        <button type="submit" className="modal-button confirm">생성</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function App() {
    // React 상태(state)를 사용하여 데이터 관리
    const [query, setQuery] = useState(''); // 검색어 상태
    const [tracks, setTracks] = useState([]); // 노래 목록 상태
    const [message, setMessage] = useState('듣고 싶은 노래를 검색해 보세요!'); // 메시지 상태

    // 플레이리스트 관련 상태
    const [playlists, setPlaylists] = useState([]);
    const [activeView, setActiveView] = useState({ type: 'search' }); // 'search' 또는 'playlist'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dropdownOpenFor, setDropdownOpenFor] = useState(null); // 드롭다운 메뉴 ID
    const [notification, setNotification] = useState('');

    // 알림 메시지 표시 함수 (alert 대체)
    const showNotification = (text) => {
        setNotification(text);
        setTimeout(() => setNotification(''), 3000); // 3초 후 사라짐
    };

    // 검색 실행 함수
    const handleSearch = async (event) => {
        event.preventDefault();
        if (!query.trim()) return;

        setActiveView({ type: 'search' });
        setMessage(`"${query}" 검색 중... 🎧`);
        setTracks([]);

        try {
            const response = await fetch('/.netlify/functions/spotify-auth');
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || 'API 인증에 실패했습니다.');
            }
            const accessToken = data.accessToken;

            const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`;
            const searchResponse = await fetch(searchUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

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
            setMessage(`오류가 발생했습니다: ${error.message}`);
        }
    };

    // 플레이리스트 생성 처리
    const handleCreatePlaylist = (name, cover) => {
        const newPlaylist = {
            id: Date.now(),
            name,
            cover: cover || `https://via.placeholder.com/100?text=${encodeURIComponent(name.substring(0, 1))}`,
            tracks: [],
        };
        setPlaylists([...playlists, newPlaylist]);
        setIsModalOpen(false);
        showNotification(`'${name}' 플레이리스트가 생성되었습니다.`);
    };

    // 노래를 플레이리스트에 추가
    const handleAddSongToPlaylist = (playlistId, trackToAdd) => {
        setPlaylists(playlists.map(p => {
            if (p.id === playlistId) {
                if (p.tracks.some(t => t.id === trackToAdd.id)) {
                    showNotification('이미 추가된 노래입니다.');
                    return p;
                }
                showNotification(`'${trackToAdd.name}'을(를) '${p.name}'에 추가했습니다.`);
                return { ...p, tracks: [...p.tracks, trackToAdd] };
            }
            return p;
        }));
        setDropdownOpenFor(null);
    };

    // 노래 아이템 렌더링 함수
    const renderSongItem = (track, isPlaylistView = false) => {
        const fullArtistInfo = `${track.artists.map(artist => artist.name).join(', ')} - ${track.album.name}`;
        return (
            <div className="song-item" key={track.id}>
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
                <div className="song-actions">
                    <button className="action-button play-button" onClick={() => window.open(track.external_urls.spotify, '_blank')}>
                        <svg viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" /></svg>
                    </button>
                    {!isPlaylistView && (
                        <div className="add-to-playlist-container">
                            <button
                                className="action-button add-song-btn"
                                onClick={() => {
                                    if (playlists.length === 0) {
                                        showNotification('먼저 플레이리스트를 생성해주세요!');
                                    } else {
                                        setDropdownOpenFor(dropdownOpenFor === track.id ? null : track.id);
                                    }
                                }}
                            >
                                <svg viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
                            </button>
                            {dropdownOpenFor === track.id && (
                                <div className="playlist-dropdown">
                                    {playlists.map(p => (
                                        <div key={p.id} className="playlist-dropdown-item" onClick={() => handleAddSongToPlaylist(p.id, track)}>
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // 메인 컨텐츠 렌더링 (검색 결과 vs 플레이리스트)
    const renderContent = () => {
        if (activeView.type === 'playlist') {
            const playlist = playlists.find(p => p.id === activeView.id);
            if (!playlist) return <p className="message">플레이리스트를 찾을 수 없습니다.</p>;

            return (<>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{playlist.name}</h2>
                {playlist.tracks.length > 0
                    ? <div id="song-list">{playlist.tracks.map(track => renderSongItem(track, true))}</div>
                    : <p className="message">이 플레이리스트에 노래가 없습니다.</p>
                }
            </>);
        }
        return (<>
            {message && <p className="message">{message}</p>}
            <div id="song-list">{tracks.map(track => renderSongItem(track))}</div>
        </>);
    };

    // 화면을 그리는 부분 (JSX)
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <h2>Playlist</h2>
                <ul className="playlist-list">
                    {playlists.map(p => (
                        <li
                            key={p.id}
                            className={`playlist-item ${activeView.type === 'playlist' && activeView.id === p.id ? 'active' : ''}`}
                            onClick={() => setActiveView({ type: 'playlist', id: p.id })}
                        >
                            <img src={p.cover} alt={`${p.name} cover`} className="playlist-cover" />
                            <span>{p.name}</span>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="main-content">
                <header className="header">
                    <h1 onClick={() => setActiveView({ type: 'search' })}>Handong Music</h1>
                    <button className="add-playlist-btn" onClick={() => setIsModalOpen(true)}>+</button>
                </header>
                <div id="search-container">
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
                    {renderContent()}
                </div>
            </main>

            {isModalOpen && <CreatePlaylistModal onClose={() => setIsModalOpen(false)} onCreate={handleCreatePlaylist} />}
            <div className={`notification ${notification ? 'show' : ''}`}>{notification}</div>
        </div>
    );
}

export default App;