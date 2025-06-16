import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface CameraCaptureProps {
  onPhotoCaptured: (uri: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCaptured, onClose }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [galleryPermission, setGalleryPermission] = useState(false);
  
    useEffect(() => {
      const requestGalleryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setGalleryPermission(status === 'granted');
      };
      
      if (!permission) {
        requestPermission();
      }
      requestGalleryPermission();
    }, [permission]);
  
    const handleTakePhoto = async () => {
      if (cameraRef) {
        const photo = await cameraRef.takePictureAsync();
        if (photo?.uri) {
          onPhotoCaptured(photo.uri);
        }
      }
    };
  
    const handleOpenGallery = async () => {
      if (!galleryPermission) {
        alert('Você precisa permitir o acesso à galeria para escolher uma imagem.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPhotoCaptured(result.assets[0].uri); 
      }
    };
  
    if (!permission) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Carregando permissão...</Text>
        </View>
      );
    }
  
    if (!permission.granted) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Permissão para usar a câmera foi negada</Text>
        </View>
      );
    }
  
    return (
      <View style={styles.fullScreenCameraContainer}>
        <CameraView
          style={styles.fullScreenCamera}
          facing="back"
          ref={setCameraRef}
        />
        
        <View style={styles.bottomButtonsContainer}>
          <IconButton
            icon="camera"
            size={60}
            mode="contained"
            containerColor="#D9D9D9"
            iconColor="#ffffff"
            onPress={handleTakePhoto}
            style={styles.fullScreenCameraButton}
          />
          <IconButton
            icon="image"
            size={60}
            onPress={handleOpenGallery}
            style={styles.galleryButton}
            iconColor="#ffffff"
          />
        </View>
  
        <IconButton
          icon="close"
          size={36}
          onPress={onClose}
          style={styles.closeButton}
          iconColor="#fff"
        />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    fullScreenCameraContainer: {
      flex: 1,
      backgroundColor: 'black',
    },
    fullScreenCamera: {
      flex: 1,
    },
    bottomButtonsContainer: {
      position: 'absolute',
      bottom: 40,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    fullScreenCameraButton: {
      marginHorizontal: 10,
      width: 85,
      height: 85,
      borderRadius: 42.5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#AFAFAF',
    },
    galleryButton: {
      marginHorizontal: 10,
      width: 85,
      height: 85,
      borderRadius: 42.5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#AFAFAF',
    },
    closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F3F3F3',
    },
  });

export default CameraCapture;