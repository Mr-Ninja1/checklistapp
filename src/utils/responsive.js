import { useWindowDimensions, PixelRatio } from 'react-native';
import { useMemo } from 'react';

// Base guideline sizes (iPad landscape like 1024x768 reference)
const guidelineBaseWidth = 1024; // target landscape tablet width
const guidelineBaseHeight = 768;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  const scale = useMemo(() => {
    // scale based on width when in landscape primarily
    const base = isLandscape ? guidelineBaseWidth : guidelineBaseHeight;
    return width / base;
  }, [width, height, isLandscape]);

  const verticalScale = useMemo(() => {
    const base = isLandscape ? guidelineBaseHeight : guidelineBaseWidth;
    return height / base;
  }, [width, height, isLandscape]);

  function s(size) {
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  }

  function vs(size) {
    return Math.round(PixelRatio.roundToNearestPixel(size * verticalScale));
  }

  function ms(size, factor = 0.5) {
    return Math.round(PixelRatio.roundToNearestPixel(size + (s(size) - size) * factor));
  }

  return { width, height, isLandscape, s, vs, ms, scale, verticalScale };
}

export default useResponsive;
