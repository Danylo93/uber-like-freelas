import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ChatListScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { chats, markAsRead } = useChat();
  const router = useRouter();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'agora';
  };

  const renderChatItem = ({ item: chat }: { item: any }) => {
    const otherParticipant = chat.participants.find((p: string) => p !== user?.id);
    const isUnread = chat.unreadCount > 0;

    return (
      <TouchableOpacity
        onPress={() => {
          router.push(`/chat/${chat.id}`);
          if (isUnread) {
            markAsRead(chat.id);
          }
        }}
      >
        <Card style={[styles.chatCard, isUnread && styles.unreadCard]}>
          <View style={styles.chatHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {otherParticipant?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={[styles.participantName, isUnread && styles.unreadText]}>
                  {otherParticipant === 'provider-1' ? 'João Silva' : 
                   otherParticipant === 'client-1' ? 'Maria Santos' : 
                   'Usuário'}
                </Text>
                <Text style={styles.serviceInfo}>
                  {chat.serviceRequestId ? 'Serviço #' + chat.serviceRequestId.slice(-3) : 'Chat geral'}
                </Text>
              </View>
            </View>
            
            <View style={styles.chatMeta}>
              {chat.lastMessage && (
                <Text style={styles.timestamp}>
                  {formatTimestamp(new Date(chat.lastMessage.timestamp))}
                </Text>
              )}
              {isUnread && (
                <Chip
                  label={chat.unreadCount.toString()}
                  selected={true}
                  style={styles.unreadBadge}
                />
              )}
            </View>
          </View>

          {chat.lastMessage && (
            <Text style={[styles.lastMessage, isUnread && styles.unreadText]} numberOfLines={2}>
              {chat.lastMessage.senderId === user?.id ? 'Você: ' : ''}
              {chat.lastMessage.content}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
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
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.level1,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    chatCard: {
      marginBottom: theme.spacing.sm,
    },
    unreadCard: {
      backgroundColor: theme.colors.primaryContainer,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSecondaryContainer,
    },
    chatInfo: {
      flex: 1,
    },
    participantName: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    unreadText: {
      fontWeight: '600',
    },
    serviceInfo: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    chatMeta: {
      alignItems: 'flex-end',
      gap: theme.spacing.xs,
    },
    timestamp: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 0,
    },
    lastMessage: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversas</Text>
      </View>

      {chats.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa"
          description="Suas conversas aparecerão aqui quando você iniciar um chat com prestadores ou clientes"
          icon="💬"
        />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
        />
      )}
    </SafeAreaView>
  );
}