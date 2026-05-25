import { Router } from "express";
import multer from "multer";
import path from "path";

import {migrarDb} from "../../../controllers/archivos/masivo.productos.js";

const archivos_routes = Router();


// Configuración de Multer para almacenar el archivo en memoria (sin guardarlo en disco)
const upload = multer({ 
    storage: multer.memoryStorage(), // Esta es la clave: almacenar en memoria
    fileFilter: (req, file, cb) => {
        // Validación para permitir solo archivos de Excel
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // ¡ESTA LÍNEA ES CRUCIAL PARA ACEPTAR CSV!
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan archivos Excel (.xlsx, .xls).'), false);
        }
    },
    // Opcional: Límite de tamaño del archivo (ej. 5MB)
    limits: { fileSize: 50 * 1024 * 1024 } 
});








//productos a base de datos

archivos_routes.post("/products-masivo/:empresaId/:puntoVentaId",upload.single("importar-db"), migrarDb)


export default archivos_routes; 
