import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScanButton } from '../scan/ScanButton';
import {
  productFormSchema,
  type ProductFormValues,
  type ProductPayload,
} from './validation';

interface Props {
  /** Nilai awal form; kosongkan untuk produk baru. */
  defaultValues?: ProductFormValues;
  /** Judul tombol simpan: "Simpan Produk" atau "Simpan Perubahan". */
  submitLabel: string;
  onSubmit: (payload: ProductPayload) => void;
  submitting?: boolean;
}

/** Nilai awal bawaan untuk form produk baru. */
export const EMPTY_PRODUCT_VALUES: ProductFormValues = {
  barcode: '',
  name: '',
  category: '',
  price: '',
  stock: '0',
  minStock: '0',
};

/**
 * Form produk dipakai dua layar: tambah dan ubah.
 * Validasi zod dijalankan manual di onSubmit (tanpa @hookform/resolvers).
 */
export function ProductForm({ defaultValues, submitLabel, onSubmit, submitting }: Props) {
  const form = useForm<ProductFormValues>({
    defaultValues: defaultValues ?? EMPTY_PRODUCT_VALUES,
  });

  const handleSubmit = (values: ProductFormValues) => {
    const result = productFormSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        form.setError(issue.path.join('.') as keyof ProductFormValues, {
          message: issue.message,
        });
      }
      return;
    }
    onSubmit(result.data);
  };

  return (
    <View>
      <Controller
        control={form.control}
        name="barcode"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Input
              label="Barcode"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Contoh: 8991002103011"
              autoCapitalize="none"
              error={form.formState.errors.barcode?.message}
            />
            {/* Isi kolom barcode dari hasil scan kamera. */}
            <ScanButton onResult={(code) => onChange(code)} />
          </View>
        )}
      />
      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nama Produk"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Contoh: Pensil 2B"
            error={form.formState.errors.name?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="category"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Kategori"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Contoh: Alat Tulis"
            error={form.formState.errors.category?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="price"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Harga Jual (Rp)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            placeholder="Contoh: 3500"
            error={form.formState.errors.price?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="stock"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Stok Awal"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            error={form.formState.errors.stock?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="minStock"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Batas Minimum Stok"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            error={form.formState.errors.minStock?.message}
          />
        )}
      />
      <Button
        label={submitLabel}
        onPress={form.handleSubmit(handleSubmit)}
        loading={submitting ?? false}
      />
    </View>
  );
}
