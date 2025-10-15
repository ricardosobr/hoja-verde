# 🚀 Guía de Despliegue - Hoja Verde Quotations

## 🎯 Opciones de Despliegue

### 1. **Vercel (Recomendado - Más Fácil)**

#### Pasos:
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. **Google Cloud Run (Containerizado)**

#### Dockerfile:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME \"0.0.0.0\"

CMD [\"node\", \"server.js\"]
```

#### Deploy Commands:
```bash
# Configurar proyecto GCP
gcloud config set project YOUR_PROJECT_ID

# Habilitar APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Build imagen
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hojaverde-quotations

# Deploy a Cloud Run
gcloud run deploy hojaverde-quotations \\n  --image gcr.io/YOUR_PROJECT_ID/hojaverde-quotations \\n  --platform managed \\n  --region us-central1 \\n  --allow-unauthenticated \\n  --set-env-vars=\"NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY\"
```

### 3. **Google Cloud App Engine**

#### app.yaml:
```yaml
runtime: nodejs18

env_variables:
  NEXT_PUBLIC_SUPABASE_URL: \"YOUR_SUPABASE_URL\"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: \"YOUR_ANON_KEY\"
  NEXT_PUBLIC_APP_URL: \"https://YOUR_PROJECT_ID.appspot.com\"

automatic_scaling:
  min_instances: 0
  max_instances: 10
  target_cpu_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 1
  disk_size_gb: 10
```

#### Deploy:
```bash
gcloud app deploy
```

---

## 🔧 Configuración de Supabase para Producción

### 1. **Crear Proyecto de Producción**
```sql
-- En Supabase SQL Editor, ejecutar:
-- 1. Crear schema completo (database-schema.sql)
-- 2. Insertar datos iniciales
```

### 2. **Configurar Autenticación**
```bash
# En Dashboard de Supabase > Authentication > Settings
# Site URL: https://tu-dominio.com
# Redirect URLs: https://tu-dominio.com/auth/callback
```

### 3. **Variables de Entorno Producción**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_APP_NAME=\"Hoja Verde - Cotizaciones\"
```

---

## 🔒 Configuración de Seguridad

### 1. **Row Level Security (RLS)**
```sql
-- Verificar que RLS esté habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. **Políticas de Acceso**
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 3. **Variables de Entorno Seguras**
- ✅ Usar HTTPS en producción
- ✅ Variables de entorno en plataforma de deploy
- ✅ No commitear .env.local
- ✅ Rotar claves periódicamente

---

## 📊 Monitoreo y Analytics

### 1. **Google Analytics**
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. **Supabase Analytics**
- Dashboard built-in de Supabase
- Métricas de uso de base de datos
- Logs de autenticación

### 3. **Error Tracking**
```bash
# Opcional: Instalar Sentry
npm install @sentry/nextjs
```

---

## 🚦 CI/CD con GitHub Actions

### `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Google Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    
    - name: Setup Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/hojaverde-quotations
        gcloud run deploy hojaverde-quotations \\n          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/hojaverde-quotations \\n          --platform managed \\n          --region us-central1 \\n          --allow-unauthenticated
```

---

## 🔍 Testing en Producción

### 1. **Health Check**
```bash
curl https://tu-dominio.com/api/health
```

### 2. **Tests de Funcionalidad**
- ✅ Login de admin y cliente
- ✅ Creación de cotizaciones
- ✅ Generación de PDFs
- ✅ Responsive en móviles

### 3. **Performance**
- ✅ Google PageSpeed Insights
- ✅ Lighthouse Score
- ✅ Core Web Vitals

---

## 📋 Checklist de Go-Live

### Pre-Deploy:
- [ ] Base de datos configurada
- [ ] Variables de entorno set
- [ ] SSL/HTTPS configurado
- [ ] DNS apuntando correctamente
- [ ] Backup de datos configurado

### Post-Deploy:
- [ ] Health checks passing
- [ ] Funcionalidad básica probada
- [ ] Analytics configurado
- [ ] Monitoreo activo
- [ ] Documentación actualizada

### Users & Training:
- [ ] Usuarios admin creados
- [ ] Empresas de prueba configuradas
- [ ] Training a usuarios finales
- [ ] Documentación de usuario

---

## 🆘 Troubleshooting

### Problemas Comunes:

#### 1. **Error de Conexión a Supabase**
```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### 2. **Error de Build**
```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### 3. **Error de RLS**
```sql
-- Verificar políticas de seguridad
SELECT * FROM pg_policies;
```

#### 4. **Performance Issues**
```bash
# Analizar bundle
npx @next/bundle-analyzer
```

---

## 📞 Soporte

- 🐛 **Issues**: GitHub Issues
- 📧 **Email**: soporte@hojaverde.com
- 📱 **WhatsApp**: +52 999 XXX XXXX
- 📖 **Docs**: [docs.hojaverde.com](https://docs.hojaverde.com)

---

**¡Tu aplicación está lista para producción! 🚀**"