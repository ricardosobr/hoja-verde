# 🌿 Hoja Verde - Sistema de Cotizaciones

Un sistema integral de gestión de cotizaciones y pedidos desarrollado con tecnologías modernas para empresas del sector hotelero y comercial.

## 🚀 Características Principales

### ✨ Funcionalidades Implementadas

#### **Panel de Administración**
- 📊 Dashboard con métricas en tiempo real
- 📈 Análisis de ventas y tendencias
- 👥 Gestión completa de clientes y usuarios
- 📦 Inventario de productos con categorías
- 💰 Sistema de precios con márgenes de ganancia
- 🧾 Gestión de impuestos (IVA configurable)

#### **Sistema de Cotizaciones**
- ✏️ Creación de cotizaciones personalizadas
- 🔢 Generación automática de folios únicos
- ⏰ Control de vigencia y términos
- 📋 Estados de flujo: Borrador → Generada → En Revisión → Aprobada/Rechazada
- 📄 Generación de PDF profesionales
- 📧 Notificaciones automáticas

#### **Gestión de Pedidos**
- 🛒 Conversión de cotizaciones a pedidos
- 📦 Seguimiento de estados: Pendiente → Confirmado → En Proceso → Listo → Enviado → Entregado
- 🚚 Sistema de tracking de entregas
- 📱 Actualizaciones en tiempo real

#### **Portal del Cliente**
- 🔐 Acceso seguro con roles diferenciados
- 💻 Creación de cotizaciones self-service
- 👀 Vista de precios finales con impuestos
- 📊 Historial de cotizaciones y pedidos
- ✅ Aprobación de cotizaciones
- 📞 Gestión de contactos por empresa

#### **Características Técnicas**
- 🔍 Auditoría completa de cambios
- 📚 Historial de revisiones
- 🔒 Seguridad a nivel de fila (RLS)
- ⚡ Actualizaciones en tiempo real
- 📱 Diseño responsive
- 🌐 PWA ready

---

## 🛠️ Stack Tecnológico

### **Frontend**
- ⚛️ **Next.js 14** - Framework React con App Router
- 🎨 **TypeScript** - Tipado estático
- 💅 **Tailwind CSS** - Styling utilitario
- 🎯 **Zustand** - Estado global
- 📋 **React Hook Form** - Gestión de formularios
- ✅ **Zod** - Validación de esquemas
- 🎨 **Lucide React** - Iconografía
- 📄 **React-PDF** - Generación de documentos

### **Backend & Database**
- 🗄️ **Supabase** - Backend-as-a-Service
- 🐘 **PostgreSQL** - Base de datos relacional
- 🔐 **Row Level Security** - Seguridad granular
- ⚡ **Real-time subscriptions** - Actualizaciones live
- 🔑 **JWT Authentication** - Autenticación segura

### **Infrastructure**
- ☁️ **Google Cloud Platform** - Hosting y deployment
- 🐳 **Docker** - Containerización
- 🔄 **GitHub Actions** - CI/CD
- 📊 **Google Analytics** - Métricas

---

## 📋 Respuestas a Requerimientos

### ❓ **"¿Qué es folio?"**
El **folio** es un identificador único generado automáticamente para cada documento:
- 📄 **COT-XXXXXXXX** para cotizaciones
- 🛒 **ORD-XXXXXXXX** para pedidos
- 🔢 Formato: Prefijo + 8 caracteres hexadecimales basados en timestamp
- 📈 Secuencial y trazable para auditoría

### 🏢 **"Diferenciación Admin vs Cliente"**

#### **Vista Administrador:**
- 💰 Ve costos, márgenes de ganancia y precios base
- 📊 Acceso a métricas completas de negocio
- 👥 Gestión de usuarios y empresas
- ⚙️ Configuración de productos e impuestos
- 📋 Control total de estados y flujos

#### **Vista Cliente:**
- 💵 Solo ve precios finales con impuestos incluidos
- 🛒 Puede crear cotizaciones para su empresa
- ✅ Aprueba/rechaza cotizaciones
- 📦 Hace seguimiento de pedidos
- 📞 Gestiona sus contactos

### 📊 **"Estados Corregidos"**

#### **Estados de Cotizaciones:**
1. 📝 **Borrador** - En creación
2. 📤 **Generada** - Enviada al cliente
3. 👀 **En Revisión** - Cliente evaluando
4. ✅ **Aprobada** - Cliente acepta
5. ❌ **Rechazada** - Cliente rechaza
6. ⏰ **Expirada** - Venció vigencia
7. 🔄 **Convertida** - Se convirtió en pedido

#### **Estados de Pedidos:**
1. ⏳ **Pendiente** - Esperando confirmación
2. ✅ **Confirmado** - Aprobado por admin
3. ⚙️ **En Proceso** - Siendo preparado
4. 📦 **Listo** - Preparado para envío
5. 🚚 **Enviado** - En tránsito
6. 🎯 **Entregado** - Completado
7. ❌ **Cancelado** - Cancelado

#### **Estados de Entrega:**
1. 🔧 **Preparando** - Preparando pedido
2. 🚛 **En Camino** - En tránsito
3. ✅ **Entregado** - Completado exitosamente
4. ⚠️ **Fallo** - Error en entrega

### 💰 **"Manejo de IVA/Impuestos"**
- ⚙️ Configuración flexible de impuestos
- 📊 IVA automático del 16% por defecto
- 💵 Soporte para impuestos por porcentaje o cantidad fija
- 🎯 Aplicación a nivel de producto
- 🧮 Cálculo automático en cotizaciones

---

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- (Opcional) Cuenta de Google Cloud

### **1. Clonar y Setup**
```bash
# Clonar repositorio
git clone <repository-url>
cd hojaverde-quotations

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.local.example .env.local
```

### **2. Configurar Supabase**

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar el schema SQL:
   ```sql
   -- Ejecutar database-schema.sql en el SQL Editor
   ```
3. Configurar variables en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

### **3. Datos Iniciales**
```sql
-- Crear usuario administrador
INSERT INTO auth.users (id, email) VALUES 
('admin-uuid', 'admin@hojaverde.com');

INSERT INTO users (id, email, full_name, role) VALUES 
('admin-uuid', 'admin@hojaverde.com', 'Administrador', 'admin');

-- Crear empresa de prueba
INSERT INTO companies (name, rfc, created_by) VALUES 
('Hotel Mundo Maya', 'HMM220603TC4', 'admin-uuid');
```

### **4. Ejecutar Desarrollo**
```bash
npm run dev
```

---

## 📊 Esquema de Base de Datos

### **Tablas Principales**

#### **users** - Usuarios del sistema
- 🆔 ID, email, nombre, rol (admin/client)
- 🔒 Estados: activo, inactivo, pendiente
- 👤 Vinculación con auth.users de Supabase

#### **companies** - Empresas/Clientes
- 🏢 Información completa: nombre, RFC, dirección
- 📞 Datos de contacto
- 🔗 Relación con usuarios (client_profiles)

#### **products** - Catálogo de productos
- 📦 Código, nombre, descripción, categoría
- 💰 Precios: costo, margen, precio base, precio público
- 🧾 Configuración de impuestos
- 📊 Control de inventario

#### **documents** - Cotizaciones y Pedidos
- 📄 Folio único, tipo (quotation/order)
- 👥 Información del cliente y contacto
- 📅 Fechas, vigencia, términos
- 💵 Totales calculados automáticamente
- 📊 Estados de flujo de trabajo

#### **document_items** - Elementos de documentos
- 📋 Productos en cotizaciones/pedidos
- 🔢 Cantidades, precios, impuestos
- 🧮 Cálculos automáticos de totales

#### **status_history** - Auditoría de cambios
- 📈 Historial completo de cambios de estado
- 👤 Usuario que realizó el cambio
- ⏰ Timestamp de cada modificación

---

## 🔐 Seguridad y Permisos

### **Row Level Security (RLS)**
- 🔒 Cada tabla tiene políticas de seguridad
- 👥 Admins ven todo, clientes solo sus datos
- 🏢 Clientes solo acceden a su empresa
- 📄 Documentos visibles según relación

### **Roles y Permisos**
- 👑 **Admin**: Control total del sistema
- 🏢 **Client**: Acceso limitado a su empresa
- ⚙️ Permisos granulares por función

---

## 🚀 Deploy en Google Cloud

### **Cloud Run (Recomendado)**
```bash
# Build de producción
npm run build

# Crear imagen Docker
docker build -t hojaverde-quotations .

# Subir a Cloud Run
gcloud run deploy hojaverde-quotations \
  --image gcr.io/PROJECT-ID/hojaverde-quotations \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### **Variables de Entorno Producción**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_produccion
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_produccion
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## 📈 Roadmap Futuro

### **Fase 1: Core MVP** ✅
- [x] Autenticación y roles
- [x] CRUD de productos y clientes
- [x] Sistema de cotizaciones básico
- [x] Dashboard administrativo

### **Fase 2: Enhancements** 🚧
- [ ] Portal cliente completo
- [ ] Sistema de pedidos
- [ ] Tracking de entregas
- [ ] Generación de PDFs
- [ ] Notificaciones email

### **Fase 3: Advanced** 📋
- [ ] API externa para integraciones
- [ ] App móvil
- [ ] Reportes avanzados
- [ ] Multi-tenancy
- [ ] Integraciones de pago

---

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

---

## 📞 Contacto

**Hoja Verde** - Sistema de Cotizaciones
- 📧 Email: contacto@hojaverde.com
- 🌐 Website: [www.hojaverde.com](https://www.hojaverde.com)
- 📱 Soporte: +52 999 XXX XXXX

---

⚡ **Construido con amor usando Next.js, Supabase y TypeScript** 💚
