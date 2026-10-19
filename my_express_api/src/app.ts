import cors from 'cors';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { sequelize } from './config/database';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import debtRoutes from './routes/debt.routes';
import distributorRoutes from './routes/distributor.routes';
import notificationRoutes from './routes/notification.routes';
import productRoutes from './routes/product.routes';
import profileRoutes from './routes/profile.routes';
import reportRoutes from './routes/report.routes';
import transactionRoutes from './routes/transaction.routes';

export const app = express();

app.use(cors());
app.use(express.json());

// Rute.
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/distributors', distributorRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Cek kesehatan: dipakai untuk memastikan backend dan database bisa diakses
// dari HP lewat http://<IP-laptop>:3000/health
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'terhubung' });
  } catch (error: unknown) {
    res.status(503).json({
      status: 'error',
      database: 'terputus',
      message: error instanceof Error ? error.message : 'Koneksi database gagal',
    });
  }
});

// 404: endpoint tidak dikenal.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Error handler terpusat.
// Express mengenali handler dengan 4 parameter sebagai error handler.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});
