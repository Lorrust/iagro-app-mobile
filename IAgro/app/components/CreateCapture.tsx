// React e React Native imports
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { IconButton } from 'react-native-paper';

//Expo e hooks imports
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// Interface para a tipagem das props do componente
interface CameraCaptureProps {
  onPhotoCaptured: (uri: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCaptured, onClose }) => {
    const [permission, requestPermission] = useCameraPermissions(); // Hook para gerenciar permissões da câmera
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null); // Referência para a câmera
    const [galleryPermission, setGalleryPermission] = useState(false); // Estado para controlar a permissão da galeria
  
    useEffect(() => {

      // Função para solicitar permissão de acesso à galeria
      const requestGalleryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setGalleryPermission(status === 'granted');
      };
      
      if (!permission) {
        requestPermission();
      }

      // Solicita permissão da galeria
      requestGalleryPermission();
    }, [permission]);
    
    // Função para tirar uma foto usando a câmera
    const handleTakePhoto = async () => {
      if (cameraRef) {
        // Captura a foto
        const photo = await cameraRef.takePictureAsync();
        if (photo?.uri) {

          // Chama a função de callback com o URI da foto capturada
          onPhotoCaptured(photo.uri);
        }
      }
    };
    

    // Função para abrir a galeria e selecionar uma imagem
    const handleOpenGallery = async () => {

      // Verifica se a permissão da galeria foi concedida
      if (!galleryPermission) {
        alert('Você precisa permitir o acesso à galeria para escolher uma imagem.');
        return;
      }
      
      // Abre a galeria para selecionar uma imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPhotoCaptured(result.assets[0].uri); 
      }
    };
    
    // Tela de carregamento enquanto verifica permissões
    if (!permission) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Carregando permissão...</Text>
        </View>
      );
    }
    

    // Se a permissão for negada, exibe a mensagem
    if (!permission.granted) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Permissão para usar a câmera foi negada</Text>
        </View>
      );
    }
  
    return (
      <View style={styles.fullScreenCameraContainer}>

        {/* Visualização da câmera em tela cheia */}
        <CameraView
          style={styles.fullScreenCamera}
          facing="back"
          ref={setCameraRef}
        />
        
        {/* Botão para tirar foto */}
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

          {/* Botão para abrir a galeria */}
          <IconButton
            icon="image"
            size={60}
            onPress={handleOpenGallery}
            style={styles.galleryButton}
            iconColor="#ffffff"
          />
        </View>
      
        {/* Botão para fechar a câmera */}
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