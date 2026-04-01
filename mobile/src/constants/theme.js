export const theme = {
    colors: {
        // Primary HRMS Colors - Professional & Enterprise
        primary: '#2076C7',        // Rich Blue '#2563EB',         
        primaryDark: '#1CADA3',    // Deep Blue '#1E40AF', 
        primaryLight: '#3B82F6',   // Light Blue '#3B82F6', 

        secondary: '#0D9488',      // Professional Teal
        secondaryDark: '#0F766E',  // Deep Teal
        secondaryLight: '#14B8A6', // Light Teal

        accent: '#8B5CF6',         // Professional Purple
        accentLight: '#A78BFA',    // Light Purple

        // Neutral Colors
        background: '#F8FAFC',     // Premium Slate Background
        surface: '#FFFFFF',        // Pure White Surface
        surfaceAlt: '#F1F5F9',     // Alternative Surface

        text: '#0F172A',           // Deep Slate Text (Primary)
        textSecondary: '#64748B',  // Medium Slate Text
        textTertiary: '#94A3B8',   // Light Slate Text

        // Status Colors
        error: '#EF4444',          // Vibrant Red
        success: '#10B981',        // Vibrant Green
        warning: '#F59E0B',        // Amber Warning
        info: '#3B82F6',           // Blue Info

        // Border & Divider
        border: '#E2E8F0',         // Light Border
        borderDark: '#CBD5E1',     // Darker Border
        divider: '#F1F5F9',        // Subtle Divider

        // Gradients (as arrays for LinearGradient)
        gradientPrimary: ['#2076C7', '#1CADA3'],     // Blue gradient
        gradientSecondary: ['#0D9488', '#0F766E'],   // Teal gradient
        gradientAccent: ['#8B5CF6', '#7C3AED'],      // Purple gradient
        gradientSuccess: ['#10B981', '#059669'],     // Green gradient
        gradientHeader: ['#2076C7', '#1A8FB0', '#1CADA3'], // Primary Blue → Peacock Green

        // Tab Navigation Colors
        tabActive: '#2076C7',
        tabInactive: '#94A3B8',
        tabBackground: '#FFFFFF',

        // Utility
        white: '#FFFFFF',
        black: '#000000',
        disabled: '#CBD5E1',
        overlay: 'rgba(0, 0, 0, 0.5)',

        // Shadow
        shadowLight: 'rgba(15, 23, 42, 0.05)',
        shadowMedium: 'rgba(15, 23, 42, 0.1)',
        shadowDark: 'rgba(15, 23, 42, 0.15)',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },

    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        round: 100,
    },

    typography: {
        // Headers
        h1: {
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: -0.8,
            lineHeight: 40,
            color: '#0F172A'
        },
        h2: {
            fontSize: 28,
            fontWeight: '700',
            letterSpacing: -0.6,
            lineHeight: 36,
            color: '#0F172A'
        },
        h3: {
            fontSize: 24,
            fontWeight: '700',
            letterSpacing: -0.5,
            lineHeight: 32,
            color: '#0F172A'
        },
        h4: {
            fontSize: 20,
            fontWeight: '600',
            letterSpacing: -0.3,
            lineHeight: 28,
            color: '#0F172A'
        },
        h5: {
            fontSize: 18,
            fontWeight: '600',
            letterSpacing: -0.2,
            lineHeight: 24,
            color: '#0F172A'
        },

        // Body Text
        body: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
            color: '#0F172A'
        },
        bodyLarge: {
            fontSize: 18,
            fontWeight: '400',
            lineHeight: 28,
            color: '#0F172A'
        },
        bodySmall: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 20,
            color: '#64748B'
        },

        // Captions & Labels
        caption: {
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 20,
            color: '#64748B'
        },
        captionSmall: {
            fontSize: 12,
            fontWeight: '500',
            lineHeight: 16,
            color: '#64748B'
        },
        label: {
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: '#64748B'
        },

        // Button Text
        button: {
            fontSize: 16,
            fontWeight: '600',
            letterSpacing: 0.5,
            color: '#FFFFFF'
        },
        buttonSmall: {
            fontSize: 14,
            fontWeight: '600',
            letterSpacing: 0.3,
            color: '#FFFFFF'
        },
    },

    shadow: {
        // Light shadow (for cards)
        light: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        // Medium shadow (for elevated elements)
        medium: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
        },
        // Dark shadow (for modals, floating elements)
        dark: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10,
        },
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
};

export default theme;
