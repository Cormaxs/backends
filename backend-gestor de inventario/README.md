
# 📦 Backend - Gestor de Inventario

## 📋 Descripción del Proyecto

**backend-gestor de inventario** es la **API central del ERP** de FacStock. Actúa como gestor de la lógica de negocio y orquesta entre el frontend, la facturación electrónica (AFIP) y la base de datos.

### 🎯 Responsabilidades Principales
- ✔️ Gestión de usuarios y autenticación
- ✔️ Gestión de empresas y punto de venta
- ✔️ Catálogo de productos con stock e inventario
- ✔️ Categorías y marcas
- ✔️ Gestión de caja y movimientos
- ✔️ Vendedores y clientes
- ✔️ Facturación interna (sin AFIP)
- ✔️ Orquestación con Backend AFIP para facturación electrónica
- ✔️ Importación masiva de productos (Excel/CSV)

### 🤝 Relación con Otros Proyectos
- **Consumidor**: ← front-facstock (todas las peticiones del frontend)
- **Consumidor de**: → backend-afip-facturacion (cuando se necesita facturación electrónica)
- **Proveedor de datos**: → backend-afip-facturacion (datos de empresa, tokens)
- **Base de datos**: MongoDB (compartida)

---

## 🛠️ Stack Tecnológico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 16+ | Runtime |
| **Express** | 5.x | Web framework |
| **MongoDB** | - | Database |
| **Mongoose** | 8.15.1 | ODM |
| **bcrypt** | 6.0.0 | Hash de contraseñas |
| **jsonwebtoken** | 9.0.2 | JWT authentication |
| **express-validator** | 7.2.1 | Validación de input |
| **multer** | 2.0.1 | File uploads |
| **xlsx** | 0.18.5 | Excel parsing |
| **csv-parser** | 3.2.0 | CSV parsing |
| **axios** | 1.13.6 | HTTP client |
| **cors** | 2.8.5 | CORS middleware |
| **dotenv** | - | Configuración ambiente |

---

## 📁 Estructura de Carpetas

```
backend-gestor de inventario/
├── app.js                    # Entry point
├── package.json
├── .env                      # Variables de ambiente
│
├── Documentacion/            # 📚 Documentación existente
│   ├── auth.md
│   ├── facturas.md
│   ├── productos.md
│   └── db/
│
├── controllers/              # Lógica de request/response
│   ├── auth/
│   ├── backend-afip/
│   ├── company/
│   ├── facturas/
│   ├── menu/
│   ├── point-sales/
│   ├── productos/
│   ├── registro-cajas/
│   ├── archivos/
│   └── vendedor/
│
├── models/                   # Esquemas MongoDB
│   ├── core/
│   │   ├── datos-empresa.js
│   │   ├── propietario.js
│   │   └── puntos-de-ventas.js
│   ├── inventory/
│   │   ├── product.js
│   │   ├── Marca.js
│   │   ├── Categoria.js
│   │   └── MovimientoInventario.js
│   ├── sales/
│   │   ├── client.js
│   │   ├── vendedor.js
│   │   └── tikets-emitidos.js
│   └── accounting/
│       └── RegistroDeCaja.js
│
├── repositories/             # Data access layer
│   ├── repo_auth.js
│   ├── repo_product.js
│   ├── repo_company.js
│   ├── repo_facturas.js
│   ├── repo_point_sales.js
│   ├── repo_cajas.js
│   ├── repo_vendedor.js
│   ├── repo_tikets.js
│   └── repo_up_masiva_db.js
│
├── services/                 # Lógica de negocio
│   ├── auth_services.js
│   ├── product_services.js
│   ├── company_services.js
│   ├── point_sales_services.js
│   ├── vendedor_services.js
│   ├── backend-afip/
│   ├── cajas/
│   ├── facturas-sin-afip/
│   └── up-masivo-db/
│
├── routes/                   # Definición de rutas
│   ├── api/
│   └── ...
│
├── middlewares/
│   ├── auth.js
│   ├── auth_middlewares.js
│   └── error_handler.js
│
├── utils/
│   ├── bcrypt.js
│   └── ...
│
└── raiz-users/               # Almacenamiento por usuario
    ├── 689a697d9061e531213a784a/
    └── ...

└── db/
    └── connect.js            # Conexión MongoDB
```

---

## 🚀 Instalación y Setup

### Prerequisitos
- **Node.js**: 16 o superior
- **MongoDB**: Local o remota (Atlas)
- **(Opcional)** Backend AFIP corriendo en puerto 3001

### Pasos de Instalación

```bash
# 1. Descargar proyecto
cd backend-gestor\ de\ inventario

# 2. Instalar dependencias
npm install

# 3. Configurar variables de ambiente
cp .env.example .env
# Editar .env con valores

# 4. Levantar servidor
npm start
# Servidor en http://localhost:3010
```

### Archivo `.env` Necesario

```bash
# Conexión MongoDB
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/facstock

# Puerto del servidor
PUERTO=3010

# Backend AFIP (opcional, solo si usas facturación electrónica)
BACKEND_AFIP_URL=http://localhost:3001

# JWT
JWT_SECRET=tu_secret_key_muy_seguro
JWT_EXPIRY=7d

# Ambiente
NODE_ENV=development|production

# Base URL frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 🏛️ Arquitectura MVC con Lógica en Capas

Este proyecto sigue el **patrón MVC + Servicios + Repositories**:

```
Route (Express)
    ↓ (request)
Middleware (validación, autenticación, error handling)
    ↓
Controller (extrae parámetros, valida input)
    ↓
Service (lógica de negocio)
    ↓
Repository (acceso a datos)
    ↓
MongoDB (persistencia)
```

### Flujo de Datos Típico

```
1. Usuario hace request → Frontend (Axios)
2. Llega a Route → /api/v1/products/add
3. Pasa por Middleware → autenticación, validación
4. Controller → extrae datos (req.body)
5. Service → lógica: validar, calcular, preparar datos
6. Repository → INSERT en collection `productos`
7. Response → producto creado con _id
```

---

## 📚 Modelos de Datos Principales

### Core Models

#### Usuario/Propietario
```javascript
{
  _id: ObjectId,
  email: String,
  password: Hash,
  rol: String,  // admin_principal, gestor_contable, empleado_administrativo, vendedor_activo, solo_visualizacion
  empresa: ObjectId,  // Ref a empresa
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### Empresa
```javascript
{
  _id: ObjectId,
  razonSocial: String,
  cuit: String,
  domicilio: String,
  tipoResponsable: String,
  puntosVenta: [ObjectId],
  usuarios: [ObjectId],
  estadoAFIP: String,  // "sin_certificado", "configurado", "error"
  createdAt: Date
}
```

#### Punto de Venta
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  nombre: String,
  numero: Number,  // Número AFIP (1, 2, 3...)
  ubicacion: String,
  activo: Boolean,
  createdAt: Date
}
```

### Inventory Models

#### Producto
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  puntoVenta: ObjectId,
  codigoInterno: String,
  codigoBarras: String,
  nombre: String,
  descripcion: String,
  precio: Decimal,
  precioCompra: Decimal,
  iva: Number,  // 21, 10.5, 5, 2.5, 0
  stock: Number,
  stockMinimo: Number,
  categoria: ObjectId,
  marca: ObjectId,
  peso: Decimal,
  dimensiones: {
    largo: Number,
    ancho: Number,
    alto: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Categoría
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  nombre: String,
  descripcion: String,
  productos: [ObjectId],
  activa: Boolean,
  createdAt: Date
}
```

#### Marca/Fabricante
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  nombre: String,
  descripcion: String,
  activa: Boolean,
  createdAt: Date
}
```

#### Movimiento de Inventario
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  producto: ObjectId,
  tipo: String,  // "entrada", "salida", "ajuste", "devolucion"
  cantidad: Number,
  motivo: String,
  documento: String,  // Número de compra, transfer, etc
  createdAt: Date
}
```

### Sales Models

#### Cliente
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  nombre: String,
  tipoDoc: String,  // CUIT, DNI, etc
  nroDoc: String,
  email: String,
  telefono: String,
  domicilio: String,
  codigoPostal: String,
  createdAt: Date
}
```

#### Vendedor
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  nombre: String,
  email: String,
  comision: Number,  // Porcentaje
  activo: Boolean,
  createdAt: Date
}
```

#### Ticket Interno (Factura sin AFIP)
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  puntoVenta: ObjectId,
  numero: Number,
  cliente: {
    nombre: String,
    documento: String
  },
  lineas: [{
    producto: String,
    cantidad: Number,
    precio: Decimal,
    total: Decimal
  }],
  total: Decimal,
  estado: String,  // ABIERTO, CERRADO, CANCELADO
  pdfPath: String,
  createdAt: Date
}
```

### Accounting Models

#### Caja (Registro de Caja)
```javascript
{
  _id: ObjectId,
  empresa: ObjectId,
  puntoVenta: ObjectId,
  empleado: ObjectId,
  montoApertura: Decimal,
  montoEsperado: Decimal,
  montoCierre: Decimal,
  diferencia: Decimal,
  estado: String,  // ABIERTA, CERRADA
  transacciones: [{
    tipo: String,  // INGRESO, EGRESO
    monto: Decimal,
    motivo: String,
    createdAt: Date
  }],
  horaApertura: Date,
  horaCierre: Date,
  observaciones: String,
  createdAt: Date
}
```

---

## 🌐 API - Rutas Principales

> **Base URL**: `http://localhost:3010/api/v1`

### Autenticación

```
POST   /auth/register                - Registrar usuario
POST   /auth/login                   - Login
GET    /auth/get                     - Obtener usuario actual
POST   /auth/update/:idUser          - Actualizar usuario
DELETE /auth/delete/:id              - Eliminar usuario
```

### Productos

```
GET    /products/buscar              - Buscar productos
GET    /products/:id                 - Obtener producto
POST   /products/add                 - Crear producto
POST   /products/update/:id          - Actualizar producto
DELETE /products/delete/:id          - Eliminar producto
DELETE /products/delete/all/:idEmpresa - Eliminar todos

GET    /products/:id/:idEmpresa/:puntoVenta    - Get by barcode
GET    /products/agotados/:idEmpresa/:puntoVenta - Out of stock
GET    /products/totalInventario/:idEmpresa    - Inventory totals

GET    /products/get/all/category/:idEmpresa   - Listar categorías
GET    /products/get/all/marca/:idEmpresa      - Listar marcas
POST   /products/categorias/                   - CRUD categorías
POST   /products/marcas/                       - CRUD marcas
```

### Empresas

```
POST   /companies/create             - Crear empresa
GET    /companies/get/all            - Listar empresas
GET    /companies/get/:id            - Obtener empresa
POST   /companies/update/:idEmpresa  - Actualizar empresa
DELETE /companies/delete/:id         - Eliminar empresa
```

### Puntos de Venta

```
POST   /point-sales/create           - Crear POS
GET    /point-sales/:id              - Obtener POS
```

### Cajas

```
POST   /cajas/abrirCaja              - Abrir caja
POST   /cajas/:idCaja/transaccion    - Registrar transacción
POST   /cajas/cerrarcaja/:idCaja     - Cerrar caja
GET    /cajas/:idCaja                - Obtener caja
GET    /cajas/empresa/:idEmpresa     - Cajas de empresa
```

### Vendedores

```
POST   /vendors/register             - Registrar vendedor
POST   /vendors/login                - Login vendedor
POST   /vendors/update/:id           - Actualizar vendedor
DELETE /vendors/delete/:id           - Eliminar vendedor
```

### Tickets/Facturas Internas

```
POST   /tickets/create/:idUser       - Crear ticket
GET    /tickets/get/all/:idEmpresa   - Listar tickets
```

### Importación Masiva

```
POST   /archivos/products-masivo/:empresaId/:puntoVentaId
       - Importar productos desde Excel/CSV
```

### AFIP (Delegado al backend-afip-facturacion)

```
POST   /afip/certificado/generar     - Generar certificado
POST   /afip/certificado/guardar     - Guardar certificado
POST   /afip/ticket/acceso           - Obtener token
POST   /facturas/crear               - Crear factura electrónica
POST   /facturas/anular              - Anular factura
GET    /facturas/buscar              - Buscar facturas
```

---

## 🔄 Workflows Típicos

### Workflow 1: Crear Producto

```
1. Usuario llena formulario en Frontend
2. Frontend → POST /api/v1/products/add
   { codigoBarras, nombre, precio, categoria, iva, stock }
3. Controller → valida y extrae datos
4. Service → calcula precioVenta según IVA
5. Repository → INSERT en products collection
6. Response → Producto creado con _id
```

### Workflow 2: Crear y Cerrar Caja

```
1. Empleado abre Caja
   POST /api/v1/cajas/abrirCaja
   { puntoVenta, montoApertura }

2. Durante el día hace transacciones
   POST /api/v1/cajas/:idCaja/transaccion
   { tipo: "INGRESO|EGRESO", monto, motivo }

3. Al cierre del día
   POST /api/v1/cajas/cerrarcaja/:idCaja
   { montoCierre, observaciones }

4. Sistema calcula diferencias y guarda registro
```

### Workflow 3: Importar Productos en Masa

```
1. Usuario sube archivo Excel
   POST /api/v1/archivos/products-masivo/:empresaId/:puntoVentaId
   (multipart/form-data con archivo)

2. Service parsea archivo (usa xlsx/csv-parser)
3. Valida esquema de columnas
4. Convierte filas a objetos Producto
5. Bulk insert en MongoDB
6. Response → {insertados: 150, errores: 2, detalles: [...]}
```

---

## 🔗 Integración con Backend AFIP

Cuando se necesita crear una **factura electrónica**:

```
1. Frontend solicita factura electrónica
   POST /api/v1/facturas/crear
   { empresaId, cliente, lineas, etc }

2. Backend Inventario recibe
   - Valida datos localmente
   - Busca tokens AFIP en BD de backend AFIP
   - Si token vencido, solicita renovación

3. Backend Inventario llama Backend AFIP
   POST http://localhost:3001/facturas/crear
   { datos de factura }

4. Backend AFIP:
   - Firma digitalmente
   - Envía a AFIP (SOAP)
   - Recibe CAE
   - Genera PDF + QR
   - Guarda en BD

5. Backend Inventario recibe respuesta
   { cae, numero, pdfUrl, qrCode }

6. Frontend obtiene factura lista
```

---

## 🔐 Autenticación y Autorización

### Flujo de Login

```
1. Usuario ingresa email + password
2. POST /auth/login
3. Service busca usuario en BD
4. Service valida password (bcrypt)
5. Service genera JWT
6. Response → { token, user: { _id, email, rol, ... } }
7. Frontend guarda token en localStorage
8. Próximos requests incluyen: Authorization: Bearer <token>
```

### Roles y Permisos

- **admin_principal**: Control total
- **gestor_contable**: Reportes y contabilidad
- **empleado_administrativo**: Datos y configuración
- **vendedor_activo**: Solo crear ventas
- **solo_visualizacion**: Solo lectura

---

## 📦 Importación de Productos

### Formato de Archivo Esperado

```
codigoInterno | codigoBarras | nombre | precio | iva | stock | categoria
ABC001        | 7798123456  | Producto A | 100  | 21  | 50    | Electrónica
ABC002        | 7798123457  | Producto B | 200  | 10.5 | 30  | Hogar
```

---

## 📖 Documentación Adicional

- [Autenticación](./Documentacion/auth.md)
- [Facturación](./Documentacion/facturas.md)
- [Productos](./Documentacion/productos.md)
- [Estructura DB](./Documentacion/db/estructura-DB.md)
- [../ARQUITECTURA-GENERAL.md](../ARQUITECTURA-GENERAL.md) - Cómo se integra con los otros 2 proyectos

---

## 🚀 Scripts Disponibles

```bash
npm start       # Inicia servidor en puerto 3010
npm run dev     # Con nodemon (desarrollo)
npm install     # Instalar dependencias
```

---

## ✨ Características Implementadas

- [x] Autenticación con JWT
- [x] Roles y permisos
- [x] Gestión de empresas/POS
- [x] CRUD de productos
- [x] Stock e inventario
- [x] Categorías y marcas
- [x] Caja y movimientos
- [x] Vendedores
- [x] Tickets internos (sin AFIP)
- [x] Importación masiva Excel/CSV
- [x] Integración con Backend AFIP
- [ ] Reportes avanzados
- [ ] Dashboard con métricas
- [ ] Notificaciones en tiempo real

---

## 🐛 Troubleshooting

### Error: "Conexión a AFIP rechazada"
- Verificar que backend-afip-facturacion está ejecutándose en puerto 3001
- Revisar BACKEND_AFIP_URL en .env

### Error: "Token inválido"
- Token JWT ha expirado, usuario debe login nuevamente
- Verificar JWT_SECRET en .env

### Error: "Producto no encontrado"
- Verificar que el _id sea válido (ObjectId)
- Confirmar que el producto existe en la empresa correcta

---

**Última actualización**: Mayo 2026
**Responsabilidad**: Gestor de Inventario y Orquestación Central
npm install --save-dev nodemon
```

Correr el programa

```bash
npm run dev 
```  

### Rutas postman -> [Aquí](https://www.postman.com/security-engineer-64827471/backend-facstock/collection/6fh3wkj/afip)  
