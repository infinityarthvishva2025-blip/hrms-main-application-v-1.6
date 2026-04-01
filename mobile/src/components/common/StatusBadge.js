import { View, Text, StyleSheet } from 'react-native';
import theme from '../../constants/theme';

const getStatusColor = (status) => {
    if (!status) return theme.colors.textSecondary;

    const normalizedStatus = status.toUpperCase();

    switch (normalizedStatus) {
        case 'PRESENT':
        case 'P':
            return theme.colors.success;
        case 'ABSENT':
        case 'A':
            return theme.colors.error;
        case 'WO': // Week Off
        case 'WEEK OFF':
            return theme.colors.textSecondary; // Greyish for neutral
        case 'PENDING':
            return theme.colors.warning;
        case 'APPROVED':
            return theme.colors.success; // Or a specific blue
        case 'REJECTED':
            return theme.colors.error;
        default:
            return theme.colors.primary;
    }
};

const StatusBadge = ({ status, style }) => {
    const color = getStatusColor(status);

    return (
        <View style={[styles.container, { backgroundColor: color + '20' }, style]}>
            <Text style={[styles.text, { color: color }]}>
                {status || 'N/A'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase'
    }
});

export default StatusBadge;
