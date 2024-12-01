import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, MapPin, Image as ImageIcon, X } from 'phosphor-react-native';
import * as Location from 'expo-location';
import { getCurrentLocation } from '../utils/location';

const CATEGORIES = [
  { id: 'security', label: 'Security Alert', icon: 'shield' },
  { id: 'announcement', label: 'Announcement', icon: 'megaphone' },
  { id: 'discussion', label: 'Discussion', icon: 'chat' },
  { id: 'assistance', label: 'Need Assistance', icon: 'help' },
];

const CategoryButton = ({ category, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.categoryButton, selected && styles.selectedCategory]}
    onPress={() => onSelect(category.id)}
  >
    {category.icon === 'shield' && <Camera size={24} color={selected ? '#fff' : '#457B9D'} />}
    {category.icon === 'megaphone' && <ImageIcon size={24} color={selected ? '#fff' : '#457B9D'} />}
    {category.icon === 'chat' && <MapPin size={24} color={selected ? '#fff' : '#457B9D'} />}
    {category.icon === 'help' && <X size={24} color={selected ? '#fff' : '#457B9D'} />}
    <Text
      style={[
        styles.categoryButtonText,
        selected && styles.selectedCategoryText,
      ]}
    >
      {category.label}
    </Text>
  </TouchableOpacity>
);

const NewPostScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleAddLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      Alert.alert('Success', 'Location added to your post');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddImage = () => {
    // Add image handling logic here
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement post creation with Firebase
      const newPost = {
        title,
        content,
        category,
        location,
        timestamp: new Date().toISOString(),
      };

      console.log('New post:', newPost);
      Alert.alert('Success', 'Post created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Select Category</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <CategoryButton
                  key={cat.id}
                  category={cat}
                  selected={category === cat.id}
                  onSelect={setCategory}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>Post Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter a clear, descriptive title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>Post Content</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Provide detailed information..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.mediaButton} onPress={handleAddImage}>
            <ImageIcon size={24} color="#457B9D" />
            <Text style={styles.mediaButtonText}>Add Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={handleAddLocation}>
            <MapPin size={24} color="#457B9D" />
            <Text style={styles.mediaButtonText}>Add Location</Text>
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImage} onPress={handleRemoveImage}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1FAEE',
    padding: 10,
    borderRadius: 10,
    margin: 5,
    flex: 1,
    minWidth: '45%',
  },
  selectedCategory: {
    backgroundColor: '#457B9D',
  },
  categoryButtonText: {
    marginLeft: 8,
    color: '#457B9D',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  titleInput: {
    backgroundColor: '#F1FAEE',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  contentInput: {
    backgroundColor: '#F1FAEE',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1FAEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  mediaButtonText: {
    marginLeft: 10,
    color: '#457B9D',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E63946',
    padding: 5,
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F1FAEE',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#457B9D',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#E63946',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
