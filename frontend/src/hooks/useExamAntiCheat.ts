import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';

interface UseExamAntiCheatOptions {
  sessionId: number;
  onWarning?: () => void;
  onMaxViolation?: () => void;
}

export const useExamAntiCheat = ({
  sessionId,
  onWarning,
  onMaxViolation
}: UseExamAntiCheatOptions) => {
  const [screenSwitchCount, setScreenSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const maxScreenSwitches = 3;
  const isInExam = useRef(true);

  const handleVisibilityChange = useCallback(() => {
    if (!isInExam.current) return;

    if (document.hidden) {
      setScreenSwitchCount((prev) => {
        const newCount = prev + 1;
        
        apiService.reportScreenSwitch(sessionId).catch(console.error);
        
        if (newCount >= maxScreenSwitches) {
          onMaxViolation?.();
        } else if (newCount >= 1) {
          onWarning?.();
        }
        
        return newCount;
      });
    }
  }, [sessionId, onWarning, onMaxViolation]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleCopyCut = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    enterFullscreen();

    return () => {
      isInExam.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [
    handleVisibilityChange,
    handleContextMenu,
    handleCopyCut,
    handlePaste,
    handleFullscreenChange,
    enterFullscreen
  ]);

  return {
    screenSwitchCount,
    maxScreenSwitches,
    isFullscreen,
    enterFullscreen,
    exitFullscreen
  };
};
