//OUTRA TELA PRINCIPAL COM MUITOS COMENTÁRIOS EXPLICATIVOS.
//lER COM ATENÇÃO PARA UM BOM ENTENDIMENTO DO CÓDIGO.


// Importações do React e hooks necessários
import React, {
   useEffect,
   useState,
   useRef,
   useContext,
   useLayoutEffect,
 } from "react";
// Importações de componentes nativos do React Native
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
// Importações de ícones e navegação
 import { Ionicons } from "@expo/vector-icons";
 import { useLocalSearchParams, useNavigation } from "expo-router";
// Importações de serviços, componentes e bibliotecas externas
 import axiosService from "../../services/axiosService";
 import * as ImagePicker from "expo-image-picker";
 import CameraCapture from "../components/CreateCapture";
 import MarkdownRenderer from "../components/MarkdownRenderer";
// Importações do React Native Paper (Material Design)
 import {
   IconButton,
   Menu,
   Switch,
   Divider,
   useTheme,
 } from "react-native-paper";
 import AsyncStorage from "@react-native-async-storage/async-storage";
 import { ThemeContext } from "../contexts/ThemeContext";
  // Tipo que define a estrutura das mensagens do chat
 // Pode ser uma mensagem de texto simples ou um diagnóstico complexo
 type ChatMessage =
   | {
       id: string; // ID único da mensagem
       isFromUser: boolean; // Se a mensagem é do usuário ou da IA
       type: "text"; // Tipo: mensagem de texto
       text: string; // Conteúdo da mensagem
       timestamp: string; // Data/hora da mensagem
       imageUrl?: string; // URL da imagem (opcional)
       isLoading?: boolean; // Se está carregando (para mensagens de "pensando...")
     }
   | {
       id: string; // ID único da mensagem
       isFromUser: boolean; // Se a mensagem é do usuário ou da IA
       type: "diagnostico"; // Tipo: diagnóstico da IA
       titulo?: string; // Título do diagnóstico
       categoria?: string; // Categoria do diagnóstico
       descricao?: string; // Descrição do problema
       problema?: string; // Problema identificado
       recomendacao?: string; // Recomendação sugerida
       timestamp: string; // Data/hora da mensagem
     };
  // Componente principal da tela de chat
 const ChatScreen = () => {
   // Obtém o ID do chat da URL/parâmetros de navegação
   const { chatId } = useLocalSearchParams<{ chatId: string }>();
   
   // Estados principais do componente
   const [chatTitle, setChatTitle] = useState<string | null>(null); // Título do chat
   const [messages, setMessages] = useState<ChatMessage[]>([]); // Lista de mensagens
   const [input, setInput] = useState(""); // Texto digitado pelo usuário
   const [loading, setLoading] = useState(true); // Estado de carregamento inicial
   const [error, setError] = useState<string | null>(null); // Mensagens de erro
   const [photoUri, setPhotoUri] = useState<string | null>(null); // URI da foto capturada
   const [message, setMessage] = useState(""); // Mensagem para acompanhar foto
   const [isCameraVisible, setIsCameraVisible] = useState(false); // Controla exibição da câmera
   const [contextEnabled, setContextEnabled] = useState(false); // Modo diagnóstico ativado/desativado
   const [isSending, setIsSending] = useState(false); // Estado de envio de mensagem
 
   // Estados para paginação de mensagens
   const [showLoadMore, setShowLoadMore] = useState(false); // Mostra botão "carregar mais"
   const [isLoadingMore, setIsLoadingMore] = useState(false); // Estado de carregamento de mais mensagens
   const [nextCursor, setNextCursor] = useState<string | null>(null); // Cursor para próxima página
   const PAGE_SIZE = 20; // Número de mensagens por página
 
   // Referências e contextos
   const flatListRef = useRef<FlatList>(null); // Referência para a lista de mensagens
   const hasScrolledRef = useRef(false); // Controla se já rolou para o final uma vez
   const { isDarkTheme } = useContext(ThemeContext); // Contexto do tema
 
   // Estados e hooks para o menu do cabeçalho
   const navigation = useNavigation(); // Hook de navegação
   const paperTheme = useTheme(); // Tema do React Native Paper
   const [menuVisible, setMenuVisible] = useState(false); // Controla visibilidade do menu
 
   // Funções para controle do menu
   const openMenu = () => setMenuVisible(true);
   const closeMenu = () => setMenuVisible(false);
 
   // Função para alternar o modo diagnóstico
   const onToggleContextSwitch = () =>
     setContextEnabled((prevState) => !prevState);
   // Hook que configura o cabeçalho da tela dinamicamente
   useLayoutEffect(() => {
     navigation.setOptions({
       // Título do cabeçalho - mostra o título do chat ou "Diagnóstico" como padrão
       headerTitle: () => (
         <Text
           style={styles.headerTitle}
           numberOfLines={1}
           ellipsizeMode="tail"
         >
           {chatTitle || "Diagnóstico"}
         </Text>
       ),
       // Botão do menu no lado direito do cabeçalho
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
             {/* Item do menu com switch para modo diagnóstico */}
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
             {/* Item de ajuda sobre o modo diagnóstico */}
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
   // Função principal para buscar mensagens do chat com suporte à paginação
   const fetchMessages = async (isLoadMore = false): Promise<void> => {
     // Controla estados de loading baseado se é carregamento inicial ou paginação
     if (isLoadMore) {
       if (isLoadingMore || !nextCursor) return; // Evita múltiplas requisições
       setIsLoadingMore(true);
     } else {
       setLoading(true);
     }
 
     try {
       // Valida se o chatId foi fornecido
       if (!chatId) {
         setError("Chat ID não fornecido.");
         setLoading(false);
         return;
       }
 
       // Monta a URL da requisição com parâmetros de paginação
       let url = `/chats/${chatId}/messages?limit=${PAGE_SIZE}&orderDirection=desc`;
       if (isLoadMore && nextCursor) {
         url += `&lastMessageId=${nextCursor}`;
       }
 
       // Faz a requisição para buscar mensagens
       const response = await axiosService.get(url);
       const rawMessages = response.data.messages || [];
       const newNextCursor = response.data.pagination?.nextCursor || null;
       const total = response.data.pagination?.totalSubDocs || 0; // Obtém total de mensagens
       
       console.log(response.data.pagination)
       // Lógica de fallback: se não há mensagens mas total > 0, busca novamente com limite total
       if (!isLoadMore && rawMessages.length === 0 && total > 0) {
         console.warn(`Nenhuma mensagem com limit=${PAGE_SIZE}, mas total é ${total}. Buscando novamente com o total.`);
         // Tenta buscar com o limite total
         const fullResponse = await axiosService.get(`/chats/${chatId}/messages?limit=${total}&orderDirection=desc`);
         const fullRawMessages = fullResponse.data.messages || [];
         const fullNewNextCursor = fullResponse.data.pagination?.nextCursor || null;
 
         if (Array.isArray(fullRawMessages) && fullRawMessages.length > 0) {
           // Processa as mensagens obtidas
           const parsedMessages: ChatMessage[] = fullRawMessages.map((msg: any) => {
             const isUser = msg.sender === "user";
             const timestamp = new Date((msg.timestamp?._seconds ?? 0) * 1000).toISOString();
             // Se é um diagnóstico, estrutura como tal
             if (msg.diagnosis) {
               setChatTitle(msg.title || "Diagnóstico");
               return { id: msg.id, isFromUser: isUser, type: "diagnostico", titulo: msg.title ?? msg.diagnosis?.problem, problema: msg.diagnosis?.problem, descricao: msg.diagnosis?.description ?? msg.content ?? "", recomendacao: msg.diagnosis?.recommendation, timestamp };
             }
             // Senão, é uma mensagem de texto normal
             return { id: msg.id, isFromUser: isUser, type: "text", text: msg.content ?? "", imageUrl: msg.imageUrl, timestamp };
           });
           setMessages(parsedMessages);
           setNextCursor(fullNewNextCursor);
           setShowLoadMore(!!fullNewNextCursor && fullRawMessages.length < total);
         } else {
           setMessages([]);
           setNextCursor(null);
           setShowLoadMore(false);
         }
         return; // Sai da função após o retry
       }
 
       // Processamento normal das mensagens
       if (Array.isArray(rawMessages) && rawMessages.length > 0) {
         type MessageFromApi = any;
         const parsedMessages: ChatMessage[] = rawMessages.map(
           (msg: MessageFromApi) => {
             const isUser = msg.sender === "user";
             const timestamp = new Date(
               (msg.timestamp?._seconds ?? 0) * 1000
             ).toISOString();
             // Processa mensagens de diagnóstico
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
             // Processa mensagens de texto
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
 
         // Atualiza a lista de mensagens
         setMessages((prevMessages) =>
           isLoadMore ? [...prevMessages, ...parsedMessages] : parsedMessages
         );
         setNextCursor(newNextCursor);
         setShowLoadMore(!!newNextCursor); // Só mostra "carregar mais" se há próximo cursor
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
       // Reseta estados de loading
       if (isLoadMore) {
         setIsLoadingMore(false);
       } else {
         setLoading(false);
       }
     }
   };
   // Efeito executado quando o chatId muda - carrega mensagens iniciais
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
 
   // Função para rolar para o final da conversa (início da FlatList invertida)
   const scrollToBottom = (animated = true) => {
     // A FlatList está invertida, então rolamos para o início (offset 0)
     if (messages.length > 0) {
       setTimeout(
         () => flatListRef.current?.scrollToOffset({ offset: 0, animated }),
         200
       );
     }
   };
 
   // Efeito para rolar para o final apenas no carregamento inicial
   useEffect(() => {
     // Rola para o final apenas no carregamento inicial
     if (!loading && messages.length > 0 && !hasScrolledRef.current) {
       scrollToBottom(false);
       hasScrolledRef.current = true;
     }
   }, [loading, messages]);
   // Função para enviar mensagem de texto
   const handleSend = async () => {
     // Validações básicas
     if (input.trim() === "" || !chatId || isSending) return;
     setIsSending(true);
 
     // Cria mensagem do usuário
     const userMessage: ChatMessage = {
       id: `${Date.now()}-user`,
       isFromUser: true,
       type: "text",
       text: input.trim(),
       timestamp: new Date().toISOString(),
     };
 
     // Cria mensagem de "pensando..." da IA
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
     setInput(""); // Limpa o campo de entrada
     scrollToBottom();
 
     try {
       // Obtém tokens de autenticação
       const idToken = await AsyncStorage.getItem("idToken");
       const userUid = await AsyncStorage.getItem("uid");
       if (!idToken || !userUid) {
         alert("Autenticação falhou.");
         setMessages((prev) =>
           prev.filter((m) => m.id !== "ia-thinking-placeholder")
         );
         return;
       }
 
       // Envia mensagem para o servidor
       const response = await axiosService.post(
         `/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`,
         { message: input.trim() },
         { headers: { Authorization: `Bearer ${idToken}` } }
       );
        const ia = response.data.iaResponse;
        console.log(ia.categoria)

        if (ia) {
            // 3. Crie o objeto da mensagem da IA (pode ser texto ou diagnóstico)
            let iaMessage: ChatMessage;

            // Verifica se é um diagnóstico completo ou uma mensagem de texto simples
            if ((ia.problema || ia.tipo) && ia.descricao) {
                iaMessage = {
                    id: `${Date.now()}-ia-diag`,
                    isFromUser: false,
                    type: "diagnostico",
                    titulo: ia.problema || ia.tipo,
                    categoria: ia.categoria,
                    problema: ia.problema || ia.tipo,
                    descricao: ia.descricao,
                    recomendacao: ia.recomendacao,
                    timestamp: new Date().toISOString(),
                };
            } else { // Caso seja uma resposta de texto simples
                 iaMessage = {
                    id: `${Date.now()}-ia-text`,
                    isFromUser: false,
                    type: "text",
                    text: ia.mensagem, // ou o campo que contém o texto da IA
                    timestamp: new Date().toISOString(),
                };
            }

            
            // Substitui apenas a mensagem "pensando..." pela resposta final da IA.
            setMessages((prev) => [
                iaMessage,
                ...prev.filter((m) => m.id !== "ia-thinking-placeholder"),
            ]);

        } else {
            // Se não houver resposta da IA, apenas remove o "pensando..."
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
   // Função chamada quando uma foto é capturada
   const handlePhotoCaptured = (uri: string) => {
     setPhotoUri(uri); // Armazena URI da foto
     setIsCameraVisible(false); // Fecha a câmera
   };
 
   // Função para confirmar e enviar foto com mensagem
   const handleConfirm = async () => {
     // Validações
     if (isSending || !photoUri || !chatId || !message.trim()) return;
     setIsSending(true);
 
     // Cria mensagem do usuário com foto
     const userMessageContent: ChatMessage = {
       id: `${Date.now()}-user-img`,
       isFromUser: true,
       type: "text",
       text: message.trim(),
       timestamp: new Date().toISOString(),
       imageUrl: photoUri,
     };

     // Status de IA "pensando..." placeholder
    const thinkingMessage: ChatMessage = {
        id: "ia-thinking-placeholder",
        isFromUser: false,
        type: "text",
        text: "A IA está analisando a imagem...",
        timestamp: new Date().toISOString(),
        isLoading: true,
    };


     // Adiciona a mensagem do usuário na UI imediatamente
     setMessages((prev) => [thinkingMessage, userMessageContent, ...prev]);
     scrollToBottom();

     setPhotoUri(null);
      setMessage("");
 
     try {
       // Obtém tokens de autenticação
       const idToken = await AsyncStorage.getItem("idToken");
       const userUid = await AsyncStorage.getItem("uid");
       if (!idToken || !userUid) {
         alert("Autenticação falhou.");
         setIsSending(false);
         setMessages((prev) => prev.filter((m) => m.id !== "ia-thinking-placeholder"));
         return;
       }
 
       // Prepara FormData para envio da foto
       const formData = new FormData();
       formData.append("file", {
         uri: photoUri,
         type: "image/jpeg",
         name: "foto.jpg",
       } as any);
       formData.append("message", userMessageContent.text);
 
       // Envia foto e mensagem
       const response= await axiosService.post(
         `/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`,
         formData,
         {
           headers: {
             "Content-Type": "multipart/form-data",
             Authorization: `Bearer ${idToken}`,
           },
         }
       );

       const ia= response.data.iaResponse;

       if (ia) {
            let iaMessage: ChatMessage;

            if ((ia.problema || ia.tipo) && ia.descricao) {
                iaMessage = {
                    id: `${Date.now()}-ia-diag`,
                    isFromUser: false,
                    type: "diagnostico",
                    titulo: ia.problema || ia.tipo, 
                    categoria: ia.categoria,
                    problema: ia.problema || ia.tipo, 
                    descricao: ia.descricao,
                    recomendacao: ia.recomendacao,
                    timestamp: new Date().toISOString(),
                };
            } else {
                 iaMessage = {
                    id: `${Date.now()}-ia-text`,
                    isFromUser: false,
                    type: "text",
                    text: ia.mensagem || "Não foi possível analisar a imagem.",
                    timestamp: new Date().toISOString(),
                };
            }

            // Substitui o "pensando..." pela resposta final.
            setMessages((prev) => [
                iaMessage,
                ...prev.filter((m) => m.id !== "ia-thinking-placeholder"),
            ]);

        } else {
            // Se não houver resposta, apenas remove o "pensando..."
            setMessages((prev) => prev.filter((m) => m.id !== "ia-thinking-placeholder"));
        }
      
     } catch (error) {
       console.error("Erro ao enviar foto:", error);
       alert("Erro ao enviar a foto.");
       // Remove a mensagem otimista em caso de erro
       setMessages((prev) => prev.filter((m) => m.id !== userMessageContent.id && m.id !== 'ia-thinking-placeholder'));
     } finally {
       setIsSending(false);
     }
   };
 
   // Função para refazer a foto
   const handleRetake = () => {
     setPhotoUri(null); // Remove foto atual
     setIsCameraVisible(true); // Abre câmera novamente
   };
   // Função para selecionar imagem da galeria
   const handleSelectImageFromGallery = async () => {
     // Solicita permissão para acessar a galeria
     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
     if (status !== "granted") {
       alert("Permissão negada.");
       return;
     }
     
     // Abre o seletor de imagens
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       quality: 1,
     });
     
     // Se uma imagem foi selecionada, processa ela
     if (!result.canceled && result.assets?.[0]?.uri) {
       handlePhotoCaptured(result.assets[0].uri);
     }
   };
   // Função para renderizar cada mensagem individual na lista
   const renderMessage = ({ item }: { item: ChatMessage }) => {
     const isUser = item.isFromUser;
     // Define cor do balão baseado no remetente e tema
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
         {/* Timestamp da mensagem */}
         <Text style={[styles.timestamp, { color: isDarkTheme ? "#AAAAAA" : "gray" }]}>
           {new Date(item.timestamp).toLocaleString()}
         </Text>
         
         {/* Renderização de mensagem de texto */}
         {item.type === "text" && (item.text || item.imageUrl) && (
           <View
             style={[
               styles.bubble,
               { backgroundColor: bubbleBackgroundColor },
             ]}
           >
             {item.isLoading ? (
               // Exibe loading para mensagens "pensando..."
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
                 {/* Texto da mensagem */}
                 {item.text ? (
                   <Text style={[styles.bubbleText, { color: textColor }]}>
                     {item.text}
                   </Text>
                 ) : null}
                 {/* Imagem anexada */}
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
         
         {/* Renderização de mensagem de diagnóstico */}
         {item.type === "diagnostico" && (
          
          <View style={[styles.bubble, { backgroundColor: bubbleBackgroundColor }]}>
                {item.titulo && (
                    <Text style={styles.diagnosisTitle}>
                        {item.titulo}
                    </Text>
                )}

                {item.problema && (
                    <Text style={styles.diagnosisSubtitle}>
                        Problema: {item.problema}
                    </Text>
                )}

                {item.categoria && (
                    <Text style={styles.diagnosisSubtitle}>
                        Categoria: {item.categoria}
                    </Text>
                )}
                
                {/* Divisor visual para separar as seções */}
                <View style={styles.divider} />

                {item.descricao && (
                    <>
                        <Text style={styles.sectionTitle}>Descrição</Text>
                        <MarkdownRenderer content={item.descricao} />
                    </>
                )}

                {item.recomendacao && (
                    <>
                        <Text style={styles.sectionTitle}>Recomendação</Text>
                        <MarkdownRenderer content={item.recomendacao} />
                    </>
                )}
            </View>
         )}
       </View>
     );
   };
   // Componente renderizado quando a lista está vazia
   const renderEmptyListComponent = () => (
     <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
       <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
       <Text style={[styles.emptyText, { color: isDarkTheme ? "#777777" : "#aaa" }]}>
         {error ? error : ""}
       </Text>
     </View>
   );
 
   // Tela de loading inicial
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
 
   // Tela da câmera
   if (isCameraVisible) {
     return (
       <CameraCapture
         onPhotoCaptured={handlePhotoCaptured}
         onClose={() => setIsCameraVisible(false)}
       />
     );
   }
 
   // Tela de preview da foto
   if (photoUri) {
     return (
       <ScrollView contentContainerStyle={styles.previewContainer}>
         {/* Exibe a foto capturada */}
         <Image
           source={{ uri: photoUri }}
           style={styles.photoPreview}
           resizeMode="contain"
         />
         {/* Campo para descrição do problema */}
         <TextInput
           placeholder="Detalhe o seu problema (obrigatório)"
           value={message}
           onChangeText={setMessage}
           multiline
           numberOfLines={3}
           style={[styles.messageInput, { backgroundColor: isDarkTheme ? "#333333" : "white", color: isDarkTheme ? "#E0E0E0" : "black" }]}
           placeholderTextColor={isDarkTheme ? "#AAAAAA" : "gray"}
         />
         {/* Botões de ação */}
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
   // Renderização principal do chat
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
         {/* Lista de mensagens */}
         <FlatList
           ref={flatListRef}
           data={messages}
           renderItem={renderMessage}
           keyExtractor={(item) => item.id}
           contentContainerStyle={styles.chatContent}
           ListEmptyComponent={renderEmptyListComponent}
           ListFooterComponent={
             // Botão "carregar mais" no final da lista
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
           inverted // Lista invertida para mostrar mensagens mais recentes primeiro
         />
         
         {/* Barra de entrada de mensagem */}
         <View style={[styles.inputContainer, { marginBottom: 0, backgroundColor: isDarkTheme ? "#222222" : "#fff", borderColor: isDarkTheme ? "#444444" : "#ccc" }]}>
           {/* Botão da câmera */}
           <TouchableOpacity
             onPress={() => setIsCameraVisible(true)}
             style={styles.iconButton}
           >
             <Ionicons name="camera" size={24} color="#4CAF50" />
           </TouchableOpacity>
           
           {/* Botão da galeria */}
           <TouchableOpacity
             onPress={handleSelectImageFromGallery}
             style={styles.iconButton}
           >
             <Ionicons name="images" size={24} color="#4CAF50" />
           </TouchableOpacity>
           
           {/* Campo de texto */}
           <TextInput
             value={input}
             onChangeText={setInput}
             placeholder="Digite sua mensagem..."
             style={[styles.textInput, { backgroundColor: isDarkTheme ? "#333333" : "#F0F0F0", color: isDarkTheme ? "#E0E0E0" : "black" }]}
             multiline
             placeholderTextColor={isDarkTheme ? "#AAAAAA" : "gray"}
           />
           
           {/* Botão de enviar */}
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
  // Estilos do componente
 const styles = StyleSheet.create({
   // Container principal
   container: { flex: 1, backgroundColor: "#F3F3F3" },
   
   // Conteúdo da lista de mensagens
   chatContent: { paddingHorizontal: 12, paddingVertical: 10, flexGrow: 1 },
   
   // Título do cabeçalho
   headerTitle: {
     fontSize: 20,
     fontWeight: '600',
     color: '#028C48',
     maxWidth: '85%',
   },
   
   // Botão "carregar mais"
   loadMoreButton: { padding: 15, alignSelf: "center" },
   loadMoreText: { color: "#028C48", fontWeight: "bold" },
   
   // Container vazio/loading
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
   
   // Container da barra de entrada
   inputContainer: {
     flexDirection: "row",
     alignItems: "center",
     backgroundColor: "#fff",
     paddingTop: 10,
     paddingBottom: 65,
     paddingHorizontal: 5,
     borderColor: "#ccc",
   },
   
   // Campo de texto de entrada
   textInput: {
     flex: 1,
     backgroundColor: "#F0F0F0",
     borderRadius: 20,
     paddingVertical: 8,
     paddingHorizontal: 15,
     marginRight: 8,
     fontSize: 16,
   },
   
   // Container de cada mensagem
   messageContainer: { marginVertical: 6, paddingHorizontal: 4 },
   rightAlign: { alignItems: "flex-end" }, // Mensagens do usuário à direita
   leftAlign: { alignItems: "flex-start" }, // Mensagens da IA à esquerda
   
   // Balão da mensagem
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
   
   // Cores dos balões
   userBubble: { backgroundColor: "#4CAF50" }, // Verde para usuário
   botBubble: { backgroundColor: "#424242" }, // Cinza para IA
   
   // Textos das mensagens
   bubbleText: { color: "white", fontSize: 14 },
   boldWhite: {
     color: "white",
     fontWeight: "bold",
     fontSize: 14,
     marginBottom: 2,
   },

    diagnosisTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    diagnosisSubtitle: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#E0E0E0',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginVertical: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 6,
        marginTop: 8,
    },
   
   // Timestamp das mensagens
   timestamp: {
     fontSize: 10,
     color: "gray",
     marginBottom: 2,
     marginHorizontal: 5,
   },
   
   // Container do preview da foto
   previewContainer: {
     flexGrow: 1,
     alignItems: "center",
     justifyContent: "center",
     padding: 16,
   },
   
   // Preview da foto
   photoPreview: {
     width: "100%",
     aspectRatio: 1,
     borderRadius: 12,
     backgroundColor: "#ccc",
   },
   
   // Campo de mensagem no preview
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
   
   // Botões de ação
   actions: { flexDirection: "row", marginTop: 20 },
   confirm: { backgroundColor: "green", marginRight: 20 }, // Botão confirmar
   retake: { backgroundColor: "red" }, // Botão refazer
   
   // Preview de imagem nas mensagens
   imagePreview: {
     width: 200,
     height: 200,
     borderRadius: 8,
     marginTop: 8,
     backgroundColor: "#ccc",
   },
   
   // Botões de ícone
   iconButton: { padding: 4, marginRight: 4 },
   
   // Container de "pensando..."
   thinkingContainer: {
     flexDirection: "row",
     alignItems: "center",
   },
   
   // Container de item do menu
   menuItemContainer: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
     paddingHorizontal: 16,
     paddingVertical: 8,
     minWidth: 220,
   },
 });
 
 // Exporta o componente
 export default ChatScreen;