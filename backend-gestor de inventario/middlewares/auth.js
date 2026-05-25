import { body, validationResult } from 'express-validator';

// Middleware de validación para el registro de usuarios
export const validateRegistration = [
    // --- Validación para el campo 'username' ---
    body('username')
        .trim() // Elimina espacios en blanco al inicio y final
        .notEmpty().withMessage('El nombre de usuario es obligatorio.') // No debe estar vacío
        .isLength({ min: 3, max: 20 }).withMessage('El nombre de usuario debe tener entre 3 y 20 caracteres.') // Longitud específica
        .isAlphanumeric().withMessage('El nombre de usuario solo puede contener letras y números.') // Solo caracteres alfanuméricos
        .custom((value) => { // Validación personalizada: no puede ser solo números
            if (value.match(/^\d+$/)) {
                throw new Error('El nombre de usuario no puede ser solo números.');
            }
            return true;
        }),

    // --- Validación para el campo 'password' ---
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.') // No debe estar vacía
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.') // Longitud mínima
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula.') // Al menos una mayúscula
        .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula.') // Al menos una minúscula
        .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número.') // Al menos un número
        .matches(/[^A-Za-z0-9]/).withMessage('La contraseña debe contener al menos un carácter especial.'), // Al menos un carácter especial

    // --- Middleware para manejar los resultados de la validación ---
    (req, res, next) => {
        const errors = validationResult(req); // Obtiene los errores de validación
        if (!errors.isEmpty()) {
            // Si hay errores, envía una respuesta 400 (Bad Request) con los detalles
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // Si no hay errores, pasa al siguiente middleware o a la función del controlador
    }
];

// Middleware de validación para el inicio de sesión (generalmente menos estricto)
export const validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es obligatorio.'),

    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
