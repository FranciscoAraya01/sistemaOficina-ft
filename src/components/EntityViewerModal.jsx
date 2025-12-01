import React, { useEffect, useRef, useState } from 'react';
import { X, Edit, Check, X as XIcon } from 'lucide-react';

/**
 * EntityViewerModal
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - title: string
 * - fields: Array<{label: string, value: any, type?: 'text' | 'sucursales'}>
 * - onSaveNotes: async (notesValue) => void (optional, callback to save notes)
 */
export default function EntityViewerModal({ open, onClose, title = 'Detalles', fields = [], onSaveNotes }) {
  const overlayRef = useRef(null);
  const notesTextareaRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const notesField = fields.find(f => f.label === 'Notas');
      setNotesValue(notesField?.value || '');
      setEditMode(false);
    }
  }, [open, fields]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (editMode) {
          setEditMode(false);
        } else {
          onClose();
        }
      }
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, editMode]);

  useEffect(() => {
    if (editMode && notesTextareaRef.current) {
      notesTextareaRef.current.focus();
    }
  }, [editMode]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleEditNotes = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    const notesField = fields.find(f => f.label === 'Notas');
    setNotesValue(notesField?.value || '');
  };

  const handleSaveNotes = async () => {
    if (typeof onSaveNotes === 'function') {
      setIsSaving(true);
      try {
        await onSaveNotes(notesValue);
        setEditMode(false);
      } catch (error) {
        console.error('Error al guardar notas:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNotesChange = (e) => {
    setNotesValue(e.target.value);
  };

  // Renderizar campo de sucursales
  const renderSucursales = (sucursales) => {
    if (!sucursales || sucursales.length === 0) {
      return <span className="text-muted">Sin sucursales registradas</span>;
    }

    return (
      <div className="sucursales-list">
        {sucursales.map((sucursal, index) => (
          <div key={sucursal.id || index} className="sucursal-item">
            <span className="sucursal-icon">📍</span>
            <span>{sucursal.nombre}</span>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar un campo según su tipo
  const renderField = (field, idx) => {
    // Campo de Notas (editable)
    if (field.label === 'Notas') {
      if (editMode) {
        return (
          <div className="entity-row entity-row--full" key={idx}>
            <div className="entity-label">Notas</div>
            <textarea
              ref={notesTextareaRef}
              className="form-textarea entity-notes-textarea"
              value={notesValue}
              onChange={handleNotesChange}
              rows="4"
            />
          </div>
        );
      } else {
        return (
          <div className="entity-row entity-row--full" key={idx}>
            <div className="entity-label">Notas</div>
            <div className="preserve-whitespace">{notesValue || '-'}</div>
          </div>
        );
      }
    }

    // Campo de Sucursales
    if (field.type === 'sucursales') {
      return (
        <div className="entity-row entity-row--full" key={idx}>
          <div className="entity-label">{field.label}</div>
          <div className="entity-value">
            {renderSucursales(field.value)}
          </div>
        </div>
      );
    }

    // Campos regulares
    return (
      <div className="entity-row" key={idx}>
        <div className="entity-label">{field.label}</div>
        <div className="entity-value">{field.value ?? '-'}</div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onMouseDown={handleOverlayClick}>
      <div className="modal modal--md entity-viewer" role="dialog" aria-modal="true" aria-labelledby="entity-viewer-title">
        <div className="modal-header">
          <h2 id="entity-viewer-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="entity-viewer-grid">
            {fields.map((f, idx) => renderField(f, idx))}
          </div>
        </div>

        <div className="modal-footer">
          {editMode ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <XIcon size={18} />
                Cancelar
              </button>
              <button
                className="btn btn-success"
                onClick={handleSaveNotes}
                disabled={isSaving}
              >
                <Check size={18} />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              {onSaveNotes && (
                <button className="btn btn-primary" onClick={handleEditNotes}>
                  <Edit size={18} />
                  Editar Notas
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}