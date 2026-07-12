"use client";

import React from 'react';
import { useTimers } from '@/context/TimerContext';
import Button from '../ui/Button';

export default function YoutubeAlarmPlayer() {
  const { playingYoutubeUrl, setPlayingYoutubeUrl } = useTimers();

  if (!playingYoutubeUrl) return null;

  // Extract video ID from youtube url
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeVideoId(playingYoutubeUrl);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {videoId ? (
        <iframe
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
          allow="autoplay"
          title="Youtube Alarm"
          className="opacity-0 pointer-events-none absolute"
        />
      ) : null}
      
      <div className="bg-theme-bg border border-theme-accent p-4 shadow-lg shadow-theme-accent/20 flex flex-col items-center gap-4">
        <div className="text-theme-accent font-bold animate-pulse">
          ALARM PLAYING
        </div>
        <Button 
          label="[STOP ALARM]" 
          color="red" 
          onClick={() => setPlayingYoutubeUrl(null)} 
        />
      </div>
    </div>
  );
}
