const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configurar Multer para manejar archivos
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
    cb(null, `${uuidv4()}${ext}`); // Generar codigo unico
  }
});

const upload = multer({ storage });

let appointments = []; // Almacenar citas en memoria

// Crear cita medica
app.post('/appointments', upload.single('authorization'), (req, res) => {
  const { cc, date } = req.body;
  const file = req.file;

  if (!cc || !date || !file) {
    return res.status(400).json({ message: 'Faltan datos o archivo' });
  }

  const appointmentCode = uuidv4();

  const newAppointment = {
    code: appointmentCode,
    cc,
    date,
    authorization: file.path
  };

  appointments.push(newAppointment);

  res.json({ code: appointmentCode });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
