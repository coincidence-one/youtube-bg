"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Shuffle, Repeat, Repeat1, Mic2, Search } from "lucide-react";
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
import { SleepTimer } from "@/components/SleepTimer";
import { PlaybackSpeed } from "@/components/PlaybackSpeed";
import { KeyboardHint } from "@/components/KeyboardHint";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { FavoritePlaylists } from "@/components/FavoritePlaylists";
import { LyricsView } from "@/components/LyricsView";
import { PiPButton } from "@/components/PiPButton";
import { SearchView } from "@/components/SearchView";
import { SponsorBlockToggle } from "@/components/SponsorBlockToggle";
import { SponsorSkipNotification } from "@/components/SponsorSkipNotification";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { useSponsorBlock } from "@/hooks/useSponsorBlock";
import { useVideoVotes } from "@/hooks/useVideoVotes";

const PLAYER_ID = "yt-player";

export default function Home() {
  // SponsorBlock 진행률 콜백 ref
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
    removeFromQueue,
    clearQueue,
    addExternalTrack,
  } = useYouTubePlayer(PLAYER_ID, onProgressRef);

  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // localStorage에서 마지막 재생목록 자동 복원
  useEffect(() => {
    if (state.isReady && state.playlistId && !playlistLoaded) {
      loadPlaylist(state.playlistId);
      setPlaylistLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isReady]);

  const handleLoadPlaylist = (playlistId: string) => {
    loadPlaylist(playlistId);
    setPlaylistLoaded(true);
    setShowSearch(false);
  };

  // 외부 트랙 추가 (검색에서)
  const handleAddExternalTrack = useCallback(
    (
      videoId: string,
      meta: { title: string; duration?: number; uploader?: string },
      playNow?: boolean
    ) => {
      addExternalTrack(videoId, meta, playNow);
      if (playNow) setPlaylistLoaded(true);
    },
    [addExternalTrack]
  );

  // 슬립 타이머
  const { timerState, setTimer } = useSleepTimer(pause);

  // SponsorBlock
  const sponsorBlock = useSponsorBlock(state.currentTrack?.videoId ?? null);

  // SponsorBlock 자동 스킵 콜백
  useEffect(() => {
    onProgressRef.current = (currentTime: number) => {
      const skipTo = sponsorBlock.checkSegment(currentTime);
      if (skipTo !== null) {
        seekTo(skipTo);
      }
    };
  }, [sponsorBlock.checkSegment, seekTo]);

  // Return YouTube Dislike
  const votes = useVideoVotes(state.currentTrack?.videoId ?? null);

  // 키보드 단축키
  const handleVolumeUp = useCallback(() => {
    setVolume(Math.min(100, state.volume + 5));
  }, [setVolume, state.volume]);

  const handleVolumeDown = useCallback(() => {
    setVolume(Math.max(0, state.volume - 5));
  }, [setVolume, state.volume]);

  const handleSeekForward = useCallback(() => {
    seekTo(Math.min(state.duration, state.currentTime + 5));
  }, [seekTo, state.duration, state.currentTime]);

  const handleSeekBackward = useCallback(() => {
    seekTo(Math.max(0, state.currentTime - 5));
  }, [seekTo, state.currentTime]);

  const handleToggleLyrics = useCallback(() => {
    setShowLyrics((prev) => !prev);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  const handleToggleSponsorBlock = useCallback(() => {
    sponsorBlock.toggleEnabled();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsorBlock.toggleEnabled]);

  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onNext: next,
    onPrevious: previous,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onToggleMute: toggleMute,
    onSeekForward: handleSeekForward,
    onSeekBackward: handleSeekBackward,
    onToggleVideoMode: toggleVideoMode,
    onToggleLyrics: handleToggleLyrics,
    onToggleSearch: handleToggleSearch,
    onToggleSponsorBlock: handleToggleSponsorBlock,
    hasTrack: state.currentTrack !== null,
  });

  const isVideoVisible = state.videoMode && !!state.currentTrack && playlistLoaded;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Headphones className="size-5 text-primary" />
            <h1 className="font-semibold text-lg">YouTube BG</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`size-8 ${showSearch ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={handleToggleSearch}
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
                />
                <SponsorBlockToggle
                  enabled={sponsorBlock.enabled}
                  segmentCount={sponsorBlock.segments.length}
                  onToggle={sponsorBlock.toggleEnabled}
                />
                <PiPButton
                  track={state.currentTrack}
                  isPlaying={state.isPlaying}
                  onTogglePlay={togglePlay}
                  onNext={next}
                  onPrevious={previous}
                />
                <ViewModeToggle videoMode={state.videoMode} onToggle={toggleVideoMode} />
                <SleepTimer timerState={timerState} onSetTimer={setTimer} />
                <PlaybackSpeed rate={state.playbackRate} onRateChange={setPlaybackRate} />
                <KeyboardHint />
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 mx-auto max-w-screen-2xl w-full px-4 py-6 pb-28 md:pb-32">
        {/* YouTube 플레이어 - 항상 DOM에 존재, videoMode일 때만 보임 */}
        <Player id={PLAYER_ID} videoMode={isVideoVisible} />

        {showSearch ? (
          /* 검색 화면 */
          <SearchView onLoadPlaylist={handleLoadPlaylist} onAddTrack={handleAddExternalTrack} onClose={() => setShowSearch(false)} />
        ) : !playlistLoaded ? (
          /* 초기 화면: 재생목록 입력 */
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 mb-4">
                <Headphones className="size-10 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">YouTube BG Player</h2>
              <p className="text-muted-foreground max-w-md">
                YouTube 재생목록 URL을 입력하면 백그라운드에서 음악을 들을 수 있습니다.
                탭을 전환해도 재생이 계속됩니다.
              </p>
            </div>
            <PlaylistInput onLoadPlaylist={handleLoadPlaylist} isLoading={state.isLoading} />
          </div>
        ) : (
          /* 재생 화면 */
          <div className="space-y-6">
            {/* 상단: URL 입력 (축소 버전) */}
            <PlaylistInput onLoadPlaylist={handleLoadPlaylist} isLoading={state.isLoading} />

            {/* 현재 재생 중인 곡 정보 (모바일/태블릿) */}
            {state.currentTrack && (
              <Card className="md:hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center gap-4">
                    {/* 노래 모드일 때만 썸네일 표시 */}
                    {!state.videoMode && (
                      <img
                        src={state.currentTrack.thumbnail}
                        alt={state.currentTrack.title}
                        className="w-full max-w-xs aspect-video rounded-lg object-cover"
                      />
                    )}
                    <div className="text-center w-full">
                      <h3 className="font-semibold truncate">{state.currentTrack.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{state.currentTrack.author}</p>
                    </div>

                    {/* 모바일 전용 프로그레스바 */}
                    <ProgressBar
                      currentTime={state.currentTime}
                      duration={state.duration}
                      onSeek={seekTo}
                      segments={sponsorBlock.enabled ? sponsorBlock.segments : undefined}
                    />

                    {/* 모바일 전용 추가 컨트롤 */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`size-9 ${state.shuffle ? "text-primary" : "text-muted-foreground"}`}
                        onClick={toggleShuffle}
                      >
                        <Shuffle className="size-4" />
                      </Button>
                      <VolumeControl
                        volume={state.volume}
                        isMuted={state.isMuted}
                        onVolumeChange={setVolume}
                        onToggleMute={toggleMute}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`size-9 ${state.repeat !== "off" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={cycleRepeat}
                      >
                        {state.repeat === "one" ? (
                          <Repeat1 className="size-4" />
                        ) : (
                          <Repeat className="size-4" />
                        )}
                      </Button>
                      {/* 가사 토글 (모바일) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`size-9 ${showLyrics ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setShowLyrics(!showLyrics)}
                        title="가사"
                      >
                        <Mic2 className="size-4" />
                      </Button>
                    </div>

                    {/* 가사 표시 (모바일) */}
                    {showLyrics && state.currentTrack && (
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

            {/* 데스크탑: 현재 곡 + 가사 + 재생목록 */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* 현재 재생 중인 곡 (데스크탑) */}
              {state.currentTrack && (
                <Card className="hidden md:block">
                  <CardContent className="p-6 space-y-5">
                    <div className={state.videoMode ? "" : "flex gap-6"}>
                      {/* 노래 모드일 때만 썸네일 표시 */}
                      {!state.videoMode && (
                        <img
                          src={state.currentTrack.thumbnail}
                          alt={state.currentTrack.title}
                          className="w-48 lg:w-64 aspect-video rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h3 className="text-xl font-semibold truncate">{state.currentTrack.title}</h3>
                        <p className="text-muted-foreground truncate mt-1">{state.currentTrack.author}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          곡 {state.currentIndex + 1} / {state.playlist.length}
                          {state.queue.length > 0 && (
                            <span className="ml-2 text-primary">큐: {state.queue.length}곡</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 프로그레스바 */}
                    <ProgressBar
                      currentTime={state.currentTime}
                      duration={state.duration}
                      onSeek={seekTo}
                      segments={sponsorBlock.enabled ? sponsorBlock.segments : undefined}
                    />

                    {/* 컨트롤 */}
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
                      {/* 가사 토글 (데스크탑) */}
                      <Button
                        variant="ghost"
                        size="icon"
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

              {/* 가사 패널 (데스크탑) */}
              {showLyrics && state.currentTrack && (
                <Card className="hidden md:block">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Mic2 className="size-3.5" />
                      가사
                    </h3>
                    <div className="h-[250px]">
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
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                    재생목록 ({state.playlist.length}곡)
                  </h3>
                  <div className="h-[300px] lg:h-[500px]">
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

      {/* SponsorBlock 스킵 알림 */}
      <SponsorSkipNotification
        category={sponsorBlock.lastSkippedCategory}
        onDismiss={sponsorBlock.clearNotification}
      />

      {/* 하단 고정 플레이어 바 */}
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
