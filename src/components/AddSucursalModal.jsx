import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * AddSucursalModal
 * Modal pequeño para agregar una nueva sucursal
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onAdd: (nombreSucursal: string) => void
 * - existingSucursales: string[] - para validar duplicados
 */
export default function AddSucursalModal({ open, onClose, onAdd, existingSucursales = [] }) {
  const overlayRef = useRef(null);
  const inputRef = useRef(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNombre('');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  console.log('AddSucursalModal está abierto:', open);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const nombreTrimmed = nombre.trim();
    
    if (!nombreTrimmed) {
      setError('El nombre de la sucursal no puede estar vacío');
      return;
    }

    // Verificar duplicados
    const isDuplicate = existingSucursales.some(
      s => s.toLowerCase() === nombreTrimmed.toLowerCase()
    );

    if (isDuplicate) {
      setError('Ya existe una sucursal con ese nombre');
      return;
    }

    onAdd(nombreTrimmed);
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      ref={overlayRef} 
      onMouseDown={handleOverlayClick}
      style={{ zIndex: 1100 }}
    >
      <div className="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="add-sucursal-title">
        <div className="modal-header">
          <h2 id="add-sucursal-title">Agregar Sucursal</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre de la Sucursal *</label>
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError('');
                }}
                placeholder="Ej: Sucursal Centro"
              />
              {error && <p className="error-message">{error}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}