import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

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
    notas: ''
  });

  useEffect(() => {
    if (open) {
      // initialize form state from client when opening for edit
      if (mode === 'edit' && client) {
        setFormState({
          nombreCompleto: client.nombreCompleto || '',
          email: client.email || '',
          telefono: client.telefono || '',
          direccion: client.direccion || '',
          notas: client.notas || ''
        });
      } else if (mode === 'create') {
        setFormState({ nombreCompleto: '', email: '', telefono: '', direccion: '', notas: '' });
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
      if (e.key === 'Escape') onClose();
    };

    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  return (
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
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-success">{mode === 'edit' ? 'Actualizar' : 'Crear'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
