//React e React Native imports
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';

// Expo imports
import * as MediaLibrary from 'expo-media-library';

// Interface para as propriedades do componente UserGalleryScreen
interface UserGalleryScreenProps {
  onClose: () => void;
}

const UserGalleryScreen: React.FC<UserGalleryScreenProps> = ({ onClose }) => {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          first: 30,
          sortBy: MediaLibrary.SortBy.creationTime,
          mediaType: MediaLibrary.MediaType.photo,
        });
        setPhotos(media.assets);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text variant="bodyMedium" style={styles.permissionText}>
          É necessário permitir acesso à galeria do dispositivo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.galleryContainer}>
      <View style={styles.galleryGrid}>
        {photos.map(photo => (
          <Image
            key={photo.id}
            source={{ uri: photo.uri }}
            style={styles.thumbnail}
          />
        ))}
        {photos.length === 0 && (
          <Text variant="bodyMedium" style={styles.emptyGalleryText}>
            Nenhuma imagem para exibir.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default UserGalleryScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  permissionText: {
    textAlign: 'center',
  },
  galleryContainer: {
    padding: 4,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  thumbnail: {
    width: '32%',
    aspectRatio: 1,
    margin: 2,
  },
  emptyGalleryText: {
    textAlign: 'center',
    marginTop: 16,
  },
});