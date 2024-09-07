const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configurar Multer para el manejo de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`); // Genera un nombre único para el archivo.
  }
});
const upload = multer({ storage });

// Almacenar las citas en memoria
let citas = [];

// Endpoint para crear una nueva cita médica
app.post('/citas', upload.single('autorizacion'), (req, res) => {
  const { cc, fecha } = req.body;
  const file = req.file;

  if (!cc || !fecha || !file) {
    return res.status(400).json({ message: 'Faltan datos o archivo' });
  }

  // Generar código único para la cita
  const codigoCita = uuidv4();

  // Crear objeto de la cita
  const nuevaCita = {
    codigo: codigoCita,
    cc,
    fecha,
    autorizacion: file.path
  };

  // Guardar la cita en memoria
  citas.push(nuevaCita);

  // Retornar el código de la cita
  res.json({ codigo: codigoCita });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
