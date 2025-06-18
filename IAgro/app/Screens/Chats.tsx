import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import LogoCopagroUsers from '../components/LogoCopagroUsers';
import axiosService from '../../services/axiosService';
import * as ImagePicker from 'expo-image-picker';
import CameraCapture from '../components/CreateCapture';
import { IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChatMessage =
  | {
      id: string;
      isFromUser: boolean;
      type: 'text';
      text: string;
      timestamp: string;
      imageUrl?: string;
    }
  | {
      id: string;
      isFromUser: boolean;
      type: 'diagnostico';
      titulo?: string;
      descricao?: string;
      problema?: string;
      recomendacao?: string;
      timestamp: string;
    };

const ChatScreen = () => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [limit, setLimit] = useState(20);

  const flatListRef = useRef<FlatList>(null);
  const hasScrolledRef = useRef(false);

  // LÓGICA DE FETCH ATUALIZADA
  const fetchMessages = async (overrideLimit?: number): Promise<void> => {
    setLoading(true);
    try {
      if (!chatId) {
        setError('Chat ID não fornecido.');
        setLoading(false);
        return;
      }

      const effectiveLimit = overrideLimit ?? limit;
      const response = await axiosService.get(`/chats/${chatId}/messages?limit=${effectiveLimit}&orderDirection=asc`);

      const total = response.data.pagination?.totalSubDocs || 0;
      const rawMessages = response.data.messages || [];

      // LÓGICA DE FALLBACK SOLICITADA
      if (rawMessages.length === 0 && total > 0 && !overrideLimit) {
        console.warn(`Nenhuma mensagem com limit=${effectiveLimit}, mas total é ${total}. Buscando novamente com o total.`);
        return fetchMessages(total);
      }

      setShowLoadMore(total > effectiveLimit && rawMessages.length > 0 && rawMessages.length < total);

      if (Array.isArray(rawMessages)) {
        type MessageFromApi = any; // Simplificado para evitar erros
        const parsedMessages: ChatMessage[] = rawMessages.map((msg: MessageFromApi) => {
          const isUser = msg.sender === 'user';
          const timestamp = new Date((msg.timestamp?._seconds ?? 0) * 1000).toISOString();

          if (msg.diagnosis) {
            return {
              id: msg.id, isFromUser: isUser, type: 'diagnostico',
              titulo: msg.title ?? msg.diagnosis?.problem,
              problema: msg.diagnosis?.problem,
              descricao: msg.diagnosis?.description ?? msg.content ?? '',
              recomendacao: msg.diagnosis?.recommendation,
              timestamp,
            };
          }
          return {
            id: msg.id, isFromUser: isUser, type: 'text',
            text: msg.content ?? '', imageUrl: msg.imageUrl, timestamp,
          };
        });

        parsedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar mensagens:', err.response?.data || err.message);
      setError('Erro ao carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId, limit]);

  const scrollToBottom = (animated = true) => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 200);
    }
  };

  useEffect(() => {
    if (!loading && messages.length > 0 && !hasScrolledRef.current) {
      scrollToBottom(false);
      hasScrolledRef.current = true;
    }
  }, [loading, messages]);

  const handleSend = async () => {
    if (input.trim() === '' || !chatId || isSending) return;
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`, isFromUser: true, type: 'text',
      text: input.trim(), timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    scrollToBottom();

    try {
      const idToken = await AsyncStorage.getItem('idToken');
      const userUid = await AsyncStorage.getItem('uid');
      if (!idToken || !userUid) { alert('Autenticação falhou.'); return; }
      
      const response = await axiosService.post(
        `/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`,
        { message: input.trim() },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const ia = response.data.iaResponse;
      if (ia?.mensagem) {
        const iaMessage: ChatMessage = {
          id: `${Date.now()}-ia`, isFromUser: false, type: 'text',
          text: ia.mensagem, timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev.filter(m => m.id !== userMessage.id), userMessage, iaMessage]);
        scrollToBottom();
      }
    } catch (error) { console.error('Erro ao enviar mensagem:', error);
    } finally { setIsSending(false); }
  };

  const handlePhotoCaptured = (uri: string) => { setPhotoUri(uri); setIsCameraVisible(false); };

  const handleConfirm = async () => {
    if (isSending || !photoUri || !chatId || !message.trim()) return;
    setIsSending(true);
    try {
      const idToken = await AsyncStorage.getItem('idToken');
      const userUid = await AsyncStorage.getItem('uid');
      if (!idToken || !userUid) { alert('Autenticação falhou.'); setIsSending(false); return; }

      const formData = new FormData();
      formData.append('file', { uri: photoUri, type: 'image/png', name: 'foto.png' } as any);
      formData.append('message', message.trim());

      setMessages((prev) => [...prev, {
        id: `${Date.now()}`, isFromUser: true, type: 'text',
        text: message.trim(), timestamp: new Date().toISOString(), imageUrl: photoUri
      }]);
      scrollToBottom();

      await axiosService.post(`/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`, formData,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${idToken}` } }
      );
      setPhotoUri(null);
      setMessage('');
      setTimeout(() => fetchMessages(), 2000);
    } catch (error) { console.error('Erro ao enviar foto:', error); alert('Erro ao enviar a foto.');
    } finally { setIsSending(false); }
  };

  const handleRetake = () => { setPhotoUri(null); setIsCameraVisible(true); };

  const handleSelectImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { alert('Permissão negada.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.canceled && result.assets?.[0]?.uri) { handlePhotoCaptured(result.assets[0].uri); }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.isFromUser;
    return (
      <View style={[styles.messageContainer, isUser ? styles.rightAlign : styles.leftAlign]}>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
        {item.type === 'text' && (item.text || item.imageUrl) && (
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
            {item.text ? <Text style={styles.bubbleText}>{item.text}</Text> : null}
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.imagePreview} resizeMode="cover" />}
          </View>
        )}
        {item.type === 'diagnostico' && (
          <View style={[styles.bubble, styles.botBubble]}>
            {item.problema && <Text style={styles.boldWhite}>Problema: {item.problema}</Text>}
            {item.titulo && <Text style={styles.boldWhite}>Praga: {item.titulo}</Text>}
            {item.descricao && <Text style={styles.bubbleText}>Descrição: {item.descricao}</Text>}
            {item.recomendacao && <Text style={styles.bubbleText}>Recomendação: {item.recomendacao}</Text>}
          </View>
        )}
      </View>
    );
  };
  
  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>
        {error ? error : "Nenhuma mensagem aqui ainda.\nEnvie uma mensagem para começar!"}
      </Text>
    </View>
  );

  if (loading && messages.length === 0 && !error) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#028C48" />
      </View>
    );
  }

  if (isCameraVisible) { return <CameraCapture onPhotoCaptured={handlePhotoCaptured} onClose={() => setIsCameraVisible(false)} />; }

  if (photoUri) {
    return (
      <ScrollView contentContainerStyle={styles.previewContainer}>
        <LogoCopagroUsers />
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />
        <TextInput placeholder="Detalhe o seu problema (obrigatório)" value={message} onChangeText={setMessage} multiline numberOfLines={3} style={styles.messageInput} />
        <View style={styles.actions}>
          <IconButton icon={isSending ? 'loading' : 'check'} onPress={handleConfirm} size={36} style={styles.confirm} iconColor="#fff" disabled={!message.trim() || isSending} />
          <IconButton icon="camera-retake" onPress={handleRetake} size={36} style={styles.retake} iconColor="#fff" />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LogoCopagroUsers />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        ListEmptyComponent={renderEmptyListComponent}
        ListHeaderComponent={
          showLoadMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={() => setLimit((prev) => prev + 10)} disabled={loading}>
              {loading ? <ActivityIndicator color="#028C48" /> : <Text style={styles.loadMoreText}>Ver mensagens anteriores</Text>}
            </TouchableOpacity>
          ) : null
        }
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => setIsCameraVisible(true)} style={styles.iconButton}>
          <Ionicons name="camera" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="IAGRO pode cometer erros, utilize com cautela!"
          style={styles.textInput}
        />
        <TouchableOpacity onPress={handleSend} disabled={isSending}>
          <Ionicons name="send" size={24} color={isSending ? '#aaa' : '#4CAF50'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  chatContent: { paddingHorizontal: 12, paddingBottom: 10, paddingTop: 60, flexGrow: 1 },
  loadMoreButton: { padding: 15, alignSelf: 'center' },
  loadMoreText: { color: '#028C48', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#aaa', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: '#ccc',marginBottom: 60 },
  textInput: { flex: 1, backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  messageContainer: { marginVertical: 6 },
  rightAlign: { alignItems: 'flex-end' },
  leftAlign: { alignItems: 'flex-start' },
  bubble: { borderRadius: 12, padding: 10, maxWidth: '80%' },
  userBubble: { backgroundColor: '#4CAF50' },
  botBubble: { backgroundColor: '#424242' },
  bubbleText: { color: 'white', fontSize: 14 },
  boldWhite: { color: 'white', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  timestamp: { fontSize: 10, color: 'gray', marginBottom: 2 },
  customBottomBar: { backgroundColor: '#028C48', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 120 },
  previewContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  photoPreview: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#ccc' },
  messageInput: { backgroundColor: 'white', borderRadius: 12, padding: 10, elevation: 2, width: '90%', marginTop: 20, minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', marginTop: 20 },
  confirm: { backgroundColor: 'green', marginRight: 20 },
  retake: { backgroundColor: 'red' },
  imagePreview: { width: 200, height: 200, borderRadius: 8, marginTop: 8, backgroundColor: '#ccc' },
  iconButton: { marginRight: 8, },

});

export default ChatScreen;