import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, IconButton, Surface, Card, Title, Paragraph } from 'react-native-paper';
import LogoCopagroUsers from '../components/LogoCopagroUsers';
import CameraCapture from '../components/CreateCapture';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage
import axiosService from '../../services/axiosService'; // Já importado, ok
import { router } from 'expo-router'; // Importar router para navegação

// Definir um tipo para a estrutura dos dados de conversa
interface ChatData {
  id: string;
  userUid: string;
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
  category: string;
  problem: string;
  description: string;
  recommendation: string;
}

const IntroScreen = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  // Novos estados para carregar e exibir as conversas
  const [chats, setChats] = useState<ChatData[] | null>(null);
  const [loadingChats, setLoadingChats] = useState(true); // Começa como true para carregar os chats ao iniciar
  const [errorChats, setErrorChats] = useState<string | null>(null);

  // Função para buscar os chats do usuário logado
  const fetchUserChats = async () => {
    setLoadingChats(true);
    setErrorChats(null);
    try {
      const userUid = await AsyncStorage.getItem('uid'); // Pega o UID do AsyncStorage

      if (!userUid) {
        console.warn("User UID não encontrado. Usuário não logado?");
        setChats([]); // Define como array vazio se não houver UID
        setLoadingChats(false);
        return;
      }

      console.log(`Buscando conversas para o UID: ${userUid}`);
      const response = await axiosService.get(`/chats/users/${userUid}`); // Rota com o UID

      console.log('Resposta da API de chats:', response.data);

      if (response.data && response.data.success && response.data.data) {
        setChats(response.data.data); // Salva os dados da conversa
      } else {
        // Se a API retornar sucesso mas data for vazio ou null
        setChats([]);
      }

    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      setErrorChats('Erro ao carregar conversas. Tente novamente mais tarde.');
      setChats([]); // Garante que o estado de chats seja vazio em caso de erro
    } finally {
      setLoadingChats(false);
    }
  };

  // UseEffect para buscar os chats quando a tela montar
  useEffect(() => {
    fetchUserChats();
  }, []); // Array de dependência vazio para rodar apenas uma vez ao montar

  const handlePhotoCaptured = (uri: string) => {
    setPhotoUri(uri);
    setIsCameraVisible(false);
    // Aqui, após capturar uma foto, você pode querer recarregar os chats
    // ou navegar para a tela de análise/chat com a nova foto.
    // Por enquanto, apenas limpa o estado de chats para forçar a re-exibição
    // da tela de "sem chats" ou um novo loading se for o caso.
    // setChats(null); // Opcional: resetar o estado para exibir loading novamente
    // fetchUserChats(); // Opcional: recarregar chats após tirar uma foto (se a foto gerar um novo chat automaticamente)
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setIsCameraVisible(true);
  };

  const handleConfirm = () => {
    console.log('Foto confirmada:', photoUri);
    // TODO: Aqui você enviaria a foto para a API para análise
    // Após o envio e processamento (em outra tela, talvez), você voltaria
    // para esta tela e chamaria fetchUserChats() novamente para ver a nova conversa.
    alert('Foto confirmada! Implementação de envio pendente.');
    setPhotoUri(null); // Limpa a foto de preview
    // fetchUserChats(); // Recarrega a lista após suposta conclusão da análise
  };

  const handleCancelCamera = () => setIsCameraVisible(false);

  const handleCardPress = (chatId: string) => {
    console.log('Abrir chat com ID:', chatId);
    // TODO: Navegar para a tela de chat detalhado, passando o chatId
    // router.push(`/Screens/ChatDetail/${chatId}`); // Exemplo de rota
    alert(`Abrir conversa com ID: ${chatId}`);
  };

  if (isCameraVisible) {
    return <CameraCapture onPhotoCaptured={handlePhotoCaptured} onClose={handleCancelCamera} />;
  }

  // Se houver uma foto para pré-visualizar, mostre a pré-visualização
  if (photoUri) {
    return (
      <View style={styles.container}>
        <LogoCopagroUsers/>
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
      </View>
    );
  }

  // Se não houver foto para pré-visualizar, mostre o conteúdo principal (chats ou tela inicial)
  return (
    <View style={styles.container}>
      <LogoCopagroUsers/>

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
        // Mostra a tela inicial (sem chats) - Sem barra de pesquisa agora
        <>
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
           {/* Botão da câmera sempre no final para tela inicial */}
           <IconButton
              icon="camera"
              size={50}
              mode="contained"
              style={styles.openCameraButton}
              onPress={() => setIsCameraVisible(true)}
              iconColor="#fff"
            />
        </>
      )}

      {!loadingChats && !errorChats && chats && chats.length > 0 && (
        // Mostra a lista de cards com as conversas - Sem barra de pesquisa
        <ScrollView contentContainerStyle={styles.chatsListContainer}>
            {/* A barra de pesquisa NÃO aparece aqui */}
            {chats.map((chat) => (
                <TouchableOpacity
                    key={chat.id}
                    onPress={() => handleCardPress(chat.id)}
                    style={styles.cardWrapper}
                >
                    <Card style={styles.chatCard}>
                      <Card.Content>
                        <Title style={styles.cardTitle}>{chat.problem || 'Problema não especificado'}</Title>
                        <Paragraph style={styles.cardDescription} numberOfLines={4} ellipsizeMode="tail">
                          {chat.description}
                        </Paragraph>
                        <Text style={styles.cardId}>ID: {chat.id}</Text>
                      </Card.Content>
                    </Card>

                </TouchableOpacity>
            ))}
        </ScrollView>
      )}

       {/* Botão da câmera - aparece apenas se não estiver carregando chats E se chats EXISTEM e NÃO ESTÃO VAZIOS (para não duplicar com a tela inicial)
           Ou pode deixá-lo fixo na parte inferior, independentemente da lista de chats.
           Vamos deixá-lo fixo na parte inferior para ambas as telas (lista de chats e sem chats)
           Mas só se não estiver carregando e não estiver mostrando preview.
        */}
        {!loadingChats && !photoUri && (chats === null || chats.length > 0) && (
           <IconButton
              icon="camera"
              size={50}
              mode="contained"
              style={styles.openCameraButtonList} // Estilo diferente para posicionar na lista
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
    backgroundColor: '#F8F3F9',
    borderRadius: 33,
    height: 50,
  },
   centeredContent: {
      flex: 1, // Permite que este conteúdo ocupe o espaço disponível
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%', // Garante que o container ocupe a largura total para centralização
   },
  illustration: {
    width: '100%',
    height: 450, // Ajustado para caber melhor com o conteúdo centralizado
    marginTop: 0, // Ajustado
    marginBottom: 20, // Adicionado espaço
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
     paddingHorizontal: 20, // Adicionado padding horizontal
  },
  seta: {
    width: 30,
    height: 30,
    marginTop: -10, // Ajustado
    marginBottom: 20,
    left: 145, // Manteve a posição lateral
  },
   // Estilo para o botão da câmera na tela inicial (sem chats)
  openCameraButton: {
    backgroundColor: '#AFAFAF',
    position: 'absolute', // Posição absoluta no container principal
    bottom: 30, // 30px do fundo
    right: 30, // 30px da direita
    zIndex: 1, // Garante que fique acima de outros elementos
  },
  // Estilo para o botão da câmera na tela com lista de chats
   openCameraButtonList: {
    backgroundColor: '#AFAFAF',
    position: 'absolute', // Posição absoluta no container principal
    bottom: 30, // 30px do fundo
    right: 30, // 30px da direita
    zIndex: 1, // Garante que fique acima de outros elementos
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 0, // Ajustado para não ter margin top se for o único conteúdo
    justifyContent: 'center',
    width: '100%', // Usa largura total
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro para dar destaque à imagem
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
     flex: 1, // Permite que a pré-visualização ocupe espaço
     justifyContent: 'center', // Centraliza a imagem no overlay
  },
  photoPreview: {
    width: 350,
    height: 500,
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    position: 'absolute', // Posiciona sobre a pré-visualização
    bottom: 40, // Um pouco acima da base
    alignSelf: 'center', // Centraliza horizontalmente
    zIndex: 1, // Garante que fiquem acima da imagem
  },
  confirm: {
    backgroundColor: 'green',
    marginRight: 20,
  },
  retake: {
    backgroundColor: 'red',
  },
   chatsListContainer: {
      paddingHorizontal: 10, // Espaço nas laterais
      paddingBottom: 100, // Espaço inferior para não esconder o último card com o botão da câmera
      width: '100%', // Garante que o ScrollView use a largura total
   },
   cardWrapper: {
       marginBottom: 10, // Espaço entre os cards
       borderRadius: 8, // Borda arredondada para o touchable
       overflow: 'hidden', // Garante que o conteúdo fique dentro da borda
   },
   chatCard: {
      elevation: 2, // Sombra
   },
   cardTitle: {
       fontSize: 16,
       fontWeight: 'bold',
       color: '#333', // Cor escura para o texto do problema
   },
   cardDescription: {
  fontSize: 14,
  color: '#555',
  marginTop: 8,
  lineHeight: 20,
},

cardId: {
  fontSize: 12,
  color: '#999',
  marginTop: 12,
  fontStyle: 'italic',
},

});

export default IntroScreen;