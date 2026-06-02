# App Contable Cotizaciones Offline

Aplicación móvil offline para cotizaciones, ventas, inventario, movimientos y cartera. Toda la información se guarda localmente en SQLite dentro del dispositivo con `expo-sqlite`.

## Flujo principal

Cotización creada -> Cotización confirmada -> Venta registrada automáticamente

## Pantallas incluidas

- Inicio
- Cotizaciones
- Ventas
- Clientes
- Inventario
- Movimientos
- Cartera / Pendientes

## Instalar dependencias

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npx expo start
```

## Generar APK de prueba

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
