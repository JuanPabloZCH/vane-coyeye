# VANE COYEYE 💙

Un pequeño videojuego web endless runner hecho con cariño para Vanessa.

## Jugar localmente

1. Descarga o clona este repositorio.
2. Abre `index.html` en tu navegador (Chrome recomendado).
   - Si el audio no se reproduce al abrir con doble clic, usa un servidor local:
     ```bash
     npx serve .
     ```
3. Presiona **JUGAR**.

## Publicar en GitHub Pages (paso a paso)

### Qué subir
Sube **toda la carpeta del proyecto** tal cual, manteniendo esta estructura en la raíz del repositorio:

```
index.html
README.md
assets/
  audio/
    coyeye.mp3
css/
  styles.css
  game.css
js/
  config.js
  audio.js
  player.js
  obstacles.js
  collectibles.js
  ui.js
  game.js
  main.js
```

No subas solo algunos archivos: `index.html` debe estar en la raíz.

### Paso a paso

1. Entra a https://github.com y crea una cuenta (si no tienes).
2. Haz clic en **+** (arriba a la derecha) → **New repository**.
3. Nombre del repositorio: `vane-coyeye` (o el que prefieras).
4. Déjalo **Public**.
5. NO marques "Add a README" (ya tienes uno).
6. Clic en **Create repository**.
7. En la página del repo vacío, haz clic en **uploading an existing file** (o "Add file → Upload files").
8. Arrastra **todos los archivos y carpetas** del proyecto (index.html, css/, js/, assets/, README.md).
   - Asegúrate de que `index.html` quede en la raíz, no dentro de una subcarpeta.
9. Baja hasta "Commit changes", escribe un mensaje (ej. "Primer commit del juego") y haz clic en **Commit changes**.
10. Ve a la pestaña **Settings** del repositorio.
11. En el menú izquierdo, clic en **Pages**.
12. En "Build and deployment":
    - Source: **Deploy from a branch**.
    - Branch: **main**.
    - Folder: **/ (root)**.
13. Clic en **Save**.
14. Espera 1–3 minutos. Refresca la página de Settings → Pages.
15. Aparecerá el enlace público, algo como:
    `https://TU-USUARIO.github.io/vane-coyeye/`
16. Abre ese enlace en tu navegador y en el celular de Vanessa para probar.
17. Comparte el enlace con ella 💙

### Actualizar el juego después
1. Edita los archivos en tu PC.
2. En GitHub, entra al archivo → ícono de lápiz (Edit) → pega el nuevo contenido → **Commit changes**.
   O vuelve a subir los archivos (sobrescribe).
3. GitHub Pages se actualiza solo en 1–2 minutos.

### Agregar o reemplazar coyeye.mp3
1. Asegúrate de que el archivo se llame exactamente `coyeye.mp3`.
2. Súbelo/reemplázalo en la ruta `assets/audio/coyeye.mp3` del repositorio.
3. Commit. Listo.

### Si el juego no carga
- Verifica que `index.html` esté en la raíz del repo.
- Abre la consola del navegador (F12) y revisa errores de rutas.
- Las rutas son relativas (`assets/...`, `js/...`), por lo que funcionan en subdirectorios de GitHub Pages.

## Audio

El archivo de audio debe estar en:

```
assets/audio/coyeye.mp3
```

Para reemplazarlo, sobrescribe ese archivo manteniendo el nombre. El sonido se inicializa después de presionar JUGAR (restricción del navegador).

## Personalización

Edita `js/config.js`:

- `gameOverMessages`: frases de derrota.
- `surpriseMessages`: mensajes sorpresa.
- `specialMessage`: dedicatoria final.
- `PERSONAL`: apodos, frases.

Agrega referencias reales de tu chat "Mi Dulce Demonio" en esos arreglos. No incluyas información privada o sensible.

## Controles

- PC: ← → cambiar carril · ↑ / espacio saltar · ↓ deslizarse · P pausa
- Móvil: desliza en cualquier dirección o usa los botones táctiles.

## Estructura

```
vane-coyeye/
├── index.html
├── README.md
├── assets/audio/coyeye.mp3
├── css/styles.css
├── css/game.css
└── js/*.js
```

## Notas

- Sin backend, sin dependencias. Funciona 100% en el navegador.
- El récord se guarda en `localStorage`.
- Compatible con Chrome y móviles.
