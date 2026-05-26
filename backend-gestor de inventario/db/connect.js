import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI_PRODUCCION || process.env.MONGO_URI;

        if (!mongoUri) {
            console.error('Error: MONGO_URI_PRODUCCION no está definida en las variables de entorno.');
            process.exit(1); // Sale de la aplicación si no hay URI
        }

        await mongoose.connect(mongoUri);


        // Puedes añadir más configuraciones de conexión aquí si las necesitas
        // Por ejemplo, para manejar eventos de conexión/desconexión
        mongoose.connection.on('connected', () => {
            console.log('✅ Conectado a MongoDB (Producción) exitosamente');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose error de conexión:', err);
        });

        mongoose.connection.on('disconnected', () => {
        });

    } catch (error) {
        console.error(`Error al conectar a MongoDB: ${error.message}`);
        // Termina el proceso de la aplicación si la conexión inicial falla
        process.exit(1);
    }
};

export default connectDB;
