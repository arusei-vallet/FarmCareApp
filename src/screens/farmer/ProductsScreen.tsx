import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Image,
  TextInput,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { useProducts, Product } from '../../context/ProductContext'

const ProductsScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const { products, loading, addProduct, updateProduct, deleteProduct, refreshProducts } = useProducts()

  const [modalVisible, setModalVisible] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    image: '',
  })

  const [editId, setEditId] = useState<string | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products)
    } else {
      const lowerQuery = searchQuery.toLowerCase()
      const filtered = products.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.price.toLowerCase().includes(lowerQuery)
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

  const openAddModal = () => {
    setNewProduct({ name: '', price: '', stock: '', image: '' })
    setEditId(null)
    setModalVisible(true)
  }

  const openEditModal = (product: Product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      stock: product.stock.toString(),
      image: product.image,
    })
    setEditId(product.id)
    setModalVisible(true)
  }

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product)
    setDetailVisible(true)
  }

  const openImagePreview = () => {
    if (selectedProduct?.image) {
      setImagePreviewVisible(true)
    }
  }

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      Alert.alert('Missing Information', 'Please fill in all required fields')
      return
    }

    setSaving(true)

    const productData = {
      name: newProduct.name,
      price: newProduct.price,
      stock: Number(newProduct.stock),
      image: newProduct.image || 'https://via.placeholder.com/400',
      description: '',
      category: 'Uncategorized',
      is_available: true,
    }

    let result
    if (editId) {
      result = await updateProduct(editId, productData)
    } else {
      result = await addProduct(productData)
    }

    setSaving(false)

    if (result.success) {
      setModalVisible(false)
      setNewProduct({ name: '', price: '', stock: '', image: '' })
      setEditId(null)
      
      // Show success with optional warning
      if (result.error) {
        // Check if it's a storage policy issue
        if (result.error.includes('Permission') || result.error.includes('policy')) {
          Alert.alert(
            '⚠️ Product Saved (Image Issue)',
            'Product saved successfully, but image upload failed due to permissions.\n\n' +
            'Solution: Run fix-storage-policies.sql in Supabase SQL Editor.\n\n' +
            'Error: ' + result.error,
            [{ text: 'OK' }]
          )
        } else if (result.error.includes('Network')) {
          Alert.alert(
            '⚠️ Product Saved (Network Issue)',
            'Product saved successfully, but image upload failed due to network issues.\n\n' +
            'The image will be shown as a placeholder.\n\n' +
            'Error: ' + result.error,
            [{ text: 'OK' }]
          )
        } else {
          Alert.alert(
            '⚠️ Product Saved',
            editId ? 'Product updated successfully' : 'Product added successfully',
            [{ text: 'OK' }, { text: 'Details', onPress: () => Alert.alert('Note', result.error) }]
          )
        }
      } else {
        Alert.alert('✅ Success', editId ? 'Product updated successfully' : 'Product added successfully')
      }
    } else {
      Alert.alert('❌ Error', result.error || 'Failed to save product')
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteProduct(id)
          if (result.success) {
            Alert.alert('Success', 'Product deleted successfully')
          } else {
            Alert.alert('Error', result.error || 'Failed to delete product')
          }
        },
      },
    ])
  }

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!')
      return
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    })

    if (!result.canceled) {
      setUploadingImage(true)
      setNewProduct({ ...newProduct, image: result.assets[0].uri })
      setUploadingImage(false)
    }
  }

  const takePhoto = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera is required!')
      return
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    })

    if (!result.canceled) {
      setUploadingImage(true)
      setNewProduct({ ...newProduct, image: result.assets[0].uri })
      setUploadingImage(false)
    }
  }

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => openDetailModal(item)} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/72' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price}</Text>
          <Text style={styles.productStock}>Stock: {item.stock}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={20} color="#1b5e20" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>Products</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add-circle" size={28} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Products Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            {searchQuery ? ` found for "${searchQuery}"` : ''}
          </Text>
          <TouchableOpacity onPress={refreshProducts} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={18} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? `No products found for "${searchQuery}"` : 'No products yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Tap + to add your first product'}
              </Text>
            </View>
          }
        />

        {/* Add/Edit Product Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <LinearGradient colors={['#ffffff', '#f3fff4']} style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>{editId ? 'Edit Product' : 'Add New Product'}</Text>

                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploadingImage}>
                  {newProduct.image ? (
                    <View style={{ position: 'relative' }}>
                      <Image source={{ uri: newProduct.image }} style={styles.pickedImage} />
                      {uploadingImage && (
                        <View style={styles.uploadOverlay}>
                          <ActivityIndicator size="small" color="#fff" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={36} color="#888" />
                      {uploadingImage && <ActivityIndicator size="small" color="#2e7d32" style={{ marginTop: 8 }} />}
                    </>
                  )}
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    {newProduct.image ? 'Change image' : 'Pick from gallery'}
                  </Text>
                  {newProduct.image && (
                    <Text style={{ fontSize: 10, color: '#2e7d32', marginTop: 2 }}>
                      ✓ Image selected (will upload on save)
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.imagePicker, { marginTop: 10 }]} onPress={takePhoto} disabled={uploadingImage}>
                  <Ionicons name="camera-outline" size={36} color="#888" />
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Take a photo</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Price (e.g., KES 120/kg)"
                  value={newProduct.price}
                  onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Stock Quantity"
                  keyboardType="numeric"
                  value={newProduct.stock}
                  onChangeText={text => setNewProduct({ ...newProduct, stock: text })}
                />

                <TouchableOpacity
                  style={[styles.modalBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSaveProduct}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>{editId ? 'Save Changes' : 'Add Product'}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#d32f2f', marginTop: 10 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>

        {/* Product Detail Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={detailVisible}
          onRequestClose={() => setDetailVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <LinearGradient colors={['#ffffff', '#f3fff4']} style={styles.detailModalContent}>
              {selectedProduct && (
                <>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailTitle}>Product Details</Text>
                    <TouchableOpacity onPress={() => setDetailVisible(false)}>
                      <Ionicons name="close-circle" size={32} color="#1b5e20" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    <TouchableOpacity onPress={openImagePreview} activeOpacity={0.85}>
                      <Image
                        source={{ uri: selectedProduct.image || 'https://via.placeholder.com/200' }}
                        style={styles.detailImage}
                      />
                      <View style={styles.zoomHint}>
                        <Ionicons name="expand-outline" size={16} color="#ffffff" />
                      </View>
                    </TouchableOpacity>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailName}>{selectedProduct.name}</Text>
                      <Text style={styles.detailPrice}>{selectedProduct.price}</Text>
                      <View style={styles.detailRow}>
                        <Ionicons name="cube-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailStock}>Stock: {selectedProduct.stock} units</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="barcode-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailId}>Product ID: {selectedProduct.id}</Text>
                      </View>
                    </View>
                    <View style={styles.detailActions}>
                      <TouchableOpacity
                        style={[styles.detailActionBtn, { backgroundColor: '#2e7d32' }]}
                        onPress={() => {
                          setDetailVisible(false)
                          openEditModal(selectedProduct)
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color="#ffffff" />
                        <Text style={styles.detailActionText}>Edit Product</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailActionBtn, { backgroundColor: '#d32f2f' }]}
                        onPress={() => {
                          setDetailVisible(false)
                          handleDelete(selectedProduct.id)
                        }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ffffff" />
                        <Text style={styles.detailActionText}>Delete Product</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              )}
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={imagePreviewVisible}
          onRequestClose={() => setImagePreviewVisible(false)}
        >
          <View style={styles.imagePreviewContainer}>
            <TouchableOpacity
              style={styles.imagePreviewClose}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Ionicons name="close-circle" size={36} color="#ffffff" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedProduct?.image || 'https://via.placeholder.com/400' }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </View>
    </LinearGradient>
  )
}

export default ProductsScreen

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#1b5e20' },
  addBtn: { backgroundColor: '#2e7d32', padding: 6, borderRadius: 24 },
  
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  countContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countText: { fontSize: 13, color: '#666', fontWeight: '600' },
  refreshBtn: { padding: 4 },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  
  // Loading state
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 12, marginBottom: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  productImage: { width: 72, height: 72, borderRadius: 12 },
  productInfo: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '800', color: '#1b5e20' },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#4CAF50', marginTop: 4 },
  productStock: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { marginVertical: 4, padding: 6, borderRadius: 12, backgroundColor: '#f3fff4' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' },
  modalContent: { width: '90%', borderRadius: 16, padding: 20, elevation: 6 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1b5e20', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f3fff4', padding: 12, borderRadius: 12, marginBottom: 12 },
  modalBtn: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  imagePicker: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3fff4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  pickedImage: { width: 80, height: 80, borderRadius: 12 },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  detailModalContent: { width: '90%', borderRadius: 16, padding: 20, elevation: 6, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: '#1b5e20' },
  detailImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  detailInfo: { marginBottom: 16 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#1b5e20', marginBottom: 8 },
  detailPrice: { fontSize: 18, fontWeight: '700', color: '#4CAF50', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailStock: { fontSize: 14, color: '#555', marginLeft: 8 },
  detailId: { fontSize: 14, color: '#888', marginLeft: 8 },
  detailActions: { marginTop: 10 },
  detailActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
  detailActionText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 },
  zoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#1b5e20cc',
    padding: 6,
    borderRadius: 20,
  },
  imagePreviewContainer: { flex: 1, backgroundColor: '#000000dd', justifyContent: 'center', alignItems: 'center' },
  imagePreviewClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  imagePreview: { width: '100%', height: '80%' },
})
