import React from 'react';

function Toast({ show, message, onClose }) {
  if (!show) return null;

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3">
      <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="toast-header bg-primary text-white">
          <strong className="me-auto">Desi Diner</strong>
          <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
        </div>
        <div className="toast-body">{message}</div>
      </div>
    </div>
  );
}

export default Toast;