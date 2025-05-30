const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, 'dist/bloc-notas-frontend')));

// Redirigir todas las rutas al index.html para que Angular maneje el routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/bloc-notas-frontend/index.html'));
});

// Escuchar en el puerto correcto
app.listen(port, '0.0.0.0', () => {  // Aquí es donde se cambia a 0.0.0.0
  console.log(`Servidor corriendo en puerto ${port}`);
});
