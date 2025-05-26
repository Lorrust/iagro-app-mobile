import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // ou 'react-native-vector-icons/Ionicons'
import LogoCopagroUsers from '../components/LogoCopagroUsers';

type ChatMessage = {
  id: string;
  isFromUser: boolean;
  type: 'text' | 'image' | 'diagnostico';
  text?: string;
  imageUrl?: string;
  titulo?: string;
  descricao?: string;
  recomendacao?: string;
  timestamp: string; // ISO string
};

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onBack: () => void;
};

const Chats: React.FC<Props> = ({ messages, onSend, onBack }) => {
  const [input, setInput] = useState('');

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.isFromUser;

    return (
      <View style={[styles.messageContainer, isUser ? styles.rightAlign : styles.leftAlign]}>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>

        {item.type === 'text' && (
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}

        {item.type === 'image' && item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
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

  const handleSend = () => {
    if (input.trim() !== '') {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoHeader}>
        <LogoCopagroUsers />
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <FlatList
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        inverted
      />

      <View style={styles.inputContainer}>
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
    </KeyboardAvoidingView>
  );
};

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  logoHeader: {
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  chatContent: {
    padding: 12,
    paddingBottom: 0,
  },
  messageContainer: {
    marginVertical: 6,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  leftAlign: {
    alignItems: 'flex-start',
  },
  timestamp: {
    fontSize: 10,
    color: 'gray',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 12,
    padding: 10,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#4CAF50',
  },
  botBubble: {
    backgroundColor: '#424242',
  },
  bubbleText: {
    color: 'white',
    fontSize: 14,
  },
  boldWhite: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  image: {
    width: 200,
    height: 120,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
});

export default Chats;
