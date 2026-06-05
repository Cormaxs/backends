const PLANES = {
    free: {
        nombre: 'Free',
        productosLimite: 50,
        usuariosLimite: 1,
        facturasMenu: 20,         // AFIP
        ticketsLimite: 100,      // Internos
        notasPedidoLimite: 50,   // Pedidos
        puntosVentaLimite: 1,
        cajasLimite: 1,
        exportXlsx: false,
        soportePrioritario: false,
        precio: 0,
        periodo: null
    },
    basico: {
        nombre: 'Básico',
        productosLimite: 500,
        usuariosLimite: 3,
        facturasMenu: 100,        // AFIP
        ticketsLimite: 1000,      // Internos
        notasPedidoLimite: 500,   // Pedidos
        puntosVentaLimite: 3,
        cajasLimite: 5,
        exportXlsx: true,
        soportePrioritario: false,
        precio: 4990,
        periodo: 'mes'
    },
    profesional: {
        nombre: 'Profesional',
        productosLimite: 5000,
        usuariosLimite: 10,
        facturasMenu: 1000,       // AFIP
        ticketsLimite: 5000,      // Internos
        notasPedidoLimite: 2000,  // Pedidos
        puntosVentaLimite: 10,
        cajasLimite: 20,
        exportXlsx: true,
        soportePrioritario: true,
        precio: 14990,
        periodo: 'mes'
    },
    premium: {
        nombre: 'Premium',
        productosLimite: 999999,
        usuariosLimite: 999999,
        facturasMenu: 999999,
        ticketsLimite: 999999,
        notasPedidoLimite: 999999,
        puntosVentaLimite: 999999,
        cajasLimite: 999999,
        exportXlsx: true,
        soportePrioritario: true,
        precio: 49990,
        periodo: 'mes'
    }
};

export default PLANES;
