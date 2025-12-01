import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Package } from 'lucide-react';
import { articulosAPI } from '../services/api';
import AlertModal from './AlertModal';

function ArticulosTab() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, type: 'info', message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null });
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: ''
  });

  const categorias = [
    'Desayunadores',
    'Comedores',
    'Camas y Camarotes',
    'Terrazas',
    'Bancos y Sillas',
    'Otros'
  ];

  useEffect(() => {
    fetchArticulos();
  }, []);

  const fetchArticulos = async () => {
    try {
      setLoading(true);
      const response = await articulosAPI.getAll();
      setArticulos(response.data);
    } catch (error) {
      console.error('Error al cargar artículos:', error);
      setAlertModal({ open: true, type: 'error', message: 'Error al cargar los artículos' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingArticulo) {
        await articulosAPI.update(editingArticulo.id, formData);
        setAlertModal({ open: true, type: 'success', message: 'Artículo actualizado exitosamente' });
      } else {
        await articulosAPI.create(formData);
        setAlertModal({ open: true, type: 'success', message: 'Artículo creado exitosamente' });
      }
      
      closeModal();
      fetchArticulos();
    } catch (error) {
      console.error('Error al guardar artículo:', error);
      setAlertModal({ open: true, type: 'error', message: 'Error al guardar el artículo' });
    }
  };

  const handleEdit = (articulo) => {
    setEditingArticulo(articulo);
    setFormData({
      nombre: articulo.nombre,
      precio: articulo.precio,
      categoria: articulo.categoria
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setConfirmModal({ 
      open: true, 
      message: '¿Estás seguro de eliminar este artículo?',
      onConfirm: async () => {
        try {
          await articulosAPI.delete(id);
          setAlertModal({ open: true, type: 'success', message: 'Artículo eliminado exitosamente' });
          setConfirmModal({ open: false, onConfirm: null });
          fetchArticulos();
        } catch (error) {
          console.error('Error al eliminar artículo:', error);
          setAlertModal({ open: true, type: 'error', message: 'Error al eliminar el artículo' });
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingArticulo(null);
    setFormData({
      nombre: '',
      precio: '',
      categoria: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingArticulo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(precio);
  };

  if (loading) {
    return <div className="loading">Cargando artículos...</div>;
  }

  return (
    <div>
      <div className="card-header">
        <h2 className="card-title">Gestión de Artículos</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={20} />
          Nuevo Artículo
        </button>
      </div>

      {articulos.length === 0 ? (
        <div className="empty-state">
          <Package size={64} />
          <p>No hay artículos registrados</p>
          <button className="btn btn-primary mt-2" onClick={openCreateModal}>
            Agregar primer artículo
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map((articulo) => (
                <tr key={articulo.id}>
                  <td>{articulo.id}</td>
                  <td>{articulo.nombre}</td>
                  <td>
                    <span className="status-badge en-proceso">
                      {articulo.categoria}
                    </span>
                  </td>
                  <td>{formatPrecio(articulo.precio)}</td>
                  <td>
                    <div className="actions-container">
                      <button
                        className="icon-button edit"
                        onClick={() => handleEdit(articulo)}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => handleDelete(articulo.id)}
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
              <h2>{editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Artículo *</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-input"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Sillón Reclinable"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select
                    name="categoria"
                    className="form-select"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Precio (₡) *</label>
                  <input
                    type="number"
                    name="precio"
                    className="form-input"
                    value={formData.precio}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  {editingArticulo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
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

export default ArticulosTab;
