import React, { useRef, useState } from 'react';
import { View, TextInput } from 'react-native';

// A small wrapper that only focuses the inner TextInput when the touch is a tap
// (no significant movement). This lets drag/scroll gestures that start on inputs
// be interpreted as scrolls instead of immediate focus + keyboard open.
export default function DelayedFocusTextInput(props) {
  const inputRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const THRESHOLD = 6; // pixels

  // Expose focus via forwarded ref prop if given
  React.useImperativeHandle && React.useImperativeHandle(props.innerRef, () => ({
    focus: () => inputRef.current && inputRef.current.focus()
  }), []);

  const onTouchStart = (e) => {
    moved.current = false;
    try {
      const t = e.nativeEvent.touches && e.nativeEvent.touches[0];
      if (t) {
        touchStart.current = { x: t.pageX, y: t.pageY };
      }
    } catch (err) { /* ignore */ }
    props.onTouchStart && props.onTouchStart(e);
  };

  const onTouchMove = (e) => {
    try {
      const t = e.nativeEvent.touches && e.nativeEvent.touches[0];
      if (t) {
        const dx = Math.abs(t.pageX - touchStart.current.x);
        const dy = Math.abs(t.pageY - touchStart.current.y);
        if (dx > THRESHOLD || dy > THRESHOLD) moved.current = true;
      }
    } catch (err) { /* ignore */ }
    props.onTouchMove && props.onTouchMove(e);
  };

  const onTouchEnd = (e) => {
    // If there was no significant movement, treat this as a tap and focus
    if (!moved.current) {
      // Small timeout to allow ScrollView to finish its gesture handling
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    }
    props.onTouchEnd && props.onTouchEnd(e);
  };

  return (
    <View
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      // Important: we don't set responder props so the ScrollView can still handle
      // the gesture; we just observe touch events.
    >
      <TextInput
        ref={inputRef}
        {...props}
      />
    </View>
  );
}
