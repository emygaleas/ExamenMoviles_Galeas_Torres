# 📱 Tech Gadgets Showcase

Un catálogo de gadgets tecnológicos desarrollada con **Ionic 8**, **Angular 20 (Standalone Components)** y **Supabase** como backend en la nube (PostgreSQL + Cloud Storage).

---

## 🚀 Características Principales

*   **Sincronización Cloud en Tiempo Real:** Realiza consultas y sincronizaciones directas y reactivas desde **Supabase Database**. Eliminación absoluta de almacenamiento cacheado en local (`localStorage`).
*   **Almacenamiento en la Nube (Supabase Storage):** Subida física automatizada de imágenes representativas y audios descriptivos para cada gadget en un bucket seguro (`gadgets-assets`).
*   **CRUD Completo y Dinámico:**
    *   **Creación:** Registro de gadgets con nombre, descripción, enlace de video (YouTube/Vimeo/Web), imagen y audio.
    *   **Lectura:** Galería con búsqueda reactiva en tiempo real y filtrado instantáneo por texto.
    *   **Edición:** Modificación de metadatos y reemplazo transparente de archivos multimedia en la nube.
    *   **Eliminación:** Borrado físico del registro en base de datos y eliminación automática de sus archivos asociados en Supabase Storage para optimizar espacio.
    *   **Reproductor de Video Adaptativo:** Integración nativa del reproductor de video configurado de forma responsive para abarcar toda la pantalla sin generar molestas barras de desplazamiento.
    *   **Reproductor de Audio Individual:** Controles interactivos integrados por tarjeta de gadget con indicador dinámico de carga.
*   **Preparación Total para APK Nativa:**
    *   **Splash Screen & Iconos Personalizados:** Generados automáticamente en alta definición
    *   **Permisos de Android Declarados:** Configurado en `AndroidManifest.xml` con permisos de red, cámara, grabación de voz y almacenamiento multimedia granular compatible con Android 13+.

---

## 🛠️ Arquitectura y Tecnologías

```text
  ┌───────────────────────────────────┐
  │     Cliente Móvil: Ionic/Angular   │
  └─────────────────┬─────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│Supabase Database │  │ Supabase Storage │
│ (Tabla: gadgets) │  │(Bucket: assets)  │
└──────────────────┘  └──────────────────┘
```

*   **Frontend Framework:** Ionic v8.0.0 & Angular v20.0.0 (Standalone Components & Reactive Router).
*   **Gestión de Estados:** RxJS BehaviorSubjects y Flujos Reactivos Asíncronos (`async/await`).
*   **Backend as a Service:** Supabase JS v2.106.1.
*   **Base de Datos:** PostgreSQL con RLS (Row Level Security) habilitado públicamente.
*   **Procesamiento de Imágenes:** Jimp v1.6.1 (Generación de assets móviles de alta fidelidad).

---

## 📊 Estructura de la Base de Datos

Para que el sistema funcione, se utiliza una tabla en **Supabase** llamada `gadgets` con columnas tipadas que mapean directamente las propiedades del modelo de TypeScript. 

### Script de Creación SQL (PostgreSQL)

Ejecuta el siguiente script en el **SQL Editor** de tu consola de Supabase para instanciar la base de datos:

```sql
-- 1. Crear la tabla de Gadgets
CREATE TABLE public.gadgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar la seguridad a nivel de filas (RLS)
ALTER TABLE public.gadgets ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Acceso Público (Lectura, Inserción, Actualización y Eliminación)
CREATE POLICY "Permitir lectura publica" ON public.gadgets
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion publica" ON public.gadgets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion publica" ON public.gadgets
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminacion publica" ON public.gadgets
    FOR DELETE USING (true);
```

> [!IMPORTANT]
> **Configuración del Storage en Supabase:**
> Debes crear un bucket público en Supabase Storage llamado `gadgets-assets` y habilitar políticas públicas de lectura (`select`), subida (`insert`/`update`) y borrado (`delete`) de objetos para permitir el correcto flujo de imágenes y audios.

---

## ⚙️ Configuración del Entorno

Modifica los archivos de configuración de entorno ubicados en `src/environments/` para enlazar la app con tus credenciales de Supabase:

### `src/environments/environment.ts` (Desarrollo y Producción)
```typescript
export const environment = {
  production: false, // true en environment.prod.ts
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY',
  supabaseBucket: 'gadgets-assets'
};
```

---

## 💻 Comandos del Proyecto

Asegúrate de tener instaladas las dependencias ejecutando `npm install`.

### 1. Levantar Servidor de Desarrollo
Inicia el entorno de desarrollo local con recarga rápida en el navegador:
```bash
ionic serve
```

### 2. Compilar para Producción
Genera los archivos estáticos listos para producción y optimizados en la carpeta `www`:
```bash
npm run build
```

### 3. Generar Splash Screen e Iconos Nativos
Si cambias la imagen base en `src/assets/icon/gadget.png`, puedes regenerar los 107 tamaños de iconos y pantallas de carga para Android ejecutando:
```bash
node generate-assets.js
npx @capacitor/assets generate
```

### 4. Sincronizar y Compilar la APK Nativamente
Sincroniza el código de Angular y los assets móviles con la carpeta de Android:
```bash
npx cap sync
npx cap open android
```
*(Se abrirá **Android Studio**. Ve a **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** para exportar tu archivo `.apk` final).*

---

## 📂 Estructura de Directorios Clave

```text
├── android/                   # Directorio del proyecto nativo de Android
├── assets/                    # Assets base en alta definición (1024x1024 / 2732x2732)
├── src/
│   ├── app/
│   │   ├── home/              # Vista principal, controladores y estilos premium
│   │   ├── models/            # Interfaces y modelos de TypeScript
│   │   └── services/          # Conectores y lógica del CRUD con Supabase
│   ├── assets/                # Iconos del sistema y PWA
│   ├── theme/                 # Paleta de colores e identidades visuales
│   └── index.html             # Punto de entrada optimizado con tipografías
├── capacitor.config.ts        # Configuración del Splash Screen y Plugins móviles
├── generate-assets.js         # Script automatizado para procesar iconos nativos con Jimp
└── README.md                  # Documentación del sistema (este archivo)
```
