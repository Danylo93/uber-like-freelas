import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { messages, sendMessage, markAsRead } = useChat();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const chatId = params.id as string;
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    if (chatId) {
      markAsRead(chatId);
    }
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(chatId, messageText.trim());
      setMessageText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item: message }: { item: any }) => {
    const isMyMessage = message.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <Card style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(message.timestamp)}
            {isMyMessage && (
              <Text style={styles.readStatus}>
                {message.read ? ' ✓✓' : ' ✓'}
              </Text>
            )}
          </Text>
        </Card>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.level1,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    headerInfo: {
      flex: 1,
    },
    title: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    subtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesList: {
      padding: theme.spacing.md,
    },
    messageContainer: {
      marginBottom: theme.spacing.md,
      maxWidth: '80%',
    },
    myMessageContainer: {
      alignSelf: 'flex-end',
    },
    otherMessageContainer: {
      alignSelf: 'flex-start',
    },
    messageBubble: {
      padding: theme.spacing.sm,
    },
    myMessageBubble: {
      backgroundColor: theme.colors.primary,
    },
    otherMessageBubble: {
      backgroundColor: theme.colors.surfaceContainer,
    },
    messageText: {
      ...theme.typography.bodyMedium,
      lineHeight: 20,
    },
    myMessageText: {
      color: theme.colors.onPrimary,
    },
    otherMessageText: {
      color: theme.colors.onSurface,
    },
    messageTime: {
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    myMessageTime: {
      color: theme.colors.onPrimary,
      opacity: 0.8,
    },
    otherMessageTime: {
      color: theme.colors.onSurfaceVariant,
    },
    readStatus: {
      opacity: 0.8,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.level1,
      gap: theme.spacing.sm,
      alignItems: 'flex-end',
    },
    messageInput: {
      flex: 1,
    },
    sendButton: {
      minWidth: 60,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Voltar"
          onPress={() => router.back()}
          variant="text"
          style={styles.backButton}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>João Silva</Text>
          <Text style={styles.subtitle}>Online agora</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            numberOfLines={1}
            style={styles.messageInput}
            variant="filled"
          />
          <Button
            title="Enviar"
            onPress={handleSendMessage}
            loading={isSending}
            disabled={!messageText.trim() || isSending}
            style={styles.sendButton}
            size="small"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}