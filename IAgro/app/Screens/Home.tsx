import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { TextInput, IconButton, Surface } from 'react-native-paper';
import LogoCopagroUsers from '../components/LogoCopagroUsers';
import CameraCapture from '../components/CreateCapture';

const IntroScreen = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  const handlePhotoCaptured = (uri: string) => {
    setPhotoUri(uri);
    setIsCameraVisible(false);
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setIsCameraVisible(true);
  };

  const handleConfirm = () => {
    console.log('Foto confirmada:', photoUri);
    // aqui você pode salvar ou enviar a foto
  };

  const handleCancelCamera = () => setIsCameraVisible(false);

  if (isCameraVisible) {
    return <CameraCapture onPhotoCaptured={handlePhotoCaptured} onClose={handleCancelCamera} />;
  }

  return (
    <View style={styles.container}>
      <LogoCopagroUsers />

      {/* Condicional para exibir a barra de pesquisa somente se não houver foto */}
      {!photoUri && (
        <Surface style={styles.searchContainer}>
          <TextInput
            placeholder="Pesquise por alguma conversa"
            mode="flat"
            underlineColor="transparent"
            style={styles.searchInput}
            right={<TextInput.Icon icon="magnify" />}
          />
        </Surface>
      )}

      {!photoUri && (
        <>
          <Image
            source={require('../../assets/images/intro.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
          <Text style={styles.description}>
            Análises e consultas fenológicas aparecerão {'\n'} aqui após sua primeira foto
          </Text>
          <Image
            source={require('../../assets/images/seta.png')}
            style={styles.seta}
          />
        </>
      )}

      {photoUri && (
        <View style={styles.previewContainer}>
          {/* Fundo escuro atrás da imagem */}
          <View style={styles.overlay}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />
          </View>
          <View style={styles.actions}>
            <IconButton icon="check" onPress={handleConfirm} size={36} style={styles.confirm} iconColor="#fff" />
            <IconButton icon="camera-retake" onPress={handleRetake} size={36} style={styles.retake} iconColor="#fff" />
          </View>
        </View>
      )}

      {!photoUri && (
        <IconButton
          icon="camera"
          size={50}
          mode="contained"
          style={styles.openCameraButton}
          onPress={() => setIsCameraVisible(true)}
          iconColor="#fff"
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
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
  },
  seta: {
    width: 30,
    height: 30,
    marginTop: -33,
    marginBottom: 20,
    left: 145,
  },
  openCameraButton: {
    backgroundColor: '#AFAFAF',
    left: 145,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20,
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro para dar destaque à imagem
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  photoPreview: {
    width: 350, // Tamanho maior para melhor visualização
    height: 500, // Tamanho maior
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  confirm: {
    backgroundColor: 'green',
    marginRight: 20,
  },
  retake: {
    backgroundColor: 'red',
  },
});

export default IntroScreen;
