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
} from '@heroicons/react/24/solid';

// Temas
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
    info: 'text-slate-700 bg-slate-100',
    dragActive: 'border-slate-600 bg-slate-50',
    valid: 'text-emerald-700',
    invalid: 'text-rose-700',
    iconBg: 'bg-slate-100 text-slate-700',
  },
};

// Documentos requeridos
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
  traffic: () => {
    return ['Incapacidad médica', 'Epicrisis o resumen clínico', 'FURIPS', 'SOAT (si aplica)'];
  },
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
  const [specificFields, setSpecificFields] = useState({
    births: '',
    motherWorks: 'No',
  });
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [apiError, setApiError] = useState(null);

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
    setSpecificFields({ births: '', motherWorks: 'No' });
    setUploadedFiles({});
    setEmail('');
    setPhoneNumber('');
    setIsSubmitting(false);
    setSubmissionComplete(false);
    setApiError(null);
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

  const getRequiredDocs = useMemo(() => {
    if (incapacityType === 'maternity') return documentRequirements.maternity;
    if (incapacityType === 'paternity')
      return documentRequirements.paternity(specificFields.motherWorks === 'Sí');
    if (incapacityType === 'other') {
      if (!subType || !daysOfIncapacity) return [];
      const days = parseInt(daysOfIncapacity, 10);
      if (subType === 'general') return documentRequirements.general(days);
      if (subType === 'labor') return documentRequirements.labor(days);
      if (subType === 'traffic') return documentRequirements.traffic();
    }
    return [];
  }, [incapacityType, specificFields.motherWorks, subType, daysOfIncapacity]);

  const isSubmissionReady = useMemo(() => {
    const requiredDocs = getRequiredDocs;
    if (requiredDocs.length === 0) return false;
    return requiredDocs.every((docName) => uploadedFiles[docName]);
  }, [getRequiredDocs, uploadedFiles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmissionReady) {
      setApiError(null);
      setStep(6);
    }
  };

  // FUNCIÓN DE ENVÍO REAL DE ARCHIVOS Y DATOS AL BACKEND (CORRECTA)
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('cedula', cedula);
    formData.append('empresa', userCompany);
    formData.append('tipo', incapacityType || subType || 'general');
    formData.append('email', email);
    formData.append('telefono', phoneNumber);

    // Enviar todos los archivos con nombre "archivos"
    const archivos = Object.values(uploadedFiles);
    archivos.forEach(file => {
      formData.append('archivos', file);
    });

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      // Enviar al backend real
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

  const DropzoneArea = ({ docName }) => {
    const onDrop = useCallback(
      (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
          setUploadedFiles((prev) => ({
            ...prev,
            [docName]: Object.assign(file, {
              preview: URL.createObjectURL(file),
              isLegible: true,
            }),
          }));
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

    return (
      <div className="w-full">
        <label className="block text-sm font-medium mb-1">{docName}</label>
        {file ? (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              currentTheme.cardBorder
            } ${file.isLegible ? 'border-green-400' : 'border-red-400'}`}
          >
            <div className="flex items-center gap-2 truncate">
              <FolderOpenIcon className={`h-5 w-5 ${currentTheme.icon}`} />
              <span className="text-sm truncate">{file.name}</span>
            </div>
            <button
              onClick={() =>
                setUploadedFiles((prev) => {
                  const newFiles = { ...prev };
                  delete newFiles[docName];
                  return newFiles;
                })
              }
              className={`p-1 rounded-full ${currentTheme.secondary} hover:bg-red-100`}
            >
              <XMarkIcon className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps({
              className: `p-6 rounded-2xl border-2 border-dashed transition-colors duration-200 ease-in-out cursor-pointer ${
                isDragActive
                  ? currentTheme.dragActive
                  : `${currentTheme.cardBorder} hover:border-blue-500`
              }`,
            })}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className={`mx-auto h-8 w-8 ${currentTheme.icon}`} />
            <p className="mt-2 text-xs text-center">
              Arrastra o haz clic para subir el archivo
            </p>
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
          <div key="mother-works">
            <label className="block text-sm font-medium">
              ¿La madre del hijo se encuentra laborando actualmente?
            </label>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="motherWorks"
                  value="Sí"
                  checked={specificFields.motherWorks === 'Sí'}
                  onChange={(e) =>
                    setSpecificFields({ ...specificFields, motherWorks: e.target.value })
                  }
                  className="form-radio"
                />
                <span className="text-sm">Sí</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="motherWorks"
                  value="No"
                  checked={specificFields.motherWorks === 'No'}
                  onChange={(e) =>
                    setSpecificFields({ ...specificFields, motherWorks: e.target.value })
                  }
                  className="form-radio"
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
        );
      }
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
            className={`fixed top-4 left-1/2 -translate-x-1/2 max-w-sm w-full p-4 rounded-xl shadow-lg ${currentTheme.error} flex items-center gap-3 z-50`}
          >
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="font-medium text-sm">{apiError}</span>
            <button
              onClick={() => setApiError(null)}
              className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute top-4 right-4">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className={`p-2 rounded-xl border-0 shadow-sm sm:text-sm ${currentTheme.input}`}
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
                  disabled={!subType || !daysOfIncapacity || (incapacityType === 'maternity' && !specificFields.births) || (incapacityType === 'paternity' && !specificFields.births)}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${(!subType || !daysOfIncapacity || (incapacityType === 'maternity' && !specificFields.births) || (incapacityType === 'paternity' && !specificFields.births)) ? 'opacity-50 cursor-not-allowed' : ''}`}
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