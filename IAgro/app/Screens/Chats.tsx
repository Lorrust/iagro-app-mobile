import React, {
   useEffect,
   useState,
   useRef,
   useContext,
   useLayoutEffect,
 } from "react";
 import {
   View,
   Text,
   TextInput,
   FlatList,
   Image,
   TouchableOpacity,
   StyleSheet,
   KeyboardAvoidingView,
   Platform,
   ActivityIndicator,
   ScrollView,
   Alert,
 } from "react-native";
 import { Ionicons } from "@expo/vector-icons";
 import { useLocalSearchParams, useNavigation } from "expo-router";
 import axiosService from "../../services/axiosService";
 import * as ImagePicker from "expo-image-picker";
 import CameraCapture from "../components/CreateCapture";
 import {
   IconButton,
   Menu,
   Switch,
   Divider,
   useTheme,
 } from "react-native-paper";
 import AsyncStorage from "@react-native-async-storage/async-storage";
 import { ThemeContext } from "../contexts/ThemeContext";
 
 type ChatMessage =
   | {
       id: string;
       isFromUser: boolean;
       type: "text";
       text: string;
       timestamp: string;
       imageUrl?: string;
       isLoading?: boolean;
     }
   | {
       id: string;
       isFromUser: boolean;
       type: "diagnostico";
       titulo?: string;
       descricao?: string;
       problema?: string;
       recomendacao?: string;
       timestamp: string;
     };
 
 const ChatScreen = () => {
   const { chatId } = useLocalSearchParams<{ chatId: string }>();
   const [chatTitle, setChatTitle] = useState<string | null>(null);
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [input, setInput] = useState("");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [photoUri, setPhotoUri] = useState<string | null>(null);
   const [message, setMessage] = useState("");
   const [isCameraVisible, setIsCameraVisible] = useState(false);
   const [contextEnabled, setContextEnabled] = useState(false);
   const [isSending, setIsSending] = useState(false);
 
   // --- NOVOS ESTADOS PARA PAGINAÇÃO CORRETA ---
   const [showLoadMore, setShowLoadMore] = useState(false);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [nextCursor, setNextCursor] = useState<string | null>(null);
   const PAGE_SIZE = 20; // Define um tamanho fixo para cada página de mensagens
 
   const flatListRef = useRef<FlatList>(null);
   const hasScrolledRef = useRef(false);
 
   const { isDarkTheme } = useContext(ThemeContext);
 
   // --- NOVO: LÓGICA E ESTADO PARA O MENU DO CABEÇALHO ---
   const navigation = useNavigation();
   const paperTheme = useTheme(); // Pega o tema do Paper para usar as cores
   const [menuVisible, setMenuVisible] = useState(false);
 
   const openMenu = () => setMenuVisible(true);
   const closeMenu = () => setMenuVisible(false);
 
   // A função do switch vai alterar o estado 'contextEnabled' que você já tinha
   const onToggleContextSwitch = () =>
     setContextEnabled((prevState) => !prevState);
 
   // NOVO: Hook que configura o cabeçalho da tela dinamicamente
   useLayoutEffect(() => {
     navigation.setOptions({
       headerTitle: () => (
         <Text
           style={styles.headerTitle}
           numberOfLines={1}
           ellipsizeMode="tail"
         >
           {chatTitle || "Diagnóstico"}
         </Text>
       ),
       headerRight: () => (
         <View>
           <Menu
             visible={menuVisible}
             onDismiss={closeMenu}
             anchor={
               <IconButton
                 icon="dots-vertical"
                 onPress={openMenu}
                 iconColor={paperTheme.colors.primary}
               />
             }
             contentStyle={{ marginTop: 45, backgroundColor: paperTheme.colors.surface }}
           >
             <View style={styles.menuItemContainer}>
               <Text style={{ color: paperTheme.colors.onSurface }}>
                 Modo diagnóstico
               </Text>
               <Switch
                 value={contextEnabled}
                 onValueChange={onToggleContextSwitch}
               />
             </View>
             <Divider />
             <Menu.Item
               onPress={() => {
                 console.log("Ação 'Modo diagnóstico' pressionada");
                 Alert.alert(
                   "Modo diagnóstico",
                   "Quando você ativa o modo diagnóstico, a Inteligência Artificial usará nossa base de dados para buscar informações específicas sobre pragas, doenças e deficiências nutricionais. Isso pode levar um tempo a mais para ter uma resposta, porém trará uma precisão maior. Ao optar por desligar a opção, a IA ainda poderá trazer informações como as descritas, mas somente em caso necessário e voltará suas respostas para algo mais informativo.",
                   [{ text: "OK", onPress: closeMenu }]
                 );
               }}
               title="O que isso faz?"
               leadingIcon="information-outline"
             />
           </Menu>
         </View>
       ),
     });
   }, [navigation, menuVisible, contextEnabled, paperTheme, chatTitle]);
 
   // --- FUNÇÃO DE BUSCA DE MENSAGENS REFEITA COM LÓGICA DE FALLBACK ---
   const fetchMessages = async (isLoadMore = false): Promise<void> => {
     if (isLoadMore) {
       if (isLoadingMore || !nextCursor) return;
       setIsLoadingMore(true);
     } else {
       setLoading(true);
     }
 
     try {
       if (!chatId) {
         setError("Chat ID não fornecido.");
         setLoading(false);
         return;
       }
 
       let url = `/chats/${chatId}/messages?limit=${PAGE_SIZE}&orderDirection=desc`;
       if (isLoadMore && nextCursor) {
         url += `&lastMessageId=${nextCursor}`;
       }
 
       const response = await axiosService.get(url);
       const rawMessages = response.data.messages || [];
       const newNextCursor = response.data.pagination?.nextCursor || null;
       const total = response.data.pagination?.totalSubDocs || 0; // Get totalSubDocs
 
       // Lógica de fallback solicitada
       if (!isLoadMore && rawMessages.length === 0 && total > 0) {
         console.warn(`Nenhuma mensagem com limit=${PAGE_SIZE}, mas total é ${total}. Buscando novamente com o total.`);
         // Tenta buscar com o limite total
         const fullResponse = await axiosService.get(`/chats/${chatId}/messages?limit=${total}&orderDirection=desc`);
         const fullRawMessages = fullResponse.data.messages || [];
         const fullNewNextCursor = fullResponse.data.pagination?.nextCursor || null;
 
         if (Array.isArray(fullRawMessages) && fullRawMessages.length > 0) {
           const parsedMessages: ChatMessage[] = fullRawMessages.map((msg: any) => {
             const isUser = msg.sender === "user";
             const timestamp = new Date((msg.timestamp?._seconds ?? 0) * 1000).toISOString();
             if (msg.diagnosis) {
               setChatTitle(msg.title || "Diagnóstico");
               return { id: msg.id, isFromUser: isUser, type: "diagnostico", titulo: msg.title ?? msg.diagnosis?.problem, problema: msg.diagnosis?.problem, descricao: msg.diagnosis?.description ?? msg.content ?? "", recomendacao: msg.diagnosis?.recommendation, timestamp };
             }
             return { id: msg.id, isFromUser: isUser, type: "text", text: msg.content ?? "", imageUrl: msg.imageUrl, timestamp };
           });
           setMessages(parsedMessages);
           setNextCursor(fullNewNextCursor);
           setShowLoadMore(!!fullNewNextCursor && fullRawMessages.length < total); // Should be false if all were fetched
         } else {
           setMessages([]);
           setNextCursor(null);
           setShowLoadMore(false);
         }
         return; // Sai da função após o retry
       }
 
       if (Array.isArray(rawMessages) && rawMessages.length > 0) {
         type MessageFromApi = any;
         const parsedMessages: ChatMessage[] = rawMessages.map(
           (msg: MessageFromApi) => {
             const isUser = msg.sender === "user";
             const timestamp = new Date(
               (msg.timestamp?._seconds ?? 0) * 1000
             ).toISOString();
             if (msg.diagnosis) {
               setChatTitle(msg.title || "Diagnóstico");
 
               return {
                 id: msg.id,
                 isFromUser: isUser,
                 type: "diagnostico",
                 titulo: msg.title ?? msg.diagnosis?.problem,
                 problema: msg.diagnosis?.problem,
                 descricao: msg.diagnosis?.description ?? msg.content ?? "",
                 recomendacao: msg.diagnosis?.recommendation,
                 timestamp,
               };
             }
             return {
               id: msg.id,
               isFromUser: isUser,
               type: "text",
               text: msg.content ?? "",
               imageUrl: msg.imageUrl,
               timestamp,
             };
           }
         );
 
         setMessages((prevMessages) =>
           isLoadMore ? [...parsedMessages, ...prevMessages] : parsedMessages
         );
         setNextCursor(newNextCursor);
         setShowLoadMore(!!newNextCursor); // Only show load more if there's a next cursor
       } else if (!isLoadMore) {
         setMessages([]); // Limpa se não houver mensagens iniciais e não for loadMore
       }
     } catch (err: any) {
       console.error(
         "❌ Erro ao buscar mensagens:",
         err.response?.data || err.message
       );
       setError("Erro ao carregar as mensagens.");
     } finally {
       if (isLoadMore) {
         setIsLoadingMore(false);
       } else {
         setLoading(false);
       }
     }
   };
 
   // --- EFEITO INICIAL REFEITO ---
   useEffect(() => {
     if (chatId) {
       // Reseta o estado ao trocar de chat
       setMessages([]);
       setNextCursor(null);
       setShowLoadMore(false);
       hasScrolledRef.current = false;
       fetchMessages(false); // Busca a primeira página de mensagens
     }
   }, [chatId]);
 
   const scrollToBottom = (animated = true) => {
     // A FlatList está invertida, então rolamos para o início
     if (messages.length > 0) {
       setTimeout(
         () => flatListRef.current?.scrollToOffset({ offset: 0, animated }),
         200
       );
     }
   };
 
   useEffect(() => {
     // Rola para o final apenas no carregamento inicial
     if (!loading && messages.length > 0 && !hasScrolledRef.current) {
       scrollToBottom(false);
       hasScrolledRef.current = true;
     }
   }, [loading, messages]);
 
   const handleSend = async () => {
     if (input.trim() === "" || !chatId || isSending) return;
     setIsSending(true);
 
     const userMessage: ChatMessage = {
       id: `${Date.now()}-user`,
       isFromUser: true,
       type: "text",
       text: input.trim(),
       timestamp: new Date().toISOString(),
     };
 
     const thinkingMessage: ChatMessage = {
       id: "ia-thinking-placeholder",
       isFromUser: false,
       type: "text",
       text: "A IA está pensando...",
       timestamp: new Date().toISOString(),
       isLoading: true,
     };
 
     // Adiciona as mensagens no início, pois a lista está invertida
     setMessages((prev) => [thinkingMessage, userMessage, ...prev]);
     setInput("");
     scrollToBottom();
 
     try {
       const idToken = await AsyncStorage.getItem("idToken");
       const userUid = await AsyncStorage.getItem("uid");
       if (!idToken || !userUid) {
         alert("Autenticação falhou.");
         setMessages((prev) =>
           prev.filter((m) => m.id !== "ia-thinking-placeholder")
         );
         return;
       }
 
       const response = await axiosService.post(
         `/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`,
         { message: input.trim() },
         { headers: { Authorization: `Bearer ${idToken}` } }
       );
       const ia = response.data.iaResponse;
 
       if (ia?.mensagem) {
         const iaMessage: ChatMessage = {
           id: `${Date.now()}-ia`,
           isFromUser: false,
           type: "text",
           text: ia.mensagem,
           timestamp: new Date().toISOString(),
         };
 
         setMessages((prev) => [
           iaMessage,
           ...prev.filter(
             (m) => m.id !== "ia-thinking-placeholder" && m.id !== userMessage.id
           ),
         ]);
         // Re-busca as mensagens para garantir consistência
         setTimeout(() => fetchMessages(), 1000);
       } else {
         setMessages((prev) =>
           prev.filter((m) => m.id !== "ia-thinking-placeholder")
         );
       }
     } catch (error) {
       console.error("Erro ao enviar mensagem:", error);
       setMessages((prev) =>
         prev.filter((m) => m.id !== "ia-thinking-placeholder")
       );
       alert("A IA não conseguiu responder. Tente novamente.");
     } finally {
       setIsSending(false);
     }
   };
 
   const handlePhotoCaptured = (uri: string) => {
     setPhotoUri(uri);
     setIsCameraVisible(false);
   };
 
   const handleConfirm = async () => {
     if (isSending || !photoUri || !chatId || !message.trim()) return;
     setIsSending(true);
 
     const userMessageContent: ChatMessage = {
       id: `${Date.now()}`,
       isFromUser: true,
       type: "text",
       text: message.trim(),
       timestamp: new Date().toISOString(),
       imageUrl: photoUri,
     };
     // Adiciona a mensagem do usuário na UI imediatamente
     setMessages((prev) => [userMessageContent, ...prev]);
     scrollToBottom();
 
     try {
       const idToken = await AsyncStorage.getItem("idToken");
       const userUid = await AsyncStorage.getItem("uid");
       if (!idToken || !userUid) {
         alert("Autenticação falhou.");
         setIsSending(false);
         return;
       }
 
       const formData = new FormData();
       formData.append("file", {
         uri: photoUri,
         type: "image/png",
         name: "foto.png",
       } as any);
       formData.append("message", message.trim());
 
       await axiosService.post(
         `/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`,
         formData,
         {
           headers: {
             "Content-Type": "multipart/form-data",
             Authorization: `Bearer ${idToken}`,
           },
         }
       );
 
       setPhotoUri(null);
       setMessage("");
       // Re-busca as mensagens do servidor para obter a resposta da IA e confirmar a mensagem do usuário
       setTimeout(() => fetchMessages(), 2000);
     } catch (error) {
       console.error("Erro ao enviar foto:", error);
       alert("Erro ao enviar a foto.");
       // Remove a mensagem otimista em caso de erro
       setMessages((prev) => prev.filter((m) => m.id !== userMessageContent.id));
     } finally {
       setIsSending(false);
     }
   };
 
   const handleRetake = () => {
     setPhotoUri(null);
     setIsCameraVisible(true);
   };
 
   const handleSelectImageFromGallery = async () => {
     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
     if (status !== "granted") {
       alert("Permissão negada.");
       return;
     }
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       quality: 1,
     });
     if (!result.canceled && result.assets?.[0]?.uri) {
       handlePhotoCaptured(result.assets[0].uri);
     }
   };
 
   const renderMessage = ({ item }: { item: ChatMessage }) => {
     const isUser = item.isFromUser;
     const bubbleBackgroundColor = isUser
       ? styles.userBubble.backgroundColor
       : isDarkTheme
       ? "#333333" // Cor mais escura para botBubble no tema escuro
       : styles.botBubble.backgroundColor;
 
     const textColor = isDarkTheme ? "#E0E0E0" : "white"; // Cor do texto no tema escuro
 
     return (
       <View
         style={[
           styles.messageContainer,
           isUser ? styles.rightAlign : styles.leftAlign,
         ]}
       >
         <Text style={[styles.timestamp, { color: isDarkTheme ? "#AAAAAA" : "gray" }]}>
           {new Date(item.timestamp).toLocaleString()}
         </Text>
         {item.type === "text" && (item.text || item.imageUrl) && (
           <View
             style={[
               styles.bubble,
               { backgroundColor: bubbleBackgroundColor }, // Usa a cor definida acima
             ]}
           >
             {item.isLoading ? (
               <View style={styles.thinkingContainer}>
                 <ActivityIndicator
                   size="small"
                   color="#FFFFFF"
                   style={{ marginRight: 8 }}
                 />
                 <Text style={styles.bubbleText}>{item.text}</Text>
               </View>
             ) : (
               <>
                 {item.text ? (
                   <Text style={[styles.bubbleText, { color: textColor }]}>
                     {item.text}
                   </Text>
                 ) : null}
                 {item.imageUrl && (
                   <Image
                     source={{ uri: item.imageUrl }}
                     style={styles.imagePreview}
                     resizeMode="cover"
                   />
                 )}
               </>
             )}
           </View>
         )}
         {item.type === "diagnostico" && (
           <View style={[styles.bubble, { backgroundColor: bubbleBackgroundColor }]}>
             {item.problema && (
               <Text style={styles.boldWhite}>Problema: {item.problema}</Text>
             )}
             {item.titulo && (
               <Text style={styles.boldWhite}>Praga: {item.titulo}</Text>
             )}
             {item.descricao && (
               <Text style={styles.bubbleText}>
                 Descrição: {item.descricao}
               </Text>
             )}
             {item.recomendacao && (
               <Text style={styles.bubbleText}>
                 Recomendação: {item.recomendacao}
               </Text>
             )}
           </View>
         )}
       </View>
     );
   };
 
   const renderEmptyListComponent = () => (
     <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
       <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
       <Text style={[styles.emptyText, { color: isDarkTheme ? "#777777" : "#aaa" }]}>
         {error ? error : ""}
       </Text>
     </View>
   );
 
   if (loading && messages.length === 0) {
     return (
       <View style={styles.emptyContainer}>
         <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
         <Text style={[styles.emptyText, { color: isDarkTheme ? "#777777" : "#aaa" }]}>
           Carregando mensagens...
         </Text>
       </View>
     );
   }
 
   if (isCameraVisible) {
     return (
       <CameraCapture
         onPhotoCaptured={handlePhotoCaptured}
         onClose={() => setIsCameraVisible(false)}
       />
     );
   }
 
   if (photoUri) {
     return (
       <ScrollView contentContainerStyle={styles.previewContainer}>
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
           style={[styles.messageInput, { backgroundColor: isDarkTheme ? "#333333" : "white", color: isDarkTheme ? "#E0E0E0" : "black" }]}
           placeholderTextColor={isDarkTheme ? "#AAAAAA" : "gray"}
         />
         <View style={styles.actions}>
           <IconButton
             icon={isSending ? "loading" : "check"}
             onPress={handleConfirm}
             size={36}
             style={styles.confirm}
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
     <KeyboardAvoidingView
       style={[
         styles.container,
         { backgroundColor: isDarkTheme ? "#121212" : "#F3F3F3" },
       ]}
       behavior={Platform.OS === "ios" ? "padding" : "height"}
       keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
     >
       <View style={{ flex: 1 }}>
         <FlatList
           ref={flatListRef}
           data={messages}
           renderItem={renderMessage}
           keyExtractor={(item) => item.id}
           contentContainerStyle={styles.chatContent}
           ListEmptyComponent={renderEmptyListComponent}
           ListFooterComponent={
             showLoadMore ? (
               <TouchableOpacity
                 style={styles.loadMoreButton}
                 onPress={() => fetchMessages(true)}
                 disabled={isLoadingMore}
               >
                 {isLoadingMore ? (
                   <ActivityIndicator color="#028C48" />
                 ) : (
                   <Text style={styles.loadMoreText}>
                     Ver mensagens anteriores
                   </Text>
                 )}
               </TouchableOpacity>
             ) : null
           }
           keyboardShouldPersistTaps="handled"
           inverted
         />
         <View style={[styles.inputContainer, { marginBottom: 0, backgroundColor: isDarkTheme ? "#222222" : "#fff", borderColor: isDarkTheme ? "#444444" : "#ccc" }]}>
           <TouchableOpacity
             onPress={() => setIsCameraVisible(true)}
             style={styles.iconButton}
           >
             <Ionicons name="camera" size={24} color="#4CAF50" />
           </TouchableOpacity>
           <TouchableOpacity
             onPress={handleSelectImageFromGallery}
             style={styles.iconButton}
           >
             <Ionicons name="images" size={24} color="#4CAF50" />
           </TouchableOpacity>
           <TextInput
             value={input}
             onChangeText={setInput}
             placeholder="Digite sua mensagem..."
             style={[styles.textInput, { backgroundColor: isDarkTheme ? "#333333" : "#F0F0F0", color: isDarkTheme ? "#E0E0E0" : "black" }]}
             multiline
             placeholderTextColor={isDarkTheme ? "#AAAAAA" : "gray"}
           />
           <TouchableOpacity onPress={handleSend} disabled={isSending}>
             <Ionicons
               name="send"
               size={24}
               color={isSending ? "#aaa" : "#4CAF50"}
             />
           </TouchableOpacity>
         </View>
       </View>
     </KeyboardAvoidingView>
   );
 };
 
 const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: "#F3F3F3" },
   chatContent: { paddingHorizontal: 12, paddingVertical: 10, flexGrow: 1 },
   headerTitle: {
     fontSize: 20,
     fontWeight: '600',
     color: '#028C48',
     maxWidth: '85%',
   },
   loadMoreButton: { padding: 15, alignSelf: "center" },
   loadMoreText: { color: "#028C48", fontWeight: "bold" },
   emptyContainer: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
     padding: 20,
   },
   emptyText: {
     marginTop: 16,
     fontSize: 16,
     color: "#ccc",
     textAlign: "center",
   },
   inputContainer: {
     flexDirection: "row",
     alignItems: "center",
     backgroundColor: "#fff",
     paddingTop: 10,
     paddingBottom: 65,
     paddingHorizontal: 5,
     //borderTopWidth: 1,
     borderColor: "#ccc",
     //marginBottom: 60,
   },
   textInput: {
     flex: 1,
     backgroundColor: "#F0F0F0",
     borderRadius: 20,
     paddingVertical: 8,
     paddingHorizontal: 15,
     marginRight: 8,
     fontSize: 16,
   },
   messageContainer: { marginVertical: 6, paddingHorizontal: 4 },
   rightAlign: { alignItems: "flex-end" },
   leftAlign: { alignItems: "flex-start" },
   bubble: {
     borderRadius: 12,
     padding: 10,
     maxWidth: "80%",
     shadowColor: "#000",
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.2,
     shadowRadius: 1.41,
     elevation: 2,
   },
   userBubble: { backgroundColor: "#4CAF50" },
   botBubble: { backgroundColor: "#424242" },
   bubbleText: { color: "white", fontSize: 14 },
   boldWhite: {
     color: "white",
     fontWeight: "bold",
     fontSize: 14,
     marginBottom: 2,
   },
   timestamp: {
     fontSize: 10,
     color: "gray",
     marginBottom: 2,
     marginHorizontal: 5,
   },
   previewContainer: {
     flexGrow: 1,
     alignItems: "center",
     justifyContent: "center",
     padding: 16,
   },
   photoPreview: {
     width: "100%",
     aspectRatio: 1,
     borderRadius: 12,
     backgroundColor: "#ccc",
   },
   messageInput: {
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
   imagePreview: {
     width: 200,
     height: 200,
     borderRadius: 8,
     marginTop: 8,
     backgroundColor: "#ccc",
   },
   iconButton: { padding: 4, marginRight: 4 },
   thinkingContainer: {
     flexDirection: "row",
     alignItems: "center",
   },
   menuItemContainer: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
     paddingHorizontal: 16,
     paddingVertical: 8,
     minWidth: 220,
   },
 });
 
 export default ChatScreen;