// src/screens/farmer/InventoryScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../services/supabase';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface Product {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  quantity_available: number;
  category?: string;
  category_id?: string;
  category_icon?: string;
  is_available: boolean;
  created_at: string;
}

interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  value: string | number;
  label: string;
  trend?: string;
}

const InventoryScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'low-stock'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [tempProduct, setTempProduct] = useState({
    id: '',
    name: '',
    category: '',
    categoryId: '',
    price: '',
    quantity: '',
    unit: 'kg',
    description: '',
  });
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    getCurrentUser();
    fetchCategories();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
        fetchProducts(user.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setLoading(false);
    }
  };

  const fetchCategories = () => {
    // Use default categories locally - no database calls to avoid RLS policy errors
    // Note: These use simple IDs since they're not in the database
    const defaultCategories = [
      { id: 'vegetables', name: 'Vegetables', icon: '🥬', description: 'Fresh vegetables and greens' },
      { id: 'grains', name: 'Grains', icon: '🌾', description: 'Cereals and grain crops' },
      { id: 'legumes', name: 'Legumes', icon: '🫘', description: 'Beans, peas, and pulses' },
      { id: 'fruits', name: 'Fruits', icon: '🍎', description: 'Fresh fruits and berries' },
      { id: 'tubers', name: 'Tubers', icon: '🥔', description: 'Root vegetables and tubers' },
      { id: 'herbs', name: 'Herbs', icon: '🌿', description: 'Culinary and medicinal herbs' },
    ];
    setCategories(defaultCategories as any);
  };

  const fetchProducts = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            icon,
            description
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include category name from the join
      const transformedData = (data || []).map((product: any) => ({
        ...product,
        category: product.categories?.name || product.category || 'Uncategorized',
        category_icon: product.categories?.icon,
      }));
      
      setProducts(transformedData);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (currentUser) fetchProducts(currentUser);
  };

  const saveProduct = async () => {
    const { id, name, category, categoryId, price, quantity, unit } = tempProduct;
    if (!name || !price || !quantity) {
      Alert.alert('Error', 'Name, price, and quantity are required.');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    if (isNaN(priceNum) || isNaN(quantityNum)) {
      Alert.alert('Error', 'Price and quantity must be valid numbers.');
      return;
    }

    try {
      // Check if categoryId is a valid UUID format
      const isValidUuid = categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
      
      // Prepare product data - only include category_id if it's a valid UUID
      const productData: any = {
        seller_id: currentUser,
        name,
        price: priceNum,
        quantity_available: quantityNum,
        unit,
        is_available: true,
        description: tempProduct.description || null,
      };
      
      // Only add category_id if it's a valid UUID from the database
      if (isValidUuid) {
        productData.category_id = categoryId;
      }

      if (id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .eq('seller_id', currentUser);

        if (error) throw error;
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        Alert.alert('Success', 'Product added successfully!');
      }

      setModalVisible(false);
      setTempProduct({ id: '', name: '', category: '', categoryId: '', price: '', quantity: '', unit: 'kg', description: '' });
      setShowCategorySelector(false);
      if (currentUser) fetchProducts(currentUser);
    } catch (err: any) {
      console.error('Error saving product:', err);
      Alert.alert('Error', 'Failed to save product: ' + err.message);
    }
  };

  const deleteProduct = (id: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to permanently delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('seller_id', currentUser!);

              if (error) throw error;
              Alert.alert('Success', 'Product deleted successfully!');
              if (currentUser) fetchProducts(currentUser);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item: Product) => {
    setTempProduct({
      id: item.id,
      name: item.name,
      category: item.category || '',
      categoryId: item.category_id || '',
      price: item.price.toString(),
      quantity: item.quantity_available.toString(),
      unit: item.unit || 'kg',
      description: item.description || '',
    });
    setShowCategorySelector(false);
    setModalVisible(true);
  };

  const openDetailModal = (item: Product) => {
    setSelectedProduct(item);
    setDetailModalVisible(true);
  };

  const openAddModal = () => {
    setTempProduct({ id: '', name: '', category: '', categoryId: '', price: '', quantity: '', unit: 'kg', description: '' });
    setShowCategorySelector(false);
    setModalVisible(true);
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterType === 'available') {
      filtered = filtered.filter((p) => p.is_available && p.quantity_available > 0);
    } else if (filterType === 'low-stock') {
      filtered = filtered.filter((p) => p.quantity_available < 10);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity_available - b.quantity_available;
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [products, searchQuery, filterType, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter((p) => p.quantity_available < 10).length;
    const outOfStock = products.filter((p) => p.quantity_available === 0).length;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity_available, 0);
    const availableProducts = products.filter((p) => p.is_available && p.quantity_available > 0).length;

    return { totalProducts, lowStock, outOfStock, totalValue, availableProducts };
  }, [products]);

  const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, bgColor, value, label, trend }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        <MCIcon name={icon} size={14} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && <Text style={styles.statTrend}>{trend}</Text>}
    </View>
  );

  const FilterChip: React.FC<{
    label: string;
    active: boolean;
    onPress: () => void;
  }> = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ProductCard: React.FC<{ item: Product }> = ({ item }) => {
    const isLowStock = item.quantity_available < 10 && item.quantity_available > 0;
    const isOutOfStock = item.quantity_available === 0;

    return (
      <TouchableOpacity
        onPress={() => openDetailModal(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          key={item.id}
          colors={['#ffffff', '#fafafa']}
          style={styles.productCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.productCardLeft}>
            <View style={[styles.productImagePlaceholder, isOutOfStock && styles.outOfStockBg]}>
              {isOutOfStock ? (
                <MCIcon name="alert-circle-outline" size={32} color="#9e9e9e" />
              ) : (
                <MCIcon name="agriculture" size={32} color="#2e7d32" />
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.productMeta}>
                <MCIcon name="tag-outline" size={12} color="#6c757d" />
                <Text style={styles.productCategory} numberOfLines={1}>
                  {item.category || 'Uncategorized'}
                </Text>
              </View>
              <View style={styles.productMeta}>
                <Ionicons name="cube-outline" size={12} color="#6c757d" />
                <Text style={styles.productUnit}>
                  {item.quantity_available} {item.unit} available
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.productCardRight}>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>KES</Text>
              <Text style={styles.productPrice}>{item.price.toLocaleString()}</Text>
            </View>

            {isOutOfStock ? (
              <View style={[styles.statusBadge, styles.outOfStockBadge]}>
                <MCIcon name="alert-circle" size={12} color="#c62828" />
                <Text style={[styles.statusText, styles.outOfStockText]}>Out of Stock</Text>
              </View>
            ) : isLowStock ? (
              <View style={[styles.statusBadge, styles.lowStockBadge]}>
                <MCIcon name="alert" size={12} color="#ef6c00" />
                <Text style={[styles.statusText, styles.lowStockText]}>Low Stock</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.inStockBadge]}>
                <MCIcon name="check-circle" size={12} color="#2e7d32" />
                <Text style={[styles.statusText, styles.inStockText]}>In Stock</Text>
              </View>
            )}

            <View style={styles.productActions}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  openEditModal(item);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#1565c0" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconBtn, styles.deleteIconBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteProduct(item.id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#c62828" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.productCardHint}>
          <MCIcon name="chevron-right" size={16} color="#9e9e9e" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    if (searchQuery || filterType !== 'all') {
      return (
        <View style={styles.emptyContainer}>
          <MCIcon name="search-off-outline" size={64} color="#bdbdbd" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search or filter criteria
          </Text>
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
          >
            <Text style={styles.clearFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <MCIcon name="warehouse" size={56} color="#2e7d32" />
        </View>
        <Text style={styles.emptyTitle}>Your inventory is empty</Text>
        <Text style={styles.emptyText}>
          Start managing your products by adding your first item
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.emptyBtnText}>Add Your First Product</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2e7d32"
              colors={['#2e7d32']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={22} color="#1b4332" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Inventory</Text>
                <Text style={styles.headerSubtitle}>
                  {stats.totalProducts} products • KES {stats.totalValue.toLocaleString()} value
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={openAddModal}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Statistics Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
          >
            <StatCard
              icon="package-variant"
              iconColor="#1b5e20"
              bgColor="#e8f5e9"
              value={stats.totalProducts}
              label="Total"
            />
            <StatCard
              icon="check-circle"
              iconColor="#1565c0"
              bgColor="#e3f2fd"
              value={stats.availableProducts}
              label="Available"
            />
            <StatCard
              icon="alert"
              iconColor="#ef6c00"
              bgColor="#fff3e0"
              value={stats.lowStock}
              label="Low Stock"
            />
            <StatCard
              icon="cash"
              iconColor="#2e7d32"
              bgColor="#c8e6c9"
              value={stats.totalValue >= 1000 ? `KES ${(stats.totalValue / 1000).toFixed(1)}k` : `KES ${stats.totalValue}`}
              label="Value"
            />
          </ScrollView>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#9e9e9e" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#9e9e9e"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9e9e9e" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterContainer}>
            <FilterChip
              label="All Products"
              active={filterType === 'all'}
              onPress={() => setFilterType('all')}
            />
            <FilterChip
              label="In Stock"
              active={filterType === 'available'}
              onPress={() => setFilterType('available')}
            />
            <FilterChip
              label="Low Stock"
              active={filterType === 'low-stock'}
              onPress={() => setFilterType('low-stock')}
            />
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortHeader}
              onPress={() => setShowSortOptions(!showSortOptions)}
              activeOpacity={0.7}
            >
              <View style={styles.sortHeaderLeft}>
                <Ionicons name="swap-vertical" size={16} color="#2e7d32" />
                <Text style={styles.sortLabel}>Sort by: </Text>
                <Text style={styles.sortLabelValue}>
                  {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : sortBy === 'quantity' ? 'Qty' : 'Date'}
                </Text>
                <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color="#2e7d32" />
              </View>
              <Ionicons name={showSortOptions ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
            </TouchableOpacity>
            
            {showSortOptions && (
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
                  onPress={() => {
                    if (sortBy === 'name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextActive]}>
                    Name
                  </Text>
                  {sortBy === 'name' && (
                    <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color="#2e7d32" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === 'price' && styles.sortOptionActive]}
                  onPress={() => {
                    if (sortBy === 'price') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('price');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === 'price' && styles.sortOptionTextActive]}>
                    Price
                  </Text>
                  {sortBy === 'price' && (
                    <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color="#2e7d32" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === 'quantity' && styles.sortOptionActive]}
                  onPress={() => {
                    if (sortBy === 'quantity') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('quantity');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === 'quantity' && styles.sortOptionTextActive]}>
                    Qty
                  </Text>
                  {sortBy === 'quantity' && (
                    <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color="#2e7d32" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === 'date' && styles.sortOptionActive]}
                  onPress={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === 'date' && styles.sortOptionTextActive]}>
                    Date
                  </Text>
                  {sortBy === 'date' && (
                    <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color="#2e7d32" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Products List */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7d32" />
              <Text style={styles.loadingText}>Loading your inventory...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            renderEmptyComponent()
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard item={item} />}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </ScrollView>

        {/* Add/Edit Product Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalOverlay}>
              <LinearGradient
                colors={['#ffffff', '#f1f8e9']}
                style={styles.modalContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {tempProduct.id ? 'Edit Product' : 'Add New Product'}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {tempProduct.id ? 'Update product information' : 'Fill in the product details'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Modal Form */}
                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Product Name <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.inputWithIcon}>
                      <MCIcon name="agriculture" size={20} color="#9e9e9e" />
                      <TextInput
                        placeholder="e.g., Fresh Tomatoes"
                        style={styles.input}
                        placeholderTextColor="#9e9e9e"
                        value={tempProduct.name}
                        onChangeText={(text) =>
                          setTempProduct({ ...tempProduct, name: text })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Category <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[styles.categorySelector, showCategorySelector && styles.categorySelectorActive]}
                      onPress={() => setShowCategorySelector(!showCategorySelector)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categorySelectorLeft}>
                        <MCIcon name="tag" size={20} color={showCategorySelector ? '#2e7d32' : '#9e9e9e'} />
                        <Text
                          style={[
                            styles.categorySelectorText,
                            !tempProduct.category && styles.categorySelectorPlaceholder,
                            showCategorySelector && styles.categorySelectorTextActive,
                          ]}
                        >
                          {tempProduct.category || 'Select a category'}
                        </Text>
                      </View>
                      <MCIcon
                        name={showCategorySelector ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={showCategorySelector ? '#2e7d32' : '#9e9e9e'}
                      />
                    </TouchableOpacity>

                    {/* Category Dropdown */}
                    {showCategorySelector && (
                      <View style={styles.categoryDropdown}>
                        <ScrollView style={styles.categoryScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <TouchableOpacity
                                key={cat.id}
                                style={[
                                  styles.categoryOption,
                                  tempProduct.categoryId === cat.id && styles.categoryOptionActive,
                                ]}
                                onPress={() => {
                                  setTempProduct({
                                    ...tempProduct,
                                    category: cat.name,
                                    categoryId: cat.id,
                                  });
                                  setShowCategorySelector(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={styles.categoryOptionLeft}>
                                  <View style={styles.categoryIconBox}>
                                    <Text style={styles.categoryOptionIcon}>
                                      {cat.icon || '📦'}
                                    </Text>
                                  </View>
                                  <View>
                                    <Text style={styles.categoryOptionName}>{cat.name}</Text>
                                    {cat.description && (
                                      <Text style={styles.categoryOptionDesc} numberOfLines={2}>
                                        {cat.description}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                                {tempProduct.categoryId === cat.id && (
                                  <MCIcon name="check-circle" size={22} color="#2e7d32" />
                                )}
                              </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.noCategories}>
                              <MCIcon name="folder-outline" size={40} color="#bdbdbd" />
                              <Text style={styles.noCategoriesText}>No categories available</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.label}>
                        Price (KES) <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.inputWithIcon}>
                        <Text style={styles.inputIconText}>KES</Text>
                        <TextInput
                          placeholder="0.00"
                          style={styles.input}
                          placeholderTextColor="#9e9e9e"
                          keyboardType="numeric"
                          value={tempProduct.price}
                          onChangeText={(text) =>
                            setTempProduct({ ...tempProduct, price: text })
                          }
                        />
                      </View>
                    </View>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.label}>
                        Quantity <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.inputWithIcon}>
                        <Ionicons name="cube" size={20} color="#9e9e9e" />
                        <TextInput
                          placeholder="0"
                          style={styles.input}
                          placeholderTextColor="#9e9e9e"
                          keyboardType="numeric"
                          value={tempProduct.quantity}
                          onChangeText={(text) =>
                            setTempProduct({ ...tempProduct, quantity: text })
                          }
                        />
                      </View>
                    </View>
                  </View>

                  {/* Unit Selector */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Unit of Measurement</Text>
                    <View style={styles.unitSelector}>
                      {['kg', 'g', 'L', 'pcs', 'bundle', 'bag'].map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.unitBtn,
                            tempProduct.unit === u && styles.unitBtnActive,
                          ]}
                          onPress={() => setTempProduct({ ...tempProduct, unit: u })}
                        >
                          <Text
                            style={[
                              styles.unitText,
                              tempProduct.unit === u && styles.unitTextActive,
                            ]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <View style={styles.inputWithIcon}>
                      <MCIcon name="text-box-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        placeholder="Describe your product quality, origin, etc."
                        style={[styles.input, styles.textArea]}
                        placeholderTextColor="#9e9e9e"
                        multiline
                        numberOfLines={4}
                        value={tempProduct.description}
                        onChangeText={(text) =>
                          setTempProduct({ ...tempProduct, description: text })
                        }
                      />
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#666" />
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSave}
                    onPress={saveProduct}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalBtnTextSave}>
                      {tempProduct.id ? 'Update Product' : 'Add Product'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default InventoryScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1b4332',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statsScrollContent: {
    paddingRight: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 8,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  statLabel: {
    fontSize: 9,
    color: '#6c757d',
    marginTop: 2,
  },
  statTrend: {
    fontSize: 8,
    color: '#2e7d32',
    marginTop: 2,
    fontWeight: '600',
  },
  searchContainer: {
    marginVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e7d32',
    marginBottom: 8,
  },
  sortHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  sortLabelValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e7d32',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortOptionActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    color: '#6c757d',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFilterBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  clearFilterText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyBtn: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  productCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  productCardHint: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  outOfStockBg: {
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1b4332',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  productCategory: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  productUnit: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  productCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginRight: 2,
  },
  productPrice: {
    fontWeight: '700',
    fontSize: 17,
    color: '#1b4332',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  outOfStockBadge: {
    backgroundColor: '#ffebee',
  },
  lowStockBadge: {
    backgroundColor: '#fff3e0',
  },
  inStockBadge: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  outOfStockText: {
    color: '#c62828',
  },
  lowStockText: {
    color: '#ef6c00',
  },
  inStockText: {
    color: '#2e7d32',
  },
  productActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: '#ffebee',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    width: '92%',
    maxHeight: '88%',
    backgroundColor: 'transparent',
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1b4332',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 380,
  },
  formGroup: {
    marginBottom: 18,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1b4332',
    marginBottom: 8,
  },
  required: {
    color: '#c62828',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIconText: {
    fontSize: 13,
    color: '#9e9e9e',
    fontWeight: '600',
    marginRight: 10,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categorySelectorActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  categorySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  categorySelectorTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  categorySelectorPlaceholder: {
    color: '#9e9e9e',
  },
  categoryDropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e7d32',
    maxHeight: 220,
  },
  categoryScroll: {
    paddingVertical: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  categoryOptionActive: {
    backgroundColor: '#e8f5e9',
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionIcon: {
    fontSize: 18,
  },
  categoryOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b4332',
  },
  categoryOptionDesc: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  noCategories: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noCategoriesText: {
    fontSize: 13,
    color: '#9e9e9e',
    marginTop: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitBtnActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  unitText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  modalSave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnTextSave: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
