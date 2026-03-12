"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Shuffle, Repeat, Repeat1, Mic2, Search, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Player } from "@/components/Player";
import { PlaylistInput } from "@/components/PlaylistInput";
import { PlayerBar } from "@/components/PlayerBar";
import { PlayerControls } from "@/components/PlayerControls";
import { PlaylistView } from "@/components/PlaylistView";
import { ProgressBar } from "@/components/ProgressBar";
import { VolumeControl } from "@/components/VolumeControl";
import { FavoritePlaylists } from "@/components/FavoritePlaylists";
import { LyricsView } from "@/components/LyricsView";
import { PiPButton } from "@/components/PiPButton";
import { SearchView } from "@/components/SearchView";
import { SettingsMenu } from "@/components/SettingsMenu";
import { SponsorSkipNotification } from "@/components/SponsorSkipNotification";
import { UserMenu } from "@/components/UserMenu";
import { GenreCards } from "@/components/GenreCards";
import { RadioBanner } from "@/components/RadioBanner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { useSponsorBlock } from "@/hooks/useSponsorBlock";
import { useVideoVotes } from "@/hooks/useVideoVotes";
import { useUserSync } from "@/hooks/useUserSync";
import { useRadioMode } from "@/hooks/useRadioMode";

const PLAYER_ID = "yt-player";

export default function Home() {
  const onProgressRef = useRef<((time: number) => void) | null>(null);

  const {
    state,
    loadPlaylist,
    togglePlay,
    pause,
    next,
    previous,
    playAt,
    setVolume,
    toggleMute,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    setPlaybackRate,
    toggleVideoMode,
    addToQueue,
    addExternalTrack,
  } = useYouTubePlayer(PLAYER_ID, onProgressRef);

  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const userSync = useUserSync();

  const { radioState, startRadio, stopRadio, checkAndLoadMore } = useRadioMode(
    addExternalTrack,
    toggleShuffle,
    state.shuffle
  );
  const [radioLoadingGenre, setRadioLoadingGenre] = useState<string | null>(null);

  // 마지막 재생목록 자동 복원 (로그인 필수)
  useEffect(() => {
    if (state.isReady && state.playlistId && !playlistLoaded && !userSync.isLoading && userSync.user) {
      loadPlaylist(state.playlistId);
      setPlaylistLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isReady, userSync.isLoading, userSync.user]);

  // 라디오: 곡이 끝에 가까워지면 자동 추가 로드
  useEffect(() => {
    if (radioState.active) checkAndLoadMore(state.currentIndex, state.playlist.length);
  }, [radioState.active, state.currentIndex, state.playlist.length, checkAndLoadMore]);

  const handleLoadPlaylist = useCallback((playlistId: string) => {
    loadPlaylist(playlistId);
    setPlaylistLoaded(true);
    setShowSearch(false);
    if (radioState.active) stopRadio();
  }, [loadPlaylist, radioState.active, stopRadio]);

  const handleAddExternalTrack = useCallback(
    (videoId: string, meta: { title: string; duration?: number; uploader?: string }, playNow?: boolean) => {
      addExternalTrack(videoId, meta, playNow);
      if (playNow) setPlaylistLoaded(true);
    },
    [addExternalTrack]
  );

  // 라디오 시작 (로그인 불필요)
  const handleStartRadio = useCallback(async (genreId: string) => {
    setRadioLoadingGenre(genreId);
    await startRadio(genreId);
    setPlaylistLoaded(true);
    setRadioLoadingGenre(null);
  }, [startRadio]);

  const { timerState, setTimer } = useSleepTimer(pause);
  const sponsorBlock = useSponsorBlock(state.currentTrack?.videoId ?? null);

  useEffect(() => {
    onProgressRef.current = (currentTime: number) => {
      const skipTo = sponsorBlock.checkSegment(currentTime);
      if (skipTo !== null) seekTo(skipTo);
    };
  }, [sponsorBlock.checkSegment, seekTo]);

  const votes = useVideoVotes(state.currentTrack?.videoId ?? null);

  useEffect(() => {
    userSync.syncPreferences({
      volume: state.volume,
      playbackRate: state.playbackRate,
      videoMode: state.videoMode,
      lastPlaylistId: state.playlistId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.volume, state.playbackRate, state.videoMode, state.playlistId]);

  useEffect(() => {
    userSync.syncPreferences({ sponsorBlockEnabled: sponsorBlock.enabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsorBlock.enabled]);

  const handleVolumeUp = useCallback(() => setVolume(Math.min(100, state.volume + 5)), [setVolume, state.volume]);
  const handleVolumeDown = useCallback(() => setVolume(Math.max(0, state.volume - 5)), [setVolume, state.volume]);
  const handleSeekForward = useCallback(() => seekTo(Math.min(state.duration, state.currentTime + 5)), [seekTo, state.duration, state.currentTime]);
  const handleSeekBackward = useCallback(() => seekTo(Math.max(0, state.currentTime - 5)), [seekTo, state.currentTime]);
  const handleToggleLyrics = useCallback(() => setShowLyrics((p) => !p), []);
  const handleToggleSearch = useCallback(() => setShowSearch((p) => !p), []);
  const handleToggleSponsorBlock = useCallback(() => sponsorBlock.toggleEnabled(), [sponsorBlock.toggleEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboardShortcuts({
    onTogglePlay: togglePlay, onNext: next, onPrevious: previous,
    onVolumeUp: handleVolumeUp, onVolumeDown: handleVolumeDown,
    onToggleMute: toggleMute, onSeekForward: handleSeekForward,
    onSeekBackward: handleSeekBackward, onToggleVideoMode: toggleVideoMode,
    onToggleLyrics: handleToggleLyrics, onToggleSearch: handleToggleSearch,
    onToggleSponsorBlock: handleToggleSponsorBlock,
    hasTrack: state.currentTrack !== null,
  });

  const isVideoVisible = state.videoMode && !!state.currentTrack && playlistLoaded;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between px-4 h-14">
          {/* 로고 */}
          <div className="flex items-center gap-2 select-none">
            <span className="text-lg font-semibold tracking-tight">YT BG</span>
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`size-8 ${showSearch ? "text-foreground" : "text-muted-foreground"}`}
              onClick={() => userSync.user ? handleToggleSearch() : userSync.signIn()}
              title="검색 (S)"
            >
              <Search className="size-4" />
            </Button>

            {playlistLoaded && (
              <>
                <FavoritePlaylists
                  currentPlaylistId={state.playlistId}
                  playlist={state.playlist}
                  onLoadPlaylist={handleLoadPlaylist}
                  user={userSync.user}
                  favorites={userSync.favorites}
                  isFavorite={userSync.isFavorite}
                  addFavorite={userSync.addFavorite}
                  removeFavorite={userSync.removeFavorite}
                  onSignIn={userSync.signIn}
                />
                <PiPButton
                  track={state.currentTrack}
                  isPlaying={state.isPlaying}
                  onTogglePlay={togglePlay}
                  onNext={next}
                  onPrevious={previous}
                />
                <SettingsMenu
                  playbackRate={state.playbackRate}
                  onRateChange={setPlaybackRate}
                  timerState={timerState}
                  onSetTimer={setTimer}
                  sponsorBlockEnabled={sponsorBlock.enabled}
                  sponsorBlockSegmentCount={sponsorBlock.segments.length}
                  onToggleSponsorBlock={handleToggleSponsorBlock}
                  videoMode={state.videoMode}
                  onToggleVideoMode={toggleVideoMode}
                />
              </>
            )}

            <UserMenu
              user={userSync.user}
              isLoading={userSync.isLoading}
              onSignIn={userSync.signIn}
              onSignOut={userSync.signOut}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── 메인 ── */}
      <main className="flex-1 mx-auto max-w-screen-xl w-full px-4 py-8 pb-28 md:pb-32">
        <Player id={PLAYER_ID} videoMode={isVideoVisible} />

        {showSearch ? (
          <SearchView
            onLoadPlaylist={handleLoadPlaylist}
            onAddTrack={handleAddExternalTrack}
            onClose={() => setShowSearch(false)}
          />

        ) : !playlistLoaded ? (
          /* ── 초기 화면 ── */
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
            {/* 히어로 */}
            <div className="text-center space-y-3 max-w-md">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">라디오 플레이어</p>
              <h2 className="text-3xl font-bold tracking-tight">원하는 장르를 선택하세요</h2>
              <p className="text-sm text-muted-foreground">
                탭을 전환해도 음악이 계속 재생됩니다
              </p>
            </div>

            {/* 장르 카드 — 비로그인도 사용 가능 */}
            {!userSync.isLoading && (
              <div className="w-full max-w-2xl space-y-6">
                <GenreCards
                  onSelectGenre={handleStartRadio}
                  loadingGenreId={radioLoadingGenre}
                />

                {/* 로그인 사용자: 재생목록 URL 입력 */}
                {userSync.user && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t" />
                      <span className="text-xs text-muted-foreground">또는 재생목록 URL 입력</span>
                      <div className="flex-1 border-t" />
                    </div>
                    <PlaylistInput onLoadPlaylist={handleLoadPlaylist} isLoading={state.isLoading} />
                  </>
                )}

                {/* 비로그인: 하단 로그인 유도 (작게) */}
                {!userSync.user && (
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    <button
                      onClick={userSync.signIn}
                      className="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
                    >
                      <LogIn className="size-3" />
                      로그인
                    </button>
                    {" "}하면 즐겨찾기와 재생목록 URL 입력이 가능합니다
                  </p>
                )}
              </div>
            )}
          </div>

        ) : (
          /* ── 재생 화면 ── */
          <div className="space-y-4">
            {/* 라디오 배너 */}
            <RadioBanner radioState={radioState} onStop={stopRadio} />

            {/* URL 입력 (데스크탑, 로그인 시만) */}
            {userSync.user && (
              <div className="hidden md:block">
                <PlaylistInput onLoadPlaylist={handleLoadPlaylist} isLoading={state.isLoading} />
              </div>
            )}

            {/* 모바일 현재 곡 카드 */}
            {state.currentTrack && (
              <Card className="md:hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col items-center gap-4">
                    {!state.videoMode && (
                      <img
                        src={state.currentTrack.thumbnail}
                        alt={state.currentTrack.title}
                        className="w-full max-w-[240px] aspect-video rounded-lg object-cover"
                      />
                    )}

                    <div className="text-center w-full space-y-0.5">
                      <h3 className="text-base font-semibold leading-tight line-clamp-2">
                        {state.currentTrack.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {state.currentTrack.author}
                      </p>
                    </div>

                    <ProgressBar
                      currentTime={state.currentTime}
                      duration={state.duration}
                      onSeek={seekTo}
                      segments={sponsorBlock.enabled ? sponsorBlock.segments : undefined}
                    />

                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="ghost" size="icon"
                        className={`size-9 ${state.shuffle ? "text-primary" : "text-muted-foreground"}`}
                        onClick={toggleShuffle}
                      >
                        <Shuffle className="size-4" />
                      </Button>
                      <VolumeControl
                        volume={state.volume} isMuted={state.isMuted}
                        onVolumeChange={setVolume} onToggleMute={toggleMute}
                      />
                      <Button
                        variant="ghost" size="icon"
                        className={`size-9 ${state.repeat !== "off" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={cycleRepeat}
                      >
                        {state.repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={`size-9 ${showLyrics ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setShowLyrics(!showLyrics)}
                      >
                        <Mic2 className="size-4" />
                      </Button>
                    </div>

                    {showLyrics && (
                      <div className="w-full h-[200px] border rounded-lg overflow-hidden">
                        <LyricsView
                          title={state.currentTrack.title}
                          artist={state.currentTrack.author}
                          currentTime={state.currentTime}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 데스크탑 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              {/* 현재 곡 (데스크탑) */}
              {state.currentTrack && (
                <Card className="hidden md:block">
                  <CardContent className="p-6 space-y-5">
                    <div className={state.videoMode ? "" : "flex gap-5"}>
                      {!state.videoMode && (
                        <img
                          src={state.currentTrack.thumbnail}
                          alt={state.currentTrack.title}
                          className="w-44 lg:w-56 aspect-video rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <h3 className="text-xl font-semibold leading-tight line-clamp-2">
                          {state.currentTrack.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {state.currentTrack.author}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {state.currentIndex + 1} / {state.playlist.length}
                          {state.queue.length > 0 && (
                            <span className="ml-2 text-primary">· 큐 {state.queue.length}곡</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <ProgressBar
                      currentTime={state.currentTime}
                      duration={state.duration}
                      onSeek={seekTo}
                      segments={sponsorBlock.enabled ? sponsorBlock.segments : undefined}
                    />

                    <div className="flex items-center justify-center gap-2">
                      <PlayerControls
                        isPlaying={state.isPlaying}
                        shuffle={state.shuffle}
                        repeat={state.repeat}
                        hasTrack
                        onTogglePlay={togglePlay}
                        onNext={next}
                        onPrevious={previous}
                        onToggleShuffle={toggleShuffle}
                        onCycleRepeat={cycleRepeat}
                      />
                      <Button
                        variant="ghost" size="icon"
                        className={`size-9 ${showLyrics ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setShowLyrics(!showLyrics)}
                        title="가사"
                      >
                        <Mic2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 가사 (데스크탑) */}
              {showLyrics && state.currentTrack && (
                <Card className="hidden md:block">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Mic2 className="size-3.5" />
                      가사
                    </p>
                    <div className="h-[240px]">
                      <LyricsView
                        title={state.currentTrack.title}
                        artist={state.currentTrack.author}
                        currentTime={state.currentTime}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 재생목록 */}
              <Card className={`lg:row-start-1 lg:col-start-2 ${showLyrics && state.currentTrack ? "lg:row-span-3" : "lg:row-span-2"}`}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    재생목록 · {state.playlist.length}곡
                  </p>
                  <div className="h-[300px] lg:h-[480px]">
                    <PlaylistView
                      playlist={state.playlist}
                      currentIndex={state.currentIndex}
                      isPlaying={state.isPlaying}
                      isLoading={state.isLoading}
                      trackMeta={state.trackMeta}
                      queue={state.queue}
                      onPlayAt={playAt}
                      onAddToQueue={addToQueue}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <SponsorSkipNotification
        category={sponsorBlock.lastSkippedCategory}
        onDismiss={sponsorBlock.clearNotification}
      />

      <InstallPrompt />

      {playlistLoaded && (
        <PlayerBar
          state={state}
          votes={votes}
          segments={sponsorBlock.enabled ? sponsorBlock.segments : undefined}
          onTogglePlay={togglePlay}
          onNext={next}
          onPrevious={previous}
          onToggleShuffle={toggleShuffle}
          onCycleRepeat={cycleRepeat}
          onSeek={seekTo}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
}
