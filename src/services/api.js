import axios from 'axios';

const API_BASE_URL = '/api';

// 🔐 Credenciales (ajusta según tus credenciales)
const USERNAME = 'admin';
const PASSWORD = 'admin';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  auth: {
    username: USERNAME,
    password: PASSWORD
  },
  withCredentials: true
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

// ========== CLIENTES ==========
export const clientesAPI = {
  getAll: () => api.get('/clientes'),
  getById: (id) => api.get(`/clientes/${id}`),
  create: (cliente) => {
    const clienteDTO = {
      ...cliente,
      sucursales: cliente.sucursales ? cliente.sucursales.map(sucursal => {
        const sucursalObj = typeof sucursal === 'string' ? { nombre: sucursal } : sucursal;
        return {
          id: sucursalObj.id || null,
          nombre: sucursalObj.nombre
        };
      }) : []
    };
    console.log('📤 Enviando cliente:', clienteDTO);
    return api.post('/clientes', clienteDTO);
  },
  update: (id, cliente) => {
    const clienteDTO = {
      ...cliente,
      sucursales: cliente.sucursales ? cliente.sucursales.map(sucursal => {
        const sucursalObj = typeof sucursal === 'string' ? { nombre: sucursal } : sucursal;
        
        // ✅ Solo incluir ID si existe y es válido
        const sucursalDTO = { nombre: sucursalObj.nombre };
        if (sucursalObj.id) {
          sucursalDTO.id = sucursalObj.id;
        }
        return sucursalDTO;
      }) : []
    };
    console.log('📤 Actualizando cliente:', clienteDTO);
    return api.put(`/clientes/${id}`, clienteDTO);
  },
  delete: (id) => api.delete(`/clientes/${id}`),
};

// ========== ARTÍCULOS ==========
export const articulosAPI = {
  getAll: () => api.get('/articulos'),
  getById: (id) => api.get(`/articulos/${id}`),
  create: (articulo) => api.post('/articulos', articulo),
  update: (id, articulo) => api.put(`/articulos/${id}`, articulo),
  delete: (id) => api.delete(`/articulos/${id}`),
};

// ========== PEDIDOS (CORREGIDO) ==========
export const pedidosAPI = {
  getAll: () => api.get('/pedidos'),
  getById: (id) => api.get(`/pedidos/${id}`), // ✅ Paréntesis + template literal
  
  create: (pedido) => {
    // 🔍 VALIDACIÓN Y CONVERSIÓN EXPLÍCITA
    const clienteId = parseInt(pedido.clienteId);
    const sucursalId = pedido.sucursalId ? parseInt(pedido.sucursalId) : null;
    
    if (!clienteId || isNaN(clienteId)) {
      throw new Error('Debe seleccionar un cliente válido');
    }
    
    const items = pedido.items.map(item => {
      const articuloId = parseInt(item.articuloId);
      const cantidad = parseInt(item.cantidad);
      const precioUnitario = parseFloat(item.precioUnitario);
      
      if (!articuloId || isNaN(articuloId)) {
        throw new Error('Todos los artículos deben tener un ID válido');
      }
      
      if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      
      if (!precioUnitario || isNaN(precioUnitario) || precioUnitario <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }
      
      return {
        articuloId,
        cantidad,
        precioUnitario
      };
    });
    
    const pedidoDTO = {
      clienteId,
      sucursalId,
      estado: pedido.estado || 'Pendiente',
      fechaPedido: pedido.fechaPedido,
      items
    };
    
    console.log('📤 Enviando pedido al backend:', pedidoDTO);
    return api.post('/pedidos', pedidoDTO);
  },
  
  update: (id, pedido) => {
    const clienteId = parseInt(pedido.clienteId);
    const sucursalId = pedido.sucursalId ? parseInt(pedido.sucursalId) : null;
    
    if (!clienteId || isNaN(clienteId)) {
      throw new Error('Debe seleccionar un cliente válido');
    }
    
    const items = pedido.items.map(item => {
      const articuloId = parseInt(item.articuloId);
      const cantidad = parseInt(item.cantidad);
      const precioUnitario = parseFloat(item.precioUnitario);
      
      if (!articuloId || isNaN(articuloId)) {
        throw new Error('Todos los artículos deben tener un ID válido');
      }
      
      if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      
      if (!precioUnitario || isNaN(precioUnitario) || precioUnitario <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }
      
      return {
        articuloId,
        cantidad,
        precioUnitario
      };
    });
    
    const pedidoDTO = {
      clienteId,
      sucursalId,
      estado: pedido.estado,
      fechaPedido: pedido.fechaPedido,
      items
    };
    
    console.log('📤 Actualizando pedido:', pedidoDTO);
    return api.put(`/pedidos/${id}`, pedidoDTO);
  },
  
  delete: (id) => api.delete(`/pedidos/${id}`), // ✅ Corregido
};

export default api;