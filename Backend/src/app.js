import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'mongo-sanitize';
import xssClean from 'xss-clean';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import {
    generalApiRateLimiter,
    riderRateLimiter,
    adminRateLimiter,
    webhookRateLimiter
} from './middleware/rateLimit.js';
import { responseTimeLogger } from './middleware/responseTimeLogger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { healthCheck } from './config/health.js';
import { config } from './config/env.js';

const app = express();

// Trust first proxy (essential for express-rate-limit if behind a proxy)
app.set('trust proxy', 1);

// Request ID tracing (before other middlewares so all logs can use it)
app.use(requestIdMiddleware);

// Health endpoints (no rate limit, minimal JSON, no secrets)
app.get('/health', async (_req, res) => {
    try {
        const data = await healthCheck();
        res.status(200).json(data);
    } catch (err) {
        res.status(503).json({ status: 'DOWN', error: 'Health check failed' });
    }
});
app.get('/ready', (_req, res) => {
    res.status(200).json({ status: 'ready' });
});

// Security & parsing middlewares
app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    hsts: config.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Handle requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Ensure exact frontend URL match, but also dynamically allow any Vercel deployment URL
        // or local network IP addresses for seamless testing and preview deployments
        if (
            allowedOrigins.includes(origin) || 
            origin.endsWith('.vercel.app') || 
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://localhost')
        ) {
            callback(null, origin);
        } else {
            // Strict exact match fallback if none of the above match
            callback(null, allowedOrigins[0] || origin);
        }
    },
    credentials: true,
    exposedHeaders: ['set-cookie', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicitly handle preflight requests
app.use(morgan('dev'));
app.use(express.json({
    limit: config.requestBodyLimit,
    verify: (req, res, buf) => {
        // ✅ Store rawBody for signature verification (Razorpay Webhooks)
        if (req.originalUrl && req.originalUrl.includes('/webhook/razorpay')) {
            req.rawBody = buf;
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: config.requestBodyLimit }));

// Protect against NoSQL injection and XSS
app.use((req, _res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
});
app.use(xssClean());

// Granular rate limiting for API sub-routes
app.use('/api/v1/payments/webhook', webhookRateLimiter);
app.use('/api/v1/food/delivery', riderRateLimiter);
app.use('/api/v1/food/admin', adminRateLimiter);
app.use('/api', generalApiRateLimiter);

// Optional: log API response time (method, path, status, duration) - no sensitive data
app.use('/api', responseTimeLogger);

// API Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export default app;
