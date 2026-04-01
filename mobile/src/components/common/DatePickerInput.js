import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';

export default function DatePickerInput({ label, value, onChange, error, required, maximumDate, minimumDate }) {
    const [show, setShow] = useState(false);

    // Parse value string (YYYY-MM-DD) to Date object, or use current date
    const dateValue = value ? new Date(value) : new Date();

    const handleChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }

        if (selectedDate) {
            // Format to YYYY-MM-DD for consistency with backend
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            onChange(formattedDate);
        }
    };

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>

            <TouchableOpacity
                style={[styles.input, error && styles.inputError]}
                onPress={() => setShow(true)}
            >
                <Text style={value ? styles.inputText : styles.placeholderText}>
                    {value || "Select Date"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {show && (
                Platform.OS === 'ios' ? (
                    // iOS requires a Modal wrapper for a better bottom-sheet look or inline usage
                    // Here we use a modal to ensure it doesn't break layout
                    <Modal transparent animationType="slide" visible={show}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.iosPickerContainer}>
                                <View style={styles.iosHeader}>
                                    <TouchableOpacity onPress={() => setShow(false)}>
                                        <Text style={styles.iosDoneText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={dateValue}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleChange}
                                    maximumDate={maximumDate}
                                    minimumDate={minimumDate}
                                    textColor="#000"
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={dateValue}
                        mode="date"
                        display="default"
                        onChange={handleChange}
                        maximumDate={maximumDate}
                        minimumDate={minimumDate}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    required: { color: theme.colors.error },
    input: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff'
    },
    inputText: { fontSize: 14, color: theme.colors.text, fontWeight: '500' },
    placeholderText: { fontSize: 14, color: theme.colors.textSecondary },
    inputError: { borderColor: theme.colors.error },
    errorText: { color: theme.colors.error, fontSize: 12, marginTop: 4 },

    // iOS Specific
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    iosPickerContainer: { backgroundColor: '#fff', paddingBottom: 20 },
    iosHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'flex-end', backgroundColor: '#f9f9f9' },
    iosDoneText: { color: theme.colors.brandBlue, fontWeight: 'bold', fontSize: 16 }
});
