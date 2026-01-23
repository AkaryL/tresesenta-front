# TRESESENTA MAPA 360 - Frontend

Aplicacion web React para explorar Mexico de forma interactiva. Plataforma exclusiva para clientes de **TRESESENTA** donde pueden descubrir lugares, ganar puntos y coleccionar experiencias.

## Descripcion del Proyecto

**TRESESENTA Mapa 360** es un pasaporte digital que permite a los usuarios:
- Explorar los 32 estados de Mexico en un mapa interactivo
- Crear "pins" de lugares que han visitado
- Ganar puntos por cada interaccion
- Obtener medallas y subir de nivel
- Verificar que usaron sus tenis TRESESENTA en cada visita

### Flujo de Usuario

1. **Registro/Login**: El usuario debe ser cliente de TRESESENTA (verificado via Shopify)
2. **Explorar Mapa**: Ve pins de otros usuarios y descubre lugares
3. **Crear Pin**: Comparte un lugar con foto, descripcion y categoria
4. **Verificacion TRESESENTA**: Marca si uso sus tenis TRESESENTA (bonus de puntos)
5. **Pasaporte 360**: Ve su progreso, puntos y medallas

---

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 19.2.0 | Framework UI |
| Vite | 7.2.4 | Build tool |
| React Router DOM | 7.9.6 | Navegacion SPA |
| Leaflet | 1.9.4 | Mapa interactivo |
| React-Leaflet | 5.0.0 | Componentes React para Leaflet |
| Framer Motion | 12.23.24 | Animaciones |
| Lucide React | 0.554.0 | Iconos |
| Axios | 1.13.2 | HTTP Client |
| Tailwind CSS | 4.1.17 | Utilidades CSS |

---

## Instalacion

### Requisitos
- Node.js 18+
- npm o yarn
- Backend corriendo en `http://localhost:4000`

### Setup

```bash
# Clonar repositorio
git clone https://github.com/AkaryL/tresesenta-front.git
cd tresesenta-front

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

La app corre en `http://localhost:5173`

### Variables de Entorno

Crear archivo `.env` para produccion:

```env
VITE_API_URL=https://tu-api.com/api
```

---

## Estructura del Proyecto

```
tresesenta-front/
├── public/
│   └── ...
├── src/
│   ├── assets/
│   │   ├── logos/
│   │   │   ├── TRESESENTA.png      # Logo principal
│   │   │   └── monito 360.png      # Isotipo/mascota
│   │   ├── pins/
│   │   │   ├── parques.png         # Pin categoria parques
│   │   │   ├── restaurantes.png    # Pin categoria restaurantes
│   │   │   ├── cafeteria.png       # Pin categoria cafeteria
│   │   │   ├── vidanocturna.png    # Pin categoria vida nocturna
│   │   │   ├── lugares publicos.png # Pin lugares publicos
│   │   │   └── lugares favoritos.png # Pin favoritos
│   │   └── badges/
│   │       └── ...                 # Imagenes de medallas
│   │
│   ├── components/
│   │   ├── BottomNav.jsx           # Navegacion inferior (5 tabs)
│   │   └── BottomNav.css
│   │
│   ├── context/
│   │   └── AuthContext.jsx         # Estado global de autenticacion
│   │
│   ├── pages/
│   │   ├── Landing.jsx/.css        # Pagina de bienvenida
│   │   ├── Login.jsx               # Login con OTP
│   │   ├── Register.jsx            # Registro de usuario
│   │   ├── Map.jsx/.css            # Mapa principal con pins
│   │   ├── Create.jsx/.css         # Crear nuevo pin
│   │   ├── Profile.jsx/.css        # Pasaporte 360 del usuario
│   │   ├── Passport.jsx            # Estados visitados
│   │   └── RoutesPage.jsx          # Rutas curadas
│   │
│   ├── services/
│   │   └── api.js                  # Configuracion Axios + endpoints
│   │
│   ├── App.jsx                     # Router principal
│   ├── App.css
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Variables globales + estilos base
│
├── index.html
├── tailwind.config.js              # Configuracion Tailwind
├── vite.config.js
└── package.json
```

---

## Paginas y Funcionalidades

### `/` - Landing Page
- Presentacion de la app
- Modal informativo con beneficios
- Botones para iniciar sesion o crear cuenta

### `/login` - Autenticacion OTP
- Login con email (sin password)
- Se envia codigo OTP al correo
- Verificacion de cliente TRESESENTA via Shopify

### `/map` - Mapa Principal
- Mapa Leaflet interactivo de Mexico
- Filtros por categoria (chips horizontales)
- Toggle vista Mapa / Lista
- Marcadores coloridos segun categoria
- Click en pin abre modal con:
  - Imagen del lugar
  - Descripcion
  - Autor y fecha
  - Botones: Like, Comentar, Abrir en Google Maps
- Seccion de comentarios

### `/create` - Crear Pin
- Formulario completo:
  - Titulo y descripcion
  - Selector de categoria
  - Selector de ciudad
  - Mapa para elegir ubicacion exacta
  - Subir imagen
- **Checkbox "Use mis tenis TRESESENTA"**: Bonus de puntos si se verifica

### `/profile` - Pasaporte 360
- Tarjeta tipo pasaporte con:
  - Nombre y avatar del usuario
  - Puntos totales con barra de progreso
  - Nivel actual
  - Indicador de comprador verificado
- Grid de medallas obtenidas
- **Selector de color**: 6 opciones para personalizar el pasaporte
- Menu de acciones:
  - Crear Pin
  - Ver Favoritos
  - Rutas guardadas
  - Intercambiar puntos
- Boton cerrar sesion

### `/passport` - Estados Visitados
- Mapa de Mexico por estados
- Estados visitados resaltados
- Contador de ciudades

### `/routes` - Rutas Curadas
- Lista de rutas oficiales TRESESENTA
- Rutas creadas por la comunidad
- Progreso en cada ruta

---

## Sistema de Diseno

### Paleta de Colores Principal

Definida en `src/index.css`:

```css
:root {
  /* Paleta Principal TRESESENTA */
  --black: #000000;
  --white: #ffffff;
  --gray-warm: #aeaa9f;
  --gray-light: #efefef;

  /* Paleta Alternativa */
  --cream: #f5f0e8;
  --beige: #d6cfc4;
  --camel: #b89b7a;      /* Color primario - botones, acentos */
  --brown: #7a6a58;
  --sage: #8f9b8a;
  --charcoal: #2d2d2d;
  --gray-mid: #6b6b6b;
}
```

### Colores de Categorias

```css
:root {
  --cat-parques: #7ed957;       /* Verde */
  --cat-restaurante: #9b59b6;   /* Morado */
  --cat-vida-nocturna: #85c1e9; /* Azul claro */
  --cat-cafeteria: #f5a623;     /* Naranja */
  --cat-cultura: #e84393;       /* Rosa */
  --cat-favoritos: #f1c40f;     /* Amarillo */
}
```

### Tipografias

```css
:root {
  --font-heading: 'Libre Baskerville', Georgia, serif;  /* Titulos */
  --font-body: 'Inter', -apple-system, sans-serif;      /* Cuerpo */
}
```

Las fuentes se cargan desde Google Fonts en `index.html`.

---

## Categorias de Pins

| Categoria | Emoji | Color | Descripcion |
|-----------|-------|-------|-------------|
| Parques | 🌳 | #7ed957 | Parques, jardines y espacios verdes |
| Restaurante | 🍽️ | #9b59b6 | Restaurantes y lugares para comer |
| Vida Nocturna | 🍸 | #85c1e9 | Bares, antros y vida nocturna |
| Cafeteria | ☕ | #f5a623 | Cafeterias y lugares para cafe |
| Cultura | 🎨 | #e84393 | Museos, galerias y cultura |
| Favoritos | ⭐ | #f1c40f | Lugares favoritos de la comunidad |

---

## Sistema de Puntos

Los usuarios ganan puntos por diferentes acciones:

| Accion | Puntos Base | Bonus TRESESENTA |
|--------|-------------|------------------|
| Crear pin | 20 | +10 |
| Crear pin con foto | 25 | +15 |
| Crear pin con video | 30 | +20 |
| Dar like | 1 | - |
| Recibir like | 2 | - |
| Comentar | 3 | +2 |
| Recibir comentario | 5 | - |
| Visitar nueva ciudad | 50 | +25 |
| Completar ruta | 100 | +50 |
| Login diario | 5 | - |

---

## API Service

`src/services/api.js` exporta funciones organizadas por recurso:

```javascript
import { authAPI, pinsAPI, categoriesAPI, citiesAPI, usersAPI, uploadAPI } from './services/api';

// Autenticacion (OTP)
await authAPI.requestCode(email);
await authAPI.verifyCode(email, code);
await authAPI.me();

// Pins
await pinsAPI.getAll({ category, city, limit, offset });
await pinsAPI.getById(id);
await pinsAPI.create({ title, description, latitude, longitude, category_id, used_tresesenta });
await pinsAPI.like(id);
await pinsAPI.unlike(id);
await pinsAPI.getComments(id);
await pinsAPI.addComment(id, content);

// Categorias
await categoriesAPI.getAll();

// Ciudades
await citiesAPI.getAll();

// Usuarios
await usersAPI.getByUsername(username);

// Upload
await uploadAPI.images(formData);
```

---

## Autenticacion

El `AuthContext` maneja el estado global de autenticacion:

```jsx
import { useAuth } from '../context/AuthContext';

const {
  user,              // Usuario actual
  loading,           // Estado de carga
  isAuthenticated,   // Boolean
  login,             // Login con credenciales
  loginWithToken,    // Login directo (OTP)
  logout,            // Cerrar sesion
  refreshUser,       // Recargar datos del usuario
} = useAuth();
```

El token JWT se guarda en `localStorage`.

---

## Navegacion

La app usa una navegacion inferior fija (`BottomNav`) con 5 tabs:

1. **Mapa** (`/map`) - Icono: Map
2. **Rutas** (`/routes`) - Icono: Route
3. **Crear** (`/create`) - Boton flotante central
4. **Pasaporte** (`/passport`) - Icono: Ticket
5. **Perfil** (`/profile`) - Icono: User

Rutas protegidas redirigen a `/login` si no hay sesion.

---

## Scripts

```bash
# Desarrollo con hot reload
npm run dev

# Build para produccion
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

---

## Responsive Design

La app es **mobile-first** con breakpoints:

- **Base**: < 640px (mobile)
- **sm**: >= 640px (tablet)
- **md**: >= 768px (tablet landscape)
- **lg**: >= 1024px (desktop)

El `BottomNav` tiene altura fija y respeta `safe-area-inset-bottom` para dispositivos con notch.

---

## Notas Tecnicas

1. **Leaflet CSS**: Se carga desde CDN en `index.html`
2. **Mapa**: Usa `invalidateSize()` para renderizar correctamente
3. **Animaciones**: Framer Motion para transiciones suaves
4. **Colores categorias**: Definidos en `Map.jsx` como `CATEGORY_COLORS`
5. **Pasaporte**: Los colores de personalizacion estan en `PROFILE_COLORS`

---

## Integracion con Backend

El frontend espera el backend en `http://localhost:4000/api`.

Endpoints principales que consume:
- `POST /api/auth/request-code` - Solicitar OTP
- `POST /api/auth/verify-code` - Verificar OTP
- `GET /api/auth/me` - Usuario actual
- `GET /api/pins` - Listar pins
- `POST /api/pins` - Crear pin
- `POST /api/pins/:id/like` - Dar like
- `GET /api/categories` - Categorias
- `GET /api/cities` - Ciudades
- `GET /api/points/my-stats` - Stats de puntos
- `PUT /api/users/me/profile-color` - Cambiar color pasaporte

---

## Repositorios Relacionados

- **Backend**: [tresesenta-back](https://github.com/AkaryL/tresesenta-back)
- **Shopify Store**: [tresesenta.com](https://tresesenta.com)

---

## Licencia

Proyecto privado de TRESESENTA.
