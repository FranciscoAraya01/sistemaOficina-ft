import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ShoppingCart, Eye } from 'lucide-react';
import { pedidosAPI, clientesAPI, articulosAPI } from '../services/api';
import AlertModal from './AlertModal';

function PedidosTab() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, type: 'info', message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null });
  const [formData, setFormData] = useState({
    clienteId: '',
    sucursalId: '',
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
      setAlertModal({ open: true, type: 'error', message: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      setAlertModal({ open: true, type: 'warning', message: 'Debes agregar al menos un artículo al pedido' });
      return;
    }

    const itemsInvalidos = formData.items.some(item => 
      !item.articuloId || !item.cantidad || !item.precioUnitario
    );
    
    if (itemsInvalidos) {
      setAlertModal({ open: true, type: 'warning', message: 'Todos los artículos deben tener artículo, cantidad y precio válidos' });
      return;
    }

    try {
      const pedidoData = {
        clienteId: parseInt(formData.clienteId),
        sucursalId: formData.sucursalId ? parseInt(formData.sucursalId) : null,
        estado: editingPedido ? formData.estado : 'Pendiente',
        fechaPedido: formData.fechaPedido,
        items: formData.items.map(item => ({
          articuloId: parseInt(item.articuloId),
          cantidad: parseInt(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          observaciones: item.observaciones || null
        }))
      };

      console.log('📤 Datos a enviar:', pedidoData);

      if (editingPedido) {
        await pedidosAPI.update(editingPedido.id, pedidoData);
        setAlertModal({ open: true, type: 'success', message: 'Pedido actualizado exitosamente' });
      } else {
        await pedidosAPI.create(pedidoData);
        setAlertModal({ open: true, type: 'success', message: 'Pedido creado exitosamente' });
      }
      
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el pedido';
      setAlertModal({ open: true, type: 'error', message: errorMessage });
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({ 
      open: true, 
      message: '¿Estás seguro de eliminar este pedido?',
      onConfirm: async () => {
        try {
          await pedidosAPI.delete(id);
          setAlertModal({ open: true, type: 'success', message: 'Pedido eliminado exitosamente' });
          setConfirmModal({ open: false, onConfirm: null });
          fetchData();
        } catch (error) {
          console.error('Error al eliminar pedido:', error);
          setAlertModal({ open: true, type: 'error', message: 'Error al eliminar el pedido' });
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingPedido(null);
    setFormData({
      clienteId: '',
      sucursalId: '',
      estado: 'Pendiente',
      fechaPedido: new Date().toISOString().split('T')[0],
      items: []
    });
    setShowModal(true);
  };

  const handleEdit = (pedido) => {
    setEditingPedido(pedido);
    
    const clienteId = pedido.cliente?.id || pedido.clienteId;
    const sucursalId = pedido.sucursal?.id || pedido.sucursalId || '';
    
    const items = (pedido.items || []).map(item => ({
      articuloId: item.articulo?.id || item.articuloId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      observaciones: item.observaciones || ''
    }));
    
    setFormData({
      clienteId: clienteId,
      sucursalId: sucursalId,
      estado: pedido.estado,
      fechaPedido: pedido.fechaPedido,
      items: items
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
        { articuloId: '', cantidad: 1, precioUnitario: '', observaciones: '' }
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

  const handleUpdateStatus = (newStatus) => {
    setConfirmModal({
      open: true,
      message: `¿Cambiar estado a "${newStatus}"?`,
      onConfirm: async () => {
        try {
          await pedidosAPI.update(selectedPedido.id, {
            ...selectedPedido,
            clienteId: selectedPedido.cliente?.id || selectedPedido.clienteId,
            sucursalId: selectedPedido.sucursal?.id || selectedPedido.sucursalId,
            estado: newStatus,
            items: (selectedPedido.items || []).map(item => ({
              articuloId: item.articulo?.id || item.articuloId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              observaciones: item.observaciones || null
            }))
          });
          setAlertModal({ open: true, type: 'success', message: `Estado actualizado a "${newStatus}"` });
          setConfirmModal({ open: false, onConfirm: null });
          setShowDetailModal(false);
          fetchData();
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          setAlertModal({ open: true, type: 'error', message: 'Error al actualizar el estado' });
        }
      }
    });
  };

  const getClienteName = (pedido) => {
    if (pedido.cliente?.nombreCompleto) {
      return pedido.cliente.nombreCompleto;
    }
    const clienteId = pedido.cliente?.id || pedido.clienteId;
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombreCompleto || 'Desconocido';
  };

  const getSucursalName = (pedido) => {
    if (pedido.sucursal?.nombre) {
      return pedido.sucursal.nombre;
    }
    const sucursalId = pedido.sucursal?.id || pedido.sucursalId;
    if (!sucursalId) return '-';
    
    const clienteId = pedido.cliente?.id || pedido.clienteId;
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente?.sucursales) {
      const sucursal = cliente.sucursales.find(s => s.id === sucursalId);
      if (sucursal) {
        return typeof sucursal === 'string' ? sucursal : sucursal.nombre;
      }
    }
    return '-';
  };

  const getSucursalesCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    return cliente?.sucursales || [];
  };

  const getArticuloName = (item) => {
    if (item.articulo?.nombre) {
      return item.articulo.nombre;
    }
    const articuloId = item.articulo?.id || item.articuloId;
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

  const calcularPrioridad = (fechaPedido) => {
    const hoy = new Date();
    const fecha = new Date(fechaPedido);
    const diasTranscurridos = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
    
    if (diasTranscurridos > 10) return 'alta';
    if (diasTranscurridos >= 7) return 'media';
    return 'baja';
  };

  const getPrioridadClass = (prioridad) => {
    return `priority-badge priority-${prioridad}`;
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
                <th>Cliente</th>
                <th>Sucursal</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{getClienteName(pedido)}</td>
                  <td>{getSucursalName(pedido)}</td>
                  <td>{new Date(pedido.fechaPedido).toLocaleDateString('es-CR')}</td>
                  <td>
                    <span className={getEstadoClass(pedido.estado)}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td>
                    <span className={getPrioridadClass(calcularPrioridad(pedido.fechaPedido))}>
                      {calcularPrioridad(pedido.fechaPedido).charAt(0).toUpperCase() + calcularPrioridad(pedido.fechaPedido).slice(1)}
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
                  <label className="form-label">Sucursal</label>
                  <select
                    name="sucursalId"
                    className="form-select"
                    value={formData.sucursalId}
                    onChange={handleInputChange}
                    disabled={!formData.clienteId}
                  >
                    <option value="">Seleccionar sucursal</option>
                    {formData.clienteId && getSucursalesCliente(formData.clienteId).map((sucursal) => (
                      <option key={sucursal.id || sucursal} value={sucursal.id || sucursal}>
                        {typeof sucursal === 'string' ? sucursal : sucursal.nombre}
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
                    disabled={!editingPedido}
                    required
                  >
                    {editingPedido ? (
                      estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))
                    ) : (
                      <option value="Pendiente">Pendiente</option>
                    )}
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
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--color-bg-hover)',
                      borderRadius: 'var(--border-radius)'
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 1fr 1fr auto', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
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
                      
                      <textarea
                        className="form-input"
                        placeholder="Observaciones (opcional)"
                        rows="2"
                        value={item.observaciones}
                        onChange={(e) => updateItem(index, 'observaciones', e.target.value)}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
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
                <p><strong>Cliente:</strong> {getClienteName(selectedPedido)}</p>
                <p><strong>Sucursal:</strong> {getSucursalName(selectedPedido)}</p>
                <p><strong>Fecha:</strong> {new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CR')}</p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={getEstadoClass(selectedPedido.estado)}>
                    {selectedPedido.estado}
                  </span>
                </p>
                <p>
                  <strong>Prioridad:</strong>{' '}
                  <span className={getPrioridadClass(calcularPrioridad(selectedPedido.fechaPedido))}>
                    {calcularPrioridad(selectedPedido.fechaPedido).charAt(0).toUpperCase() + calcularPrioridad(selectedPedido.fechaPedido).slice(1)}
                  </span>
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Actualizar Estado:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['En Proceso', 'Despachado'].map((status) => (
                      <button
                        key={status}
                        className="btn btn-sm"
                        onClick={() => handleUpdateStatus(status)}
                        disabled={selectedPedido.estado === status}
                        style={{ opacity: selectedPedido.estado === status ? 0.5 : 1 }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
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
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPedido.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{getArticuloName(item)}</td>
                          <td>{item.cantidad}</td>
                          <td>{formatPrecio(item.precioUnitario)}</td>
                          <td>{formatPrecio(item.cantidad * item.precioUnitario)}</td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'pre-wrap' }}>
                            {item.observaciones || '-'}
                          </td>
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
                        <td></td>
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

      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal({ open: false, type: 'info', message: '' })}
        type={alertModal.type}
        message={alertModal.message}
      />

      <AlertModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        type="confirm"
        message={confirmModal.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}

export default PedidosTab;