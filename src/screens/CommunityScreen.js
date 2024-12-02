import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlass, Plus } from 'phosphor-react-native';

// Temporary mock data (replace with Firebase data later)
const MOCK_POSTS = [
  {
    id: '1',
    title: 'Suspicious Activity Report',
    content: 'Noticed unusual activity around Victoria Island area. Please be cautious.',
    author: 'John Doe',
    timestamp: new Date().toISOString(),
    category: 'security',
    likes: 5,
    comments: 3,
  },
  {
    id: '2',
    title: 'Community Safety Meeting',
    content: 'Monthly safety meeting this Saturday at 10 AM. All residents are welcome.',
    author: 'Community Leader',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    category: 'announcement',
    likes: 12,
    comments: 7,
  },
];

const CategoryChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.categoryChip, active && styles.activeCategoryChip]}
    onPress={onPress}
  >
    <Text style={[styles.categoryChipText, active && styles.activeCategoryChipText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PostCard = ({ post, onPress }) => {
  const getIconName = (category) => {
    switch (category) {
      case 'security':
        return 'shield-outline';
      case 'announcement':
        return 'megaphone-outline';
      default:
        return 'document-text-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress}>
      <View style={styles.postHeader}>
        <View style={styles.postCategory}>
          <MagnifyingGlass size={20} color="#457B9D" />
          <Text style={styles.categoryText}>
            {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(post.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>
        {post.content}
      </Text>
      <View style={styles.postFooter}>
        <View style={styles.authorInfo}>
          <MagnifyingGlass size={20} color="#457B9D" />
          <Text style={styles.authorText}>{post.author}</Text>
        </View>
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <MagnifyingGlass size={20} color="#457B9D" />
            <Text style={styles.statText}>{post.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <MagnifyingGlass size={20} color="#457B9D" />
            <Text style={styles.statText}>{post.comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CommunityScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['All', 'Alerts', 'Tips', 'Events', 'Discussion'];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetching data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const filteredPosts = MOCK_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MagnifyingGlass size={20} color="#666" weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search community posts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <CategoryChip
              label={item}
              active={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
            />
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { post: item })}
          />
        )}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E63946']}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPost')}
      >
        <Plus size={24} color="#fff" weight="bold" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1FAEE',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 10,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1FAEE',
    marginRight: 10,
  },
  activeCategoryChip: {
    backgroundColor: '#457B9D',
  },
  categoryChipText: {
    color: '#457B9D',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: '#fff',
  },
  postsList: {
    padding: 15,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    marginLeft: 5,
    color: '#457B9D',
    fontSize: 14,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 5,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    marginLeft: 5,
    color: '#457B9D',
    fontSize: 14,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  statText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#E63946',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunityScreen;
