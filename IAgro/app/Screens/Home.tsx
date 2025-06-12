import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Text, ScrollView, ActivityIndicator, TouchableOpacity, Animated  } from 'react-native';
import { TextInput, IconButton, Card, Title, Paragraph, BottomNavigation } from 'react-native-paper';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
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
  lastDiagnosis?: {
    category?: string;
    problem?: string;
    description?: string;
    recommendation?: string;
  };
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
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const swipeableRef = useRef<Swipeable | null>(null);
  const [hasAnimatedHint, setHasAnimatedHint] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    console.log('Valor de hasMore:', hasMore);
    console.log('Quantidade de chats carregados:', chats?.length);
  }, [hasMore, chats]);

  useEffect(() => {
    // A condição para TENTAR a animação continua a mesma
    if (!loadingChats && chats && chats.length > 0 && !hasAnimatedHint) {
      
      // Adicionamos um pequeno delay para garantir que a ref foi anexada
      const animationTriggerTimeout = setTimeout(() => {
        // A verificação da ref é feita AGORA, dentro do timeout
        if (swipeableRef.current) {
          setHasAnimatedHint(true); // Marcamos como animado
          
          swipeableRef.current.openRight(); // Abrimos o item

          // Agendamos o fechamento
          const closeTimeout = setTimeout(() => {
            swipeableRef.current?.close();
          }, 1500);

          // Limpamos o timeout de fechamento se o componente for desmontado
          return () => clearTimeout(closeTimeout);
        }
      }, 100); // Um delay curto (100ms) é suficiente

      // Limpamos o timeout principal se as dependências mudarem
      return () => clearTimeout(animationTriggerTimeout);
    }
  }, [chats, loadingChats, hasAnimatedHint]);

  const renderRightActions = (progress: any, dragX: any, chatId: string) => {
    return (
        <RectButton style={styles.deleteButton} onPress={() => handleDeleteChat(chatId)}>
            <IconButton icon="delete" iconColor="#fff" size={30} />
        </RectButton>
    );
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

  const handleDeleteChat = async (chatId: string) => {
    try {
      const userUid = await AsyncStorage.getItem('uid');
      if (!userUid) {
        alert('Usuário não identificado.');
        return;
      }
      await axiosService.del(`/chats/${userUid}/${chatId}`);
      setChats((prev) => prev?.filter(chat => chat.id !== chatId) || []);
    } catch (error) {
      console.error('Erro ao excluir o chat:', error);
      alert('Erro ao excluir o chat.');
    }
  };

  const fetchUserChats = async () => {
    setLoadingChats(true);
    setErrorChats(null);
    setHasAnimatedHint(false);
    try {
      const userUid = await AsyncStorage.getItem('uid');
      if (!userUid) {
        console.warn("User UID não encontrado.");
        setChats([]);
        setLoadingChats(false);
        setShowBottomNavigation(false);
        return;
      }

      console.log(`Buscando conversas para o UID: ${userUid}`);
      const param = {
        "limit": 5,
      }
      const response = await axiosService.get(`/chats/users/${userUid}`, param);
      console.log('Resposta da API de chats:', response.data.chats);
      console.log('Response total dados' ,response)

      if (Array.isArray(response.data.chats)) {
        setChats(response.data.chats);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
      } else {
        setChats([]);
      }

      setShowBottomNavigation(response.data.chats.length > 0);
    } catch (error) {
      setErrorChats('Erro ao carregar as conversas.');
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMoreChats = async () => {
    if (!hasMore || loadingChats) return;

    setLoadingChats(true);
    setErrorChats(null);

    try {
      const userUid = await AsyncStorage.getItem('uid');
      console.log('🔍 loadMoreChats: UID encontrado?', userUid);
      console.log('🔍 Próximo cursor:', nextCursor);

      if (!userUid || !nextCursor) {
        console.warn('UID ou cursor ausente ao tentar carregar mais chats.');
        return;
      }

      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=5&lastChatId=${nextCursor}`
      );

      console.log('📥 Novas conversas recebidas:', response.data.chats);

      if (Array.isArray(response.data.chats)) {
        setChats((prev) => [...(prev || []), ...response.data.chats]);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mais conversas:', error);
      setErrorChats('Erro ao carregar mais conversas.');
    } finally {
      setLoadingChats(false);
    }
  };



  const filteredChats = chats?.filter((chat) => {
  const query = searchQuery.toLowerCase();
  return (
    chat.title?.toLowerCase().includes(query) ||
    chat.lastDiagnosis?.problem?.toLowerCase().includes(query) ||
    chat.lastDiagnosis?.description?.toLowerCase().includes(query) ||
    !searchQuery
  );
  }) || [];


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

  const handleConfirm = async () => {
  if (isSending) return;

  try {
      if (!photoUri) return;

      if (!message.trim()) {
        alert('Por favor, escreva uma mensagem antes de enviar.');
        return;
      }

      const userUid = await AsyncStorage.getItem('uid');
      if (!userUid) {
        alert('Usuário não identificado.');
        return;
      }

      const idToken = await AsyncStorage.getItem('idToken');

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/png',
        name: 'foto.png',
      } as any);

      if (message.trim() !== '') {
        formData.append('message', message.trim());
      }

      setIsSending(true);

      await axiosService.post(`/chats/${userUid}/message`, formData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Aqui você pode limpar o formulário, fechar o modal etc.

    } catch (error) {
      console.error(error);
      alert('Erro ao enviar a imagem. Tente novamente.');
    } finally {
      setIsSending(false); // Destrava o botão apenas em caso de erro
    }
  };


  const handleCancelCamera = () => setIsCameraVisible(false);
  const handleCancelGallery = () => setIsGalleryVisible(false);

  const handleCardPress = (chatId: string) => {
    console.log('Abrir chat com ID:', chatId);
    //alert(`Abrir conversa com ID: ${chatId}`);
    router.push(`/Screens/Chats?chatId=${chatId}`);
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
      <ScrollView contentContainerStyle={styles.previewContainer}>
        <LogoCopagroUsers />
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />

        <TextInput
          placeholder="Detalhe o seu problema (obrigatório)"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 10,
            elevation: 2,
            width: '90%',
            marginTop: 20,
          }}
        />

        <View style={styles.actions}>
          <IconButton
            icon={isSending ? 'loading' : 'check'} // opcional: ícone diferente se enviando
            onPress={handleConfirm}
            size={36}
            style={[
              styles.confirm,
              { opacity: message.trim() && !isSending ? 1 : 0.5 }
            ]}
            iconColor="#fff"
            disabled={!message.trim() || isSending}
          />
          <IconButton
            icon="camera-retake"
            onPress={handleRetake}
            size={36}
            style={styles.retake}
            iconColor="#fff"
          />
        </View>
      </ScrollView>
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
            {filteredChats.map((chat, index) => (
              <Swipeable
                key={chat.id}
                ref={index === 0 ? swipeableRef : null}
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, chat.id)}
              >
                <TouchableOpacity onPress={() => handleCardPress(chat.id)} style={styles.cardWrapper}>
                  <Card style={styles.chatCard}>
                    <Card.Content>
                      <Title style={styles.cardTitle}>
                        {chat.title || 'Título não especificado'}
                      </Title>
                      <Paragraph
                        style={styles.cardDescription}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {chat.lastDiagnosis?.description || 'Descrição não especificada'}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </Swipeable>
            ))}

            {hasMore && !loadingChats && (
              <TouchableOpacity onPress={loadMoreChats} style={{ padding: 10, alignItems: 'center' }}>
                <Text style={{ color: '#028C48', fontSize: 16 }}>Ver mais conversas</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      {/* Rodapé fixo e funcional */}
      {showBottomNavigation && (
      <View style={styles.customBottomBar}>
        <IconButton
          icon="home"
          size={30}
          iconColor={navigationIndex === 0 ? '#FFFFFF' : '#FFFFFF'}
          onPress={() => handleNavigationChange(0)}
        />
        <IconButton
          icon="camera"
          size={30}
          iconColor={navigationIndex === 1 ? '#FFFFFF' : '#FFFFFF'}
          onPress={() => handleNavigationChange(1)}
        />
        <IconButton
          icon="folder"
          size={30}
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
  deleteButton: {
  backgroundColor: '#D32F2F',
  justifyContent: 'center',
  alignItems: 'center',
  width: 70,
  borderRadius: 12,
  marginVertical: 8,
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
  width: '100%',
  aspectRatio: 2 / 2, // proporção vertical típica (ajuste conforme necessário)
  borderRadius: 12,
  backgroundColor: '#ccc', // para debug
  alignSelf: 'center',
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
    paddingBottom: 70,
    paddingTop: 20,
  },
  cardWrapper: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chatCard: {
  elevation: 30,
  backgroundColor: '#F8F8FF',
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