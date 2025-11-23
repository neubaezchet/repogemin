import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Camera } from 'lucide-react';

/**
 * Toast flotante con guía visual
 * Aparece después de seleccionar tipo de incapacidad
 */
const ToastGuiaFotos = ({ visible, onClose }) => {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (visible) {
      setMostrar(true);
    }
  }, [visible]);

  const handleClose = () => {
    setMostrar(false);
    setTimeout(() => onClose(), 300);
  };

  if (!visible && !mostrar) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        mostrar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-white" />
            <h3 className="text-white font-bold text-lg">Guía para Fotos</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Imagen comparativa */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="space-y-3">
              {/* Documento CORRECTO */}
              <div className="border-4 border-green-500 rounded-lg bg-white p-3">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  <span className="font-bold text-green-700 text-sm">CORRECTO</span>
                </div>
                <svg className="w-full h-24" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="180" height="60" fill="#f0f9ff" stroke="#3b82f6" strokeWidth="2"/>
                  <line x1="20" y1="20" x2="150" y2="20" stroke="#1e40af" strokeWidth="2"/>
                  <line x1="20" y1="30" x2="180" y2="30" stroke="#60a5fa" strokeWidth="2"/>
                  <line x1="20" y1="40" x2="140" y2="40" stroke="#60a5fa" strokeWidth="2"/>
                  <line x1="20" y1="50" x2="170" y2="50" stroke="#60a5fa" strokeWidth="2"/>
                  <circle cx="10" cy="10" r="3" fill="#16a34a"/>
                  <circle cx="190" cy="10" r="3" fill="#16a34a"/>
                  <circle cx="10" cy="70" r="3" fill="#16a34a"/>
                  <circle cx="190" cy="70" r="3" fill="#16a34a"/>
                </svg>
                <p className="text-xs text-center text-green-700 mt-1 font-semibold">
                  ✓ Todos los bordes visibles
                </p>
              </div>

              {/* Documento INCORRECTO */}
              <div className="border-4 border-red-500 rounded-lg bg-white p-3">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                  <span className="font-bold text-red-700 text-sm">INCORRECTO</span>
                </div>
                <svg className="w-full h-24" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
                  <rect x="-10" y="5" width="180" height="70" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5"/>
                  <line x1="0" y1="15" x2="130" y2="15" stroke="#b91c1c" strokeWidth="2"/>
                  <line x1="0" y1="25" x2="160" y2="25" stroke="#f87171" strokeWidth="2"/>
                  <line x1="0" y1="35" x2="120" y2="35" stroke="#f87171" strokeWidth="2"/>
                  <line x1="175" y1="10" x2="195" y2="30" stroke="#dc2626" strokeWidth="3"/>
                  <line x1="195" y1="10" x2="175" y2="30" stroke="#dc2626" strokeWidth="3"/>
                </svg>
                <p className="text-xs text-center text-red-700 mt-1 font-semibold">
                  ✗ Bordes cortados
                </p>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm">📸 Cómo tomar la foto:</h4>
            
            <div className="space-y-2">
              {[
                'Coloca el documento sobre una superficie plana',
                'Usa buena iluminación (luz natural preferible)',
                'Asegúrate que los 4 bordes sean visibles',
                'Toma la foto desde arriba (perpendicular)',
                'Enfoca bien y verifica que el texto sea legible'
              ].map((instruccion, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-700 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{instruccion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Advertencias */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-900 text-sm">Evita:</span>
            </div>
            <ul className="text-xs text-amber-800 space-y-1 ml-7">
              <li>• Fotos con flash (causa reflejos)</li>
              <li>• Documentos doblados o arrugados</li>
              <li>• Dedos o sombras sobre el documento</li>
              <li>• Fotos desde un ángulo inclinado</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastGuiaFotos;