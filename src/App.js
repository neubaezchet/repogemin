import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
  HeartIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  FolderOpenIcon,
  XMarkIcon,
  AtSymbolIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

// Temas (sin cambios)
const themes = {
  light: {
    bg: 'bg-gray-50 text-gray-900',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-200',
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-blue-100 text-blue-800',
    input: 'bg-gray-100 border-gray-300 focus:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonOutline: 'bg-transparent text-gray-900 hover:bg-gray-100 border-gray-300',
    icon: 'text-gray-500',
    success: 'text-green-600 bg-green-100',
    error: 'text-red-600 bg-red-100',
    warning: 'text-amber-600 bg-amber-100',
    info: 'text-blue-600 bg-blue-100',
    dragActive: 'border-blue-500 bg-blue-50',
    valid: 'text-green-600',
    invalid: 'text-red-600',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  dark: {
    bg: 'bg-gray-800 text-gray-50',
    cardBg: 'bg-gray-900',
    cardBorder: 'border-gray-700',
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-blue-800 text-blue-100',
    input: 'bg-gray-700 border-gray-600 focus:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonOutline: 'bg-transparent text-gray-50 hover:bg-gray-700 border-gray-600',
    icon: 'text-gray-400',
    success: 'text-green-400 bg-green-900',
    error: 'text-red-400 bg-red-900',
    warning: 'text-amber-400 bg-amber-900',
    info: 'text-blue-400 bg-blue-900',
    dragActive: 'border-blue-500 bg-blue-900',
    valid: 'text-green-400',
    invalid: 'text-red-400',
    iconBg: 'bg-blue-900 text-blue-400',
  },
  institutional: {
    bg: 'bg-slate-50 text-gray-900',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-300',
    primary: 'bg-slate-700 text-white',
    secondary: 'bg-slate-200 text-slate-800',
    input: 'bg-slate-100 border-slate-300 focus:border-slate-600',
    button: 'bg-slate-700 hover:bg-slate-800',
    buttonOutline: 'bg-transparent text-gray-900 hover:bg-slate-100 border-slate-300',
    icon: 'text-slate-500',
    success: 'text-emerald-700 bg-emerald-100',
    error: 'text-rose-700 bg-rose-100',
    warning: 'text-amber-700 bg-amber-100',
    info: 'text-slate-700 bg-slate-100',
    dragActive: 'border-slate-600 bg-slate-50',
    valid: 'text-emerald-700',
    invalid: 'text-rose-700',
    iconBg: 'bg-slate-100 text-slate-700',
  },
};

// ACTUALIZADO: Documentos requeridos con lógica de vehículo fantasma
const documentRequirements = {
  maternity: [
    'Licencia o incapacidad de maternidad',
    'Epicrisis o resumen clínico',
    'Cédula de la madre',
    'Registro civil',
    'Certificado de nacido vivo',
  ],
  paternity: (motherWorks) => {
    const docs = [
      'Epicrisis o resumen clínico',
      'Cédula del padre',
      'Registro civil',
      'Certificado de nacido vivo',
    ];
    if (motherWorks) {
      docs.push('Licencia o incapacidad de maternidad');
    }
    return docs;
  },
  general: (days) => {
    return days <= 2
      ? ['Incapacidad médica']
      : ['Incapacidad médica', 'Epicrisis o resumen clínico'];
  },
  labor: (days) => {
    return days <= 2
      ? ['Incapacidad médica']
      : ['Incapacidad médica', 'Epicrisis o resumen clínico'];
  },
  traffic: (isPhantomVehicle) => {
    const docs = ['Incapacidad médica', 'Epicrisis o resumen clínico', 'FURIPS'];
    if (!isPhantomVehicle) {
      docs.push('SOAT');
    }
    return docs;
  },
};

// NUEVO: Función de validación de calidad de imagen (frontend)
const validateImageQuality = async (file) => {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') {
      resolve({ isLegible: true, quality: 100, message: 'PDF aceptado' });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        brightness = brightness / (data.length / 4);

        let edgeCount = 0;
        for (let i = 0; i < data.length - 4; i += 4) {
          const diff = Math.abs(data[i] - data[i + 4]);
          if (diff > 30) edgeCount++;
        }
        const sharpness = (edgeCount / (data.length / 4)) * 100;

        const minResolution = 300 * 300;
        const isBrightnessOk = brightness > 30 && brightness < 240;
        const isSharpnessOk = sharpness > 0.5;
        const isResolutionOk = (img.width * img.height) > minResolution;

        const quality = Math.min(100, (
          (isBrightnessOk ? 40 : 0) +
          (isSharpnessOk ? 40 : 0) +
          (isResolutionOk ? 20 : 0)
        ));

        const isLegible = quality >= 60;

        let message = '';
        if (!isLegible) {
          if (!isBrightnessOk) message = 'Imagen muy oscura o muy clara';
          else if (!isSharpnessOk) message = 'Imagen borrosa o de baja nitidez';
          else if (!isResolutionOk) message = 'Resolución muy baja';
        } else {
          message = 'Calidad aceptable';
        }

        URL.revokeObjectURL(url);
        resolve({ isLegible, quality, message });
      } catch (error) {
        URL.revokeObjectURL(url);
        resolve({ isLegible: true, quality: 100, message: 'No se pudo validar' });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ isLegible: false, quality: 0, message: 'Error al cargar imagen' });
    };

    img.src = url;
  });
};

const App = () => {
  const [theme, setTheme] = useState('light');
  const [step, setStep] = useState(1);
  const [cedula, setCedula] = useState('');
  const [isCedulaValid, setIsCedulaValid] = useState(false);
  const [userName, setUserName] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [incapacityType, setIncapacityType] = useState(null);
  const [subType, setSubType] = useState(null);
  const [daysOfIncapacity, setDaysOfIncapacity] = useState('');
  
  // ACTUALIZADO: Agregado isPhantomVehicle
  const [specificFields, setSpecificFields] = useState({
    births: '',
    motherWorks: false,
    isPhantomVehicle: false,
  });
  
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // NUEVO: Estado para validación de archivos
  const [validatingFiles, setValidatingFiles] = useState({});

  const currentTheme = themes[theme];

  const resetApp = () => {
    setStep(1);
    setCedula('');
    setIsCedulaValid(false);
    setUserName('');
    setUserCompany('');
    setIncapacityType(null);
    setSubType(null);
    setDaysOfIncapacity('');
    setSpecificFields({ births: '', motherWorks: false, isPhantomVehicle: false });
    setUploadedFiles({});
    setEmail('');
    setPhoneNumber('');
    setIsSubmitting(false);
    setSubmissionComplete(false);
    setApiError(null);
    setValidatingFiles({});
  };

  const handleCedulaChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    setCedula(numericValue);
    setIsCedulaValid(numericValue.length >= 7);
  };

  const handleCedulaSubmit = async (e) => {
    e.preventDefault();
    if (!isCedulaValid) return;

    setApiError(null);
    setIsSubmitting(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/empleados/${cedula}`);
      const data = await response.json();

      if (response.ok) {
        setUserName(data.nombre);
        setUserCompany(data.empresa);
        setStep(2);
      } else {
        setApiError(data.error || 'Error al validar la cédula. Inténtalo de nuevo.');
      }
    } catch (error) {
      setApiError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmUser = (confirm) => {
    if (confirm) {
      setStep(3);
    } else {
      resetApp();
    }
  };

  const handleIncapacityType = (type) => {
    setIncapacityType(type);
    setSubType(null);
    setDaysOfIncapacity('');
    setUploadedFiles({});
    setSpecificFields({ births: '', motherWorks: false, isPhantomVehicle: false });
    if (type === 'other') {
      setStep(4);
    } else {
      setStep(5);
    }
  };

  const handleSubTypeChange = (e) => {
    setSubType(e.target.value);
    setUploadedFiles({});
  };

  // ACTUALIZADO: Incluye isPhantomVehicle en la lógica
  const getRequiredDocs = useMemo(() => {
    if (incapacityType === 'maternity') return documentRequirements.maternity;
    if (incapacityType === 'paternity')
      return documentRequirements.paternity(specificFields.motherWorks);
    if (incapacityType === 'other') {
      if (!subType || !daysOfIncapacity) return [];
      const days = parseInt(daysOfIncapacity, 10);
      if (subType === 'general') return documentRequirements.general(days);
      if (subType === 'labor') return documentRequirements.labor(days);
      if (subType === 'traffic') return documentRequirements.traffic(specificFields.isPhantomVehicle);
    }
    return [];
  }, [incapacityType, specificFields.motherWorks, specificFields.isPhantomVehicle, subType, daysOfIncapacity]);

  // ACTUALIZADO: Valida que archivos sean legibles
  const isSubmissionReady = useMemo(() => {
    const requiredDocs = getRequiredDocs;
    if (requiredDocs.length === 0) return false;
    return requiredDocs.every((docName) => {
      const file = uploadedFiles[docName];
      return file && file.isLegible;
    });
  }, [getRequiredDocs, uploadedFiles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmissionReady) {
      setApiError(null);
      setStep(6);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('cedula', cedula);
    formData.append('empresa', userCompany);
    formData.append('tipo', incapacityType || subType || 'general');
    formData.append('email', email);
    formData.append('telefono', phoneNumber);

    const archivos = Object.values(uploadedFiles);
    archivos.forEach(file => {
      formData.append('archivos', file);
    });

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/subir-incapacidad/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setSubmissionComplete(true);
      } else {
        setApiError(data.error || 'Error al enviar la solicitud. Inténtalo de nuevo.');
      }
    } catch (error) {
      setApiError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Ingresa tu número de cédula';
      case 2:
        return 'Confirma tu identidad';
      case 3:
        return 'Selecciona el tipo de incapacidad';
      case 4:
        return 'Detalla el tipo de incapacidad';
      case 5:
        return 'Sube los documentos requeridos';
      case 6:
        return 'Confirma tu información de contacto';
      default:
        return 'Sistema de incapacidades';
    }
  };

  // ACTUALIZADO: DropzoneArea con validación de calidad
  const DropzoneArea = ({ docName }) => {
    const onDrop = useCallback(
      async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
          setValidatingFiles(prev => ({ ...prev, [docName]: true }));

          const validationResult = await validateImageQuality(file);

          setUploadedFiles((prev) => ({
            ...prev,
            [docName]: Object.assign(file, {
              preview: URL.createObjectURL(file),
              ...validationResult,
            }),
          }));

          setValidatingFiles(prev => ({ ...prev, [docName]: false }));
        }
      },
      [docName]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpeg', '.png', '.jpg'],
        'application/pdf': ['.pdf'],
      },
      maxFiles: 1,
    });

    const file = uploadedFiles[docName];
    const isValidating = validatingFiles[docName];

    return (
      <div className="w-full">
        <label className="block text-sm font-medium mb-1">{docName}</label>
        {file ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
              file.isLegible 
                ? 'border-green-400 bg-green-50' 
                : 'border-red-400 bg-red-50'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FolderOpenIcon className={`h-5 w-5 flex-shrink-0 ${file.isLegible ? 'text-green-600' : 'text-red-600'}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{file.name}</span>
                <div className="flex items-center gap-1 mt-1">
                  {file.isLegible ? (
                    <CheckCircleIcon className="h-3 w-3 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${file.isLegible ? 'text-green-600' : 'text-red-600'}`}>
                    {file.message}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                setUploadedFiles((prev) => {
                  const newFiles = { ...prev };
                  delete newFiles[docName];
                  return newFiles;
                })
              }
              className="p-1 rounded-full hover:bg-red-100 transition-colors ml-2"
            >
              <XMarkIcon className="h-4 w-4 text-red-600" />
            </button>
          </motion.div>
        ) : (
          <div
            {...getRootProps({
              className: `p-6 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragActive
                  ? currentTheme.dragActive
                  : `${currentTheme.cardBorder} hover:border-blue-500`
              }`,
            })}
          >
            <input {...getInputProps()} />
            {isValidating ? (
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                </svg>
                <p className="mt-2 text-xs text-blue-600 font-medium">Validando calidad...</p>
              </div>
            ) : (
              <>
                <CloudArrowUpIcon className={`mx-auto h-8 w-8 ${currentTheme.icon}`} />
                <p className="mt-2 text-xs text-center">
                  Arrastra o haz clic para subir el archivo
                </p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const DocumentsUploadSection = () => {
    const docs = getRequiredDocs;
    if (docs.length === 0) {
      return (
        <div className={`p-4 rounded-xl ${currentTheme.info} text-center`}>
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">
            Completa la información de tu incapacidad para ver los documentos requeridos.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {docs.map((docName) => (
          <DropzoneArea key={docName} docName={docName} />
        ))}
      </div>
    );
  };

  // ACTUALIZADO: Campos específicos con vehículo fantasma
  const renderSpecificFields = () => {
    const fieldsToRender = [];

    if (incapacityType === 'maternity' || incapacityType === 'paternity') {
      fieldsToRender.push(
        <div key="births">
          <label htmlFor="births" className="block text-sm font-medium">
            Número de nacidos vivos
          </label>
          <input
            type="number"
            id="births"
            value={specificFields.births}
            onChange={(e) =>
              setSpecificFields({ ...specificFields, births: e.target.value })
            }
            className={`mt-1 block w-full rounded-xl border-0 p-3 shadow-sm focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
          />
        </div>
      );

      if (incapacityType === 'paternity') {
        fieldsToRender.push(
          <div key="mother-works" className="space-y-2">
            <label className="block text-sm font-medium">
              ¿La madre se encuentra laborando actualmente?
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="motherWorks"
                  checked={specificFields.motherWorks === true}
                  onChange={() =>
                    setSpecificFields({ ...specificFields, motherWorks: true })
                  }
                  className="form-radio"
                />
                <span className="text-sm">Sí</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="motherWorks"
                  checked={specificFields.motherWorks === false}
                  onChange={() =>
                    setSpecificFields({ ...specificFields, motherWorks: false })
                  }
                  className="form-radio"
                />
                <span className="text-sm">No</span>
              </label>
            </div>
            {specificFields.motherWorks !== null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-blue-600 mt-1"
              >
                {specificFields.motherWorks 
                  ? '✓ Se requerirá licencia de maternidad'
                  : '✓ No se requiere licencia de maternidad'}
              </motion.p>
            )}
          </div>
        );
      }
    }

    // NUEVO: Campo para vehículo fantasma
    if (incapacityType === 'other' && subType === 'traffic') {
      fieldsToRender.push(
        <div key="phantom-vehicle" className="space-y-2">
          <label className="block text-sm font-medium">
            ¿El vehículo relacionado al accidente es fantasma?
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isPhantomVehicle"
                checked={specificFields.isPhantomVehicle === true}
                onChange={() =>
                  setSpecificFields({ ...specificFields, isPhantomVehicle: true })
                }
                className="form-radio"
              />
              <span className="text-sm">Sí</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isPhantomVehicle"
                checked={specificFields.isPhantomVehicle === false}
                onChange={() =>
                  setSpecificFields({ ...specificFields, isPhantomVehicle: false })
                }
                className="form-radio"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {specificFields.isPhantomVehicle !== null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-amber-600 mt-1"
            >
              {specificFields.isPhantomVehicle 
                ? '✓ No se requiere SOAT'
                : '✓ Se requerirá adjuntar SOAT'}
            </motion.p>
          )}
        </div>
      );
    }

    if (incapacityType === 'other' && subType) {
      fieldsToRender.push(
        <div key="days">
          <label htmlFor="days" className="block text-sm font-medium">
            Días de la incapacidad
          </label>
          <input
            type="number"
            id="days"
            value={daysOfIncapacity}
            onChange={(e) => setDaysOfIncapacity(e.target.value)}
            className={`mt-1 block w-full rounded-xl border-0 p-3 shadow-sm focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
          />
        </div>
      );
    }

    if (fieldsToRender.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 space-y-4"
      >
        {fieldsToRender}
      </motion.div>
    );
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 flex items-center justify-center transition-colors duration-300 ${currentTheme.bg}`}
    >
      {apiError && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 max-w-sm w-full p-4 rounded-xl shadow-lg ${currentTheme.error} flex items-center gap-3 z-50`}
          >
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="font-medium text-sm">{apiError}</span>
            <button
              onClick={() => setApiError(null)}
              className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute top-4 right-4">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className={`p-2 rounded-xl border-0 shadow-sm sm:text-sm transition-all ${currentTheme.input}`}
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
          <option value="institutional">Institucional</option>
        </select>
      </div>

      <motion.div
        layout
        className={`w-full max-w-xl p-8 rounded-3xl shadow-xl transition-colors duration-300 ${currentTheme.cardBg} ${currentTheme.cardBorder} border`}
      >
        <h1 className="text-3xl font-bold mb-2 text-center">{getStepTitle()}</h1>
        <p className="text-center text-sm mb-8 opacity-70">
          Un portal moderno y eficiente para gestionar tus incapacidades.
        </p>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleCedulaSubmit} className="space-y-4">
                <div>
                  <label htmlFor="cedula" className="block text-sm font-medium">
                    Número de Cédula o CE
                  </label>
                  <input
                    type="text"
                    id="cedula"
                    value={cedula}
                    onChange={handleCedulaChange}
                    className={`mt-1 block w-full rounded-xl border-0 p-3 shadow-sm focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
                    placeholder="Escribe tu número de identificación"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isCedulaValid || isSubmitting}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${(!isCedulaValid || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                      </svg>
                      Validando...
                    </>
                  ) : (
                    'Consultar'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`p-6 rounded-2xl ${currentTheme.info} text-center`}>
                <UserCircleIcon className="h-16 w-16 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">¿Eres {userName}?</h3>
                <p className="text-sm">Identificado con CC o CE {cedula} y vinculado a {userCompany}.</p>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleConfirmUser(false)}
                  className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                >
                  No
                </button>
                <button
                  onClick={() => handleConfirmUser(true)}
                  className={`w-full p-3 rounded-xl font-bold transition-colors ${currentTheme.button}`}
                >
                  Sí
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-center text-sm mb-6 font-medium">Selecciona el tipo de incapacidad que deseas registrar:</p>
              <div className="grid grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleIncapacityType('maternity')}
                  className={`flex flex-col items-center p-6 rounded-2xl transition-colors ${currentTheme.secondary} hover:ring-2 ring-blue-500`}
                >
                  <div className={`p-4 rounded-full ${currentTheme.iconBg}`}>
                    <HeartIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="mt-2 text-xs text-center font-medium">Maternidad</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleIncapacityType('paternity')}
                  className={`flex flex-col items-center p-6 rounded-2xl transition-colors ${currentTheme.secondary} hover:ring-2 ring-blue-500`}
                >
                  <div className={`p-4 rounded-full ${currentTheme.iconBg}`}>
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="mt-2 text-xs text-center font-medium">Paternidad</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleIncapacityType('other')}
                  className={`flex flex-col items-center p-6 rounded-2xl transition-colors ${currentTheme.secondary} hover:ring-2 ring-blue-500`}
                >
                  <div className={`p-4 rounded-full ${currentTheme.iconBg}`}>
                    <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="mt-2 text-xs text-center font-medium">Otro tipo</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Detalles de la incapacidad</h2>
                <button onClick={() => setStep(3)} className={`p-2 rounded-full ${currentTheme.buttonOutline}`}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
              <div>
                <label htmlFor="subType" className="block text-sm font-medium mb-1">
                  Selecciona la causa
                </label>
                <select
                  id="subType"
                  value={subType || ''}
                  onChange={handleSubTypeChange}
                  className={`mt-1 block w-full rounded-xl border-0 p-3 shadow-sm focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
                >
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="general">Enfermedad general o especial</option>
                  <option value="traffic">Accidente de tránsito</option>
                  <option value="labor">Accidente laboral o enfermedad laboral</option>
                </select>
              </div>
              {renderSpecificFields()}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(3)}
                  className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!subType || !daysOfIncapacity}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${(!subType || !daysOfIncapacity) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Siguiente
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Documentos requeridos</h2>
                <button onClick={() => setStep(incapacityType === 'other' ? 4 : 3)} className={`p-2 rounded-full ${currentTheme.buttonOutline}`}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
              <DocumentsUploadSection />
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(incapacityType === 'other' ? 4 : 3)}
                  className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isSubmissionReady}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${!isSubmissionReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Siguiente
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Información de contacto</h2>
                <button onClick={() => setStep(5)} className={`p-2 rounded-full ${currentTheme.buttonOutline}`}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Correo electrónico
                </label>
                <div className="relative mt-1 rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <AtSymbolIcon className={`h-5 w-5 ${currentTheme.icon}`} aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full rounded-xl border-0 p-3 pl-10 focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium">
                  Número de celular
                </label>
                <div className="relative mt-1 rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <PhoneIcon className={`h-5 w-5 ${currentTheme.icon}`} aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`block w-full rounded-xl border-0 p-3 pl-10 focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
                    placeholder="300 123 4567"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(5)}
                  className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                >
                  Atrás
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={!email || !phoneNumber || isSubmitting}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${(!email || !phoneNumber || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Finalizar y enviar'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {submissionComplete && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <CheckCircleIcon className={`h-16 w-16 mx-auto mb-4 ${currentTheme.success}`} />
              <h2 className="text-2xl font-bold mb-2">Solicitud enviada con éxito</h2>
              <p className="text-sm opacity-80 mb-6">
                Hemos recibido tu solicitud. Pronto nos comunicaremos contigo.
              </p>
              <button
                onClick={resetApp}
                className={`w-full p-3 rounded-xl font-bold transition-colors ${currentTheme.button}`}
              >
                Volver al inicio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default App;