import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ShoppingCart, Eye } from 'lucide-react';
import { pedidosAPI, clientesAPI, articulosAPI } from '../services/api';

function PedidosTab() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    estado: 'Pendiente',
    fechaPedido: new Date().toISOString().split('T')[0],
    items: []
  });

  const estados = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pedidosRes, clientesRes, articulosRes] = await Promise.all([
        pedidosAPI.getAll(),
        clientesAPI.getAll(),
        articulosAPI.getAll()
      ]);
      
      setPedidos(pedidosRes.data);
      setClientes(clientesRes.data);
      setArticulos(articulosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (formData.items.length === 0) {
    alert('Debes agregar al menos un artículo al pedido');
    return;
  }

  // Validación adicional de items
  const itemsInvalidos = formData.items.some(item => 
    !item.articuloId || !item.cantidad || !item.precioUnitario
  );
  
  if (itemsInvalidos) {
    alert('Todos los artículos deben tener artículo, cantidad y precio válidos');
    return;
  }

  try {
    const pedidoData = {
      clienteId: parseInt(formData.clienteId),
      estado: formData.estado,
      fechaPedido: formData.fechaPedido,
      items: formData.items.map(item => ({
        articuloId: parseInt(item.articuloId),
        cantidad: parseInt(item.cantidad),
        precioUnitario: parseFloat(item.precioUnitario)
      }))
    };

    console.log('📤 Datos a enviar:', pedidoData);

    if (editingPedido) {
      await pedidosAPI.update(editingPedido.id, pedidoData);
      alert('Pedido actualizado exitosamente');
    } else {
      await pedidosAPI.create(pedidoData);
      alert('Pedido creado exitosamente');
    }
    
    closeModal();
    fetchData();
  } catch (error) {
    console.error('Error al guardar pedido:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el pedido';
    alert(errorMessage);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pedido?')) return;
    
    try {
      await pedidosAPI.delete(id);
      alert('Pedido eliminado exitosamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      alert('Error al eliminar el pedido');
    }
  };

  const openCreateModal = () => {
    setEditingPedido(null);
    setFormData({
      clienteId: '',
      estado: 'Pendiente',
      fechaPedido: new Date().toISOString().split('T')[0],
      items: []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPedido(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { articuloId: '', cantidad: 1, precioUnitario: '' }
      ]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'articuloId') {
            const articulo = articulos.find(a => a.id === parseInt(value));
            if (articulo) {
              updatedItem.precioUnitario = articulo.precio;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const viewDetails = (pedido) => {
    setSelectedPedido(pedido);
    setShowDetailModal(true);
  };

  const getClienteName = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombreCompleto || 'Desconocido';
  };

  const getArticuloName = (articuloId) => {
    const articulo = articulos.find(a => a.id === articuloId);
    return articulo?.nombre || 'Desconocido';
  };

  const calcularTotal = (items) => {
    return items?.reduce((sum, item) => {
      return sum + (item.cantidad * item.precioUnitario);
    }, 0) || 0;
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(precio);
  };

  const getEstadoClass = (estado) => {
    const estadoLower = estado?.toLowerCase().replace(/\s/g, '-') || 'pendiente';
    return `status-badge ${estadoLower}`;
  };

  if (loading) {
    return <div className="loading">Cargando pedidos...</div>;
  }

  return (
    <div>
      <div className="card-header">
        <h2 className="card-title">Gestión de Pedidos</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={20} />
          Nuevo Pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={64} />
          <p>No hay pedidos registrados</p>
          <button className="btn btn-primary mt-2" onClick={openCreateModal}>
            Crear primer pedido
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.id}</td>
                  <td>{getClienteName(pedido.cliente?.id)}</td>
                  <td>{new Date(pedido.fechaPedido).toLocaleDateString('es-CR')}</td>
                  <td>
                    <span className={getEstadoClass(pedido.estado)}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td>{formatPrecio(calcularTotal(pedido.items))}</td>
                  <td>
                    <div className="actions-container">
                      <button
                        className="icon-button"
                        onClick={() => viewDetails(pedido)}
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="icon-button edit"
                        onClick={() => handleEdit(pedido)}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => handleDelete(pedido.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingPedido ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select
                    name="clienteId"
                    className="form-select"
                    value={formData.clienteId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <select
                    name="estado"
                    className="form-select"
                    value={formData.estado}
                    onChange={handleInputChange}
                    required
                  >
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha del Pedido *</label>
                  <input
                    type="date"
                    name="fechaPedido"
                    className="form-input"
                    value={formData.fechaPedido}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Artículos del Pedido *</label>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={addItem}
                    >
                      <Plus size={16} />
                      Agregar Artículo
                    </button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1fr auto', 
                      gap: '0.5rem', 
                      marginBottom: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--color-bg-hover)',
                      borderRadius: 'var(--border-radius)'
                    }}>
                      <select
                        className="form-select"
                        value={item.articuloId}
                        onChange={(e) => updateItem(index, 'articuloId', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar artículo</option>
                        {articulos.map((articulo) => (
                          <option key={articulo.id} value={articulo.id}>
                            {articulo.nombre}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        className="form-input"
                        placeholder="Cantidad"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                        required
                      />

                      <input
                        type="number"
                        className="form-input"
                        placeholder="Precio"
                        step="0.01"
                        min="0"
                        value={item.precioUnitario}
                        onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}
                        required
                      />

                      <button
                        type="button"
                        className="icon-button delete"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <p style={{ color: 'var(--color-text-light)', textAlign: 'center', padding: '1rem' }}>
                      No hay artículos agregados. Haz clic en "Agregar Artículo" para comenzar.
                    </p>
                  )}
                </div>

                {formData.items.length > 0 && (
                  <div style={{ 
                    textAlign: 'right', 
                    padding: '1rem', 
                    backgroundColor: 'var(--color-primary-light)',
                    borderRadius: 'var(--border-radius)',
                    fontWeight: '600'
                  }}>
                    Total: {formatPrecio(calcularTotal(formData.items))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  {editingPedido ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {showDetailModal && selectedPedido && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Detalles del Pedido #{selectedPedido.id}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Información del Cliente
                </h3>
                <p><strong>Cliente:</strong> {getClienteName(selectedPedido.cliente?.id)}</p>
                <p><strong>Fecha:</strong> {new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CR')}</p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={getEstadoClass(selectedPedido.estado)}>
                    {selectedPedido.estado}
                  </span>
                </p>
              </div>

              <div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Artículos
                </h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Artículo</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPedido.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{getArticuloName(item.articulo?.id)}</td>
                          <td>{item.cantidad}</td>
                          <td>{formatPrecio(item.precioUnitario)}</td>
                          <td>{formatPrecio(item.cantidad * item.precioUnitario)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: '600' }}>
                          Total:
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {formatPrecio(calcularTotal(selectedPedido.items))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PedidosTab;
