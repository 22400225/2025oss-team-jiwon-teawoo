// src/App.js

import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* 1. 사이드바 (Navigation) */}
      <nav className="sidebar" aria-label="메인 탐색">
        <h1 className="logo">Handong Music</h1>
        <ul className="playlist-list">
          <li className="playlist-item">
            <button className="add-folder-btn" aria-label="폴더 추가">
              <span className="icon" aria-hidden="true">+</span> 폴더 추가
            </button>
          </li>
        </ul>
      </nav>

      {/* 2. 메인 콘텐츠 (Music List) */}
      <main className="main-content">
        {/* 검색 및 필터 영역 */}
        <header className="search-filter-area">
          <div className="search-bar" role="search">
            {/* class -> className, input 단일 태그는 닫아줌 */}
            <input type="search" id="music-search" placeholder="검색" aria-label="음악 검색 입력" />
            <button className="search-icon-btn" aria-label="검색 실행">
              <span className="icon" aria-hidden="true">🔍</span>
            </button>
          </div>
          <div className="controls-area">
            <button className="settings-btn" aria-label="설정 열기">
              <span className="icon" aria-hidden="true">⚙️</span>
            </button>
          </div>
        </header>

        {/* 음악 목록 헤더 */}
        <div className="music-list-header" role="rowgroup">
          <span className="header-col img-col" role="columnheader" aria-label="이미지">IMG</span>
          <span className="header-col title-col" role="columnheader" aria-sort="none">제목</span>
          <span className="header-col artist-col" role="columnheader" aria-sort="none">Artist</span>
          <span className="header-col album-col" role="columnheader" aria-sort="none">앨범</span>
          <span className="header-col duration-col" role="columnheader" aria-label="재생 시간">
            <span className="icon" aria-hidden="true">⏱️</span>
          </span>
        </div>

        {/* 실제 음악 목록 (이후 Spotify API 데이터를 받아 .map()으로 동적 생성) */}
        <section className="music-list-body" role="list">
          {/* 예시 항목 */}
          <div className="music-item" role="listitem" tabIndex="0">
            <div className="item-col img-col">[Image]</div>
            <div className="item-col title-col">노래 제목 A</div>
            <div className="item-col artist-col">아티스트 이름 X</div>
            <div className="item-col album-col">앨범 이름 1</div>
            <div className="item-col duration-col">3:45</div>
          </div>
          <div className="music-item" role="listitem" tabIndex="0">
            <div className="item-col img-col">[Image]</div>
            <div className="item-col title-col">노래 제목 B (현재 재생 중)</div>
            <div className="item-col album-col">앨범 이름 2</div>
            <div className="item-col duration-col">2:59</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;