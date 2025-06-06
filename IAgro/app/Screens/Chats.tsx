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

type ChatMessage =
  | {
      id: string;
      isFromUser: boolean;
      type: 'text';
      text: string;
      timestamp: string;
    }
  | {
      id: string;
      isFromUser: boolean;
      type: 'diagnostico';
      titulo?: string;
      descricao?: string;
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

  const fetchMessages = async () => {
    try {
      if (!chatId) {
        setError('Chat ID não fornecido.');
        return;
      }
      const response = await axiosService.get(`/chats/${chatId}/messages`, { limit: 2 });
      if (Array.isArray(response.data.messages)) {
        type MessageFromApi = {
          id: string;
          sender: string;
          content?: string;
          title?: string;
          diagnosis?: {
            problem?: string;
            description?: string;
            recommendation?: string;
          };
          timestamp?: { _seconds?: number };
        };

        const parsedMessages = response.data.messages.map((msg: MessageFromApi) => {
          const isUser = msg.sender === 'user';
          const timestamp = new Date((msg.timestamp?._seconds ?? 0) * 1000).toISOString();
          if (msg.diagnosis) {
            return {
              id: msg.id,
              isFromUser: isUser,
              type: 'diagnostico',
              titulo: msg.title ?? msg.diagnosis?.problem,
              descricao: msg.diagnosis?.description,
              recomendacao: msg.diagnosis?.recommendation,
              timestamp,
            };
          }
          return {
            id: msg.id,
            isFromUser: isUser,
            type: 'text',
            text: msg.content ?? '',
            timestamp,
          };
        });
        parsedMessages.sort(
          (a: { timestamp: string }, b: { timestamp: string }) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      setError('Erro ao carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  const handleSend = async () => {
    if (input.trim() === '') return;
    const newMessage: ChatMessage = {
      id: `${Date.now()}`,
      isFromUser: true,
      type: 'text',
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    try {
      await axiosService.post(`/chats/${chatId}/messages`, newMessage);
      await fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handlePhotoCaptured = (uri: string) => {
    setPhotoUri(uri);
    setIsCameraVisible(false);
  };

  const handleConfirm = async () => {
    if (!photoUri || !chatId || !message.trim()) return;
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/png',
        name: 'foto.png',
      } as any);
      formData.append('message', message.trim());
      await axiosService.post(`/chats/${chatId}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Foto enviada com sucesso!');
      setPhotoUri(null);
      setMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar foto:', error);
      alert('Erro ao enviar a foto.');
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
        {item.type === 'text' && (
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        {item.type === 'diagnostico' && (
          <View style={[styles.bubble, styles.botBubble]}>
            <Text style={styles.boldWhite}>Praga: {item.titulo}</Text>
            <Text style={styles.bubbleText}>Descrição: {item.descricao}</Text>
            <Text style={styles.bubbleText}>Recomendação: {item.recomendacao}</Text>
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
          <IconButton icon="check" onPress={handleConfirm} size={36} style={styles.confirm} iconColor="#fff" disabled={!message.trim()} />
          <IconButton icon="camera-retake" onPress={handleRetake} size={36} style={styles.retake} iconColor="#fff" />
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
      />
      <View style={[styles.inputContainer]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte para a IA..."
          style={styles.textInput}
        />
        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={24} color="#4CAF50" />
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
  chatContent: { padding: 12, paddingBottom: 0, paddingTop: 60 },
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
});

export default ChatScreen;
