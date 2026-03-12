import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { scanImages } from '../services/api';
import ImagePreview from '../components/ImagePreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, MAX_SCAN_IMAGES } from '../utils/constants';

export default function ScanScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  const takePhoto = async () => {
    if (images.length >= MAX_SCAN_IMAGES) {
      Alert.alert('Limit reached', `You can scan up to ${MAX_SCAN_IMAGES} images at once.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to take photos of expiry labels.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickFromGallery = async () => {
    if (images.length >= MAX_SCAN_IMAGES) {
      Alert.alert('Limit reached', `You can scan up to ${MAX_SCAN_IMAGES} images at once.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to select images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SCAN_IMAGES - images.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, MAX_SCAN_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScan = async () => {
    if (images.length === 0) {
      Alert.alert('No images', 'Please add at least one image to scan.');
      return;
    }

    setScanning(true);
    try {
      const results = await scanImages(images);
      router.push({
        pathname: '/scan-result',
        params: { results: JSON.stringify(results) },
      });
    } catch (err) {
      Alert.alert(
        'Scan Failed',
        'Could not scan the images. Please try again or add items manually.'
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Scan Expiry Labels</Text>
        <Text style={styles.description}>
          Take photos of food packaging or select images from your gallery. We
          will extract expiry dates automatically.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.pickButton} onPress={takePhoto}>
            <Text style={styles.pickButtonIcon}>&#128247;</Text>
            <Text style={styles.pickButtonText}>Take Photo</Text>
          </Pressable>

          <Pressable style={styles.pickButton} onPress={pickFromGallery}>
            <Text style={styles.pickButtonIcon}>&#128444;</Text>
            <Text style={styles.pickButtonText}>Choose from Gallery</Text>
          </Pressable>
        </View>

        {images.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>
              Selected images ({images.length}/{MAX_SCAN_IMAGES})
            </Text>
            <ImagePreview images={images} onRemove={removeImage} />
          </View>
        )}

        <Pressable
          style={[
            styles.scanButton,
            images.length === 0 && styles.scanButtonDisabled,
          ]}
          onPress={handleScan}
          disabled={images.length === 0 || scanning}
        >
          <Text style={styles.scanButtonText}>Scan</Text>
        </Pressable>

        <Pressable
          style={styles.manualButton}
          onPress={() =>
            router.push({
              pathname: '/scan-result',
              params: { results: JSON.stringify([]) },
            })
          }
        >
          <Text style={styles.manualButtonText}>Add Manually Instead</Text>
        </Pressable>
      </ScrollView>

      {scanning && <LoadingOverlay message="Scanning images..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: COLORS.secondaryText,
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pickButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  pickButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondaryText,
    marginBottom: 8,
    marginLeft: 4,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonDisabled: {
    opacity: 0.4,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  manualButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
