import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native'; // Added Image
import theme from '../../constants/theme';

const SettingsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>SettingsScreen</Text>
      
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    text: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    image: {
        width: 300,
        height: 300,
        marginTop: 20,
    },
});

export default SettingsScreen;