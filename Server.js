import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// إعداد المسارات
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// middleware الأمان
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

// منع الهجمات
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100 // 100 طلب كحد أقصى
});
app.use(limiter);

// تحليل البيانات
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes الأساسية
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/services', (await import('./routes/services.js')).default);
app.use('/api/orders', (await import('./routes/orders.js')).default);
app.use('/api/admin', (await import('./routes/admin.js')).default);
app.use('/api/kyc', (await import('./routes/kyc.js')).default);

// WebSocket للإشعارات الفورية
wss.on('connection', (ws) => {
    console.log('عميل متصل WebSocket');
    
    ws.on('message', (message) => {
        console.log('رسالة مستلمة:', message.toString());
    });
    
    ws.send(JSON.stringify({ type: 'welcome', message: 'مرحباً بك في MataTech!' }));
});

// route الأساسي
app.get('/', (req, res) => {
    res.json({
        message: 'مرحباً بك في MataTech API 🇾🇪',
        version: '1.0.0',
        services: ['شحن المحافظ', 'البطاقات', 'شحن الألعاب', 'سداد الفواتير', 'سحب الأموال']
    });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'حدث خطأ في الخادم!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'الصفحة غير موجودة' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
    console.log(`🇾🇪 MataTech - المنصة اليمنية للخدمات الرقمية`);
});
