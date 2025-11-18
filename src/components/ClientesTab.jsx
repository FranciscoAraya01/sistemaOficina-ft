import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { clientesAPI } from '../services/api';
import ClientModal from './ClientModal';
import EntityViewerModal from './EntityViewerModal';

function ClientesTab() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerEntity, setViewerEntity] = useState(null);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: ''
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
      alert('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCliente) {
        await clientesAPI.update(editingCliente.id, formData);
        alert('Cliente actualizado exitosamente');
      } else {
        await clientesAPI.create(formData);
        alert('Cliente creado exitosamente');
      }
      
      closeModal();
      fetchClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await clientesAPI.delete(id);
      alert('Cliente eliminado exitosamente');
      fetchClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData({
      nombreCompleto: '',
      email: '',
      telefono: '',
      direccion: '',
      notas: ''
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
        notas: notesValue
      });
      // Actualizar la lista de clientes para que se refleje el cambio
      fetchClientes();
      // Actualizar el viewer entity para mostrar las notas actualizadas
      setViewerEntity(prev => ({ ...prev, notas: notesValue }));
      alert('Notas actualizadas exitosamente');
    } catch (error) {
      console.error('Error al guardar notas:', error);
      alert('Error al guardar las notas');
      throw error; // Re-throw para que EntityViewerModal sepa que hubo error
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
                        <Plus size={18} style={{ transform: 'rotate(90deg)' }} />
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
              alert('Cliente actualizado exitosamente');
            } else {
              await clientesAPI.create(data);
              alert('Cliente creado exitosamente');
            }
            closeModal();
            fetchClientes();
          } catch (error) {
            console.error('Error al guardar cliente:', error);
            alert('Error al guardar el cliente');
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
          { label: 'Notas', value: viewerEntity.notas }
        ] : []}
        onSaveNotes={handleSaveNotes}
      />
    </div>
  );
}

export default ClientesTab;
