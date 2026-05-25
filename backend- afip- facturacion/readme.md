# 🔐 Backend AFIP Facturación - Documentación Completa

## 📋 Descripción del Proyecto

**backend-afip-facturacion** es un servicio especializado en **facturación electrónica argentina** a través de AFIP (Administración Federal de Ingresos Públicos).

### 🎯 Responsabilidades Principales
- ✔️ Gestión de certificados digitales
- ✔️ Obtención y renovación de tokens AFIP
- ✔️ Generación de facturas electrónicas
- ✔️ Anulación de comprobantes
- ✔️ Consultas al padrón (CUIT)
- ✔️ Generación de PDF con código QR
- ✔️ Autorización de comprobantes (CAE)

### 🤝 Relación con Otros Proyectos
- **Consumidor**: ← backend-gestor de inventario (cuando necesita facturación)
- **Consumidor**: ← front-facstock (indirectamente, vía backend inventario)
- **Proveedor EXTERNO**: → AFIP (SOAP services)
- **Base de datos**: MongoDB (compartida)

---

## 🛠️ Stack Tecnológico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 16+ | Runtime |
| **Express** | 5.2.1 | Web framework |
| **MongoDB** | - | Database |
| **Mongoose** | 9.2.1 | ODM |
| **soap** | 1.7.1 | SOAP client para AFIP |
| **node-forge** | 1.3.3 | Cryptografía (firma digital) |
| **xml2js** | 0.6.2 | Parser XML |
| **xmlbuilder** | 15.1.1 | Builder XML |
| **pdfmake** | 0.3.5 | Generación PDF |
| **pdfkit** | 0.17.2 | Manipulación PDF |
| **qrcode** | 1.5.4 | Generación QR |
| **decimal.js** | 10.6.0 | Aritmética decimal (importante para montos) |
| **axios** | 1.13.5 | HTTP client |
| **cors** | 2.8.6 | CORS middleware |
| **dotenv** | 17.3.1 | Configuración ambiente |

---

## 📁 Estructura de Carpetas

```
backend-afip-facturacion/
├── app.js                    # Entry point de Express
├── package.json              # Dependencias
├── README.md                 # Este archivo
├── .env                      # Variables de ambiente (no commitar)
│
├── doc/                      # 📚 Documentación
│   ├── API.md                # Referencia de endpoints
│   ├── TECH.md               # Detalles técnicos
│   ├── conectividad-afip.md  # Guía AFIP
│   └── images/               # Diagramas
│
├── src/
│   ├── controllers/          # Lógica de request/response
│   │   ├── afip/             # Endpoints de AFIP
│   │   │   ├── certificado.controller.js
│   │   │   ├── token.controller.js
│   │   │   ├── parametros.controller.js
│   │   │   └── padron.controller.js
│   │   ├── facturas/         # Endpoints de facturas
│   │   │   ├── crear.controller.js
│   │   │   ├── anular.controller.js
│   │   │   └── consultar.controller.js
│   │   └── usuarios/         # Endpoints de usuarios
│   │
│   ├── models/               # Esquemas MongoDB + Mongoose
│   │   ├── afipCert.model.js          # Certificados AFIP
│   │   ├── afipToken.model.js         # Tokens AFIP
│   │   ├── dataUser.model.js          # Datos usuario/empresa
│   │   ├── factura.model.js           # Facturas
│   │   └── ultmComprobante.model.js   # Numeración
│   │
│   ├── services/             # Lógica de negocio
│   │   ├── wsaa.service-mongo.js       # Obtención de tokens
│   │   ├── QRService.js                # Generación QR
│   │   ├── generarPdf.js               # Generación PDF
│   │   │
│   │   ├── afip-general/               # Servicios AFIP
│   │   │   ├── afip.service.js
│   │   │   ├── padron.service-mongo.js
│   │   │   └── utils.js
│   │   │
│   │   ├── certificados/               # Gestión certs
│   │   │   └── certificados.service.js
│   │   │
│   │   ├── facturas/                   # Servicios de facturas
│   │   │   ├── facturacion.service.js
│   │   │   ├── anulacion.service.js
│   │   │   ├── facturaPdfPreparer.service.js
│   │   │   ├── facturaValidator.service.js
│   │   │   └── estructura_pdf.js
│   │   │
│   │   └── user-data/                  # Datos de usuario
│   │       └── dataUser.service.js
│   │
│   ├── routes/               # Definición de rutas
│   │   ├── afip.routes.js
│   │   ├── facturas.routes.js
│   │   ├── usuario.routes.js
│   │   └── index.js          # Aggregación de rutas
│   │
│   ├── middlewares/          # Middleware Express
│   │   └── tokenRenovation.middleware.js
│   │
│   ├── utils/                # Utilidades varias
│   │   ├── afip-mapper.js    # Mapeo de datos a formatos AFIP
│   │   ├── date.utils.js     # Utilidades de fecha
│   │   └── openssl.utils.crypto.js  # Operaciones crypto
│   │
│   ├── jobs-cron/            # Jobs programados
│   │   ├── simpleTokenRenewal.job.js  # Renovar tokens periódicamente
│   │   └── testRenewal.job.js
│   │
│   └── repositories/         # Data access layer
│       ├── afip/
│       └── ...
│
└── storage/                  # 💾 Almacenamiento
    └── users/                # Carpetas por usuario para PDFs, keys, etc
        ├── 689a697d9061e531213a7842/
        │   ├── certificado.pem
        │   ├── clave-privada.pem
        │   └── pdfs/
        │       └── factura_123.pdf
        └── ...
```

---

## 🚀 Instalación y Setup

### Prerequisitos
- **Node.js**: 16 o superior
- **MongoDB**: Local o remota (Atlas)
- **Acceso a AFIP**: Certificado Digital (archivo .p12 o .pfx)

### Pasos de Instalación

```bash
# 1. Clonar/descargar proyecto
cd backend-afip-facturacion

# 2. Instalar dependencias
npm install

# 3. Configurar variables de ambiente
cp .env.example .env
# Editar .env con valores correspondientes

# 4. Levantar servidor
npm start
# Servidor escuchando en http://localhost:3001
```

### Archivo `.env` Necesario

```bash
# Conexión MongoDB
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/facstock

# Puerto del servidor
PUERTO=3001

# Ambiente AFIP (homo=testing, prod=producción)
AFIP_ENVIRONMENT=homo

# JWT para autenticación interna
JWT_SECRET=tu_secret_key_muy_seguro

# URLs de servicios AFIP (usualmente autodetectadas)
AFIP_WSAA_URL=https://wsaa.afip.gov.ar/ws/services/LoginCms
AFIP_WSFEV1_URL=https://wswhomo.afip.gov.ar/ws/services/wsfev1
```

---

## 📚 Modelos de Datos

### 1. **afipCert.model.js** - Certificado Digital

```javascript
{
  _id: ObjectId,
  empresa: ObjectId,           // Ref a empresa
  privateKey: String,          // Clave privada (encriptada)
  csr: String,                 // Certificate Signing Request
  certificate: String,         // Cert firmado por AFIP
  thumbprint: String,          // Identif. del certificado
  expiryDate: Date,           // Vencimiento del cert
  activo: Boolean,             // Es el certificado activo
  environment: String,         // "homo" o "prod"
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **afipToken.model.js** - Token de Acceso AFIP

```javascript
{
  _id: ObjectId,
  empresa: ObjectId,           // Ref a empresa
  servicio: String,            // "wsfe", "ws_sr_padron_a5", etc
  token: String,               // Token TA
  sign: String,                // Signature
  expiryTime: Date,           // Expiración
  createdAt: Date,
  updatedAt: Date,
  
  // Virtuals (no se guardan, se calculan)
  get isExpired() {
    return Date.now() > this.expiryTime
  },
  get minutesRemaining() {
    return Math.floor((this.expiryTime - Date.now()) / 1000 / 60)
  }
}
```

### 3. **dataUser.model.js** - Datos de Empresa

```javascript
{
  _id: ObjectId,
  cuitEmpresa: String,         // CUIT único
  razonSocial: String,
  domicilio: String,
  tipoResponsable: String,     // "Responsable Inscripto", etc
  
  // AFIP Configuration
  puntoVenta: Number,          // Punto de venta principal
  ambiente: String,            // "homo" o "prod"
  
  // Estadísticas
  totalTokens: Number,
  totalComprobantes: Number,
  totalFacturado: Decimal,
  
  // Metadata
  activo: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **factura.model.js** - Factura Electrónica

```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  
  // Número AFIP
  numero: Number,              // Número de factura único
  
  // Estado AFIP
  estado: String,              // PENDIENTE, APROBADA, RECHAZADA, ANULADA
  cae: String,                 // Código de Autorización AFIP
  fechaProcessamiento: Date,   // Cuándo AFIP procesó
  fechaVencimiento: Date,      // Vencimiento del CAE
  
  // Detalles de emisión
  tipo: String,                // "factura", "nota de credito", etc
  fechaEmision: Date,
  puntoVenta: Number,
  
  // Datos del cliente
  cliente: {
    nombre: String,
    tipoDoc: String,           // "CUIT", "DNI", etc.
    nroDoc: String,
    domicilio: String,
    codigoPostal: String
  },
  
  // Líneas de detalle
  lineas: [{
    codigoProducto: String,
    descripcion: String,
    cantidad: Decimal,
    precio: Decimal,           // Unitario
    iva: Decimal,              // Porcentaje (21, 10.5, etc)
    totalIva: Decimal,
    total: Decimal
  }],
  
  // Totales
  totales: {
    noGravado: Decimal,        // Exento de IVA
    servicios: Decimal,        // Monto gravado
    ivaTotal: Decimal,         // Total IVA
    total: Decimal,            // Total final
    importeOtrosTributos: Decimal
  },
  
  // Archivos generados
  pdfPath: String,             // /storage/users/..../factura_123.pdf
  qrCode: String,              // URL del QR
  
  // Respuesta de AFIP
  respuestaAFIP: {
    resultadoOperacion: String,
    codigoAutoriz: String,
    mensajes: [String]
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🌐 Integración con AFIP (SOAP)

### Servicios AFIP Utilizados

1. **WSAA** - Web Service de Autenticación y Autorización
   - Genera TA (Ticket de Acceso)
   - Autenticación con certificado digital
   - URL homo: `https://wsaa.afip.gov.ar/ws/services/LoginCms`

2. **WSFe v1** - Web Service de Facturación Electrónica
   - Autorización de comprobantes
   - Obtención de ultimo comprobante
   - URL homo: `https://wswhomo.afip.gov.ar/ws/services/wsfev1`

3. **WS Padrón** - Padrón de CUIT
   - Consulta de datos de contribuyentes
   - Validación de CUITs

### Flujo de Firma Digital

```
1. Preparar datos XML
2. Generar Request Signature
3. Encriptar con Private Key (RSA)
4. Enviar a AFIP con certificado
5. AFIP valida firma
6. AFIP retorna autorización
```

---

## 📖 Documentación Adicional

- [API.md](doc/API.md) - Referencia completa de endpoints (si existe)
- [TECH.md](doc/TECH.md) - Arquitectura técnica y diagramas
- [conectividad-afip.md](doc/conectividad-afip.md) - Guía de conectividad con AFIP
- [../ARQUITECTURA-GENERAL.md](../ARQUITECTURA-GENERAL.md) - Cómo este proyecto se integra con los otros 2

---

## 🔗 Links Útiles

- [AFIP - Administración Federal de Ingresos Públicos](https://www.afip.gob.ar)
- [Documentación AFIP Web Services](https://servicios1.afip.gob.ar/documento/documentos.html)
- [Padrón de deudores AFIP](https://servicios1.afip.gob.ar/citsv/)

---

**Última actualización**: Mayo 2026
**Responsabilidad**: Facturación Electrónica - AFIP Integration