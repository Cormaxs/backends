// models/index.js
import Empresa from './core/datos-empresa.js';
import User from './core/propietario.js';
import PuntoDeVenta from './core/puntos-de-ventas.js';
import Plan from './core/Plan.js';
import Sequence from './core/Sequence.js';

import Vendedor from './sales/vendedor.js';
import Proveedor from './sales/proveedor.js';

import Client from './sales/client.js';

import Product from './inventory/product.js';
import MovimientoInventario from './inventory/MovimientoInventario.js';

import Caja from './accounting/RegistroDeCaja.js';
import CuentaPorPagar from './accounting/CuentaPorPagar.js';
import PagoProveedor from './accounting/PagoProveedor.js';
import HistorialPago from './accounting/HistorialPago.js';
import Ticket from './sales/tikets-emitidos.js';
import NotaPedido from './sales/NotaPedido.js';
import Marca from './inventory/Marca.js';
import Categoria from './inventory/Categoria.js';
export {
    Empresa,
    User,
    PuntoDeVenta,
    Plan,
    Sequence,
    Vendedor,
    Proveedor,
    Client,
    Product,
    MovimientoInventario,
    Caja,
    CuentaPorPagar,
    PagoProveedor,
    HistorialPago,
    Ticket,
    NotaPedido,
    Marca,
    Categoria
};
