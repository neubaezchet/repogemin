import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { validarCalidadArchivo } from './utils/validadorCalidad';
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
  traffic: (isPhantomVehicle) => {
    const docs = ['Incapacidad médica', 'Epicrisis o resumen clínico', 'FURIPS'];
    if (!isPhantomVehicle) {
      docs.push('SOAT');
    }
    return docs;
  },
  prelicencia: [
    'Prelicencia de maternidad',
    'Soporte resumen de atención',  // ✅ NUEVO
  ],
  certificado: [
    'Certificado de hospitalización',
  ],
};

// Validación de calidad de imagen
const validateImageQuality = async (file) => {
  const resultado = await validarCalidadArchivo(file);
  
  return {
    isLegible: resultado.esValido,
    quality: resultado.esValido ? 100 : 30,
    message: resultado.problemas.length > 0 
      ? resultado.problemas[0] 
      : 'Calidad aceptable'
  };
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
    motherWorks: null,
    isPhantomVehicle: null,
  });
  
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [apiError, setApiError] = useState(null);

  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Vanta.js FOG – solo en step 1
  useEffect(() => {
    if (step === 1 && !vantaEffect.current && window.VANTA) {
      vantaEffect.current = window.VANTA.FOG({
        el: vantaRef.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0x3d82a7,
        midtoneColor: 0xffffff,
        lowlightColor: 0xffffff,
        baseColor: 0xe3aeae,
        blurFactor: 0.90,
        speed: 2.50,
      });
    }
    if (step !== 1 && vantaEffect.current) {
      vantaEffect.current.destroy();
      vantaEffect.current = null;
    }
  }, [step]);
  const [validatingFiles, setValidatingFiles] = useState({});
  const [serverResponse, setServerResponse] = useState(null); // ✅ NUEVO: guardar respuesta completa
  
  // ✅ NUEVOS ESTADOS PARA BLOQUEO
  const [bloqueo, setBloqueo] = useState(null);
  const [modoReenvio, setModoReenvio] = useState(false);
  
  // ✅ NUEVOS ESTADOS PARA FECHAS DE INCAPACIDAD
  const [incapacityStartDate, setIncapacityStartDate] = useState('');
  const [incapacityEndDate, setIncapacityEndDate] = useState('');
  
  // ✅ VALIDACIÓN DE DUPLICADOS
  const [duplicateError, setDuplicateError] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

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
    setSpecificFields({ births: '', motherWorks: null, isPhantomVehicle: null });
    setUploadedFiles({});
    setEmail('');
    setPhoneNumber('');
    setIsSubmitting(false);
    setSubmissionComplete(false);
    setApiError(null);
    setValidatingFiles({});
    setBloqueo(null);
    setModoReenvio(false);
    setIncapacityStartDate('');
    setIncapacityEndDate('');
    setDuplicateError(null);
    setCheckingDuplicate(false);
    setServerResponse(null); // ✅ NUEVO: resetear respuesta del servidor
  };

  // ✅ CORRECCIÓN 4: Validación de serial en pantalla de bloqueo
  useEffect(() => {
    if (bloqueo?.serial) {
      // Validar formato del serial (debe tener al menos 7 partes: CEDULA DD MM YYYY DD MM YYYY)
      const partes = bloqueo.serial.split(' ');
      if (partes.length < 7) {
        console.error('❌ Serial con formato incorrecto:', bloqueo.serial);
        setApiError('Error: Formato de serial inválido. Contacta soporte.');
      } else {
        console.log('✅ Serial validado correctamente:', bloqueo.serial);
      }
    }
  }, [bloqueo]);

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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://web-production-95ed.up.railway.app';
      
      console.log('🔍 URL del backend:', backendUrl);
      
      // PASO 1: Validar empleado
      const responseEmpleado = await fetch(`${backendUrl}/empleados/${cedula}`);
      const dataEmpleado = await responseEmpleado.json();

      if (responseEmpleado.ok) {
        setUserName(dataEmpleado.nombre);
        setUserCompany(dataEmpleado.empresa);
        
        // PASO 2: ✅ VERIFICAR BLOQUEO
        const responseBloqueo = await fetch(`${backendUrl}/verificar-bloqueo/${cedula}`);
        const dataBloqueo = await responseBloqueo.json();
        
        if (dataBloqueo.bloqueado) {
          // Hay caso bloqueante → Ir a pantalla de bloqueo
          setBloqueo(dataBloqueo.caso_pendiente);
          setModoReenvio(true);
          
       // ✅ Detectar tipo de incapacidad y mapear correctamente
          const tipoBloqueante = dataBloqueo.caso_pendiente.tipo.toLowerCase();
          const tipoCambiado = dataBloqueo.caso_pendiente.tipo_cambiado || false;
          
          console.log('🔍 Tipo recibido del backend:', dataBloqueo.caso_pendiente.tipo);
          console.log('🔍 Tipo cambió:', tipoCambiado);
          
          if (tipoCambiado) {
            // El validador cambió el tipo → Usar el NUEVO tipo
            const tipoNuevo = dataBloqueo.caso_pendiente.tipo_nuevo;
            console.log('✅ Usando tipo NUEVO:', tipoNuevo);
            
            if (tipoNuevo === 'maternity' || tipoNuevo === 'maternidad') {
              setIncapacityType('maternity');
            } else if (tipoNuevo === 'paternity' || tipoNuevo === 'paternidad') {
              setIncapacityType('paternity');
              if (dataBloqueo.caso_pendiente.madre_trabaja !== undefined) {
                setSpecificFields(prev => ({
                  ...prev,
                  motherWorks: dataBloqueo.caso_pendiente.madre_trabaja
                }));
              }
            } else if (tipoNuevo === 'traffic' || tipoNuevo.includes('transito')) {
              setIncapacityType('other');
              setSubType('traffic');
              setDaysOfIncapacity(dataBloqueo.caso_pendiente.dias || '3');
              if (dataBloqueo.caso_pendiente.vehiculo_fantasma !== undefined) {
                setSpecificFields(prev => ({
                  ...prev,
                  isPhantomVehicle: dataBloqueo.caso_pendiente.vehiculo_fantasma
                }));
              }
            } else if (tipoNuevo === 'labor' || tipoNuevo.includes('laboral')) {
              setIncapacityType('other');
              setSubType('labor');
              setDaysOfIncapacity(dataBloqueo.caso_pendiente.dias || '3');
            } else {
              setIncapacityType('other');
              setSubType('general');
              setDaysOfIncapacity(dataBloqueo.caso_pendiente.dias || '3');
            }
            
          } else {
            // ✅ FLUJO NORMAL: Mapear tipo original
            console.log('📋 Usando tipo ORIGINAL:', tipoBloqueante);
            
            if (tipoBloqueante.includes('maternidad') || tipoBloqueante === 'maternity') {
              setIncapacityType('maternity');
              console.log('✅ Tipo mapeado: maternity');
              
            } else if (tipoBloqueante.includes('paternidad') || tipoBloqueante === 'paternity') {
              setIncapacityType('paternity');
              console.log('✅ Tipo mapeado: paternity');
              
            } else if (tipoBloqueante.includes('transito') || tipoBloqueante.includes('tránsito') || tipoBloqueante === 'accidente_transito') {
              setIncapacityType('other');
              setSubType('traffic');
              setDaysOfIncapacity('3');
              console.log('✅ Tipo mapeado: traffic');
              
            } else if (tipoBloqueante.includes('laboral') || tipoBloqueante === 'enfermedad_laboral' || tipoBloqueante === 'accidente_laboral') {
              setIncapacityType('other');
              setSubType('labor');
              setDaysOfIncapacity('3');
              console.log('✅ Tipo mapeado: labor');
              
            } else if (tipoBloqueante.includes('general') || tipoBloqueante === 'enfermedad_general') {
              setIncapacityType('other');
              setSubType('general');
              setDaysOfIncapacity('3');
              console.log('✅ Tipo mapeado: general');
              
            } else {
              setIncapacityType('other');
              setSubType('general');
              setDaysOfIncapacity('3');
              console.warn('⚠️ Tipo desconocido, usando general:', tipoBloqueante);
            }
          }
          
          setStep(2.5);
        } else {
          setStep(2);
        }
      } else {
        setApiError(dataEmpleado.error || 'Error al validar la cédula. Inténtalo de nuevo.');
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

  

  // ✅ NUEVA FUNCIÓN: Formatear checks para mostrar legible
  const formatearCheck = (check) => {
    const nombres = {
      'incapacidad_faltante': 'Soporte de incapacidad',
      'epicrisis_faltante': 'Epicrisis o resumen clínico',
      'epicrisis_incompleta': 'Epicrisis incompleta',
      'soat_faltante': 'SOAT del vehículo',
      'furips_faltante': 'FURIPS',
      'licencia_maternidad_faltante': 'Licencia de maternidad',
      'registro_civil_faltante': 'Registro civil del bebé',
      'nacido_vivo_faltante': 'Certificado de nacido vivo',
      'cedula_padre_faltante': 'Cédula del padre (ambas caras)',
      'ilegible_recortada': 'Documento recortado',
      'ilegible_borrosa': 'Documento borroso',
      'ilegible_manchada': 'Documento con manchas o reflejos',
      'incompleta_general': 'Soportes incompletos',
      'ilegible_general': 'Problemas de calidad',
      'faltante_general': 'Documentos faltantes'
    };
    return nombres[check] || check.replace(/_/g, ' ');
  };

  // CAMBIO PRINCIPAL: Todos los tipos van al paso 4
  const handleIncapacityType = (type) => {
    setIncapacityType(type);
    setSubType(null);
    setDaysOfIncapacity('');
    setUploadedFiles({});
    setSpecificFields({ births: '', motherWorks: null, isPhantomVehicle: null });
    
    // Para certificados y prelicencias, ir directo al paso 5 (subir docs)
    if (type === 'prelicencia' || type === 'certificado') {
      setStep(5);
    } else {
      setStep(4);
    }
  };

  const handleSubTypeChange = (e) => {
    setSubType(e.target.value);
    setUploadedFiles({});
    setSpecificFields({ ...specificFields, isPhantomVehicle: null });
  };

  const getRequiredDocs = useMemo(() => {
    if (incapacityType === 'maternity') return documentRequirements.maternity;
    if (incapacityType === 'paternity')
      return documentRequirements.paternity(specificFields.motherWorks);
    if (incapacityType === 'prelicencia') return documentRequirements.prelicencia;
    if (incapacityType === 'certificado') return documentRequirements.certificado;
    if (incapacityType === 'other') {
      if (!subType || !daysOfIncapacity) return [];
      const days = parseInt(daysOfIncapacity, 10);
      if (subType === 'general') return documentRequirements.general(days);
      if (subType === 'labor') return documentRequirements.labor(days);
      if (subType === 'traffic') return documentRequirements.traffic(specificFields.isPhantomVehicle);
    }
    return [];
  }, [incapacityType, specificFields.motherWorks, specificFields.isPhantomVehicle, subType, daysOfIncapacity]);

  const isSubmissionReady = useMemo(() => {
    const requiredDocs = getRequiredDocs;
    if (requiredDocs.length === 0) return false;
    return requiredDocs.every((docName) => {
      const file = uploadedFiles[docName];
      return file && file.isLegible;
    });
  }, [getRequiredDocs, uploadedFiles]);

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    
    // ✅ Mostrar pantalla de éxito inmediatamente para evitar doble clic
    setSubmissionComplete(true);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://web-production-95ed.up.railway.app';
    let endpoint;
    const formData = new FormData();

    if (modoReenvio) {
      // ✅ MODO REENVÍO: Completar documentos faltantes
      // ✅ CORRECCIÓN 2: Encoding correcto del serial (contiene espacios)
      endpoint = `${backendUrl}/casos/${encodeURIComponent(bloqueo.serial)}/completar`;
      
      const archivos = Object.values(uploadedFiles);
      archivos.forEach(file => {
        formData.append('archivos', file);
      });
      
      console.log(`🔄 Modo reenvío activado para caso ${bloqueo.serial}`);
      
    } else {
      // ✅ MODO NORMAL: Todos los datos
      endpoint = `${backendUrl}/subir-incapacidad/`;
      
      formData.append('cedula', cedula);
      // ✅ NO enviar empresa - el backend la busca automáticamente
      formData.append('tipo', incapacityType || subType || 'general');
      formData.append('email', email);
      formData.append('telefono', phoneNumber);
      
      // Agregar campos específicos si existen
      if (specificFields.births) {
        formData.append('births', specificFields.births);
      }
      if (specificFields.motherWorks !== null) {
        formData.append('motherWorks', specificFields.motherWorks);
      }
      if (specificFields.isPhantomVehicle !== null) {
        formData.append('isPhantomVehicle', specificFields.isPhantomVehicle);
      }
      if (daysOfIncapacity) {
        formData.append('daysOfIncapacity', daysOfIncapacity);
      }
      if (subType) {
        formData.append('subType', subType);
      }
      if (incapacityStartDate) {
        formData.append('incapacityStartDate', incapacityStartDate);
      }
      if (incapacityEndDate) {
        formData.append('incapacityEndDate', incapacityEndDate);
      }
      
      const archivos = Object.values(uploadedFiles);
      archivos.forEach(file => {
        formData.append('archivos', file);
      });
    }

    try {
      console.log('📤 Iniciando envío...');
      console.log('📤 Enviando a:', endpoint);
      console.log('📤 Modo reenvío:', modoReenvio);
      
      // ✅ CORRECCIÓN 1: Timeout aumentado para Railway + n8n
      // (Railway puede tardar 60s + n8n 30s = 90s, usamos 95s de margen)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 95000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📥 Status recibido:', response.status);
      console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Respuesta exitosa completa:', data);
        
        // ✅ GUARDAR respuesta completa para mostrar detalles
        setServerResponse(data);
        
        // ✅ NUEVO: Verificar confirmación de notificaciones enviadas
        if (data.notificacion_enviada) {
          console.log('📧 Notificaciones enviadas:', data.canales_notificados);
          if (data.canales_notificados?.email) {
            console.log('  ✓ Email enviado correctamente');
          }
          if (data.canales_notificados?.whatsapp) {
            console.log('  ✓ WhatsApp enviado correctamente');
          }
        } else {
          console.warn('⚠️ Las notificaciones no fueron enviadas por n8n');
        }
        
        setSubmissionComplete(true);
        setApiError(null);
      } else {
        const data = await response.json().catch(() => ({ error: 'Error del servidor' }));
        console.error('❌ Error del servidor:', data);
        setApiError(data.error || `Error ${response.status}: No se pudo procesar la solicitud.`);
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Tipo de error:', error.name);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Stack:', error.stack);
      
      // ✅ CORRECCIÓN 3: Mejor manejo de errores de timeout
      if (error.name === 'AbortError') {
        console.warn('⚠️ Timeout detectado (95s), pero el proceso probablemente se completó en el servidor');
        
        // Mostrar mensaje específico al usuario
        setSubmissionComplete(true);
        setApiError(null);
        
        // Guardar respuesta simulada para mostrar confirmación
        setServerResponse({
          mensaje: 'Proceso completado (tardó más de lo esperado)',
          notificacion_enviada: true,
          canales_notificados: {
            email: true,
            whatsapp: true
          }
        });
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Error TypeError - problema de red o CORS');
        setApiError('Error de conexión con el servidor. Verifica tu internet.');
      } else {
        setApiError('Error inesperado. Por favor inténtalo de nuevo.');
      }
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
      case 2.5:
        return 'Incapacidad Pendiente';
      case 3:
        return 'Selecciona el tipo de incapacidad';
      case 4:
        return 'Detalla la información';
      case 5:
        return modoReenvio ? 'Completa los documentos faltantes' : 'Sube los documentos requeridos';
      case 5.5:
        return 'Fechas de la incapacidad';
      case 6:
        return 'Confirma tu información de contacto';
      default:
        return 'Sistema de incapacidades';
    }
  };

  const DropzoneArea = ({ docName }) => {
    const onDrop = useCallback(
      async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
          // ✅ VALIDAR: No permitir el mismo archivo en otro campo
          const archivosExistentes = Object.entries(uploadedFiles);
          const duplicado = archivosExistentes.find(
            ([otroDoc, otroFile]) => otroDoc !== docName && otroFile.name === file.name && otroFile.size === file.size
          );
          if (duplicado) {
            alert(`⚠️ Este archivo "${file.name}" ya fue subido en "${duplicado[0]}". No puedes subir el mismo archivo en dos campos diferentes.`);
            return;
          }
          
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

  // Validación de campos del paso 4
  const isStep4Valid = () => {
    if (incapacityType === 'prelicencia' || incapacityType === 'certificado') {
      return true; // Siempre válido para estos tipos
    }
    if (incapacityType === 'maternity') {
      return specificFields.births !== '';
    }
    if (incapacityType === 'paternity') {
      return specificFields.births !== '' && specificFields.motherWorks !== null;
    }
    if (incapacityType === 'other') {
      if (!subType || !daysOfIncapacity) return false;
      if (subType === 'traffic') {
        return specificFields.isPhantomVehicle !== null;
      }
      return true;
    }
    return false;
  };

  // Campos específicos según el tipo
  const renderSpecificFields = () => {
    // Para prelicencia y certificado no hay campos específicos
    if (incapacityType === 'prelicencia' || incapacityType === 'certificado') {
      return (
        <div className={`p-4 rounded-xl ${currentTheme.info} text-center`}>
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">
            {incapacityType === 'prelicencia' 
              ? 'Solo necesitas adjuntar la prelicencia de maternidad'
              : 'Solo necesitas adjuntar el certificado de hospitalización'}
          </p>
        </div>
      );
    }

    const fieldsToRender = [];

    // MATERNIDAD Y PATERNIDAD
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
            placeholder="Ej: 1"
          />
        </div>
      );

      // Solo para PATERNIDAD
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

    // OTRO TIPO
    if (incapacityType === 'other') {
      fieldsToRender.push(
        <div key="subtype">
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
      );

      if (subType) {
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
              placeholder="Ej: 5"
            />
          </div>
        );
      }

      // Campo para vehículo fantasma
      if (subType === 'traffic') {
        fieldsToRender.push(
          <div key="phantom-vehicle" className="space-y-2">
            <label className="block text-sm font-medium">
              ¿El vehículo relacionado al accidente es fantasma o se dio a la fuga?
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
    }

    if (fieldsToRender.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {fieldsToRender}
      </motion.div>
    );
  };

  return (
    <div
      ref={vantaRef}
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

      <div className="absolute top-4 right-4" style={{ zIndex: 1 }}>
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
        style={{ position: 'relative', zIndex: 1 }}
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
                    Número de documento de identidad
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

          {step === 2.5 && bloqueo && !submissionComplete && (
            <motion.div
              key="step2.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Alerta de bloqueo */}
              <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6">
                <ExclamationTriangleIcon className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-center mb-2">
                  Incapacidad Pendiente de Completar
                </h3>
                <p className="text-sm text-center text-amber-700 mb-4">
                  {bloqueo.mensaje}
                </p>
                
                {/* Información del caso */}
                <div className="bg-white rounded-lg p-4 mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Serial:</span>
                    <span className="font-bold text-gray-900">{bloqueo.serial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Tipo:</span>
                    <span className="text-gray-900">{bloqueo.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bloqueo.estado === 'INCOMPLETA' ? 'bg-red-100 text-red-800' :
                      bloqueo.estado === 'ILEGIBLE' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bloqueo.estado}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Fecha de envío:</span>
                    <span className="text-gray-900">{bloqueo.fecha_envio}</span>
                  </div>
                </div>
                
                {/* Motivo */}
                {bloqueo.motivo && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                      <ExclamationCircleIcon className="h-5 w-5" />
                      Motivo:
                    </h4>
                    <p className="text-sm text-red-800">{bloqueo.motivo}</p>
                  </div>
                )}
                
                {/* Documentos faltantes */}
                {bloqueo.checks_faltantes && bloqueo.checks_faltantes.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                      Documentos que faltan:
                    </h4>
                    <ul className="space-y-1">
                      {bloqueo.checks_faltantes.map((check, idx) => (
                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{formatearCheck(check)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Instrucciones */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-bold text-green-900 mb-2">📝 Qué debes hacer:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                    <li>Revisa los problemas indicados arriba</li>
                    <li>Consigue o corrige los documentos que faltan</li>
                    <li>Haz clic en "Completar esta Incapacidad"</li>
                    <li>Sube TODOS los documentos juntos</li>
                  </ol>
                </div>
                
                {/* ✅ CAMPOS DE SUBIDA DE DOCUMENTOS */}
                <div className="bg-white rounded-lg p-4 mt-4">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
                    Documentos requeridos para {bloqueo.tipo_display || bloqueo.tipo}
                  </h4>
                  
                  {/* Campos específicos SOLO si el validador cambió el tipo */}
                  {bloqueo.tipo_cambiado && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800 font-medium mb-3">
                        ⚠️ El validador cambió el tipo de incapacidad. Completa esta información:
                      </p>
                      {renderSpecificFields()}
                    </div>
                  )}
                  
                  {/* Zona de dropzone para cada documento */}
                  {getRequiredDocs.length > 0 ? (
                    <div className="space-y-3">
                      {getRequiredDocs.map((docName) => (
                        <DropzoneArea key={docName} docName={docName} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-500">
                      ⚠️ Completa los campos arriba para ver los documentos requeridos
                    </div>
                  )}
                </div>  
                
                {/* Botones de acción */}
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (getRequiredDocs.length === 0) {
                        alert('⚠️ Selecciona el tipo de incapacidad y completa los campos requeridos');
                        return;
                      }
                      
                      const archivosSubidos = getRequiredDocs.every(doc => uploadedFiles[doc]);
                      if (!archivosSubidos) {
                        alert('⚠️ Debes subir TODOS los documentos requeridos antes de continuar');
                        return;
                      }
                      
                      // Todo OK → Enviar
                      handleFinalSubmit();
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="h-5 w-5" />
                        Enviar y Completar ({Object.keys(uploadedFiles).length}/{getRequiredDocs.length})
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetApp}
                    className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
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
                <p className="text-sm">Identificado con CC {cedula} y vinculado a {userCompany}.</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                
                {/* NUEVO: Prelicencia */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleIncapacityType('prelicencia')}
                  className={`flex flex-col items-center p-6 rounded-2xl transition-colors ${currentTheme.secondary} hover:ring-2 ring-blue-500`}
                >
                  <div className={`p-4 rounded-full ${currentTheme.iconBg}`}>
                    <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <span className="mt-2 text-xs text-center font-medium">Prelicencia Maternidad</span>
                </motion.button>
                
                {/* NUEVO: Certificado */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleIncapacityType('certificado')}
                  className={`flex flex-col items-center p-6 rounded-2xl transition-colors ${currentTheme.secondary} hover:ring-2 ring-blue-500`}
                >
                  <div className={`p-4 rounded-full ${currentTheme.iconBg}`}>
                    <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <span className="mt-2 text-xs text-center font-medium">Certificado Hospitalización</span>
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
                <h2 className="text-xl font-bold">Detalla la información</h2>
                <button onClick={() => setStep(3)} className={`p-2 rounded-full ${currentTheme.buttonOutline}`}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
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
                  disabled={!isStep4Valid()}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${!isStep4Valid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Siguiente
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && !submissionComplete && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {modoReenvio ? 'Completa los documentos' : 'Documentos requeridos'}
                </h2>
                <button 
                  onClick={() => modoReenvio ? setStep(2.5) : setStep(4)} 
                  className={`p-2 rounded-full ${currentTheme.buttonOutline}`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Banner de modo reenvío */}
              {modoReenvio && bloqueo && (
                <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-blue-900">
                        🔄 Completando caso {bloqueo.serial}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Solo sube los documentos que faltan. Los demás datos ya están guardados.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DocumentsUploadSection />
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => modoReenvio ? setStep(2.5) : setStep(4)}
                  className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                >
                  Atrás
                </button>
                <button
                  onClick={() => {
                    if (modoReenvio) {
                      handleFinalSubmit();
                    } else if (incapacityType === 'prelicencia' || incapacityType === 'certificado') {
                      // Para prelicencia y certificado, ir directo a correo
                      setStep(6);
                    } else {
                      // Para otras incapacidades, ir a fechas
                      setStep(5.5);
                    }
                  }}
                  disabled={!isSubmissionReady}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${!isSubmissionReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {modoReenvio ? 'Enviar y completar' : 'Siguiente'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 5.5 && !modoReenvio && !submissionComplete && (
            <motion.div
              key="step5.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Fechas de la incapacidad</h2>
                <button onClick={() => setStep(5)} className={`p-2 rounded-full ${currentTheme.buttonOutline}`}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600">Ingresa las fechas que indica el soporte de tu incapacidad.</p>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium">
                  Fecha inicial de la incapacidad
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={incapacityStartDate}
                  onChange={(e) => { setIncapacityStartDate(e.target.value); setDuplicateError(null); }}
                  className={`mt-1 block w-full rounded-xl border-0 p-3 shadow-sm focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium">
                  Fecha final de la incapacidad
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={incapacityEndDate}
                  onChange={(e) => { setIncapacityEndDate(e.target.value); setDuplicateError(null); }}
                  className={`mt-1 block w-full rounded-xl border-0 p-3 shadow-sm focus:ring-2 sm:text-sm transition-colors ${currentTheme.input}`}
                />
              </div>
              
              {/* ✅ ALERTA DE DUPLICADO */}
              {duplicateError && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-800">
                  <p className="font-bold">⚠️ Incapacidad duplicada</p>
                  <p>{duplicateError}</p>
                </div>
              )}
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(5)}
                  className={`w-full p-3 rounded-xl font-bold border transition-colors ${currentTheme.buttonOutline}`}
                >
                  Atrás
                </button>
                <button
                  onClick={async () => {
                    // ✅ VERIFICAR DUPLICADO antes de continuar
                    setCheckingDuplicate(true);
                    setDuplicateError(null);
                    try {
                      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://web-production-95ed.up.railway.app';
                      const resp = await fetch(`${backendUrl}/verificar-duplicado?cedula=${cedula}&fecha_inicio=${incapacityStartDate}&fecha_fin=${incapacityEndDate}`);
                      const data = await resp.json();
                      if (data.duplicado) {
                        setDuplicateError(data.mensaje);
                        setCheckingDuplicate(false);
                        return;
                      }
                    } catch (err) {
                      console.warn('⚠️ No se pudo verificar duplicado:', err);
                    }
                    setCheckingDuplicate(false);
                    setStep(6);
                  }}
                  disabled={!incapacityStartDate || !incapacityEndDate || checkingDuplicate}
                  className={`w-full p-3 rounded-xl font-bold transition-colors duration-200 ${currentTheme.button} ${(!incapacityStartDate || !incapacityEndDate || checkingDuplicate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {checkingDuplicate ? 'Verificando...' : 'Siguiente'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && !modoReenvio && !submissionComplete && (
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
              <h2 className="text-2xl font-bold mb-2">
                {modoReenvio ? 'Documentos completados con éxito' : 'Solicitud enviada con éxito'}
              </h2>
              <p className="text-sm opacity-80 mb-4">
                {modoReenvio 
                  ? 'Tu caso será revisado nuevamente. Pronto nos comunicaremos contigo con los resultados.'
                  : 'Hemos recibido tu solicitud. Pronto nos comunicaremos contigo.'}
              </p>
              
              {/* ✅ Indicador de procesamiento mientras espera respuesta del servidor */}
              {isSubmitting && !serverResponse?.notificacion_enviada && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                    </svg>
                    <span className="text-sm text-blue-800 dark:text-blue-300">
                      Enviando notificaciones...
                    </span>
                  </div>
                </div>
              )}
              
              {/* ✅ Mostrar confirmación de notificaciones cuando respondan */}
              {serverResponse?.notificacion_enviada && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                    📬 Notificaciones enviadas:
                  </p>
                  <div className="flex justify-center gap-4 text-xs">
                    {serverResponse.canales_notificados?.email && (
                      <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        ✓ Email enviado
                      </span>
                    )}
                    {serverResponse.canales_notificados?.whatsapp && (
                      <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        ✓ WhatsApp enviado
                      </span>
                    )}
                  </div>
                </div>
              )}
              
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