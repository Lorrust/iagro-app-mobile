import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import {
  TextInput,
  IconButton,
  Card,
  Title,
  Paragraph,
  BottomNavigation,
  useTheme,
  Searchbar,
  // Theme,
} from "react-native-paper";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue, // Importado para tipagem
} from "react-native-reanimated";

// Componentes e Serviços (sem alterações)
import LogoCopagroUsers from "../components/LogoCopagroUsers";
import CameraCapture from "../components/CreateCapture";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosService from "../../services/axiosService";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

// ================================================================= //
// INTERFACES E TIPOS
// ================================================================= //

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

// Props para o componente HomeRoute
interface HomeRouteProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  loadingChats: boolean;
  errorChats: string | null;
  fetchUserChats: () => Promise<void>;
  filteredChats: ChatData[];
  hasMore: boolean;
  loadMoreChats: () => Promise<void>;
  handleCardPress: (chatId: string) => void;
  swipeableRef: React.RefObject<Swipeable>;
  animatedHintContainerStyle: { opacity: number };
  animatedCardStyle: { transform: { translateX: number }[] };
  hintOpacity: SharedValue<number>;
  renderRightActions: (
    progress: any,
    dragX: any,
    chatId: string
  ) => React.ReactElement;
  setNavigationIndex: React.Dispatch<React.SetStateAction<number>>;
  chats: ChatData[] | null;
  photoUri: string | null;
  showBottomNavigation: boolean;
}

// Props para o componente CameraRoute
interface CameraRouteProps {
  onPhotoCaptured: (uri: string) => void;
  onClose: () => void;
}

// ================================================================= //
// COMPONENTES DE ROTA TIPADOS
// ================================================================= //

const HomeRoute: React.FC<HomeRouteProps> = ({
  searchQuery,
  setSearchQuery,
  loadingChats,
  errorChats,
  fetchUserChats,
  filteredChats,
  hasMore,
  loadMoreChats,
  handleCardPress,
  swipeableRef,
  animatedHintContainerStyle,
  animatedCardStyle,
  hintOpacity,
  renderRightActions,
  setNavigationIndex,
  chats,
  photoUri,
  showBottomNavigation,
}) => (
  <View style={styles.container}>
    <LogoCopagroUsers />
    <View style={{ flex: 1, width: "100%" }}>
      <Searchbar
        icon="magnify"
        placeholder="Pesquise por um problema..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />
      {/* O resto do JSX continua o mesmo */}
      {loadingChats && filteredChats.length === 0 && (
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
      {!loadingChats && !errorChats && (!chats || chats.length === 0) && (
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
      {!errorChats && filteredChats.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.chatsListContainer}
          showsVerticalScrollIndicator={true}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredChats.map((chat, index) => (
            <View key={chat.id} style={styles.chatItemContainer}>
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

          {/* ===== LÓGICA DE CARREGAMENTO "VER MAIS" CORRIGIDA ===== */}
          {hasMore &&
            (loadingChats ? (
              // ===== ALTERAÇÃO AQUI =====
              // Mostra o spinner E o texto de carregamento
              <View style={{ paddingVertical: 20, alignItems: "center"}}>
                <ActivityIndicator size="large" color="#028C48" />
                <Text style={styles.loadingText}>
                  Carregando mais conversas...
                </Text>
              </View>
            ) : (
              // Se não, mostra o botão para carregar mais
              <TouchableOpacity
                onPress={loadMoreChats}
                style={{ padding: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#028C48", fontSize: 16 }}>
                  Ver mais conversas
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
    </View>
    {!showBottomNavigation &&
      !loadingChats &&
      !photoUri &&
      (!chats || chats.length === 0) && (
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

const CameraRoute: React.FC<CameraRouteProps> = ({
  onPhotoCaptured,
  onClose,
}) => <CameraCapture onPhotoCaptured={onPhotoCaptured} onClose={onClose} />;

// ================================================================= //
// COMPONENTE PRINCIPAL TIPADO
// ================================================================= //

const IntroScreen: React.FC = () => {
  const theme = useTheme();
  const navigationTheme = {
    ...theme,
    colors: { ...theme.colors, secondaryContainer: "#01572b" },
  };

  // --- ESTADOS TIPADOS ---
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatData[] | null>(null);
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showBottomNavigation, setShowBottomNavigation] =
    useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const swipeableRef = useRef<Swipeable>(null);
  const [hasAnimatedHint, setHasAnimatedHint] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // --- CONFIGURAÇÃO DA BOTTOM NAVIGATION TIPADA ---
  const [navigationIndex, setNavigationIndex] = useState<number>(0);
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
  ]);

  // --- ANIMAÇÃO COM SHARED VALUES TIPADOS ---
  const hintTranslateX = useSharedValue<number>(0);
  const hintOpacity = useSharedValue<number>(0);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hintTranslateX.value }],
  }));

  const animatedHintContainerStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  // Lógica de animação (sem alteração)
  useEffect(() => {
    if (!loadingChats && chats && chats.length > 0 && !hasAnimatedHint) {
      setHasAnimatedHint(true);
      const OPEN_DURATION = 600;
      const HOLD_DURATION = 1500;
      const CLOSE_DURATION = 400;
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
      hintOpacity.value = withSequence(
        withTiming(1, { duration: OPEN_DURATION }),
        withDelay(HOLD_DURATION, withTiming(0, { duration: CLOSE_DURATION }))
      );
    }
  }, [chats, loadingChats, hasAnimatedHint]);

  // --- FUNÇÕES COM PARÂMETROS TIPADOS ---
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

  const handleOpenGalleryDirect = async (): Promise<void> => {
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

  const handleDeleteChat = async (chatId: string): Promise<void> => {
    try {
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        alert("Usuário não identificado.");
        return;
      }
      await axiosService.del(`/chats/${userUid}/${chatId}`);
      setChats((prev) =>
        prev ? prev.filter((chat) => chat.id !== chatId) : []
      );
    } catch (error) {
      console.error("Erro ao excluir o chat:", error);
      alert("Erro ao excluir o chat.");
    }
  };

  const fetchUserChats = async (overrideLimit?: number): Promise<void> => {
    setLoadingChats(true);
    setErrorChats(null);
    try {
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid) {
        setChats([]);
        setShowBottomNavigation(false);
        return;
      }
      const effectiveLimit = overrideLimit ?? 5;
      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=${effectiveLimit}`
      );
      const rawChats = response.data.chats ?? [];
      const total = response.data.pagination?.totalDocs ?? 0;
      if (rawChats.length === 0 && total > 0 && !overrideLimit) {
        return fetchUserChats(total);
      }
      if (Array.isArray(rawChats)) {
        setChats(rawChats);
        setHasMore(response.data.pagination.hasMore);
        setNextCursor(response.data.pagination.nextCursor);
        setShowBottomNavigation(rawChats.length > 0);
      } else {
        setChats([]);
        setShowBottomNavigation(false);
      }
    } catch (error) {
      setErrorChats("Erro ao carregar as conversas.");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMoreChats = async (): Promise<void> => {
    if (!hasMore || loadingChats) return;
    setLoadingChats(true);
    console.log("MUDOU O ESTADO? loadingChats agora é:", true); 
    setErrorChats(null);
    try {
      const userUid = await AsyncStorage.getItem("uid");
      if (!userUid || !nextCursor) return;
      const response = await axiosService.get(
        `/chats/users/${userUid}?limit=5&lastChatId=${nextCursor}`
      );
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

  const filteredChats: ChatData[] =
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

  const handlePhotoCaptured = (uri: string): void => {
    setPhotoUri(uri);
    setNavigationIndex(0);
  };

  const handleRetake = (): void => {
    setPhotoUri(null);
    setNavigationIndex(1);
  };

  const handleConfirm = async (): Promise<void> => {
    if (isSending) return;
    try {
      if (!photoUri || !message.trim()) return;
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
      const createdChatId = response.data.iaResponse.chatId;
      if (createdChatId) {
        handleCardPress(createdChatId);
        setPhotoUri(null);
        setMessage("");
      }
    } catch (error) {
      alert("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCardPress = (chatId: string): void => {
    router.push(`/Screens/Chats?chatId=${chatId}`);
  };

  const handleIndexChange = (index: number): void => {
    if (index === 2) {
      handleOpenGalleryDirect();
    } else {
      setNavigationIndex(index);
    }
  };

  // --- LÓGICA DE RENDERIZAÇÃO TIPADA ---
  const renderScene = ({
    route,
  }: {
    route: { key: string };
  }): React.ReactNode => {
    switch (route.key) {
      case "home":
        return (
          <HomeRoute
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loadingChats={loadingChats}
            errorChats={errorChats}
            fetchUserChats={fetchUserChats}
            filteredChats={filteredChats}
            hasMore={hasMore}
            loadMoreChats={loadMoreChats}
            handleCardPress={handleCardPress}
            swipeableRef={swipeableRef}
            animatedHintContainerStyle={animatedHintContainerStyle}
            animatedCardStyle={animatedCardStyle}
            hintOpacity={hintOpacity}
            renderRightActions={renderRightActions}
            setNavigationIndex={setNavigationIndex}
            chats={chats}
            photoUri={photoUri}
            showBottomNavigation={showBottomNavigation}
          />
        );
      case "camera":
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

  // --- RENDERIZAÇÃO PRINCIPAL (LÓGICA INALTERADA) ---
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

  return (
    <BottomNavigation
      navigationState={{ index: navigationIndex, routes }}
      onIndexChange={handleIndexChange}
      renderScene={renderScene}
      barStyle={[
        styles.bottomNavigation,
        { display: showBottomNavigation ? "flex" : "none" },
      ]}
      activeColor="#FFFFFF"
      inactiveColor="#F5F5F5"
      theme={navigationTheme}
    />
  );
};

// Estilos (sem alteração)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3", paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  chatItemContainer: {
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
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
  searchInput: {
    width: "90%",
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
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
    backgroundColor: "#028C48",
    position: "absolute",
    bottom: 30,
    right: 30,
    zIndex: 1,
  },
  previewContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#F3F3F3",
    paddingVertical: 20,
    paddingTop: 60,
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", marginTop: 20 },
  confirm: { backgroundColor: "green", marginRight: 20 },
  retake: { backgroundColor: "red" },
  chatsListContainer: {
    paddingHorizontal: 10,
    paddingBottom: 70,
    paddingTop: 20,
  },
  chatCard: {
    elevation: 4,
    shadowColor: "rgba(0,0,0,0.5)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: "600", color: "black" },
  cardDescription: {
    fontSize: 15,
    color: "#555",
    marginTop: 6,
    lineHeight: 18,
  },
  bottomNavigation: { backgroundColor: "#028C48" },
});

export default IntroScreen;
