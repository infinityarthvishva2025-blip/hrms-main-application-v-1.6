import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import theme from '../../constants/theme';

const BackButton = ({ color = theme.colors.text, size = 24 }) => {
    const navigation = useNavigation();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <Ionicons name="arrow-back" size={size} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginLeft: theme.spacing.md,
        padding: theme.spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BackButton;
