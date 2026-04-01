import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import theme from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import EmployeeNavigator from './EmployeeNavigator';
import HRNavigator from './HRNavigator';
import AuthStack from './AuthStack';

const RootNavigator = () => {
    const { refreshToken, role, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const renderNavigator = () => {
        if (!refreshToken) {
            return <AuthStack />;
        }

        // ✅ Prevent null/undefined role early
        if (!role) {
            console.warn('Role not yet available, waiting...');
            return <ActivityIndicator />;
        }

        switch (role) {
            case 'Employee':
            case 'Intern':
                return <EmployeeNavigator />;

            case 'Manager':
                return <EmployeeNavigator />;

            case 'HR':
            case 'Director':
            case 'VP':
            case 'GM':
                return <HRNavigator />;

            default:
                console.warn(`Unknown role "${role}", defaulting to Employee navigation`);
                return <EmployeeNavigator />;
        }
    };

    return (
        <NavigationContainer>
            {renderNavigator()}
        </NavigationContainer>
    );
};

export default RootNavigator;