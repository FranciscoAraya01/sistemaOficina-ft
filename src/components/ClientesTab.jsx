import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Eye } from 'lucide-react';
import { clientesAPI } from '../services/api';
import ClientModal from './ClientModal';
import EntityViewerModal from './EntityViewerModal';
import AlertModal from './AlertModal';

function ClientesTab() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerEntity, setViewerEntity] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, type: 'info', message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null });
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: '',
    sucursales: []
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await clientesAPI.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setAlertModal({ open: true, type: 'error', message: 'Error al cargar los clientes' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCliente) {
        await clientesAPI.update(editingCliente.id, formData);
        setAlertModal({ open: true, type: 'success', message: 'Cliente actualizado exitosamente' });
      } else {
        await clientesAPI.create(formData);
        setAlertModal({ open: true, type: 'success', message: 'Cliente creado exitosamente' });
      }

      closeModal();
      fetchClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      setAlertModal({ open: true, type: 'error', message: 'Error al guardar el cliente' });
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setConfirmModal({ 
      open: true, 
      message: '¿Estás seguro de eliminar este cliente?',
      onConfirm: async () => {
        try {
          await clientesAPI.delete(id);
          setAlertModal({ open: true, type: 'success', message: 'Cliente eliminado exitosamente' });
          setConfirmModal({ open: false, onConfirm: null });
          fetchClientes();
        } catch (error) {
          console.error('Error al eliminar cliente:', error);
          setAlertModal({ open: true, type: 'error', message: 'Error al eliminar el cliente' });
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData({
      nombreCompleto: '',
      email: '',
      telefono: '',
      direccion: '',
      notas: '',
      sucursales: []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCliente(null);
  };

  const handleSaveNotes = async (notesValue) => {
    if (!viewerEntity) return;
    try {
      await clientesAPI.update(viewerEntity.id, {
        nombreCompleto: viewerEntity.nombreCompleto,
        email: viewerEntity.email,
        telefono: viewerEntity.telefono,
        direccion: viewerEntity.direccion,
        notas: notesValue,
        sucursales: viewerEntity.sucursales || []
      });
      fetchClientes();
      setViewerEntity(prev => ({ ...prev, notas: notesValue }));
      setAlertModal({ open: true, type: 'success', message: 'Notas actualizadas exitosamente' });
    } catch (error) {
      console.error('Error al guardar notas:', error);
      setAlertModal({ open: true, type: 'error', message: 'Error al guardar las notas' });
      throw error;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para formatear sucursales como texto
  const formatSucursales = (sucursales) => {
    if (!sucursales || sucursales.length === 0) {
      return 'Sin sucursales registradas';
    }
    return sucursales.map(s => s.nombre).join(', ');
  };

  if (loading) {
    return <div className="loading">Cargando clientes...</div>;
  }

  return (
    <div>
      <div className="card-header">
        <h2 className="card-title">Gestión de Clientes</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <p>No hay clientes registrados</p>
          <button className="btn btn-primary mt-2" onClick={openCreateModal}>
            Agregar primer cliente
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre o Razon social</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombreCompleto}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.telefono}</td>
                  <td>
                    <div className="actions-container">
                      <button
                        className="icon-button view"
                        onClick={() => {
                          setViewerEntity(cliente);
                          setViewerOpen(true);
                        }}
                        title="Visualizar"
                      >
                        <Eye size={18}/>
                      </button>
                      <button
                        className="icon-button edit"
                        onClick={() => handleEdit(cliente)}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => handleDelete(cliente.id)}
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

      <ClientModal
        open={showModal}
        onClose={closeModal}
        client={editingCliente}
        mode={editingCliente ? 'edit' : 'create'}
        onSave={async (data) => {
          try {
            if (editingCliente) {
              await clientesAPI.update(editingCliente.id, data);
              setAlertModal({ open: true, type: 'success', message: 'Cliente actualizado exitosamente' });
            } else {
              await clientesAPI.create(data);
              setAlertModal({ open: true, type: 'success', message: 'Cliente creado exitosamente' });
            }
            closeModal();
            fetchClientes();
          } catch (error) {
            console.error('Error al guardar cliente:', error);
            setAlertModal({ open: true, type: 'error', message: 'Error al guardar el cliente' });
          }
        }}
      />

      <EntityViewerModal
        open={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerEntity(null); }}
        title="Detalles del Cliente"
        fields={viewerEntity ? [
          { label: 'Nombre', value: viewerEntity.nombreCompleto },
          { label: 'Email', value: viewerEntity.email },
          { label: 'Teléfono', value: viewerEntity.telefono },
          { label: 'Dirección', value: viewerEntity.direccion },
          { label: 'Sucursales', value: viewerEntity.sucursales, type: 'sucursales' },
          { label: 'Notas', value: viewerEntity.notas }
        ] : []}
        onSaveNotes={handleSaveNotes}
      />

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

export default ClientesTab;