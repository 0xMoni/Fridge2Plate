import React from 'react';
import {
  View,
  Image,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../utils/constants';

interface ImagePreviewProps {
  images: string[];
  onRemove: (index: number) => void;
}

export default function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {images.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.imageWrapper}>
          <Image source={{ uri }} style={styles.image} />
          <Pressable
            style={styles.removeButton}
            onPress={() => onRemove(index)}
            hitSlop={8}
          >
            <Text style={styles.removeText}>X</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.expired,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  removeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
