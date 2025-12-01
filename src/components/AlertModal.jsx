import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

/**
 * AlertModal
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onConfirm: () => void (optional, for confirmation mode)
 * - type: 'success' | 'error' | 'warning' | 'info' | 'confirm' (default: 'info')
 * - title: string (optional)
 * - message: string (required)
 * - autoClose: number (ms, optional — auto-close after this time, only for non-confirm modes)
 * - confirmText: string (optional, for confirm mode, default: 'Confirmar')
 * - cancelText: string (optional, for confirm mode, default: 'Cancelar')
 */
export default function AlertModal({ 
  open, 
  onClose, 
  onConfirm, 
  type = 'info', 
  title, 
  message, 
  autoClose = 0,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open || autoClose <= 0) return;
    const timer = setTimeout(onClose, autoClose);
    return () => clearTimeout(timer);
  }, [open, autoClose, onClose]);

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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={28} className="alert-icon alert-icon--success" />;
      case 'error':
        return <AlertCircle size={28} className="alert-icon alert-icon--error" />;
      case 'warning':
        return <AlertCircle size={28} className="alert-icon alert-icon--warning" />;
      case 'confirm':
        return <AlertCircle size={28} className="alert-icon alert-icon--warning" />;
      case 'info':
      default:
        return <Info size={28} className="alert-icon alert-icon--info" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success':
        return 'Éxito';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Advertencia';
      case 'confirm':
        return 'Confirmación';
      case 'info':
      default:
        return 'Información';
    }
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onMouseDown={handleOverlayClick}>
      <div className={`alert-modal alert-modal--${type}`} role="alertdialog" aria-modal="true" aria-labelledby="alert-title">
        <div className="alert-modal-content">
          <div className="alert-modal-icon">
            {getIcon()}
          </div>
          <div className="alert-modal-text">
            <h3 id="alert-title" className="alert-modal-title">{getTitle()}</h3>
            <p className="alert-modal-message">{message}</p>
          </div>
          {type !== 'confirm' && (
            <button className="alert-modal-close" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="alert-modal-footer">
          {type === 'confirm' ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button className="btn btn-danger" onClick={onConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className={`btn btn-${type === 'error' ? 'danger' : 'primary'}`} onClick={onClose}>
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
