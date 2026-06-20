import { useEffect } from 'react';
import { useCameraStore } from '@/store/useCameraStore';

export function useWindowMonitor() {
  const setWindowSize = useCameraStore((state) => state.setWindowSize);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [setWindowSize]);
}
