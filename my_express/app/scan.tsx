import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { deliverScanResult } from '../features/scan/scan-result';
import { navy } from '../lib/theme';

/**
 * Tipe barcode yang didukung untuk barang toko ATK.
 * ean13/ean8/upc_a/upc_e adalah barcode EAN/UPC yang umum dipakai barang jadi;
 * code128/code39 dipakai barcode lepasan; qr untuk barcode buatan sendiri.
 */
const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

/** Layar scan barcode. Hasil diserahkan ke layar pemanggil lalu layar ini ditutup. */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');

  // onBarcodeScanned dipanggil berulang selama barcode masih terlihat kamera.
  // Penanda ini memastikan satu kali baca saja.
  const handledRef = useRef(false);

  const finish = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || handledRef.current) return;
    handledRef.current = true;

    try {
      // Serahkan dulu ke layar pemanggil (penerima bisa menavigasi),
      // baru tutup layar ini — urutan terbalik membuat navigasi saling menimpa.
      deliverScanResult(trimmed);
    } finally {
      router.back();
    }
  };

  // Izin kamera sedang diperiksa.
  if (!permission) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={navy.main} />
        <Text style={styles.muted}>Memeriksa izin kamera...</Text>
      </View>
    );
  }

  // Izin belum diberikan.
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
        <Text style={styles.title}>Izin kamera diperlukan</Text>
        <Text style={styles.muted}>
          my_express memakai kamera untuk membaca barcode produk. Anda juga tetap bisa memasukkan
          kode secara manual di bawah.
        </Text>

        {permission.canAskAgain ? (
          <Button label="Izinkan Kamera" onPress={() => requestPermission()} />
        ) : (
          <Button label="Buka Pengaturan HP" onPress={() => Linking.openSettings()} />
        )}

        <ManualInput value={manualCode} onChange={setManualCode} onSubmit={finish} />
        <Button label="Kembali" onPress={() => router.back()} variant="danger" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        onBarcodeScanned={(result) => finish(result.data)}
      />

      {/* Bingkai pemandu di atas preview kamera. */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Arahkan kamera ke barcode sampai terbaca</Text>
      </View>

      <View style={styles.header} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Pindai Barcode</Text>
      </View>

      <View style={styles.manualWrap}>
        <Text style={styles.manualLabel}>Atau masukkan kode manual</Text>
        <ManualInput value={manualCode} onChange={setManualCode} onSubmit={finish} />
      </View>
    </View>
  );
}

/** Kolom kode manual — cadangan bila kamera tidak bisa dipakai. */
function ManualInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (code: string) => void;
}) {
  return (
    <View style={styles.manualRow}>
      <TextInput
        style={styles.manualInput}
        value={value}
        onChangeText={onChange}
        placeholder="Contoh: 8991002103011"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        keyboardType="default"
        returnKeyType="done"
        onSubmitEditing={() => onSubmit(value)}
        accessibilityLabel="Kode barcode manual"
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => onSubmit(value)}
        style={({ pressed }) => [styles.manualButton, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={[navy.main, navy.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.manualButtonText}>Gunakan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: navy.background,
    padding: 24,
    gap: 14,
  },
  camera: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700', color: '#111827', textAlign: 'center' },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  pressed: { opacity: 0.7 },

  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: navy.main,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },

  manualWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  manualLabel: { fontSize: 13, color: '#E5E7EB', marginBottom: 8, textAlign: 'center' },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#111827',
  },
  manualButton: {
    paddingHorizontal: 18,
    minHeight: 46,
    borderRadius: 12,
    // `overflow: hidden` memotong gradasi mengikuti sudut membulat.
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
