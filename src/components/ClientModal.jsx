import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import AddSucursalModal from './AddSucursalModal';

/**
 * ClientModal
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - client: object | null
 * - mode: 'view' | 'edit' | 'create'
 * - onSave: async (clientData) => void  (only for edit/create)
 */
export default function ClientModal({ open, onClose, client = null, mode = 'view', onSave }) {
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);
  const notesRef = useRef(null);
  const [formState, setFormState] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: '',
    sucursales: []
  });

  // Estado para el modal de agregar sucursal
  const [addSucursalOpen, setAddSucursalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      // initialize form state from client when opening for edit
      if (mode === 'edit' && client) {
        // Normalizar sucursales a strings (por si vienen como objetos desde el backend)
        const sucursalesNormalizadas = (client.sucursales || []).map(s => 
          typeof s === 'string' ? s : s.nombre
        );
        setFormState({
          nombreCompleto: client.nombreCompleto || '',
          email: client.email || '',
          telefono: client.telefono || '',
          direccion: client.direccion || '',
          notas: client.notas || '',
          sucursales: sucursalesNormalizadas
        });
      } else if (mode === 'create') {
        setFormState({ nombreCompleto: '', email: '', telefono: '', direccion: '', notas: '', sucursales: [] });
      }

      // focus first input for form modes
      setTimeout(() => {
        if (firstInputRef.current && (mode === 'edit' || mode === 'create')) {
          firstInputRef.current.focus();
        }
      }, 0);
    }
  }, [open, mode, client]);

  useEffect(() => {
    const onKey = (e) => {
      // Solo cerrar con Escape si el modal de sucursal no está abierto
      if (e.key === 'Escape' && !addSucursalOpen) onClose();
    };

    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, addSucursalOpen]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof onSave === 'function') {
      await onSave(formState);
    }
  };

  const handleAddSucursal = (nombreSucursal) => {
    setFormState(prev => ({
      ...prev,
      sucursales: [...prev.sucursales, nombreSucursal]
    }));
  };

  const handleRemoveSucursal = (index) => {
    setFormState(prev => ({
      ...prev,
      sucursales: prev.sucursales.filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      <div className="modal-overlay" ref={overlayRef} onMouseDown={handleOverlayClick}>
        <div className={`modal ${mode === 'view' ? 'modal--md' : ''}`} role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
          <div className="modal-header">
            <h2 id="client-modal-title">
              {mode === 'view' ? 'Detalles del Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button className="modal-close" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          {mode === 'view' ? (
            <div className="modal-body">
              <p><strong>Nombre:</strong> {client?.nombreCompleto || '-'}</p>
              <p><strong>Email:</strong> {client?.email || '-'}</p>
              <p><strong>Teléfono:</strong> {client?.telefono || '-'}</p>
              <p><strong>Dirección:</strong> {client?.direccion || '-'}</p>
              <p><strong>Sucursales:</strong> {client?.sucursales?.length > 0 ? client.sucursales.join(', ') : '-'}</p>
              <p><strong>Notas:</strong></p>
              <div className="preserve-whitespace">{client?.notas || '-'}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    ref={firstInputRef}
                    name="nombreCompleto"
                    className="form-input"
                    value={formState.nombreCompleto}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    value={formState.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono *</label>
                  <input
                    name="telefono"
                    className="form-input"
                    value={formState.telefono}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección *</label>
                  <input
                    name="direccion"
                    className="form-input"
                    value={formState.direccion}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    ref={notesRef}
                    name="notas"
                    className="form-textarea"
                    value={formState.notas}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Sucursales</label>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        console.log('Botón Agregar clickeado, abriendo modal...');
                        setAddSucursalOpen(true);
                      }}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      + Agregar
                    </button>
                  </div>
                  {formState.sucursales.length > 0 ? (
                    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem' }}>
                      {formState.sucursales.map((sucursal, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.4rem',
                            borderBottom: idx < formState.sucursales.length - 1 ? '1px solid #eee' : 'none'
                          }}
                        >
                          <span>{sucursal}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveSucursal(idx)}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>Sin sucursales agregadas</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-success">{mode === 'edit' ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Modal para agregar sucursal - fuera del overlay principal */}
      <AddSucursalModal
        open={addSucursalOpen}
        onClose={() => setAddSucursalOpen(false)}
        onAdd={handleAddSucursal}
        existingSucursales={formState.sucursales}
      />
    </>
  );
}