import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated
} from "react-native";
import {
  TextInput,
  IconButton,
  Card,
  Title,
  Paragraph,
  BottomNavigation,
  useTheme 
} from "react-native-paper";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  AnimatedStyle, // TIPADO: Importação explícita do tipo de estilo
} from "react-native-reanimated";
import LogoCopagroUsers from "../components/LogoCopagroUsers";
import CameraCapture from "../components/CreateCapture";
import UserGalleryScreen from "../components/UserGalleryScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosService from "../../services/axiosService";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

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
  const theme = useTheme();
  const navigationTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      secondaryContainer: '#01572b',
    },
  };
  // --- ESTADOS ---
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // const [isCameraVisible, setIsCameraVisible] = useState(false); // Removi, qualquer coisa volta
  const [chats, setChats] = useState<ChatData[] | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBottomNavigation, setShowBottomNavigation] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const swipeableRef = useRef<Swipeable | null>(null);
  const [hasAnimatedHint, setHasAnimatedHint] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // --- CONFIGURAÇÃO DA BOTTOM NAVIGATION ---
  const [navigationIndex, setNavigationIndex] = useState(0);
  const [routes] = useState([
    { key: "home", title: "Início", focusedIcon: "home", unfocusedIcon: 'home-outline' },
    { key: "camera", title: "Câmera", focusedIcon: "camera", unfocusedIcon: 'camera-outline' },
    { key: "gallery", title: "Galeria", focusedIcon: "folder", unfocusedIcon: 'folder-outline' },
  ]);

  //Animação agr aqui matheus
  const hintTranslateX = useSharedValue(0);
  const hintOpacity = useSharedValue(0); 

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: hintTranslateX.value }],
    };
  });

  const animatedHintContainerStyle = useAnimatedStyle(() => {
    return {
        opacity: hintOpacity.value,
    };
});


  useEffect(() => {
    console.log("Valor de hasMore:", hasMore);
    console.log("Quantidade de chats carregados:", chats?.length);
  }, [hasMore, chats]);

  // useEffect(() => {
  //   if (!loadingChats && chats && chats.length > 0 && !hasAnimatedHint) {
  //     const animationTriggerTimeout = setTimeout(() => {
  //       if (swipeableRef.current) {
  //         setHasAnimatedHint(true);
  //         swipeableRef.current.openRight();
  //         const closeTimeout = setTimeout(() => {
  //           swipeableRef.current?.close();
  //         }, 2000);
  //         return () => clearTimeout(closeTimeout);
  //       }
  //     }, 100);
  //     return () => clearTimeout(animationTriggerTimeout);
  //   }
  // }, [chats, loadingChats, hasAnimatedHint]);


 useEffect(() => {
    // A condição para disparar a animação continua a mesma
    if (!loadingChats && chats && chats.length > 0 && !hasAnimatedHint) {
      setHasAnimatedHint(true); // Garante que a animação rode apenas uma vez

      const OPEN_DURATION = 600;    // Duração para o card deslizar para a esquerda
      const HOLD_DURATION = 1500;   // Quanto tempo o card fica aberto
      const CLOSE_DURATION = 400;   // Duração para o card voltar ao lugar

      // 1. Animação do Card (translateX)
      // Desliza para a esquerda, espera, e depois volta para a posição inicial.
      hintTranslateX.value = withSequence(
        withTiming(-75, { duration: OPEN_DURATION, easing: Easing.out(Easing.quad) }),
        withDelay(HOLD_DURATION, 
          withTiming(0, { duration: CLOSE_DURATION, easing: Easing.in(Easing.quad) })
        )
      );

      // 2. Animação do Botão Vermelho (opacity) - AQUI ESTÁ A CORREÇÃO
      // Aparece (fade-in), fica visível, e depois desaparece (fade-out), em sincronia com o card.
      hintOpacity.value = withSequence(
        // O botão aparece ao mesmo tempo que o card desliza para a esquerda
        withTiming(1, { duration: OPEN_DURATION }),
        // O botão permanece visível (opacidade 1) durante o tempo de espera
        withDelay(HOLD_DURATION,
          // O botão desaparece ao mesmo tempo que o card volta para a posição 0
          withTiming(0, { duration: CLOSE_DURATION })
        )
      );
    }
  }, [chats, loadingChats, hasAnimatedHint]);

  const renderRightActions = (progress: any, dragX: any, chatId: string) => {
    return (
      <RectButton
        style={styles.deleteButton}
        onPress={() => handleDeleteChat(chatId)}
      >
        <IconButton icon="delete" iconColor="#fff" size={30} />
      </RectButton>
    );
  };

  const handleOpenGalleryDirect = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert(
        "Você precisa permitir o acesso à galeria para escolher uma imagem."
      );
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
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        alert("Usuário não identificado.");
        return;
      }
      await axiosService.del(`/chats/${userUid}/${chatId}`);
      setChats((prev) => prev?.filter((chat) => chat.id !== chatId) || []);
    } catch (error) {
      console.error("Erro ao excluir o chat:", error);
      alert("Erro ao excluir o chat.");
    }
  };

  const fetchUserChats = async (overrideLimit?: number) => {
    setLoadingChats(true);
    setErrorChats(null);
    setHasAnimatedHint(false);

    try {
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        console.warn("User UID não encontrado.");
        setChats([]);
        setLoadingChats(false);
        setShowBottomNavigation(false);
        return;
      }

      const effectiveLimit = overrideLimit ?? 5;
      console.log(`📡 Buscando conversas com limit = ${effectiveLimit}`);

      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=${effectiveLimit}`
      );
      console.log("📨 Resposta da API de chats:", response.data.chats);
      console.log("🧾 Resposta completa:", response);

      const rawChats = response.data.chats ?? [];
      const total = response.data.pagination?.totalDocs ?? 0;

      if (rawChats.length === 0 && total > 0 && !overrideLimit) {
        console.warn(
          "⚠️ Nenhum chat retornado, tentando novamente com limit totalDocs..."
        );
        return fetchUserChats(total);
      }

      if (Array.isArray(rawChats)) {
        setChats(rawChats);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
      } else {
        setChats([]);
      }

      setShowBottomNavigation(rawChats.length > 0);
    } catch (error) {
      setErrorChats("Erro ao carregar as conversas.");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMoreChats = async () => {
    if (!hasMore || loadingChats) return;

    setLoadingChats(true);
    setErrorChats(null);

    try {
      const userUid = await AsyncStorage.getItem("uid");
      console.log("🔍 loadMoreChats: UID encontrado?", userUid);
      console.log("🔍 Próximo cursor:", nextCursor);

      if (!userUid || !nextCursor) {
        console.warn("UID ou cursor ausente ao tentar carregar mais chats.");
        return;
      }

      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=5&lastChatId=${nextCursor}`
      );

      console.log("📥 Novas conversas recebidas:", response.data.chats);

      if (Array.isArray(response.data.chats)) {
        setChats((prev) => [...(prev || []), ...response.data.chats]);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar mais conversas:", error);
      setErrorChats("Erro ao carregar mais conversas.");
    } finally {
      setLoadingChats(false);
    }
  };

  const filteredChats =
    chats?.filter((chat) => {
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
    setNavigationIndex(0); // Necessário para voltar à aba home após a foto
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setNavigationIndex(1); // Necessário para ir à aba câmera
  };

  const handleConfirm = async () => {
    if (isSending) return;
    try {
      if (!photoUri) return;

      if (!message.trim()) {
        alert("Por favor, escreva uma mensagem antes de enviar.");
        return;
      }
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        alert("Usuário não identificado.");
        return;
      }
      const idToken = await AsyncStorage.getItem("idToken");
      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        type: "image/png",
        name: "foto.png",
      } as any);
      if (message.trim() !== "") {
        formData.append("message", message.trim());
      }
      setIsSending(true);
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
      console.log("Resposta do envio de imagem:", response.data);
      const createdChatId = response.data.iaResponse.chatId;
      if (createdChatId) {
        handleCardPress(createdChatId);
        setPhotoUri(null);
        setMessage("");
      } else {
        alert("Erro ao obter o ID da conversa criada.");
      }
    } catch (error) {
      alert("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelGallery = () => setIsGalleryVisible(false);

  const handleCardPress = (chatId: string) => {
    console.log("Abrir chat com ID:", chatId);
    router.push(`/Screens/Chats?chatId=${chatId}`);
  };


  // --- COMPONENTES DAS CENAS PARA A NAVEGAÇÃO ---

  const HomeRoute = () => (
    <View style={styles.container}>
      <LogoCopagroUsers />
      <View style={{ flex: 1, width: "100%" }}>
        <TextInput
          placeholder="Pesquise por problema ou título..."
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
            <TouchableOpacity
              onPress={() => fetchUserChats()}
              style={{ marginTop: 20 }}
            >
              <Text style={styles.retryText}>Tentar carregar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loadingChats &&
          !errorChats &&
          (chats === null || chats.length === 0) && (
            <View style={styles.centeredContent}>
              <Image
                source={require("../../assets/images/intro.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
              <Text style={styles.description}>
                Análises e consultas fenológicas aparecerão {"\n"} aqui após sua
                primeira foto
              </Text>
              <Image
                source={require("../../assets/images/seta.png")}
                style={styles.seta}
              />
            </View>
          )}
        {!loadingChats && !errorChats && filteredChats.length > 0 && (
          <ScrollView
            contentContainerStyle={styles.chatsListContainer}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {filteredChats.map((chat, index) => (
              <View key={chat.id} style={styles.chatItemContainer}>
                {/* 2. A caixinha vermelha de dica fica aqui, posicionada absolutamente atrás de tudo.
        Ela só será visível no primeiro item para a animação. */}
                {index === 0 && (
                  <AnimatedReanimated.View
                    style={[
                      styles.hintActionContainer,
                      animatedHintContainerStyle,
                    ]}
                  >
                    <IconButton icon="delete" iconColor="#fff" size={30} />
                  </AnimatedReanimated.View>
                )}

                <Swipeable
                  ref={index === 0 ? swipeableRef : null}
                  // O renderRightActions continua o mesmo para o gesto REAL do usuário.
                  renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, chat.id)
                  }
                  // NOVO: Detecta quando o usuário começa a arrastar para esconder a dica
                  onSwipeableWillOpen={() => {
                    if (index === 0) {
                      // Faz a dica da animação desaparecer para não sobrepor a ação real
                      hintOpacity.value = withTiming(0, { duration: 50 });
                    }
                  }}
                >
                  {/* 3. O card clicável agora é envolvido pelo componente animado */}
                  <AnimatedReanimated.View
                    style={index === 0 ? animatedCardStyle : undefined}
                  >
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
            {hasMore && !loadingChats && (
              <TouchableOpacity
                onPress={loadMoreChats}
                style={{ padding: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#028C48", fontSize: 16 }}>
                  Ver mais conversas
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
      {!showBottomNavigation &&
        !loadingChats &&
        !photoUri &&
        (chats === null || chats.length === 0) && (
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
  );

  const CameraRoute = () => (
    <CameraCapture
      onPhotoCaptured={handlePhotoCaptured}
      onClose={() => setNavigationIndex(0)}
    />
  );

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    camera: CameraRoute,
    gallery: () => null, // Galeria é uma ação, não renderiza uma tela.
  });

  // --- LÓGICA DE NAVEGAÇÃO ADAPTADA ---
  const handleIndexChange = (index: number) => {
    if (index === 2) {
      handleOpenGalleryDirect(); // USA SUA FUNÇÃO ORIGINAL
    } else {
      setNavigationIndex(index);
    }
  };

  // --- RENDERIZAÇÃO PRINCIPAL ESTRUTURALMENTE CORRIGIDA ---

  if (photoUri) {
    return (
      <ScrollView contentContainerStyle={styles.previewContainer}>
        <LogoCopagroUsers />
        <Image
          source={{ uri: photoUri }}
          style={styles.photoPreview}
          resizeMode="contain"
        />
        <TextInput
          placeholder="Detalhe o seu problema (obrigatório)"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          style={styles.previewTextInput}
        />
        <View style={styles.actions}>
          <IconButton
            icon={isSending ? "loading" : "check"}
            onPress={handleConfirm}
            size={36}
            style={[
              styles.confirm,
              { opacity: message.trim() && !isSending ? 1 : 0.5 },
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

  if (loadingChats && chats === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#028C48" />
        <Text style={styles.loadingText}>Carregando conversas...</Text>
      </View>
    );
  }

  return (
    <BottomNavigation
      navigationState={{ index: navigationIndex, routes }}
      onIndexChange={handleIndexChange}
      renderScene={renderScene}
      barStyle={styles.bottomNavigation}
      activeColor="#FFFFFF"
      inactiveColor="#F5F5F5"
      theme={navigationTheme}
      style={{ display: showBottomNavigation ? "flex" : "none" }}
    />
  );
};

const styles = StyleSheet.create({
  // Todo o seu objeto de estilos original vai aqui.
  container: { flex: 1, backgroundColor: "#F3F3F3", paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
   chatItemContainer: {
       marginVertical: 6,
  },
  hintActionContainer: {
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 75,
    borderRadius: 12, // Mesmo raio do Card
  },
    deleteActionContainer: {
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'flex-end', // Alinha o ícone à direita
    position: 'absolute',
    right: 10, // Alinha com a margem do card
    top: 0,
    bottom: 0,
    width: 75, // Distância da animação
    paddingRight: 15, // Espaçamento para o ícone não colar na borda
    borderRadius: 12,
  },
  
  // O seu estilo deleteButton original continua sendo usado pelo renderRightActions
  deleteButton: {
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    width: 75,
    borderRadius: 12,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#028C48" },
  errorText: { color: "red", fontSize: 16, textAlign: "center", marginTop: 20 },
  retryText: {
    color: "#028C48",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  searchContainer: {
    width: "85%",
    marginTop: 30,
    elevation: 2,
    borderRadius: 33,
  },
  searchInput: {
    width: "90%",
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 10,
    alignSelf: "center",
    elevation: 2,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  illustration: { width: "100%", height: 450, marginTop: 0, marginBottom: 20 },
  description: {
    textAlign: "center",
    fontSize: 16,
    color: "black",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  seta: { width: 30, height: 30, marginTop: -10, marginBottom: 20, left: 145 },
  openCameraButton: {
    backgroundColor: "#AFAFAF",
    position: "absolute",
    bottom: 30,
    right: 30,
    zIndex: 1,
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 0,
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#F3F3F3",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    flex: 1,
    justifyContent: "center",
  },
  photoPreview: {
    width: "90%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#ccc",
    alignSelf: "center",
  },
  previewTextInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    width: "90%",
    marginTop: 20,
  }, // Adicionado para garantir
  actions: { flexDirection: "row", marginTop: 20 },
  confirm: { backgroundColor: "green", marginRight: 20 },
  retake: { backgroundColor: "red" },
  chatsListContainer: {
    paddingHorizontal: 10,
    paddingBottom: 70,
    paddingTop: 20,
  },
  cardWrapper: { marginBottom: 10, borderRadius: 8, overflow: "hidden" },
  chatCard: {
    elevation: 30,
    shadowColor: "rgba(0,0,0,0.5)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: "600", color: "black" },
  cardDescription: {
    fontSize: 15,
    color: "#555",
    marginTop: 6,
    lineHeight: 18,
  },
  cardId: { fontSize: 12, color: "#999", marginTop: 12, fontStyle: "italic" },
  bottomNavigation: { backgroundColor: "#028C48" },
  scrollArea: { flex: 1, width: "100%", marginBottom: 70 },
});

export default IntroScreen;
