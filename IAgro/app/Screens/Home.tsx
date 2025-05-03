import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, Alert } from 'react-native';
import { TextInput, IconButton, Surface } from 'react-native-paper';
import LogoCopagroUsers from '../components/LogoCopagroUsers';
import { launchCamera } from 'react-native-image-picker';

const IntroScreen = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
    
  const handleOpenCamera = () => {
    const options = {
      mediaType: 'photo' as const,
      saveToPhotos: true,
      cameraType: 'back' as const,
    };

    launchCamera(options, response => {
        if (response.errorCode === 'camera_unavailable') {
            Alert.alert('Erro', 'Câmera indisponível');
        } else if (response.errorCode === 'permission') {
            Alert.alert('Erro', 'Permissão da câmera não concedida');
        } else if (response.errorCode === 'others') {
            Alert.alert('Erro', 'Erro desconhecido: ' + response.errorMessage);
        }
      if (response.didCancel) {
        console.log('Usuário cancelou a câmera');
      } else if (response.errorCode) {
        Alert.alert('Erro', response.errorMessage || 'Erro ao abrir câmera');
      } else {
        const photo = response.assets?.[0];
        if (photo?.uri) {
          setPhotoUri(photo.uri);
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Logo no topo */}
      <View>
        <LogoCopagroUsers />
      </View>

      {/* Search Bar */}
      <Surface style={styles.searchContainer}>
        <TextInput
          placeholder="Pesquise por alguma conversa"
          mode="flat"
          underlineColor="transparent"
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" />}
        />
      </Surface>

      {/* Illustration */}
      {!photoUri && (
        <Image
          source={require('../../assets/images/intro.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      )}

      {/* Description */}
      {!photoUri && (
        <>
          <Text style={styles.description}>
            Análises e consultas fenológicas aparecerão {'\n'} aqui após sua primeira foto
          </Text>
          <Image
            source={require('../../assets/images/seta.png')}
            style={styles.seta}
          />
        </>
      )}

      {/* Mostra a foto tirada */}
      {photoUri && (
        <View style={{ alignItems: 'center' }}>
          <Image
            source={{ uri: photoUri }}
            style={{ width: 300, height: 400, marginTop: 20, borderRadius: 10 }}
            resizeMode="cover"
          />
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <IconButton
              icon="check"
              size={36}
              onPress={() => {
                console.log('Foto confirmada:', photoUri);
                // Aqui você pode enviar a imagem para o backend ou salvar localmente
              }}
              style={{ backgroundColor: 'green', marginRight: 20 }}
              iconColor="#fff"
            />
            <IconButton
              icon="camera-retake"
              size={36}
              onPress={() => setPhotoUri(null)}
              style={{ backgroundColor: 'red' }}
              iconColor="#fff"
            />
          </View>
        </View>
      )}

      {/* Botão da câmera (só mostra se nenhuma foto foi tirada) */}
      {!photoUri && (
        <IconButton
          icon="camera"
          size={36}
          mode="contained"
          containerColor="#D9D9D9"
          iconColor="#ffffff"
          onPress={handleOpenCamera}
          style={styles.cameraButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 160,
    height: 40,
    marginBottom: 30,
  },
  searchContainer: {
    width: '85%',
    marginTop: 30,
    elevation: 2,
    borderRadius: 33,
  },
  searchInput: {
    backgroundColor: '#F8F3F9',
    borderRadius: 33,
    height: 50,
  },
  illustration: {
    width: '100%',
    height: 450,
    marginTop: 90,
  },
  seta: {
    width: 30,
    height: 30,
    marginTop: -33,
    marginBottom: 20,
    left: 145,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
  },
  cameraButton: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    position: 'absolute',
    bottom: 40,
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#AFAFAF',
  },
  cameraIcon: {
    width: 39,
    height: 39,
  },
});

export default IntroScreen;
