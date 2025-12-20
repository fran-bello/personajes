# Instrucciones para agregar tu tipografía personalizada

## Pasos a seguir:

1. **Coloca tus archivos de fuente aquí**
   - Copia tus archivos `.ttf` y/o `.otf` a esta carpeta: `frontend/public/fonts/`
   - Ejemplo: `TuFuente-Regular.ttf`, `TuFuente-Bold.ttf`

2. **Actualiza el archivo `frontend/src/fonts.css`**
   - Abre el archivo `frontend/src/fonts.css`
   - Reemplaza `'TuFuente'` con el nombre real de tu fuente
   - Actualiza las rutas de los archivos para que coincidan con los nombres que colocaste

3. **Ejemplo de configuración:**

   Si tu fuente se llama "MiFuente" y tienes estos archivos:
   - `MiFuente-Regular.ttf`
   - `MiFuente-Bold.ttf`

   Entonces en `fonts.css` debería quedar así:
   ```css
   @font-face {
     font-family: 'MiFuente';
     src: url('/fonts/MiFuente-Regular.ttf') format('truetype');
     font-weight: 400;
     font-style: normal;
   }
   
   @font-face {
     font-family: 'MiFuente';
     src: url('/fonts/MiFuente-Bold.ttf') format('truetype');
     font-weight: 700;
     font-style: normal;
   }
   ```

4. **Y en `index.css` cambiar:**
   ```css
   font-family: 'MiFuente', -apple-system, ...
   ```

## Formatos soportados:
- ✅ **TTF (TrueType Font)** - Recomendado, mejor compatibilidad
- ✅ **OTF (OpenType Font)** - También funciona perfectamente
- Puedes usar ambos formatos para máxima compatibilidad

## Nota:
Los archivos en la carpeta `public/` se sirven directamente, por eso las rutas en CSS comienzan con `/fonts/`
