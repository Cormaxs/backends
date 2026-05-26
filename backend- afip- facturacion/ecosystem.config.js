module.exports = {
  apps: [
    {
      name: 'afip',
      script: './app.js', // cambiá esto por tu archivo principal
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb://admin-facstock:facstock-admin-password@45.7.229.18:27017/Facstock-produccion',
        PORT: 3000,
        // agregá acá TODAS las variables de tu .env
      }
    }
  ]
}