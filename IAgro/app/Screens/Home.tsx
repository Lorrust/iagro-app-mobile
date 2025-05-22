import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, IconButton, Card, Title, Paragraph, BottomNavigation } from 'react-native-paper';
import LogoCopagroUsers from '../components/LogoCopagroUsers';
import CameraCapture from '../components/CreateCapture';
import UserGalleryScreen from '../components/UserGalleryScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosService from '../../services/axiosService';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface ChatData {
  id: string;
  title: string;
  userUid: string;
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
  category?: string;
  problem?: string;
  description?: string;
  recommendation?: string;
}

const IntroScreen = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [chats, setChats] = useState<ChatData[] | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBottomNavigation, setShowBottomNavigation] = useState(false);
  const [navigationIndex, setNavigationIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const params = {
    "limit": 10,
  };

  const handleOpenGalleryDirect = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Você precisa permitir o acesso à galeria para escolher uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handlePhotoCaptured(result.assets[0].uri);
    }
  };

  const fetchUserChats = async () => {
    setLoadingChats(true);
    setErrorChats(null);
    try {
      const userUid = await AsyncStorage.getItem('uid');

      if (!userUid) {
        console.warn("User UID não encontrado. Usuário não logado?");
        setChats([]);
        setLoadingChats(false);
        setShowBottomNavigation(false);
        return;
      }

      console.log(`Buscando conversas para o UID: ${userUid}`);
      const response = await axiosService.get(`/chats/users/${userUid}` );
      console.log('Resposta da API de chats:', response.data.chats);

      if (Array.isArray(response.data.chats)) {
        setChats(response.data.chats);
        setShowBottomNavigation(response.data.chats.length > 0);
        console.log('chats.length:', response.data.chats.length);
      } else {
        console.warn('Resposta inesperada da API');
        setChats([]);
        setShowBottomNavigation(false);
      }
      setLoadingChats(false);
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      setErrorChats('Erro ao carregar as conversas. Tente novamente mais tarde.');
      setLoadingChats(false);
      setShowBottomNavigation(false);
    }
  };

  const filteredChats = chats?.filter((chat) =>
    chat.problem?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  useEffect(() => {
    fetchUserChats();
  }, []);

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
    alert('Foto confirmada! Implementação de envio pendente.');
    setPhotoUri(null);
  };

  const handleCancelCamera = () => setIsCameraVisible(false);
  const handleCancelGallery = () => setIsGalleryVisible(false);

  const handleCardPress = (chatId: string) => {
    console.log('Abrir chat com ID:', chatId);
    alert(`Abrir conversa com ID: ${chatId}`);
    // router.push(`/Screens/ChatDetail/${chatId}`);
  };

  const handleNavigationChange = (index: number) => {
    setNavigationIndex(index);
    switch (index) {
      case 0:
        setIsCameraVisible(false);
        setIsGalleryVisible(false);
        break;
      case 1:
        setIsCameraVisible(true);
        setIsGalleryVisible(false);
        break;
      case 2:
        handleOpenGalleryDirect();
        break;
      default:
        break;
    }
  };

  if (isCameraVisible) {
    return <CameraCapture onPhotoCaptured={handlePhotoCaptured} onClose={handleCancelCamera} />;
  }

  if (isGalleryVisible) {
    return <UserGalleryScreen onClose={handleCancelGallery} />;
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <LogoCopagroUsers />
        <View style={styles.previewContainer}>
          <View style={styles.overlay}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />
          </View>
          <View style={styles.actions}>
            <IconButton icon="check" onPress={handleConfirm} size={36} style={styles.confirm} iconColor="#fff" />
            <IconButton icon="camera-retake" onPress={handleRetake} size={36} style={styles.retake} iconColor="#fff" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LogoCopagroUsers />

      <View style={{ flex: 1, width: '100%' }}>
        <TextInput
          placeholder="Pesquisar por problema..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

        {loadingChats && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#028C48" />
            <Text style={styles.loadingText}>Carregando conversas...</Text>
          </View>
        )}

        {errorChats && (
          <View style={styles.centeredContent}>
            <Text style={styles.errorText}>{errorChats}</Text>
            <TouchableOpacity onPress={fetchUserChats} style={{ marginTop: 20 }}>
              <Text style={styles.retryText}>Tentar carregar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingChats && !errorChats && (chats === null || chats.length === 0) && (
          <View style={styles.centeredContent}>
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
          </View>
        )}

        {!loadingChats && !errorChats && filteredChats.length > 0 && (
          <ScrollView contentContainerStyle={styles.chatsListContainer} showsVerticalScrollIndicator={true} bounces={false}>
            {filteredChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                onPress={() => handleCardPress(chat.id)}
                style={styles.cardWrapper}
              >
                <Card style={styles.chatCard}>
                  <Card.Content>
                    <Title style={styles.cardTitle}>
                      {chat.title || 'Titulo não especificado'}
                    </Title>
                    <Paragraph
                      style={styles.cardDescription}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {chat.description}
                    </Paragraph>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Rodapé fixo e funcional */}
      {showBottomNavigation && (
      <View style={styles.customBottomBar}>
        <IconButton
          icon="home"
          iconColor={navigationIndex === 0 ? '#FFFFFF' : '#FFFFFF'}
          onPress={() => handleNavigationChange(0)}
        />
        <IconButton
          icon="camera"
          iconColor={navigationIndex === 1 ? '#FFFFFF' : '#FFFFFF'}
          onPress={() => handleNavigationChange(1)}
        />
        <IconButton
          icon="folder"
          iconColor={navigationIndex === 2 ? '#FFFFFF' : '#FFFFFF'}
          onPress={() => handleNavigationChange(2)}
        />
      </View>
      )}

      {!showBottomNavigation && !loadingChats && !photoUri && (chats === null || chats.length === 0) && (
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
    //alignItems: 'center',
    paddingTop: 60,
    //flexDirection: 'column',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#028C48',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  retryText: {
    color: '#028C48',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  searchContainer: {
    width: '85%',
    marginTop: 30,
    elevation: 2,
    borderRadius: 33,
  },
  searchInput: {
    width: '85%',
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 10,
    alignSelf: 'center',  
    elevation: 2,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustration: {
    width: '100%',
    height: 450,
    marginTop: 0,
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  seta: {
    width: 30,
    height: 30,
    marginTop: -10,
    marginBottom: 20,
    left: 145,
  },
  openCameraButton: {
    backgroundColor: '#AFAFAF',
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 1,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 0,
    justifyContent: 'center',
    width: '100%',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    flex: 1,
    justifyContent: 'center',
  },
  photoPreview: {
    width: 350,
    height: 500,
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 1,
  },
  confirm: {
    backgroundColor: 'green',
    marginRight: 20,
  },
  retake: {
    backgroundColor: 'red',
  },
  chatsListContainer: {
    paddingHorizontal: 10,
    //width: '100%',
    paddingBottom: 20,
    paddingTop: 20,
  },
  cardWrapper: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chatCard: {
  elevation: 30,
  backgroundColor: '#E0E0E0',
  marginHorizontal: 10,
  borderRadius: 12,
  padding: 10,
  marginTop: 8,
  marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
  },
  cardDescription: {
    fontSize: 15,
    color: '#555',
    marginTop: 6,
    lineHeight: 18,
  },
  cardId: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
  },
  bottomNavigation: {
    backgroundColor: '#028C48',
  },
  scrollArea: {
    flex: 1,
    width: '100%',
    marginBottom: 70, // Espaço para o bottom navigation
  },
  customBottomBar: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 60,
  backgroundColor: '#028C48',
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  elevation: 8,
  zIndex: 10,
  },
});

export default IntroScreen;