# Frontend - TRESESENTA MAPA360

Aplicacion web React para descubrir lugares autenticos de Mexico.

## Tecnologias

- **React 18** + **Vite**
- **React Router DOM** - Navegacion SPA
- **Leaflet** + **React-Leaflet** - Mapa interactivo
- **Lucide React** - Iconos outline
- **Axios** - Peticiones HTTP
- **CSS Variables** - Sin frameworks, estilos propios

## Setup

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Configurar API
El archivo `src/services/api.js` ya apunta a `http://localhost:3000/api`

Para produccion, crear `.env`:
```env
VITE_API_URL=https://tu-api.com/api
```

### 3. Iniciar desarrollo
```bash
npm run dev
```
La app corre en `http://localhost:5173`

---

## Estructura de Carpetas

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx       # Navegacion inferior (5 tabs)
│   │   └── ProtectedRoute.jsx  # Wrapper para rutas auth
│   │
│   ├── context/
│   │   └── AuthContext.jsx     # Estado global de usuario
│   │
│   ├── pages/
│   │   ├── Auth.jsx            # Login/Registro
│   │   ├── Auth.css
│   │   ├── Map.jsx             # Mapa principal (Leaflet)
│   │   ├── Map.css
│   │   ├── Create.jsx          # Crear nuevo pin
│   │   ├── Create.css
│   │   ├── Profile.jsx         # Perfil de usuario
│   │   ├── Profile.css
│   │   ├── Passport.jsx        # Pasaporte/Estados
│   │   └── Passport.css
│   │
│   ├── services/
│   │   └── api.js              # Configuracion Axios + endpoints
│   │
│   ├── App.jsx                 # Router principal
│   ├── main.jsx                # Entry point
│   └── index.css               # Estilos globales + variables
│
├── index.html
├── vite.config.js
└── package.json
```

---

## Paginas

### `/` - Auth (Login/Registro)
- Formulario de login y registro
- Guarda token JWT en localStorage
- Redirige a `/map` al autenticarse

### `/map` - Mapa Principal
- Mapa Leaflet con todos los pins
- Filtros por categoria
- Vista mapa / vista lista (toggle)
- Click en pin abre modal con detalles
- Likes, comentarios, compartir a Google Maps
- Marcadores coloridos segun categoria

### `/create` - Crear Pin
- Formulario para crear nuevo pin
- Selector de categoria y ciudad
- Mapa para seleccionar ubicacion
- Subir imagen (pendiente implementar)

### `/profile` - Perfil
- Info del usuario actual
- Nivel y puntos
- Lista de pins creados
- Medallas obtenidas (pendiente)

### `/passport` - Pasaporte
- Mapa de Mexico con estados
- Estados visitados resaltados
- Conteo de ciudades visitadas

---

## Paleta de Colores

Definidas en `src/index.css`:

```css
:root {
  --arena: #E8DCC8;      /* Beige arena */
  --terracota: #C67B5C;  /* Principal - botones, acentos */
  --sage: #8B9B7E;       /* Verde salvia - textos secundarios */
  --cafe-dark: #4A3A2A;  /* Cafe oscuro - textos principales */
  --cream: #F5F0E8;      /* Fondo general */
}
```

---

## Iconos por Categoria

Usando Lucide React (outline style):

| Categoria | Icono | Color |
|-----------|-------|-------|
| Monumentos | Building2 | #E74C3C |
| Naturaleza | Leaf | #27AE60 |
| Cafes | Coffee | #F39C12 |
| Nightlife | Moon | #9B59B6 |
| Museos | Palette | #3498DB |
| Curiosos | Sparkles | #E91E63 |

---

## Autenticacion

El `AuthContext` maneja el estado global:

```jsx
// En cualquier componente:
import { useAuth } from '../context/AuthContext';

const { user, login, logout, loading } = useAuth();
```

El token se guarda en `localStorage` como `token`.

---

## API Service

`src/services/api.js` exporta funciones para cada endpoint:

```jsx
import { pinsAPI, categoriesAPI, citiesAPI, authAPI } from '../services/api';

// Ejemplos:
const pins = await pinsAPI.getAll();
const pin = await pinsAPI.create({ title, description, ... });
await pinsAPI.like(pinId);
await pinsAPI.unlike(pinId);
const comments = await pinsAPI.getComments(pinId);
```

---

## Scripts

```bash
# Desarrollo
npm run dev

# Build produccion
npm run build

# Preview build
npm run preview
```

---

## Notas para Desarrollo

1. **Leaflet CSS**: Se carga desde CDN en `index.html`
2. **Responsive**: Mobile-first, breakpoints en 640px y 1024px
3. **BottomNav**: Siempre visible, altura fija de 80px
4. **Mapa**: Usa `invalidateSize()` para renderizar correctamente

---

## Pendientes

- [ ] Subida de imagenes real (actualmente sin funcionalidad)
- [ ] Pagina Passport con estados de Mexico
- [ ] Sistema de medallas visual
- [ ] PWA / Service Worker
- [ ] Dark mode

---

## Credenciales de Prueba

Despues de ejecutar `seedData.js` en el backend:

- Email: `ana@example.com` / Password: `password123`
- Email: `carlos@example.com` / Password: `password123`
