import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../constants/theme';

const GradientButton = ({
    onPress,
    title,
    colors = theme.colors.gradientPrimary,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
    style,
    textStyle,
    disabled = false,
    loading = false,
    icon
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={disabled ? ['#CBD5E1', '#94A3B8'] : colors}
                start={start}
                end={end}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        {icon}
                        <Text style={[styles.text, textStyle, icon && { marginLeft: 8 }]}>
                            {title}
                        </Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        width: '100%',
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default GradientButton;