//POR SER UMA TELA PRINCIPAL, TERÃO MUITOS COMENTÁRIOS,
//PEÇO QUE SEJAM LIDOS COM ATENÇÃO PARA UM BOM ENTENDIMENTO.

// Importações do React e hooks necessários
import React, { useState, useEffect, useRef, useContext } from "react";
// Importações de componentes nativos do React Native
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
// Importações de componentes do React Native Paper (Material Design)
import {
  TextInput,
  IconButton,
  Card,
  Title,
  Paragraph,
  BottomNavigation,
  useTheme,
  Searchbar,
  Text,
} from "react-native-paper";
// Importações para gestos de deslizar (swipe)
import { Swipeable, RectButton } from "react-native-gesture-handler";
// Importações para animações
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
  interpolate,
} from "react-native-reanimated";
// Importações de contextos, componentes e serviços da aplicação
import { ThemeContext } from "../contexts/ThemeContext";
import LogoCopagroUsers from "../components/LogoCopagroUsers";
import CameraCapture from "../components/CreateCapture";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosService from "../../services/axiosService";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";

// Interface que define a estrutura dos dados de um chat
interface ChatData {
  id: string; // ID único do chat
  title: string; // Título do chat
  userUid: string; // ID do usuário
  timestamp: { _seconds: number; _nanoseconds: number }; // Timestamp do chat
  lastDiagnosis?: { // Último diagnóstico (opcional)
    category?: string; // Categoria do problema
    problem?: string; // Problema identificado
    description?: string; // Descrição do problema
    recommendation?: string; // Recomendação sugerida
  };
}

// Interface das propriedades do componente HomeRoute (tela inicial)
interface HomeRouteProps {
  searchQuery: string; // Texto de busca
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>; // Função para alterar busca
  loadingChats: boolean; // Estado de carregamento dos chats
  errorChats: string | null; // Mensagem de erro
  fetchUserChats: () => Promise<void>; // Função para buscar chats do usuário
  filteredChats: ChatData[]; // Lista de chats filtrados
  hasMore: boolean; // Indica se há mais chats para carregar
  loadMoreChats: () => Promise<void>; // Função para carregar mais chats
  handleCardPress: (chatId: string) => void; // Função ao clicar em um chat
  handleAccountPress: () => void; // Função ao clicar no botão de conta
  handleThemeToggle: () => void; // Função para alternar tema
  swipeableRef: React.RefObject<Swipeable>; // Referência para componente deslizável
  animatedHintContainerStyle: { opacity: number }; // Estilo animado do container de dica
  animatedCardStyle: { transform: { translateX: number }[] }; // Estilo animado do card
  hintOpacity: SharedValue<number>; // Valor compartilhado da opacidade da dica
  renderRightActions: ( // Função para renderizar ações do lado direito
    progress: any,
    dragX: any,
    chatId: string
  ) => React.ReactElement;
  setNavigationIndex: React.Dispatch<React.SetStateAction<number>>; // Função para alterar índice de navegação
  chats: ChatData[] | null; // Lista de chats
  photoUri: string | null; // URI da foto capturada
  showBottomNavigation: boolean; // Controla exibição da navegação inferior
  plusPressed: boolean; // Estado do botão plus pressionado
  setPlusPressed: React.Dispatch<React.SetStateAction<boolean>>; // Função para alterar estado do plus
  animatedCircle1Style: ViewStyle; // Estilo animado do primeiro círculo
  animatedCircle2Style: ViewStyle; // Estilo animado do segundo círculo
}

// Interface das propriedades do componente CameraRoute (tela da câmera)
interface CameraRouteProps {
  onPhotoCaptured: (uri: string) => void; // Callback quando foto é capturada
  onClose: () => void; // Callback para fechar a câmera
}

// Componente da tela inicial (HomeRoute)
const HomeRoute: React.FC<HomeRouteProps> = ({
  plusPressed,
  setPlusPressed,
  handleThemeToggle,
  animatedCircle1Style,
  animatedCircle2Style,
  searchQuery,
  setSearchQuery,
  loadingChats,
  errorChats,
  fetchUserChats,
  filteredChats,
  hasMore,
  loadMoreChats,
  handleCardPress,
  handleAccountPress,
  swipeableRef,
  animatedHintContainerStyle,
  animatedCardStyle,
  hintOpacity,
  renderRightActions,
  setNavigationIndex,
  chats,
}) => {
  const theme = useTheme(); // Hook para acessar o tema atual
  const styles = getStyles(theme); // Aplica estilos baseados no tema

  return (
    <View style={styles.container}>
      {/* Overlay com blur que aparece quando o botão plus é pressionado */}
      {plusPressed && (
        <BlurView intensity={100} tint="default" style={styles.plusContainer}>
          <View style={styles.animatedCirclesContainer}>
            {/* Primeiro círculo animado - botão de conta */}
            <AnimatedReanimated.View
              style={[styles.animatedCircle, animatedCircle1Style]}
            >
              <IconButton
                icon="account"
                iconColor="#FFFFFF"
                size={30}
                onPress={handleAccountPress}
              />
            </AnimatedReanimated.View>
            {/* Segundo círculo animado - botão de alternar tema */}
            <AnimatedReanimated.View
              style={[styles.animatedCircle, animatedCircle2Style]}
            >
              <IconButton
                icon="theme-light-dark"
                iconColor="#FFFFFF"
                size={30}
                onPress={handleThemeToggle}
              />
            </AnimatedReanimated.View>
          </View>
          {/* Área transparente para detectar toque fora dos botões */}
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 15 }]}
            activeOpacity={0}
            // onPress={() => setPlusPressed(false)}
          />
        </BlurView>
      )}
      
      {/* Componente do logo */}
      <LogoCopagroUsers />
      
      <View style={{ flex: 1, width: "100%" }}>
        {/* Barra de pesquisa - só aparece se há chats */}
        {chats && chats.length !== 0 && (
          <Searchbar
            icon="magnify"
            placeholder="Pesquise por um problema..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        )}
        
        {/* Indicador de carregamento - aparece durante carregamento inicial */}
        {loadingChats && filteredChats.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando conversas...</Text>
          </View>
        )}
        
        {/* Mensagem de erro com opção de retry */}
        {errorChats && (
          <View style={styles.centeredContent}>
            <Text style={styles.errorText}>{errorChats}</Text>
            <TouchableOpacity
              onPress={fetchUserChats}
              style={{ marginTop: 20 }}
            >
              <Text style={styles.retryText}>Tentar carregar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Tela de introdução - aparece quando não há chats */}
        {!loadingChats && !errorChats && !chats || chats?.length === 0 && (
          <View style={styles.centeredContent}>
            <Image
              source={
                theme.dark
                  ? require("../../assets/images/white-intro.png")
                  : require("../../assets/images/intro.png")
              }
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={styles.description}>
              Análises e consultas fenológicas aparecerão {"\n"} aqui após sua
              primeira foto
            </Text>
          </View>
        )}
        
        {/* Lista de chats filtrados */}
        {!errorChats && filteredChats.length > 0 && (
          <ScrollView
            contentContainerStyle={styles.chatsListContainer}
            showsVerticalScrollIndicator={true}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={loadingChats}
                onRefresh={fetchUserChats}
                colors={[theme.colors.primary]}
              />
            }
          >
            {filteredChats.map((chat, index) => (
              <View key={chat.id} style={styles.chatItemContainer}>
                {/* Dica visual para swipe - só aparece no primeiro item */}
                {index === 0 && (
                  <AnimatedReanimated.View
                    style={[styles.hintActionContainer, animatedHintContainerStyle]}
                  >
                    <IconButton icon="delete" iconColor="#fff" size={30} />
                  </AnimatedReanimated.View>
                )}
                
                {/* Componente deslizável para excluir chat */}
                <Swipeable
                  ref={index === 0 ? swipeableRef : null}
                  renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, chat.id)
                  }
                  onSwipeableWillOpen={() => {
                    if (index === 0) {
                      hintOpacity.value = withTiming(0, { duration: 50 });
                    }
                  }}
                >
                  <AnimatedReanimated.View
                    style={index === 0 ? animatedCardStyle : undefined}
                  >
                    {/* Card do chat clicável */}
                    <TouchableOpacity
                      onPress={() => handleCardPress(chat.id)}
                      activeOpacity={0.9}
                    >
                      <Card style={styles.chatCard}>
                        <Card.Content>
                          <Title style={styles.cardTitle}>
                            {chat.title || "Título não especificado"}
                          </Title>
                          <Paragraph
                            style={styles.cardDescription}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {chat.lastDiagnosis?.description ||
                              "Descrição não especificada"}
                          </Paragraph>
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  </AnimatedReanimated.View>
                </Swipeable>
              </View>
            ))}
            
            {/* Seção de carregar mais chats */}
            {hasMore &&
              (loadingChats ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                  <Text style={styles.loadingText}>
                    Carregando mais conversas...
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={loadMoreChats}
                  style={{ padding: 10, alignItems: "center" }}
                >
                  <Text style={styles.loadMoreText}>Ver mais conversas</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}
        
        {/* Botão flutuante da câmera - só aparece quando não há chats */}
        {!loadingChats && !errorChats && !chats || chats?.length === 0 &&(
          <IconButton
            icon="camera"
            size={50}
            mode="contained"
            style={styles.openCameraButton}
            onPress={() => setNavigationIndex(1)}
            iconColor="#fff"
          />
        )}
      </View>
    </View>
  );
};

// Componente da tela de câmera - simplesmente renderiza o componente CameraCapture
const CameraRoute: React.FC<CameraRouteProps> = ({
  onPhotoCaptured,
  onClose,
}) => <CameraCapture onPhotoCaptured={onPhotoCaptured} onClose={onClose} />;

// Componente principal da tela (IntroScreen)
const IntroScreen: React.FC = () => {
  const paperTheme = useTheme(); // Hook para acessar tema do Material Design
  const { toggleTheme } = useContext(ThemeContext); // Contexto para alternar tema
  const styles = getStyles(paperTheme); // Estilos baseados no tema

  // Configuração customizada do tema para navegação
  const navigationTheme = {
    ...paperTheme,
    colors: { ...paperTheme.colors, secondaryContainer: "#01572b" },
  };

  // Estados do componente
  const [photoUri, setPhotoUri] = useState<string | null>(null); // URI da foto capturada
  const [chats, setChats] = useState<ChatData[] | null>(null); // Lista de chats
  const [loadingChats, setLoadingChats] = useState<boolean>(true); // Estado de carregamento
  const [errorChats, setErrorChats] = useState<string | null>(null); // Erro ao carregar chats
  const [searchQuery, setSearchQuery] = useState<string>(""); // Texto de busca
  const [showBottomNavigation, setShowBottomNavigation] = useState<boolean>(false); // Controla exibição da navegação
  const [hasMore, setHasMore] = useState<boolean>(true); // Indica se há mais chats para carregar
  const [nextCursor, setNextCursor] = useState<string | null>(null); // Cursor para paginação
  const [message, setMessage] = useState<string>(""); // Mensagem para envio com foto
  const swipeableRef = useRef<Swipeable>(null); // Referência para componente deslizável
  const [hasAnimatedHint, setHasAnimatedHint] = useState<boolean>(false); // Controla se animação da dica já foi exibida
  const [isSending, setIsSending] = useState<boolean>(false); // Estado de envio de mensagem
  const [plusPressed, setPlusPressed] = useState<boolean>(false); // Estado do botão plus
  const [navigationIndex, setNavigationIndex] = useState<number>(0); // Índice da navegação ativa
  
  // Configuração das abas da navegação inferior
  const [routes] = useState<
    { key: string; title: string; focusedIcon: string; unfocusedIcon: string }[]
  >([
    {
      key: "home",
      title: "Início",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "camera",
      title: "Câmera",
      focusedIcon: "camera",
      unfocusedIcon: "camera-outline",
    },
    {
      key: "gallery",
      title: "Galeria",
      focusedIcon: "folder",
      unfocusedIcon: "folder-outline",
    },
    {
      key: "plus",
      title: "Mais",
      focusedIcon: "plus",
      unfocusedIcon: "plus",
    },
  ]);

  // Valores compartilhados para animações
  const hintTranslateX = useSharedValue<number>(0); // Posição X da dica de swipe
  const hintOpacity = useSharedValue<number>(0); // Opacidade da dica
  const plusIconRotation = useSharedValue(0); // Rotação do ícone plus
  const circlesAnimation = useSharedValue(0); // Animação dos círculos flutuantes
  // Efeito para animar o botão plus e os círculos quando pressionado
  useEffect(() => {
    const config = { duration: 400, easing: Easing.bezier(0.34, 1.56, 0.64, 1) };
    if (plusPressed) {
      // Rotaciona o ícone plus e exibe os círculos
      plusIconRotation.value = withTiming(180, config);
      circlesAnimation.value = withTiming(1, config);
    } else {
      // Volta à posição original
      plusIconRotation.value = withTiming(0, config);
      circlesAnimation.value = withTiming(0, { duration: 250 });
    }
  }, [plusPressed]);

  // Estilo animado do ícone plus
  const animatedPlusIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plusIconRotation.value}deg` }],
  }));

  // Estilo animado do primeiro círculo (botão de conta)
  const animatedCircle1Style = useAnimatedStyle(() => ({
    opacity: circlesAnimation.value,
    transform: [
      { scale: circlesAnimation.value },
      { translateY: interpolate(circlesAnimation.value, [0, 1], [0, -80]) },
    ],
  }));

  // Estilo animado do segundo círculo (botão de tema)
  const animatedCircle2Style = useAnimatedStyle(() => ({
    opacity: circlesAnimation.value,
    transform: [
      { scale: circlesAnimation.value },
      { translateY: interpolate(circlesAnimation.value, [0, 1], [0, -160]) },
    ],
  }));

  // Estilo animado do card para dica de swipe
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hintTranslateX.value }],
  }));

  // Estilo animado do container da dica
  const animatedHintContainerStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));
  // Efeito para exibir dica de swipe na primeira vez que há chats
  useEffect(() => {
    if (!loadingChats && chats && chats.length > 0 && !hasAnimatedHint) {
      setHasAnimatedHint(true);
      // Configurações de timing da animação
      const OPEN_DURATION = 600; // Duração para abrir
      const HOLD_DURATION = 1500; // Duração para manter visível
      const CLOSE_DURATION = 400; // Duração para fechar
      
      // Anima o card deslizando para mostrar a ação de delete
      hintTranslateX.value = withSequence(
        withTiming(-75, {
          duration: OPEN_DURATION,
          easing: Easing.out(Easing.quad),
        }),
        withDelay(
          HOLD_DURATION,
          withTiming(0, {
            duration: CLOSE_DURATION,
            easing: Easing.in(Easing.quad),
          })
        )
      );
      
      // Anima a opacidade da dica de delete
      hintOpacity.value = withSequence(
        withTiming(1, { duration: OPEN_DURATION }),
        withDelay(HOLD_DURATION, withTiming(0, { duration: CLOSE_DURATION }))
      );
    }
  }, [chats, loadingChats, hasAnimatedHint]);

  // Função que renderiza as ações do lado direito (botão delete) quando o usuário desliza
  const renderRightActions = (
    progress: any,
    dragX: any,
    chatId: string
  ): React.ReactElement => (
    <RectButton
      style={styles.deleteButton}
      onPress={() => handleDeleteChat(chatId)}
    >
      <IconButton icon="delete" iconColor="#fff" size={30} />
    </RectButton>
  );
  // Função para abrir a galeria de fotos diretamente
  const handleOpenGalleryDirect = async (): Promise<void> => {
    // Solicita permissão para acessar a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert(
        "Você precisa permitir o acesso à galeria para escolher uma imagem."
      );
      return;
    }
    
    // Abre o seletor de imagens
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    // Se uma imagem foi selecionada, processa ela
    if (!result.canceled && result.assets && result.assets.length > 0) {
      handlePhotoCaptured(result.assets[0].uri);
    }
  };

  // Função para excluir um chat
  const handleDeleteChat = async (chatId: string): Promise<void> => {
    try {
      // Obtém o ID do usuário do storage local
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        alert("Usuário não identificado.");
        return;
      }
      
      // Faz a requisição para excluir o chat
      await axiosService.del(`/chats/${userUid}/${chatId}`);
      
      // Remove o chat da lista local
      setChats((prev) =>
        prev ? prev.filter((chat) => chat.id !== chatId) : []
      );
    } catch (error) {
      alert("Erro ao excluir o chat.");
    }
  };
  // Função para buscar os chats do usuário
  const fetchUserChats = async (overrideLimit?: number): Promise<void> => {
    setLoadingChats(true);
    setErrorChats(null);
    try {
      // Obtém o ID do usuário do storage local
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        // Se não há usuário logado, define lista vazia
        setChats([]);
        setShowBottomNavigation(false);
        return;
      }
      
      // Define limite de chats a buscar (padrão: 5)
      const effectiveLimit = overrideLimit ?? 5;
      
      // Faz requisição para buscar chats
      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=${effectiveLimit}`
      );
      
      const rawChats = response.data.chats ?? [];
      const total = response.data.pagination?.totalDocs ?? 0;
      

      console.debug("Fetched user chats:", rawChats.length);

      // Se não há chats mas total > 0, busca todos os chats
      if (rawChats.length === 0 && total > 0 && !overrideLimit) {
        return fetchUserChats(total);
      }
      
      // Atualiza estados com os dados recebidos
      if (Array.isArray(rawChats)) {
        setChats(rawChats);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
        setShowBottomNavigation(rawChats.length > 0);
      } else {
        // Se não há chats válidos, define lista vazia
        setChats([]);
        setShowBottomNavigation(false);
      }
    } catch (error) {
      setErrorChats("Erro ao carregar as conversas.");
    } finally {
      setLoadingChats(false);
    }
  };
  // Função para carregar mais chats (paginação)
  const loadMoreChats = async (): Promise<void> => {
    // Evita carregamento múltiplo ou quando não há mais chats
    if (!hasMore || loadingChats) return;
    
    setLoadingChats(true);
    setErrorChats(null);
    try {
      // Obtém dados necessários para paginação
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid || !nextCursor) return;
      
      // Busca próxima página de chats
      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=5&lastChatId=${nextCursor}`
      );
      
      // Adiciona novos chats à lista existente
      if (Array.isArray(response.data.chats)) {
        setChats((prev) => [...(prev || []), ...response.data.chats]);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
      }
    } catch (error) {
      setErrorChats("Erro ao carregar mais conversas.");
    } finally {
      setLoadingChats(false);
    }
  };

  // Filtra chats baseado na query de busca
  const filteredChats: ChatData[] =
    chats?.filter((chat) => {
      const query = searchQuery.toLowerCase();
      return (
        chat.title?.toLowerCase().includes(query) ||
        chat.lastDiagnosis?.problem?.toLowerCase().includes(query) ||
        chat.lastDiagnosis?.description?.toLowerCase().includes(query) ||
        !searchQuery // Se não há busca, mostra todos
      );
    }) || [];

  // Efeito para carregar chats quando componente monta
  useEffect(() => {
    fetchUserChats();
  }, []);
  // Função chamada quando uma foto é capturada
  const handlePhotoCaptured = (uri: string): void => {
    setPhotoUri(uri); // Armazena URI da foto
    setNavigationIndex(0); // Volta para a tela inicial
  };

  // Função para refazer a foto
  const handleRetake = (): void => {
    setPhotoUri(null); // Remove foto atual
    setNavigationIndex(1); // Vai para tela da câmera
  };

  // Função para confirmar e enviar a foto com mensagem
  const handleConfirm = async (): Promise<void> => {
    // Evita envio múltiplo
    if (isSending) return;
    
    try {
      // Valida se há foto e mensagem
      if (!photoUri || !message.trim()) return;
      
      // Obtém dados do usuário
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        alert("Usuário não identificado.");
        return;
      }
      
      const idToken = await AsyncStorage.getItem("idToken");
      
      // Prepara FormData para envio
      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        type: "image/png",
        name: "foto.png",
      } as any);
      
      // Adiciona mensagem se fornecida
      if (message.trim() !== "") {
        formData.append("message", message.trim());
      }
      
      setIsSending(true);
      
      // Envia foto e mensagem para o servidor
      const response = await axiosService.post(
        `/chats/${userUid}/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      // Obtém ID do chat criado e navega para ele
      const createdChatId = response.data.iaResponse.chatId;
      if (createdChatId) {
        handleCardPress(createdChatId);
        setPhotoUri(null); // Limpa foto
        setMessage(""); // Limpa mensagem
      }
    } catch (error) {
      alert("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };
  // Função para navegar para um chat específico
  const handleCardPress = (chatId: string): void => {
    router.push(`/Screens/Chats?chatId=${chatId}`);
  };

  // Função para navegar para o perfil do usuário
  const handleAccountPress = (): void => {
    // setPlusPressed(false);
    router.push("/Screens/UserProfile");
    // Fecha o menu plus após um pequeno delay
    setTimeout(() => setPlusPressed(false), 200);
  };

  // Função para alternar entre tema claro e escuro
  const handleThemeToggle = () => {
    toggleTheme(); // Alterna o tema
    // Fecha o menu plus após um pequeno delay
    setTimeout(() => setPlusPressed(false), 200);
  };

  // Função chamada quando o índice da navegação inferior muda
  const handleIndexChange = (index: number): void => {
    if (index === 2) {
      // Se clicou na galeria, abre diretamente
      handleOpenGalleryDirect();
      return;
    }
    if (index === 3) {
      // Se clicou no plus, alterna seu estado
      setPlusPressed((prev) => !prev);
      return;
    }

    // Para outras abas, fecha o menu plus e navega
    setPlusPressed(false);
    setNavigationIndex(index);
  };
  // Função que renderiza o conteúdo de cada aba da navegação
  const renderScene = ({
    route,
  }: {
    route: { key: string };
  }): React.ReactNode => {
    switch (route.key) {
      case "home":
        // Renderiza a tela inicial com todas as props necessárias
        return (
          <HomeRoute
            {...{
              searchQuery,
              setSearchQuery,
              loadingChats,
              errorChats,
              fetchUserChats,
              filteredChats,
              hasMore,
              loadMoreChats,
              handleCardPress,
              handleAccountPress,
              handleThemeToggle,
              swipeableRef,
              animatedHintContainerStyle,
              animatedCardStyle,
              hintOpacity,
              renderRightActions,
              setNavigationIndex,
              chats,
              photoUri,
              showBottomNavigation,
              plusPressed,
              setPlusPressed,
              animatedCircle1Style,
              animatedCircle2Style,
            }}
          />
        );
      case "camera":
        // Renderiza a tela da câmera
        return (
          <CameraRoute
            onPhotoCaptured={handlePhotoCaptured}
            onClose={() => setNavigationIndex(0)}
          />
        );
      default:
        return null;
    }
  };

  // Função que renderiza os ícones animados da navegação inferior
  const renderAnimatedIcon = ({
    route,
    focused,
    color,
  }: {
    route: { key: string; focusedIcon: string; unfocusedIcon: string };
    focused: boolean;
    color: string;
  }) => {
    // Escolhe o ícone baseado no estado (focado ou não)
    const iconName = focused ? route.focusedIcon : route.unfocusedIcon;
    const icon = <IconButton icon={iconName} size={30} iconColor={color} />;
    const plusIcon = <IconButton icon="plus" size={30} iconColor={color} />;
    
    return (
      <View style={styles.iconContainer}>
        {route.key === "plus" ? (
          // Ícone plus com animação de rotação
          <AnimatedReanimated.View style={animatedPlusIconStyle}>
            {plusIcon}
          </AnimatedReanimated.View>
        ) : (
          // Ícones normais das outras abas
          icon
        )}
      </View>
    );
  };
  // Se há uma foto capturada, exibe a tela de preview
  if (photoUri) {
    return (
      <ScrollView contentContainerStyle={styles.previewContainer}>
        {/* Logo da aplicação */}
        <LogoCopagroUsers />
        
        {/* Exibe a foto capturada */}
        <Image
          source={{ uri: photoUri }}
          style={styles.photoPreview}
          resizeMode="contain"
        />
        
        {/* Campo de texto para descrição do problema */}
        <TextInput
          placeholder="Detalhe o seu problema (obrigatório)"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          style={styles.previewTextInput}
        />
        
        {/* Botões de ação */}
        <View style={styles.actions}>
          {/* Botão para confirmar e enviar */}
          <IconButton
            icon={isSending ? "loading" : "check"} // Mostra loading durante envio
            onPress={handleConfirm}
            size={36}
            style={[
              styles.confirm,
              { opacity: message.trim() && !isSending ? 1 : 0.5 }, // Opacidade baseada na validação
            ]}
            iconColor="#fff"
            disabled={!message.trim() || isSending} // Desabilitado se não há mensagem ou está enviando
          />
          
          {/* Botão para refazer a foto */}
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

  // Renderização principal - Navegação inferior com as abas
  return (
    <BottomNavigation
      navigationState={{ index: navigationIndex, routes }}
      onIndexChange={handleIndexChange}
      renderScene={renderScene}
      renderIcon={renderAnimatedIcon}
      barStyle={[
        styles.bottomNavigation,
        { display: showBottomNavigation ? "flex" : "none" }, // Só exibe se há chats
      ]}
      activeColor="#FFFFFF" // Cor dos ícones ativos
      inactiveColor="#F5F5F5" // Cor dos ícones inativos
      theme={navigationTheme}
    />
  );
};

// Função que retorna os estilos baseados no tema atual
const getStyles = (theme: any) =>
  StyleSheet.create({
    // Container principal da aplicação
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 60, // Espaço para status bar
    },
    
    // Container do overlay do botão plus
    plusContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    
    // Container dos círculos animados
    animatedCirclesContainer: {
      position: "absolute",
      bottom: 0,
      right: 45,
      alignItems: "center",
      zIndex: 20,
    },
    
    // Estilo dos círculos animados (botões flutuantes)
    animatedCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      marginBottom: 15,
    },
    
    // Container dos ícones da navegação
    iconContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    
    // Container de loading centralizado
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    
    // Container de cada item de chat
    chatItemContainer: {
      marginVertical: 10,
      marginHorizontal: 10,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "transparent",
    },
    
    // Container da dica de ação (delete)
    hintActionContainer: {
      backgroundColor: "#D32F2F",
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 75,
      borderRadius: 12,
    },
    
    // Botão de deletar (vermelho)
    deleteButton: {
      backgroundColor: "#D32F2F",
      justifyContent: "center",
      alignItems: "center",
      width: 75,
      borderRadius: 12,
    },
    
    // Texto de loading
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.primary,
    },
    
    // Texto de erro
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
      textAlign: "center",
      marginTop: 20,
    },
    
    // Texto do botão de retry
    retryText: {
      color: theme.colors.primary,
      fontSize: 16,
      textDecorationLine: "underline",
    },
    
    // Campo de busca
    searchInput: {
      width: "90%",
      marginTop: 25,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      alignSelf: "center",
      elevation: 2,
    },
    
    // Conteúdo centralizado
    centeredContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    
    // Ilustração da tela inicial
    illustration: {
      width: "100%",
      height: 450,
      marginBottom: 20,
    },
    
    // Descrição da tela inicial
    description: {
      textAlign: "center",
      fontSize: 16,
      color: theme.colors.onBackground,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    
    // Seta da tela inicial
    seta: {
      width: 30,
      height: 30,
      marginTop: -10,
      marginBottom: 40,
      left: 130,
    },
    
    // Botão flutuante da câmera
    openCameraButton: {
      backgroundColor: theme.colors.primary,
      position: "absolute",
      bottom: 20,
      right: 20,
      zIndex: 1,
    },
    
    // Container do preview da foto
    previewContainer: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      backgroundColor: theme.colors.background,
      paddingVertical: 20,
      paddingTop: 60,
    },
    
    // Preview da foto capturada
    photoPreview: {
      width: "90%",
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignSelf: "center",
    },
    
    // Campo de texto do preview
    previewTextInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 10,
      elevation: 2,
      width: "90%",
      marginTop: 20,
      minHeight: 80,
      textAlignVertical: "top",
    },
    
    // Container das ações (botões)
    actions: {
      flexDirection: "row",
      marginTop: 20,
    },
    
    // Botão de confirmar (verde)
    confirm: {
      backgroundColor: "green",
      marginRight: 20,
    },
    
    // Botão de refazer (vermelho)
    retake: {
      backgroundColor: theme.colors.error,
    },
    
    // Container da lista de chats
    chatsListContainer: {
      paddingHorizontal: 10,
      paddingBottom: 70,
      paddingTop: 20,
    },
    
    // Card de cada chat
    chatCard: {
      elevation: 4,
      shadowColor: "rgba(0,0,0,0.5)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 10,
    },
    
    // Título do card
    cardTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    
    // Descrição do card
    cardDescription: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
      lineHeight: 18,
    },
    
    // Barra de navegação inferior
    bottomNavigation: {
      backgroundColor: theme.colors.primary,
    },
    
    // Texto do botão "carregar mais"
    loadMoreText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
  });

// Exporta o componente principal
export default IntroScreen;