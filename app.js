const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const sharp = require('sharp');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
const PORT = 3000;

const appointments = [];

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
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

app.post('/appointments', upload.single('authorization'), (req, res) => {
  console.log("Agregar cita.")
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
    status: true,
    authorization: file.path
  };

  appointments.push(newAppointment);

  console.log("Cita agregada.")

  res.json({ code: appointmentCode });
});

app.get("/appointments", async (_req, res) => {
  console.log("Obtener citas.")
  const { start, end } = _req.query;

  if (!start || !end) {
    return res.status(400).json({ message: 'Falta rango de fechas' });
  }

  function filterAppointments(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return appointments.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  const filteredAppointments = filterAppointments(start, end);

  const processedAppointments = await Promise.all(filteredAppointments.map(async (appointment) => {
    try {

      const imagePath = path.resolve(appointment.authorization);

      if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size === 0) {
        console.error(`El archivo ${imagePath} no existe o está vacío.`);
        appointment.authorization = null;
        return appointment;
      }

      const resizedImageBuffer = await sharp(imagePath)
        .resize({ width: 200 }) 
        .jpeg({ quality: 40 }) 
        .toBuffer();

      const base64Image = resizedImageBuffer.toString('base64');
      appointment.authorization = base64Image;

      return appointment;
    } catch (error) {
      console.error(`Error al procesar la imagen para la cita con codigo ${appointment.code}`, error);
      appointment.authorization = null; 
      return appointment;
    }
  }));

  if(processedAppointments.length > 0) {
    console.log("Citas encontradas");
    res.json(processedAppointments);
  } else {
    console.log("Citas no encontradas");
    res.status(400).json({message: `No hay citas asignadas dentro de ${start} y ${end}.`});
  }
});

app.delete("/appointments", (req, res) => {
  const { code } = req.query;
  console.log(`Cancelar cita con codigo: ${code}`)
  if (!code) {
    return res.status(400).json({ message: 'Falta codigo de cita' });
  }

  const index = appointments.findIndex(item => item.code === code);

  if (index !== -1) {
    appointments[index].status = false;
    console.log("Cita cancelada.")
    return res.status(400).json({ message: `Cita con codigo "${code}" cancelada con exito` });
  } else {
    console.log("Cita no encontrada.")
    return res.status(400).json({ message: `Cita con codigo "${code}" no encontrada` });
  }
})


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

