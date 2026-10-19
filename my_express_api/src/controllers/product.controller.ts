import type { Request, Response } from 'express';
import { Op, col, fn, where as sequelizeWhere } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { Product, computeStockStatus } from '../models/Product';
import type { CreateProductInput, UpdateProductInput } from '../validators/product.schemas';

/** Bentuk produk yang aman dikirim ke klien (dengan stockStatus dihitung). */
function toPublicProduct(product: Product) {
  return {
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    category: product.category,
    satuan: product.satuan,
    price: product.price,
    stock: product.stock,
    minStock: product.minStock,
    stockStatus: computeStockStatus(product.stock, product.minStock),
  };
}

/**
 * GET /products
 * Query opsional: search (nama atau barcode), category, stock (aman/menipis/habis).
 * Selalu dibatasi user_id pemilik toko dari token.
 */
export async function listProducts(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const stock = typeof req.query.stock === 'string' ? req.query.stock.trim() : '';

  // Semua kondisi dikumpulkan di array, lalu digabung dengan Op.and.
  // Alasan: indexing simbol (where[Op.or]) tidak didukung tipe WhereOptions.
  const conditions: WhereOptions[] = [{ userId }];

  if (search) {
    conditions.push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } },
      ],
    });
  }

  if (category) {
    conditions.push({ category });
  }

  // Filter status stok dihitung dari kolom (stock vs min_stock), bukan disimpan.
  // habis = stock 0; menipis = stock>0 dan stock<=min_stock; aman = stock>0 dan stock>min_stock.
  if (stock === 'habis') {
    conditions.push({ stock: 0 });
  } else if (stock === 'menipis') {
    conditions.push(
      { stock: { [Op.gt]: 0 } },
      sequelizeWhere(col('stock'), Op.lte, col('min_stock')),
    );
  } else if (stock === 'aman') {
    conditions.push(
      { stock: { [Op.gt]: 0 } },
      sequelizeWhere(col('stock'), Op.gt, col('min_stock')),
    );
  }

  const products = await Product.findAll({
    where: { [Op.and]: conditions },
    order: [['name', 'ASC']],
  });

  res.json({ data: products.map(toPublicProduct) });
}

/**
 * GET /products/categories
 * Daftar kategori unik yang dipakai pemilik toko ini.
 */
export async function listCategories(req: Request, res: Response): Promise<void> {
  const rows = await Product.findAll({
    attributes: [[fn('DISTINCT', col('category')), 'category']],
    where: { userId: req.userId },
    order: [['category', 'ASC']],
    raw: true,
  });

  const categories = rows.map((row) => (row as { category: string }).category);
  res.json({ data: categories });
}

/**
 * GET /products/barcode/:barcode
 * 200 jika terdaftar, 404 jika belum.
 * Penting: dipanggil sebelum /products/:id agar "barcode" tidak tertangkap sebagai id.
 */
export async function getProductByBarcode(req: Request, res: Response): Promise<void> {
  const product = await Product.findOne({
    where: { userId: req.userId, barcode: req.params.barcode },
  });

  if (!product) {
    res.status(404).json({ message: 'Produk dengan barcode tersebut belum terdaftar' });
    return;
  }

  res.json({ data: toPublicProduct(product) });
}

/**
 * GET /products/:id
 * 200 jika ketemu, 404 jika tidak ada atau bukan milik pemilik toko.
 */
export async function getProductById(req: Request, res: Response): Promise<void> {
  const product = await Product.findOne({
    where: { id: req.params.id, userId: req.userId },
  });

  if (!product) {
    res.status(404).json({ message: 'Produk tidak ditemukan' });
    return;
  }

  res.json({ data: toPublicProduct(product) });
}

/**
 * POST /products
 * 201 → produk baru. 409 → barcode ganda (per pemilik toko).
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateProductInput;

  const existing = await Product.findOne({
    where: { userId: req.userId, barcode: input.barcode },
  });
  if (existing) {
    res.status(409).json({
      message: 'Barcode sudah dipakai produk lain',
      errors: [{ field: 'barcode', message: 'Barcode sudah dipakai produk lain' }],
    });
    return;
  }

  const product = await Product.create({
    ...input,
    userId: req.userId,
  });

  res.status(201).json({ data: toPublicProduct(product) });
}

/**
 * PUT /products/:id
 * 200 → produk terbarui. 404 → tidak ketemu. 409 → barcode bentrok.
 * `stock` boleh diubah untuk mencatat barang masuk.
 */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateProductInput;

  const product = await Product.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!product) {
    res.status(404).json({ message: 'Produk tidak ditemukan' });
    return;
  }

  // Jika barcode diganti, pastikan belum dipakai produk lain milik toko ini.
  if (input.barcode && input.barcode !== product.barcode) {
    const taken = await Product.findOne({
      where: { userId: req.userId, barcode: input.barcode },
    });
    if (taken) {
      res.status(409).json({
        message: 'Barcode sudah dipakai produk lain',
        errors: [{ field: 'barcode', message: 'Barcode sudah dipakai produk lain' }],
      });
      return;
    }
  }

  await product.update(input);
  res.json({ data: toPublicProduct(product) });
}

/**
 * DELETE /products/:id
 * 200 → terhapus. 404 → tidak ketemu.
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const product = await Product.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!product) {
    res.status(404).json({ message: 'Produk tidak ditemukan' });
    return;
  }

  await product.destroy();
  res.json({ message: 'Produk berhasil dihapus' });
}
