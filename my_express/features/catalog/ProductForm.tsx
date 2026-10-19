import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PickOrTypeField } from '../../components/PickOrTypeField';
import { LABEL_KETIK_SENDIRI, SATUAN_MAKSIMAL, daftarSatuan } from '../../lib/satuan';
import { ScanButton } from '../scan/ScanButton';
import { useCategories } from './queries';
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
  satuan: '',
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

  // Kategori yang sudah pernah dipakai, supaya tidak perlu diketik ulang.
  const { data: kategori } = useCategories();

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
        render={({ field: { onChange, value } }) => (
          <PickOrTypeField
            label="Kategori"
            value={value}
            options={kategori ?? []}
            placeholder="Contoh: Alat Tulis"
            customLabel={LABEL_KETIK_SENDIRI}
            maxLength={50}
            error={form.formState.errors.category?.message}
            onChange={onChange}
          />
        )}
      />
      <Controller
        control={form.control}
        name="satuan"
        render={({ field: { onChange, value } }) => (
          <PickOrTypeField
            label="Satuan"
            value={value}
            options={daftarSatuan()}
            placeholder="Contoh: rim"
            customLabel={LABEL_KETIK_SENDIRI}
            maxLength={SATUAN_MAKSIMAL}
            autoCapitalize="none"
            error={form.formState.errors.satuan?.message}
            onChange={onChange}
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
