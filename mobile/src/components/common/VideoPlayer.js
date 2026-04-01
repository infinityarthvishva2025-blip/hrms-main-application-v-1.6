// components/VideoPlayer.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import theme from '../../constants/theme';
// import theme from '../constants/theme';

const VideoPlayer = ({ visible, videoUrl, onClose }) => {
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Create and configure the player instance
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.timeUpdateEventInterval = 0.5; // update every 500ms
    player.addListener('timeUpdate', (event) => {
      setCurrentTime(event.currentTime);
      setDuration(event.duration);
    });
    player.addListener('statusChange', (event) => {
      if (event.status === 'loading') setLoading(true);
      else setLoading(false);
    });
    player.addListener('playbackSpeedChange', (event) => {
      setPlaybackSpeed(event.playbackSpeed);
    });
    player.addListener('fullscreenChange', (event) => {
      setIsFullscreen(event.isFullscreen);
    });
  });

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    let timer;
    if (showControls && !loading) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls, loading]);

  const togglePlayPause = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    player.playbackSpeed = speeds[nextIndex];
  }, [player, playbackSpeed]);

  const toggleFullscreen = useCallback(() => {
    player.fullscreen = !player.fullscreen;
  }, [player]);

  const seekTo = useCallback(
    (value) => {
      player.currentTime = value;
    },
    [player]
  );

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent={false} animationType="none">
      <View style={styles.container}>
        {/* The VideoView handles the actual rendering */}
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain" // maintains aspect ratio
          nativeControls={false} // we provide custom controls
        />

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Control overlay (visible on tap) */}
        {showControls && !loading && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.controlsOverlay}
            onPress={() => setShowControls(false)}
          >
            {/* Top bar: close & speed */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cycleSpeed} style={styles.speedButton}>
                <Text style={styles.speedText}>{playbackSpeed}x</Text>
              </TouchableOpacity>
            </View>

            {/* Center play/pause */}
            <TouchableOpacity onPress={togglePlayPause} style={styles.centerPlayButton}>
              <Ionicons
                name={player.playing ? 'pause' : 'play'}
                size={50}
                color="white"
              />
            </TouchableOpacity>

            {/* Bottom bar: progress, time, fullscreen */}
            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration || 1}
                value={currentTime}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor={theme.colors.primary}
                onSlidingComplete={seekTo}
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
              <TouchableOpacity onPress={toggleFullscreen} style={styles.iconButton}>
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Tap anywhere to show controls */}
        {!showControls && !loading && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.tapArea}
            onPress={() => setShowControls(true)}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  centerPlayButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    padding: 10,
  },
  iconButton: {
    padding: 8,
  },
  speedButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  speedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default VideoPlayer;