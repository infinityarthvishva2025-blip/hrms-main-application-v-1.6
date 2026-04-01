/**
 * SwipeButton.js
 * ─────────────────────────────────────────────────────────
 * Best-in-class swipe-to-confirm button.
 *
 * Features:
 *  • Ultra-smooth Reanimated v3 gesture on UI thread
 *  • Animated shimmer on label text
 *  • Progressive gradient fill as thumb moves
 *  • Pulsing arrow on thumb
 *  • Success state: checkmark + haptic + lock
 *  • Debounce: prevents rapid re-swipe
 *  • Proper reset via loading prop or swipeKey
 * ─────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    runOnJS,
    interpolate,
    Extrapolation,
    Easing,
} from 'react-native-reanimated';
import theme from '../../constants/theme';

const BUTTON_HEIGHT = 64;
const THUMB_SIZE = 56;
const PADDING = 4;
const SWIPE_THRESHOLD = 0.7;
const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };
const SPRING_RESET = { damping: 20, stiffness: 180 };

const SwipeButton = ({
    onSwipeSuccess,
    label = 'SWIPE TO CONFIRM',
    loading = false,
    gradientColors = [theme.colors.primary, theme.colors.primaryDark],
    iconName = 'chevron-forward',
    iconColor = '#FFF',
    disabled = false,
    swipeKey = 0, // Change this to force-reset the button
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [swiped, setSwiped] = useState(false);
    const lockedRef = useRef(false);

    // Shared values
    const translateX = useSharedValue(0);
    const successOpacity = useSharedValue(0);
    const shimmerOffset = useSharedValue(-1);
    const pulseScale = useSharedValue(1);

    const maxDrag = Math.max(0, containerWidth - THUMB_SIZE - PADDING * 2);

    // ── Shimmer animation (repeating) ──
    useEffect(() => {
        if (!swiped && !loading && !disabled) {
            shimmerOffset.value = withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            shimmerOffset.value = -1;
        }
    }, [swiped, loading, disabled]);

    // ── Pulse animation on thumb arrows ──
    useEffect(() => {
        if (!swiped && !loading && !disabled) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            pulseScale.value = 1;
        }
    }, [swiped, loading, disabled]);

    // ── Reset when swipeKey changes or loading finishes ──
    useEffect(() => {
        if (!loading && swiped) {
            // Delay reset slightly for visual satisfaction
            const timeout = setTimeout(() => {
                translateX.value = withTiming(0, { duration: 350 }, () => {
                    runOnJS(setSwiped)(false);
                    runOnJS(resetLock)();
                });
                successOpacity.value = withTiming(0, { duration: 250 });
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [loading]);

    useEffect(() => {
        // Force reset when swipeKey changes
        translateX.value = withTiming(0, { duration: 250 });
        successOpacity.value = 0;
        setSwiped(false);
        lockedRef.current = false;
    }, [swipeKey]);

    const resetLock = () => {
        lockedRef.current = false;
    };

    const handleSuccess = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (onSwipeSuccess) {
            onSwipeSuccess();
        }
    };

    // ── Gesture handler ──
    const pan = Gesture.Pan()
        .enabled(!loading && !disabled && !swiped && !lockedRef.current)
        .activeOffsetX(5) // Require 5px horizontal movement before activating
        .failOffsetY([-15, 15]) // Fail if user scrolls vertically
        .onStart(() => {
            'worklet';
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((event) => {
            'worklet';
            translateX.value = Math.max(0, Math.min(event.translationX, maxDrag));
        })
        .onEnd(() => {
            'worklet';
            if (maxDrag > 0 && translateX.value > maxDrag * SWIPE_THRESHOLD) {
                // Success — snap to end
                translateX.value = withSpring(maxDrag, SPRING_CONFIG, (finished) => {
                    if (finished) {
                        successOpacity.value = withTiming(1, { duration: 200 });
                        runOnJS(setSwiped)(true);
                        runOnJS(setLock)();
                        runOnJS(handleSuccess)();
                    }
                });
            } else {
                // Reset — spring back
                translateX.value = withSpring(0, SPRING_RESET);
            }
        });

    const setLock = () => {
        lockedRef.current = true;
    };

    const onLayout = (e) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    // ── Animated Styles ──

    // Thumb position
    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Background gradient fill (progressive opacity)
    const gradientStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, maxDrag * 0.3, maxDrag],
            [0.08, 0.3, 1],
            Extrapolation.CLAMP
        ),
    }));

    // Label text with shimmer and fade
    const labelStyle = useAnimatedStyle(() => {
        const fadeOpacity = interpolate(
            translateX.value,
            [0, maxDrag * 0.4],
            [1, 0],
            Extrapolation.CLAMP
        );
        const shimmerOpacity = interpolate(
            shimmerOffset.value,
            [-1, 0, 1],
            [0.6, 1, 0.6],
            Extrapolation.CLAMP
        );
        return {
            opacity: fadeOpacity * shimmerOpacity,
        };
    });

    // Success checkmark scale
    const successStyle = useAnimatedStyle(() => ({
        opacity: successOpacity.value,
        transform: [
            {
                scale: interpolate(
                    successOpacity.value,
                    [0, 1],
                    [0.5, 1],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    // Pulse animation on arrow icon
    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    // Progress trail behind thumb
    const trailStyle = useAnimatedStyle(() => ({
        width: translateX.value + THUMB_SIZE + PADDING,
        opacity: interpolate(
            translateX.value,
            [0, maxDrag * 0.2, maxDrag],
            [0, 0.15, 0.35],
            Extrapolation.CLAMP
        ),
    }));

    return (
        <View style={[styles.container, disabled && styles.containerDisabled]} onLayout={onLayout}>
            {/* Background gradient layer */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.gradientLayer, gradientStyle]}>
                <LinearGradient
                    colors={disabled ? ['#94A3B8', '#94A3B8'] : gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Progress trail */}
            <Animated.View style={[styles.trail, trailStyle]}>
                <LinearGradient
                    colors={disabled ? ['#94A3B8', '#94A3B8'] : gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Label with shimmer */}
            <Animated.View style={[styles.labelContainer, labelStyle]}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.arrowHints}>
                    <Ionicons name="chevron-forward" size={12} color={theme.colors.textTertiary} />
                    <Ionicons name="chevron-forward" size={12} color={theme.colors.textTertiary} style={{ marginLeft: -6 }} />
                    <Ionicons name="chevron-forward" size={12} color={theme.colors.textTertiary} style={{ marginLeft: -6 }} />
                </View>
            </Animated.View>

            {/* Success overlay */}
            <Animated.View style={[styles.successOverlay, successStyle]}>
                <Ionicons name="checkmark-circle" size={28} color="#FFF" />
                <Text style={styles.successText}>CONFIRMED</Text>
            </Animated.View>

            {/* Thumb */}
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.thumb, thumbStyle]}>
                    <LinearGradient
                        colors={disabled ? ['#94A3B8', '#94A3B8'] : gradientColors}
                        style={styles.thumbGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : swiped ? (
                            <Ionicons name="checkmark" size={26} color={iconColor} />
                        ) : (
                            <Animated.View style={pulseStyle}>
                                <Ionicons name={iconName} size={24} color={iconColor} />
                            </Animated.View>
                        )}
                    </LinearGradient>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        marginVertical: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    containerDisabled: {
        opacity: 0.5,
    },
    gradientLayer: {
        borderRadius: BUTTON_HEIGHT / 2,
    },
    trail: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: BUTTON_HEIGHT / 2,
        overflow: 'hidden',
    },
    labelContainer: {
        position: 'absolute',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        zIndex: 1,
    },
    label: {
        ...theme.typography.button,
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    arrowHints: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 3,
    },
    successText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 1.5,
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        position: 'absolute',
        left: PADDING,
        top: PADDING,
        zIndex: 4,
    },
    thumbGradient: {
        flex: 1,
        borderRadius: THUMB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
});

export default SwipeButton;
