import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import theme from '../../../constants/theme';
import api from '../../../services/api';
import VideoPlayer from '../../../components/common/VideoPlayer';
// import theme from '../../../constants/theme';
// import api from '../../../services/api';
// import VideoPlayer from '../../../components/VideoPlayer';

// ---------- Add Video Modal Component ----------
const AddVideoModal = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    TitleGroup: '',
    Category: '',
    Title: '',
    Description: '',
    AllowedDepartment: '',
    AllowedEmployeeId: '',
    ExternalLink: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch departments and employees on mount
  useEffect(() => {
    if (visible) {
      fetchDepartments();
      fetchEmployees();
    }
  }, [visible]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/employees/departments');
      setDepartments(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees/active');
      setEmployees(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load employees');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("Selected Video:", file);
        setSelectedFile(file);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.TitleGroup || !form.Category || !form.Title || !form.Description) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (!selectedFile && !form.ExternalLink) {
      Alert.alert('Validation Error', 'Either upload a video or provide an external link');
      return;
    }

    const formData = new FormData();
    formData.append('TitleGroup', form.TitleGroup);
    formData.append('Category', form.Category);
    formData.append('Title', form.Title);
    formData.append('Description', form.Description);
    if (form.AllowedDepartment) {
      formData.append('AllowedDepartment', form.AllowedDepartment);
    }
    if (form.AllowedEmployeeId) {
      formData.append('AllowedEmployeeId', form.AllowedEmployeeId);
    }
    if (selectedFile) {
      formData.append('VideoFile', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType,
        name: selectedFile.name,
      });
    }
    if (form.ExternalLink) {
      formData.append('ExternalLink', form.ExternalLink);
    }

    setUploading(true);
    try {
      await api.post('/GurukulApi/hr/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Video added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to add video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent={false}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Video</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.label}>Title Group *</Text>
          <TextInput
            style={styles.input}
            value={form.TitleGroup}
            onChangeText={(text) => setForm({ ...form, TitleGroup: text })}
            placeholder="e.g., AI"
          />

          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={form.Category}
            onChangeText={(text) => setForm({ ...form, Category: text })}
            placeholder="e.g., Introduction to AI"
          />

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={form.Title}
            onChangeText={(text) => setForm({ ...form, Title: text })}
            placeholder="Video title"
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.Description}
            onChangeText={(text) => setForm({ ...form, Description: text })}
            placeholder="Description"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Department (optional)</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDepartmentPicker(true)}
          >
            <Text style={form.AllowedDepartment ? styles.pickerText : styles.pickerPlaceholder}>
              {form.AllowedDepartment || 'Select department'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Employee (optional)</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowEmployeePicker(true)}
          >
            <Text style={form.AllowedEmployeeId ? styles.pickerText : styles.pickerPlaceholder}>
              {form.AllowedEmployeeId
                ? employees.find((e) => e.id === form.AllowedEmployeeId)?.displayName
                : 'Select employee'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Video File</Text>
          <TouchableOpacity style={styles.filePicker} onPress={pickVideo}>
            <Ionicons name="cloud-upload" size={24} color={theme.colors.primary} />
            <Text style={styles.filePickerText}>
              {selectedFile ? selectedFile.name : 'Tap to select video'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>OR External Link</Text>
          <TextInput
            style={styles.input}
            value={form.ExternalLink}
            onChangeText={(text) => setForm({ ...form, ExternalLink: text })}
            placeholder="https://example.com/video.mp4"
          />
        </ScrollView>

        {/* Department Picker Modal */}
        <Modal visible={showDepartmentPicker} transparent animationType="none">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModal}>
              <Text style={styles.pickerModalTitle}>Select Department</Text>
              <FlatList
                data={departments}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setForm({ ...form, AllowedDepartment: item });
                      setShowDepartmentPicker(false);
                    }}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.pickerClose}
                onPress={() => setShowDepartmentPicker(false)}
              >
                <Text style={styles.pickerCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Employee Picker Modal */}
        <Modal visible={showEmployeePicker} transparent animationType="slide">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModal}>
              <Text style={styles.pickerModalTitle}>Select Employee</Text>
              <FlatList
                data={employees}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setForm({ ...form, AllowedEmployeeId: item.id });
                      setShowEmployeePicker(false);
                    }}
                  >
                    <Text>{item.displayName}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.pickerClose}
                onPress={() => setShowEmployeePicker(false)}
              >
                <Text style={styles.pickerCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

// ---------- Main Screen ----------
const GurukulAdminScreen = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({}); // { titleGroup: true/false }
  const [expandedCategories, setExpandedCategories] = useState({}); // { categoryId: true/false }
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null); // { url, title } for player

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/GurukulApi/hr/videos');
      setVideos(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this video?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/GurukulApi/hr/videos/${id}`);
            // Remove from local state
            setVideos(videos.filter((v) => v.id !== id));
            Alert.alert("video deleted suxxesfully")
          } catch (error) {
            Alert.alert('Error', 'Failed to delete video');
          }
        },
      },
    ]);
  };

  // Build hierarchical data
  const groupData = () => {
    const groups = {};
    videos.forEach((video) => {
      if (!groups[video.titleGroup]) {
        groups[video.titleGroup] = {};
      }
      if (!groups[video.titleGroup][video.category]) {
        groups[video.titleGroup][video.category] = [];
      }
      groups[video.titleGroup][video.category].push(video);
    });
    return groups;
  };

  const grouped = groupData();

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCategory = (group, category) => {
    const key = `${group}_${category}`;
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderVideoItem = (video) => (
    <View key={video.id} style={styles.videoCard}>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.videoDescription} numberOfLines={2}>
          {video.description}
        </Text>
        <View style={styles.videoMeta}>
          {video.allowedDepartment && (
            <Text style={styles.metaText}>Dept: {video.allowedDepartment}</Text>
          )}
          <Text style={styles.metaText}>
            {new Date(video.uploadedOn).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.videoActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            setSelectedVideo({
              url: video.isExternal
                ? video.externalLink
                : `http://192.168.1.75:5000${video.videoPath}`,
              title: video.title,
            })
          }
        >
          <Ionicons name="play-circle" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(video.id)}
        >
          <Ionicons name="trash" size={28} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gurukul Admin</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={Object.keys(grouped)}
            keyExtractor={(item) => item}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item: group }) => (
              <View style={styles.groupContainer}>
                {/* Group Header */}
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={styles.groupTitle}>{group}</Text>
                  <Ionicons
                    name={expandedGroups[group] ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Categories */}
                {expandedGroups[group] &&
                  Object.keys(grouped[group]).map((category) => {
                    const categoryKey = `${group}_${category}`;
                    return (
                      <View key={category} style={styles.categoryContainer}>
                        <TouchableOpacity
                          style={styles.categoryHeader}
                          onPress={() => toggleCategory(group, category)}
                        >
                          <Text style={styles.categoryTitle}>{category}</Text>
                          <Ionicons
                            name={expandedCategories[categoryKey] ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.textTertiary}
                          />
                        </TouchableOpacity>

                        {expandedCategories[categoryKey] &&
                          grouped[group][category].map((video) => renderVideoItem(video))}
                      </View>
                    );
                  })}
              </View>
            )}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No videos found</Text>
                </View>
              )
            }
          />
        )}

        {/* Add Video Modal */}
        <AddVideoModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={fetchVideos}
        />

        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayer
            visible={!!selectedVideo}
            videoUrl={selectedVideo.url}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.light,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
  },
  groupContainer: {
    marginBottom: theme.spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  categoryContainer: {
    paddingLeft: theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryTitle: {
    ...theme.typography.h5,
    color: theme.colors.textSecondary,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    marginRight: theme.spacing.lg,
    ...theme.shadow.light,
  },
  videoInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  videoTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    ...theme.typography.captionSmall,
    color: theme.colors.textTertiary,
    marginRight: theme.spacing.sm,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  saveButton: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  label: {
    ...theme.typography.label,
    marginTop: theme.spacing.md,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: theme.colors.textTertiary,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  filePickerText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '70%',
  },
  pickerModalTitle: {
    ...theme.typography.h5,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerClose: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  pickerCloseText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
});

export default GurukulAdminScreen;