// src/hooks/useIconFonts.ts
import * as Font from 'expo-font';
import { useState, useEffect } from 'react';

export const useIconFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          // Ionicons
          'Ionicons': require('react-native-vector-icons/Fonts/Ionicons.ttf'),
          // MaterialCommunityIcons
          'MaterialCommunityIcons': require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
          // MaterialIcons
          'MaterialIcons': require('react-native-vector-icons/Fonts/MaterialIcons.ttf'),
          // FontAwesome
          'FontAwesome': require('react-native-vector-icons/Fonts/FontAwesome.ttf'),
          // FontAwesome5
          'FontAwesome5': require('react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf'),
          // SimpleLineIcons
          'SimpleLineIcons': require('react-native-vector-icons/Fonts/SimpleLineIcons.ttf'),
          // Entypo
          'Entypo': require('react-native-vector-icons/Fonts/Entypo.ttf'),
          // Feather
          'Feather': require('react-native-vector-icons/Fonts/Feather.ttf'),
          // AntDesign
          'AntDesign': require('react-native-vector-icons/Fonts/AntDesign.ttf'),
          // Fontisto
          'Fontisto': require('react-native-vector-icons/Fonts/Fontisto.ttf'),
          // Foundation
          'Foundation': require('react-native-vector-icons/Fonts/Foundation.ttf'),
          // Octicons
          'Octicons': require('react-native-vector-icons/Fonts/Octicons.ttf'),
          // Zocial
          'Zocial': require('react-native-vector-icons/Fonts/Zocial.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading icon fonts:', error);
        setFontsLoaded(false);
      }
    };

    loadFonts();
  }, []);

  return fontsLoaded;
};
