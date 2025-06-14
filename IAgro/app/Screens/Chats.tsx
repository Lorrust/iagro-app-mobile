import React, { useEffect, useState } from 'react';
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
  const [limit, setLimit] = useState(10);

  const fetchMessages = async (overrideLimit?: number) => {
    try {
      if (!chatId) {
        setError('Chat ID não fornecido.');
        return;
      }

      const effectiveLimit = overrideLimit ?? limit;

      const response = await axiosService.get(`/chats/${chatId}/messages?limit=${effectiveLimit}&orderDirection=asc`, );

      const total = response.data.pagination?.totalSubDocs || 0;
      const rawMessages = response.data.messages || [];

      // 🧠 Tenta novamente com totalSubDocs se vier vazio
      if (rawMessages.length === 0 && total > 0 && !overrideLimit) {
        console.warn('⚠️ Nenhuma mensagem retornada, tentando novamente com limit totalSubDocs...');
        return fetchMessages(total);
      }

      setShowLoadMore(total > effectiveLimit);

      console.log('✅ Mensagens carregadas:', rawMessages);

      if (Array.isArray(rawMessages)) {
        type MessageFromApi = {
          id: string;
          sender: string;
          content?: string;
          imageUrl?: string;
          title?: string;
          diagnosis?: {
            problem?: string;
            description?: string;
            recommendation?: string;
          };
          timestamp?: { _seconds?: number };
        };

        const parsedMessages: ChatMessage[] = rawMessages.map((msg: MessageFromApi) => {
          const isUser = msg.sender === 'user';
          const timestamp = new Date((msg.timestamp?._seconds ?? 0) * 1000).toISOString();

          if (msg.diagnosis) {
            return {
              id: msg.id,
              isFromUser: isUser,
              type: 'diagnostico',
              titulo: msg.title ?? msg.diagnosis?.problem,
              problema: msg.diagnosis?.problem,
              descricao: msg.diagnosis?.description ?? msg.content ?? '',
              recomendacao: msg.diagnosis?.recommendation,
              timestamp,
            };
          }

          return {
            id: msg.id,
            isFromUser: isUser,
            type: 'text',
            text: msg.content ?? '',
            imageUrl: msg.imageUrl,
            timestamp,
          };
        });

        parsedMessages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        if (
          parsedMessages.length > 0 &&
          !parsedMessages[parsedMessages.length - 1].isFromUser
        ) {
          parsedMessages.push({
            id: 'placeholder-user-first',
            isFromUser: true,
            type: 'text',
            text: '',
            timestamp: parsedMessages[parsedMessages.length - 1].timestamp,
          });
        }

        setMessages(parsedMessages.filter(m => m.id !== 'typing' && m.id !== 'typing-img'));
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

  const handleSend = async () => {
  if (input.trim() === '' || !chatId || isSending) return;

  setIsSending(true);

    try {
      const idToken = await AsyncStorage.getItem('idToken');
      const userUid = await AsyncStorage.getItem('uid');
      if (!idToken || !userUid) {
        alert('Autenticação falhou.');
        return;
      }

      const userMessage: ChatMessage = {
        id: `${Date.now()}-user`,
        isFromUser: true,
        type: 'text',
        text: input.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

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
          type: 'text',
          text: ia.mensagem,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, iaMessage]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

    try {
      const idToken = await AsyncStorage.getItem('idToken');
      const userUid = await AsyncStorage.getItem('uid');

      if (!idToken || !userUid) {
        alert('Autenticação falhou.');
        setIsSending(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/png',
        name: 'foto.png',
      } as any);
      formData.append('message', message.trim());

      setMessages((prev) => [...prev, {
        id: `${Date.now()}`,
        isFromUser: true,
        type: 'text',
        text: message.trim(),
        timestamp: new Date().toISOString(),
      }, {
        id: 'typing-img',
        isFromUser: false,
        type: 'text',
        text: 'Digitando...',
        timestamp: new Date().toISOString(),
      }]);

      await axiosService.post(
        `/chats/${userUid}/message?chat=${chatId}&context=${contextEnabled}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setPhotoUri(null);
      setMessage('');

      setTimeout(() => {
        fetchMessages();
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar foto:', error);
      alert('Erro ao enviar a foto.');
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
    if (status !== 'granted') {
      alert('Permissão negada.');
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

    return (
      <View style={[styles.messageContainer, isUser ? styles.rightAlign : styles.leftAlign]}>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>

        {item.type === 'text' && (item.text || item.imageUrl) && (
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
            {item.text ? (
              <Text style={styles.bubbleText}>{item.text}</Text>
            ) : null}

            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {item.type === 'diagnostico' && (
          <View style={[styles.bubble, styles.botBubble]}>
            {item.problema && <Text style={styles.boldWhite}>Problema: {item.problema}</Text>}
            {item.titulo && <Text style={styles.boldWhite}>Praga: {item.titulo}</Text>}
            {item.descricao && <Text style={styles.bubbleText}>Descrição: {item.descricao}</Text>}
            {item.recomendacao && (
              <Text style={styles.bubbleText}>Recomendação: {item.recomendacao}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isCameraVisible) {
    return <CameraCapture onPhotoCaptured={handlePhotoCaptured} onClose={() => setIsCameraVisible(false)} />;
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
          style={styles.messageInput}
        />
        <View style={styles.actions}>
          <IconButton
            icon={isSending ? 'loading' : 'check'}
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LogoCopagroUsers />
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        ListFooterComponent={
          showLoadMore ? (
            <TouchableOpacity
              style={{ padding: 10, alignSelf: 'center' }}
              onPress={() => setLimit((prev) => prev + 10)}
            >
              <Text style={{ color: '#028C48', fontWeight: 'bold' }}>Ver mais mensagens</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <View style={[styles.inputContainer]}>
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
      <View style={styles.customBottomBar}>
      <IconButton
        icon="home"
        iconColor="white"
        size={30}
        onPress={() => router.back()}
      />
      <IconButton
        icon="camera"
        iconColor="white"
        size={30}
        onPress={() => setIsCameraVisible(true)}
      />
      <IconButton
        icon="folder"
        iconColor="white"
        size={30}
        onPress={handleSelectImageFromGallery}
      />
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3', paddingBottom: 60 },
  chatContent: { padding: 12, paddingTop: 80, paddingBottom: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  messageContainer: { marginVertical: 6 },
  rightAlign: { alignItems: 'flex-end' },
  leftAlign: { alignItems: 'flex-start' },
  bubble: { borderRadius: 12, padding: 10, maxWidth: '80%' },
  userBubble: { backgroundColor: '#4CAF50' },
  botBubble: { backgroundColor: '#424242' },
  bubbleText: { color: 'white', fontSize: 14 },
  boldWhite: { color: 'white', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  timestamp: { fontSize: 10, color: 'gray', marginBottom: 2 },
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

  previewContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  photoPreview: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#ccc' },
  messageInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    width: '90%',
    marginTop: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 1,
  },
  confirm: { backgroundColor: 'green', marginRight: 20 },
  retake: { backgroundColor: 'red' },
  imagePreview: {
  width: 200,
  height: 200,
  borderRadius: 8,
  marginTop: 8,
  backgroundColor: '#ccc',
  },
});

export default ChatScreen;
