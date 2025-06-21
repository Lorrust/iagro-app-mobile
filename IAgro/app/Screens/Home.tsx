import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  StyleSheet,
  Image,
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
  Text,
} from "react-native-paper";
import { Swipeable, RectButton } from "react-native-gesture-handler";
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
import { ThemeContext } from "../contexts/ThemeContext";
import LogoCopagroUsers from "../components/LogoCopagroUsers";
import CameraCapture from "../components/CreateCapture";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosService from "../../services/axiosService";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";

interface ChatData {
  id: string;
  title: string;
  userUid: string;
  timestamp: { _seconds: number; _nanoseconds: number };
  lastDiagnosis?: {
    category?: string;
    problem?: string;
    description?: string;
    recommendation?: string;
  };
}

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
  handleAccountPress: () => void;
  handleThemeToggle: () => void;
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
  plusPressed: boolean;
  setPlusPressed: React.Dispatch<React.SetStateAction<boolean>>;
  animatedCircle1Style: ViewStyle;
  animatedCircle2Style: ViewStyle;
}

interface CameraRouteProps {
  onPhotoCaptured: (uri: string) => void;
  onClose: () => void;
}

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
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {plusPressed && (
        <BlurView intensity={100} tint="default" style={styles.plusContainer}>
          <View style={styles.animatedCirclesContainer}>
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
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 15 }]}
            activeOpacity={0}
            // onPress={() => setPlusPressed(false)}
          />
        </BlurView>
      )}
      <LogoCopagroUsers />
      <View style={{ flex: 1, width: "100%" }}>
        {chats && chats.length !== 0 && (
          <Searchbar
            icon="magnify"
            placeholder="Pesquise por um problema..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        )}
        {loadingChats && filteredChats.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando conversas...</Text>
          </View>
        )}
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
        {!loadingChats && !errorChats && !chats || chats?.length === 0 && (
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
                    style={[styles.hintActionContainer, animatedHintContainerStyle]}
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

const CameraRoute: React.FC<CameraRouteProps> = ({
  onPhotoCaptured,
  onClose,
}) => <CameraCapture onPhotoCaptured={onPhotoCaptured} onClose={onClose} />;

const IntroScreen: React.FC = () => {
  const paperTheme = useTheme();
  const { toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(paperTheme);

  const navigationTheme = {
    ...paperTheme,
    colors: { ...paperTheme.colors, secondaryContainer: "#01572b" },
  };

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
  const [plusPressed, setPlusPressed] = useState<boolean>(false);
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
    {
      key: "plus",
      title: "Mais",
      focusedIcon: "plus",
      unfocusedIcon: "plus",
    },
  ]);

  const hintTranslateX = useSharedValue<number>(0);
  const hintOpacity = useSharedValue<number>(0);
  const plusIconRotation = useSharedValue(0);
  const circlesAnimation = useSharedValue(0);

  useEffect(() => {
    const config = { duration: 400, easing: Easing.bezier(0.34, 1.56, 0.64, 1) };
    if (plusPressed) {
      plusIconRotation.value = withTiming(180, config);
      circlesAnimation.value = withTiming(1, config);
    } else {
      plusIconRotation.value = withTiming(0, config);
      circlesAnimation.value = withTiming(0, { duration: 250 });
    }
  }, [plusPressed]);

  const animatedPlusIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plusIconRotation.value}deg` }],
  }));

  const animatedCircle1Style = useAnimatedStyle(() => ({
    opacity: circlesAnimation.value,
    transform: [
      { scale: circlesAnimation.value },
      { translateY: interpolate(circlesAnimation.value, [0, 1], [0, -80]) },
    ],
  }));

  const animatedCircle2Style = useAnimatedStyle(() => ({
    opacity: circlesAnimation.value,
    transform: [
      { scale: circlesAnimation.value },
      { translateY: interpolate(circlesAnimation.value, [0, 1], [0, -160]) },
    ],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hintTranslateX.value }],
  }));

  const animatedHintContainerStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

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

  const handleAccountPress = (): void => {
    // setPlusPressed(false);
    router.push("/Screens/UserProfile");
    setTimeout(() => setPlusPressed(false), 200);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setTimeout(() => setPlusPressed(false), 200);
  };

  const handleIndexChange = (index: number): void => {
    if (index === 2) {
      handleOpenGalleryDirect();
      return;
    }
    if (index === 3) {
      setPlusPressed((prev) => !prev);
      return;
    }

    setPlusPressed(false);
    setNavigationIndex(index);
  };

  const renderScene = ({
    route,
  }: {
    route: { key: string };
  }): React.ReactNode => {
    switch (route.key) {
      case "home":
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

  const renderAnimatedIcon = ({
    route,
    focused,
    color,
  }: {
    route: { key: string; focusedIcon: string; unfocusedIcon: string };
    focused: boolean;
    color: string;
  }) => {
    const iconName = focused ? route.focusedIcon : route.unfocusedIcon;
    const icon = <IconButton icon={iconName} size={30} iconColor={color} />;
    const plusIcon = <IconButton icon="plus" size={30} iconColor={color} />;
    return (
      <View style={styles.iconContainer}>
        {route.key === "plus" ? (
          <AnimatedReanimated.View style={animatedPlusIconStyle}>
            {plusIcon}
          </AnimatedReanimated.View>
        ) : (
          icon
        )}
      </View>
    );
  };

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
      renderIcon={renderAnimatedIcon}
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

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 60,
    },
    plusContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    animatedCirclesContainer: {
      position: "absolute",
      bottom: 0,
      right: 45,
      alignItems: "center",
      zIndex: 20,
    },
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
    iconContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
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
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.primary,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
      textAlign: "center",
      marginTop: 20,
    },
    retryText: {
      color: theme.colors.primary,
      fontSize: 16,
      textDecorationLine: "underline",
    },
    searchInput: {
      width: "90%",
      marginTop: 20,
      backgroundColor: theme.colors.surface,
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
    illustration: {
      width: "100%",
      height: 450,
      marginTop: 0,
      marginBottom: 20,
    },
    description: {
      textAlign: "center",
      fontSize: 16,
      color: theme.colors.onBackground,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    seta: {
      width: 30,
      height: 30,
      marginTop: -10,
      marginBottom: 40,
      left: 130,
    },
    openCameraButton: {
      backgroundColor: theme.colors.primary,
      position: "absolute",
      bottom: 20,
      right: 20,
      zIndex: 1,
    },
    previewContainer: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      backgroundColor: theme.colors.background,
      paddingVertical: 20,
      paddingTop: 60,
    },
    photoPreview: {
      width: "90%",
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignSelf: "center",
    },
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
    actions: {
      flexDirection: "row",
      marginTop: 20,
    },
    confirm: {
      backgroundColor: "green",
      marginRight: 20,
    },
    retake: {
      backgroundColor: theme.colors.error,
    },
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
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 10,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    cardDescription: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
      lineHeight: 18,
    },
    bottomNavigation: {
      backgroundColor: theme.colors.primary,
    },
    loadMoreText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
  });

export default IntroScreen;