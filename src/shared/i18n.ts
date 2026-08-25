import type { Locale } from './types';

export const COPY = {
  en: {
    launcher: 'Open music discovery',
    launcherAnalyzing: 'Creating suggestions… Open music discovery',
    launcherTranscribing: 'Transcribing locally… Open music discovery',
    minimize: 'Minimize music discovery',
    title: 'Discover music your way',
    independent: 'Independent extension · Not affiliated with Spotify',
    language: 'Language',
    provider: 'Discovery provider',
    onDevice: 'On-device AI',
    rules: 'Guided discovery',
    theme: 'Theme',
    themeSession: 'Theme changes stay in this tab and reset on reload.',
    themeAurora: 'Aurora',
    themeAuroraDescription: 'Prismatic cyan, violet, and rose.',
    themePulse: 'Pulse',
    themePulseDescription: 'Warm coral energy on graphite.',
    themeNightwave: 'Nightwave',
    themeNightwaveDescription: 'Deep blue and electric indigo.',
    inputLabel: 'Describe the music you want to find',
    inputPlaceholder: 'Try “432 Hz with piano, trumpet, or violin”',
    analyzing: 'Creating suggestions…',
    microphone: 'Use microphone',
    stopMicrophone: 'Stop recording',
    voiceDisclosure:
      'Your microphone is used only after you start it. Audio is processed locally and is not saved.',
    cancel: 'Cancel',
    clearAll: 'Clear all',
    undo: 'Undo',
    selectedFilters: 'Selected filters',
    removeFilter: 'Remove {label}',
    suggestions: 'Reasoned music routes',
    interpretation: 'Interpretation',
    evidence: 'Evidence',
    supportingExamples: 'Start with',
    searchShort: 'Search',
    searchNamed: 'Search {name}',
    searchFor: 'Search for {name} in Spotify',
    spotifySupported: 'Spotify-supported',
    keywordBased: 'Keyword-based',
    aiSuggested: 'AI-suggested',
    exploratory: 'Exploratory search term—not verified audio or effects',
    exploratoryCompact: 'Exploratory; audio/effects not verified',
    clarificationTitle: 'What does {frequency} Hz mean here?',
    tuningOption: 'A4 tuning reference',
    toneOption: 'Prominent tone or title keyword',
    usage: 'Session context: {used} of {total}',
    noUsage: 'No account quota is read or shown.',
    fallback:
      'Guided discovery created these searches from local words and associations at your request.',
    modelDownload: 'Downloading the on-device model: {progress}%',
    modelDownloadDetected:
      'Chrome reports that its shared local AI model is already downloading. This extension has not created an AI session yet.',
    modelRequiredTitle: 'Local AI model required',
    modelRequiredFeatures:
      'Reasoned on-device AI suggestions and, on compatible GPUs, microphone transcription require Chrome’s local model. Prompts and audio stay on this device.',
    modelRequiredAlternative:
      'Guided discovery works without this model. Choosing it does not stop a Chrome-managed download already in progress.',
    ready: 'Suggestions are ready for review.',
    searched: 'Search sent to Spotify.',
    error: 'Could not create suggestions. Your input was not saved.',
    empty: 'Add a description or choose at least one filter.',
    categories: 'Filter categories',
    settings: 'Discovery settings',
    closeSettings: 'Close settings',
    localAiStatus: 'Local AI status',
    checkingModel: 'Checking local AI capabilities…',
    downloadModel: 'Download local AI',
    modelDownloadRequired:
      'Chrome reports that the model is ready to download. The extension will not create an AI session until you choose Download local AI.',
    modelDownloadProgress: 'Local AI model download progress',
    cancelDownload: 'Stop setup',
    continueDownload: 'Continue and show progress',
    modelReady: 'Local AI is ready for text and microphone input.',
    modelReadyText:
      'Local AI is ready for text. Microphone input needs compatible GPU audio support.',
    modelUnavailable:
      'Chrome currently reports local AI as unavailable, so a download cannot start yet.',
    modelRecoveryRequirements:
      'Check for a supported desktop Chrome, macOS 13 or later, at least 22 GB free on the Chrome profile volume, compatible CPU or GPU, and an unmetered connection. Restart Chrome after changing model-manager state.',
    modelError:
      'Chrome could not prepare local AI. Try the capability check again.',
    localAiGenerationError:
      'Local AI could not create this suggestion. Your draft is still here. Retry local AI or choose Guided discovery.',
    retryLocalAi: 'Retry local AI',
    retry: 'Retry',
    checkAgain: 'Check again',
    openAiStatus: 'Open Chrome AI status',
    useRules: 'Use Guided discovery',
    releaseSession: 'Release active AI session',
    releaseExplanation:
      'Stops active work, destroys this tab’s AI sessions, and resets context usage. Chrome manages the shared downloaded model files.',
    sessionReleased: 'Active local AI sessions were released.',
    removeModel: 'Remove downloaded local AI…',
    removeModelTitle: 'Remove local AI from Chrome',
    removeModelImpact:
      'This model is shared by Chrome. Removing it affects every site and extension that uses Chrome’s built-in AI on this browser profile.',
    removeModelBoundary:
      'For security, extensions cannot uninstall Chrome’s shared model directly. Finish the removal in Chrome’s model manager.',
    modelManagerAddress: 'Chrome model manager address',
    openModelManager: 'Open Chrome AI model manager',
    modelRemovalStepOne: 'Open the Broker State tab.',
    modelRemovalStepTwo:
      'Choose Uninstall Models (called Delete models in some Chrome versions), then wait until the Models size is 0 B or 0 KB.',
    modelRemovalStepThree:
      'Quit Chrome completely using its Quit command (Cmd+Q on macOS), then reopen it. The extension checks the fresh Prompt API status automatically; no overlay refresh is needed.',
    cancelRemoval: 'Close',
    modelManagerOpened:
      'Chrome’s AI model manager opened. Remove the model in Broker State, then quit Chrome completely and reopen it.',
    modelManagerOpenError:
      'Chrome could not open its model manager automatically. Enter the address shown above in a new Chrome tab.',
    generate: 'Generate search suggestions',
    openSettings: 'Open settings',
    composerHelp: 'Enter generates · Shift+Enter adds a new line',
    rulesReady:
      'Guided discovery is ready. It uses local words and curated associations; no model download is required.',
    allowAndStart: 'Allow and start',
    voicePermissionDenied:
      'Microphone permission was denied. You can change the site permission in Chrome or keep typing.',
    voiceNoDevice: 'No microphone was found. Connect one or keep typing.',
    voiceBusy: 'The microphone is unavailable or already in use.',
    voiceAudioUnsupported:
      'This device does not support local AI audio. Typed and guided discovery still work.',
    voiceModelError:
      'Local AI could not transcribe this recording. The audio was discarded.',
    voiceNoSpeech:
      'No speech was detected. Your existing draft was left unchanged.',
    voiceDraftReady:
      'Transcript added as a draft. Review it, then generate suggestions.',
    requestingMicrophone: 'Requesting microphone access…',
    processingVoice: 'Transcribing locally…',
    recordingLimit: 'Recording locally · 30 second limit',
    selectedFiltersCount: '{count} selected',
  },
  es: {
    launcher: 'Abrir descubrimiento musical',
    launcherAnalyzing: 'Creando sugerencias… Abrir descubrimiento musical',
    launcherTranscribing:
      'Transcribiendo localmente… Abrir descubrimiento musical',
    minimize: 'Minimizar descubrimiento musical',
    title: 'Descubre música a tu manera',
    independent: 'Extensión independiente · Sin afiliación con Spotify',
    language: 'Idioma',
    provider: 'Proveedor de descubrimiento',
    onDevice: 'IA en el dispositivo',
    rules: 'Descubrimiento guiado',
    theme: 'Tema',
    themeSession:
      'El tema se mantiene en esta pestaña y se reinicia al recargar.',
    themeAurora: 'Aurora',
    themeAuroraDescription: 'Cian, violeta y rosa prismáticos.',
    themePulse: 'Pulse',
    themePulseDescription: 'Energía coral cálida sobre grafito.',
    themeNightwave: 'Nightwave',
    themeNightwaveDescription: 'Azul profundo e índigo eléctrico.',
    inputLabel: 'Describe la música que quieres encontrar',
    inputPlaceholder: 'Prueba “432 Hz con piano, trompeta o violín”',
    analyzing: 'Creando sugerencias…',
    microphone: 'Usar micrófono',
    stopMicrophone: 'Detener grabación',
    voiceDisclosure:
      'El micrófono se usa solo cuando lo inicias. El audio se procesa localmente y no se guarda.',
    cancel: 'Cancelar',
    clearAll: 'Limpiar todo',
    undo: 'Deshacer',
    selectedFilters: 'Filtros seleccionados',
    removeFilter: 'Quitar {label}',
    suggestions: 'Rutas musicales razonadas',
    interpretation: 'Interpretación',
    evidence: 'Evidencia',
    supportingExamples: 'Empieza por',
    searchShort: 'Buscar',
    searchNamed: 'Buscar {name}',
    searchFor: 'Buscar {name} en Spotify',
    spotifySupported: 'Compatible con Spotify',
    keywordBased: 'Basado en palabras clave',
    aiSuggested: 'Sugerido por IA',
    exploratory:
      'Término de búsqueda exploratorio; sin verificación de audio ni efectos',
    exploratoryCompact: 'Exploratorio; audio y efectos sin verificar',
    clarificationTitle: '¿Qué significa {frequency} Hz aquí?',
    tuningOption: 'Referencia de afinación A4',
    toneOption: 'Tono destacado o palabra clave del título',
    usage: 'Contexto de sesión: {used} de {total}',
    noUsage: 'No se consulta ni muestra ninguna cuota de cuenta.',
    fallback:
      'Descubrimiento guiado creó estas búsquedas con palabras y asociaciones locales porque lo elegiste.',
    modelDownload: 'Descargando el modelo local: {progress}%',
    modelDownloadDetected:
      'Chrome indica que su modelo de IA local compartido ya se está descargando. Esta extensión todavía no ha creado una sesión de IA.',
    modelRequiredTitle: 'Se necesita un modelo de IA local',
    modelRequiredFeatures:
      'Las sugerencias razonadas con IA local y, con una GPU compatible, la transcripción por micrófono necesitan el modelo local de Chrome. Los prompts y el audio permanecen en este dispositivo.',
    modelRequiredAlternative:
      'Descubrimiento guiado funciona sin este modelo. Elegirlo no detiene una descarga que Chrome ya esté administrando.',
    ready: 'Las sugerencias están listas para revisar.',
    searched: 'Búsqueda enviada a Spotify.',
    error: 'No se pudieron crear sugerencias. Tu entrada no se guardó.',
    empty: 'Añade una descripción o elige al menos un filtro.',
    categories: 'Categorías de filtros',
    settings: 'Ajustes de descubrimiento',
    closeSettings: 'Cerrar ajustes',
    localAiStatus: 'Estado de la IA local',
    checkingModel: 'Comprobando las capacidades de IA local…',
    downloadModel: 'Descargar IA local',
    modelDownloadRequired:
      'Chrome indica que el modelo está listo para descargar. La extensión no creará una sesión de IA hasta que elijas Descargar IA local.',
    modelDownloadProgress: 'Progreso de descarga del modelo de IA local',
    cancelDownload: 'Detener configuración',
    continueDownload: 'Continuar y mostrar progreso',
    modelReady: 'La IA local está lista para texto y micrófono.',
    modelReadyText:
      'La IA local está lista para texto. El micrófono necesita una GPU compatible con audio.',
    modelUnavailable:
      'Chrome marca actualmente la IA local como no disponible, por lo que todavía no puede comenzar una descarga.',
    modelRecoveryRequirements:
      'Comprueba que usas Chrome de escritorio compatible, macOS 13 o posterior, al menos 22 GB libres en el volumen del perfil de Chrome, CPU o GPU compatible y una conexión no medida. Reinicia Chrome después de cambiar el estado del administrador de modelos.',
    modelError:
      'Chrome no pudo preparar la IA local. Vuelve a comprobar la capacidad.',
    localAiGenerationError:
      'La IA local no pudo crear esta sugerencia. El borrador sigue aquí. Reintenta la IA local o elige Descubrimiento guiado.',
    retryLocalAi: 'Reintentar IA local',
    retry: 'Reintentar',
    checkAgain: 'Comprobar de nuevo',
    openAiStatus: 'Abrir estado de IA de Chrome',
    useRules: 'Usar Descubrimiento guiado',
    releaseSession: 'Liberar sesión de IA activa',
    releaseExplanation:
      'Detiene el trabajo, destruye las sesiones de IA de esta pestaña y reinicia el uso de contexto. Chrome gestiona los archivos compartidos del modelo descargado.',
    sessionReleased: 'Las sesiones activas de IA local se liberaron.',
    removeModel: 'Eliminar IA local descargada…',
    removeModelTitle: 'Eliminar la IA local de Chrome',
    removeModelImpact:
      'Chrome comparte este modelo. Eliminarlo afecta a todos los sitios y extensiones que usan la IA integrada de Chrome en este perfil del navegador.',
    removeModelBoundary:
      'Por seguridad, las extensiones no pueden desinstalar directamente el modelo compartido de Chrome. Termina la eliminación en el administrador de modelos de Chrome.',
    modelManagerAddress: 'Dirección del administrador de modelos de Chrome',
    openModelManager: 'Abrir administrador de IA de Chrome',
    modelRemovalStepOne: 'Abre la pestaña Broker State.',
    modelRemovalStepTwo:
      'Selecciona Uninstall Models (llamado Delete models en algunas versiones de Chrome) y espera hasta que Models muestre 0 B o 0 KB.',
    modelRemovalStepThree:
      'Cierra Chrome por completo con su comando Salir (Cmd+Q en macOS) y vuelve a abrirlo. La extensión comprobará automáticamente el estado nuevo de Prompt API; no hace falta actualizar el overlay.',
    cancelRemoval: 'Cerrar',
    modelManagerOpened:
      'Se abrió el administrador de modelos de IA de Chrome. Elimina el modelo en Broker State, cierra Chrome por completo y vuelve a abrirlo.',
    modelManagerOpenError:
      'Chrome no pudo abrir automáticamente su administrador de modelos. Escribe la dirección mostrada arriba en una pestaña nueva de Chrome.',
    generate: 'Generar sugerencias de búsqueda',
    openSettings: 'Abrir ajustes',
    composerHelp: 'Intro genera · Mayús+Intro añade una línea',
    rulesReady:
      'Descubrimiento guiado está listo. Usa palabras y asociaciones locales; no hace falta descargar ningún modelo.',
    allowAndStart: 'Permitir e iniciar',
    voicePermissionDenied:
      'Se denegó el permiso del micrófono. Puedes cambiar el permiso del sitio en Chrome o seguir escribiendo.',
    voiceNoDevice:
      'No se encontró ningún micrófono. Conecta uno o sigue escribiendo.',
    voiceBusy: 'El micrófono no está disponible o ya está en uso.',
    voiceAudioUnsupported:
      'Este dispositivo no admite audio con IA local. El descubrimiento escrito y guiado sigue funcionando.',
    voiceModelError:
      'La IA local no pudo transcribir esta grabación. El audio se descartó.',
    voiceNoSpeech: 'No se detectó voz. El borrador existente no se modificó.',
    voiceDraftReady:
      'La transcripción se añadió como borrador. Revísala y luego genera sugerencias.',
    requestingMicrophone: 'Solicitando acceso al micrófono…',
    processingVoice: 'Transcribiendo localmente…',
    recordingLimit: 'Grabando localmente · límite de 30 segundos',
    selectedFiltersCount: '{count} seleccionados',
  },
} as const;

export type CopyKey = keyof (typeof COPY)['en'];

export function translate(
  locale: Locale,
  key: CopyKey,
  variables: Record<string, string | number> = {},
): string {
  let result: string = COPY[locale][key];
  for (const [name, value] of Object.entries(variables)) {
    result = result.replace(`{${name}}`, String(value));
  }
  return result;
}
