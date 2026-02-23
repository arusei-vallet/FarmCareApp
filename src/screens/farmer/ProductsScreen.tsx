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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'

const ProductsScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const [modalVisible, setModalVisible] = useState(false)
  const [products, setProducts] = useState([
    {
      id: 'PRD-001',
      name: 'Fresh Tomatoes',
      price: 'KES 120/kg',
      stock: 25,
      image:
        'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=400&q=60',
    },
    {
      id: 'PRD-002',
      name: 'Red Onions',
      price: 'KES 80/kg',
      stock: 40,
      image:
        'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=400&q=60',
    },
  ])

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    image: '',
  })

  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start()
  }, [])

  const openAddModal = () => {
    setNewProduct({ name: '', price: '', stock: '', image: '' })
    setEditId(null)
    setModalVisible(true)
  }

  const openEditModal = (product: any) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      stock: product.stock.toString(),
      image: product.image,
    })
    setEditId(product.id)
    setModalVisible(true)
  }

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return

    if (editId) {
      setProducts(products.map(p => (p.id === editId ? { ...p, ...newProduct, stock: Number(newProduct.stock) } : p)))
    } else {
      const id = `PRD-${Math.floor(Math.random() * 1000 + 100)}`
      setProducts([...products, { ...newProduct, id, stock: Number(newProduct.stock) }])
    }

    setModalVisible(false)
    setNewProduct({ name: '', price: '', stock: '', image: '' })
    setEditId(null)
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setProducts(products.filter(p => p.id !== id)) },
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
      setNewProduct({ ...newProduct, image: result.assets[0].uri })
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
      setNewProduct({ ...newProduct, image: result.assets[0].uri })
    }
  }

  const renderItem = ({ item }: any) => (
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
  )

  return (
    <LinearGradient colors={['#f4fbf6', '#e8f5e9']} style={{ flex: 1 }}>
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

        {/* Products List */}
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />

        {/* Add/Edit Product Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <LinearGradient colors={['#ffffff', '#f3fff4']} style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>{editId ? 'Edit Product' : 'Add New Product'}</Text>

                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {newProduct.image ? (
                    <Image source={{ uri: newProduct.image }} style={styles.pickedImage} />
                  ) : (
                    <Ionicons name="image-outline" size={36} color="#888" />
                  )}
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Pick from gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.imagePicker, { marginTop: 10 }]} onPress={takePhoto}>
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
                  placeholder="Price"
                  value={newProduct.price}
                  onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Stock"
                  keyboardType="numeric"
                  value={newProduct.stock}
                  onChangeText={text => setNewProduct({ ...newProduct, stock: text })}
                />

                <TouchableOpacity style={styles.modalBtn} onPress={handleSaveProduct}>
                  <Text style={styles.modalBtnText}>{editId ? 'Save Changes' : 'Add Product'}</Text>
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
      </View>
    </LinearGradient>
  )
}

export default ProductsScreen

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1b5e20' },
  addBtn: { backgroundColor: '#2e7d32', padding: 6, borderRadius: 24 },
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
})