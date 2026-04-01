import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../../constants/theme';

const BenefitsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>BenefitsScreen</Text>
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
});

export default BenefitsScreen;
