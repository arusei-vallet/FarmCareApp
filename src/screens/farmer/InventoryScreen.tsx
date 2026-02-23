// src/screens/farmer/InventoryScreen.tsx
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../services/supabase';

const InventoryScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempProduct, setTempProduct] = useState({
    id: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    const { id, name, category, price, quantity } = tempProduct;
    if (!name || !category || !price || !quantity) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    try {
      if (id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({ name, category, price, quantity })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabase
          .from('products')
          .insert({ name, category, price, quantity });
        if (error) throw error;
      }
      setModalVisible(false);
      setTempProduct({ id: '', name: '', category: '', price: '', quantity: '' });
      fetchProducts();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.productQty}>Qty: {item.quantity}</Text>
        <Text style={styles.productPrice}>KES {item.price}</Text>
        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <TouchableOpacity
            style={{ marginRight: 10 }}
            onPress={() => {
              setTempProduct({
                id: item.id,
                name: item.name,
                category: item.category,
                price: item.price,
                quantity: item.quantity,
              });
              setModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={22} color="#2e7d32" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteProduct(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#e8f5e9', '#f4fbf6']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
          <Text style={styles.title}>Inventory</Text>
          <TouchableOpacity
            onPress={() => {
              setTempProduct({ id: '', name: '', category: '', price: '', quantity: '' });
              setModalVisible(true);
            }}
            style={styles.addBtn}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 40 }} />
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products available. Add new products.</Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <LinearGradient colors={['#e8f5e9', '#f4fbf6']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>{tempProduct.id ? 'Edit Product' : 'Add Product'}</Text>
              <TextInput
                placeholder="Product Name"
                style={styles.input}
                value={tempProduct.name}
                onChangeText={(text) => setTempProduct({ ...tempProduct, name: text })}
              />
              <TextInput
                placeholder="Category"
                style={styles.input}
                value={tempProduct.category}
                onChangeText={(text) => setTempProduct({ ...tempProduct, category: text })}
              />
              <TextInput
                placeholder="Price"
                style={styles.input}
                keyboardType="numeric"
                value={tempProduct.price.toString()}
                onChangeText={(text) => setTempProduct({ ...tempProduct, price: text })}
              />
              <TextInput
                placeholder="Quantity"
                style={styles.input}
                keyboardType="numeric"
                value={tempProduct.quantity.toString()}
                onChangeText={(text) => setTempProduct({ ...tempProduct, quantity: text })}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={saveProduct}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </LinearGradient>
  );
};

export default InventoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 12, elevation: 3 },
  title: { fontSize: 24, fontWeight: '700', color: '#1b4332' },
  addBtn: { flexDirection: 'row', backgroundColor: '#2e7d32', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', elevation: 4 },
  productName: { fontWeight: '700', fontSize: 16, color: '#1b4332' },
  productCategory: { fontSize: 13, color: '#6c757d', marginTop: 4 },
  productQty: { fontWeight: '600', color: '#2e7d32' },
  productPrice: { fontWeight: '700', color: '#1b4332', marginTop: 4 },
  emptyText: { marginTop: 40, textAlign: 'center', color: '#6c757d', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: '90%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#163d1a', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#cfcfcf' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalCancel: { backgroundColor: '#9e9e9e', flex: 1, padding: 12, borderRadius: 12, marginRight: 8, alignItems: 'center' },
  modalSave: { backgroundColor: '#2e7d32', flex: 1, padding: 12, borderRadius: 12, marginLeft: 8, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});