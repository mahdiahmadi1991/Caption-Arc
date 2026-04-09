import type { UiMessageCatalog } from "../types";

export const esMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "Acceso rápido",
        actions: {
            cancel: "Cancelar",
            clear: "Borrar",
            close: "Cerrar",
            collapse: "Colapso",
            confirmDelete: "Confirmar eliminación",
            delete: "Eliminar",
            expand: "Expandir",
            hide: "Ocultar",
            loading: "Cargando...",
            open: "Abierto",
            show: "Mostrar",
            working: "Trabajando..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "Aún no hay contenido.",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "reunión"
        },
        theme: {
            group: "Tema",
            system: "Usar tema del sistema",
            light: "Usar tema claro",
            dark: "Usar tema oscuro"
        },
        optional: "(opcional)",
        uiLanguage: {
            label: "Idioma de la interfaz",
            description: "Elija el idioma utilizado por la ventana emergente, la configuración, el historial y la interfaz de usuario durante la reunión.",
            system: "Usar el idioma del navegador",
            locales: {
                en: "English",
                fa: "فارسی",
                ar: "العربية",
                es: "Español",
                fr: "Français",
                de: "Deutsch",
                pt: "Português",
                ru: "Русский",
                hi: "हिन्दी",
                zh: "中文",
                ja: "日本語",
                ko: "한국어"
            }
        },
        units: {
            byte: "B",
            kilobyte: "KB",
            megabyte: "MB"
        }
    },
    options: {
        header: {
            eyebrow: "Configuración",
            title: "CaptionArc Configuración",
            subtitle: "Configure el servicio de IA compartido, los perfiles de reuniones, el comportamiento de traducción en vivo, la protección de la nube y la recuperación desde una superficie de control compacta.",
            openMeetingHistory: "Historial de reuniones"
        },
        navigation: {
            title: "Mapa de configuración",
            description: "Muévete sección por sección a través de la consola.",
            quickJump: "Salto rápido"
        },
        loading: "Cargando...",
        snapshot: {
            aiEngine: "motor de IA",
            serviceStatus: "Estado del servicio",
            model: "modelo",
            primaryProfile: "perfil primario",
            theme: "Tema",
            cloudVault: "Bóveda de la nube",
            meetingUi: "Interfaz de usuario de la reunión",
            none: "Ninguno",
            system: "Sistema",
            light: "Luz",
            dark: "oscuro",
            providerOne: "{count} proveedor",
            providerOther: "{count} proveedores",
            visibleClickThrough: "Visible · clic",
            visibleInteractive: "Visible · interactivo",
            hidden: "Oculto"
        },
        sections: {
            workspace: {
                eyebrow: "Espacio de trabajo",
                title: "Experiencia y valores predeterminados",
                description: "Establezca los valores predeterminados compartidos una vez y luego mantenga claramente separados el comportamiento visual, el flujo de la reunión y las reglas de archivo.",
                shortLabel: "Espacio de trabajo",
                mapHint: "Configuración predeterminada de apariencia, flujo de reuniones y archivo"
            },
            openAiService: {
                eyebrow: "OpenAI Servicio",
                title: "Servicio de IA compartido",
                shortLabel: "OpenAI",
                mapHint: "Traducción, resúmenes y asistente.",
                description: "Administre el servicio compartido OpenAI utilizado por la traducción en vivo, los resúmenes de reuniones y el asistente durante la reunión."
            },
            translation: {
                eyebrow: "Traducción",
                title: "Traducción en vivo",
                shortLabel: "Traducción",
                mapHint: "Comportamiento y ajuste de los subtítulos en vivo",
                description: "Ajuste cómo OpenAI maneja la traducción de subtítulos en vivo sin cambiar la generación de resúmenes o el comportamiento del asistente."
            },
            profiles: {
                eyebrow: "Reunión de IA",
                title: "Perfiles de reuniones",
                shortLabel: "Perfiles",
                mapHint: "Identidad, resumen y asistente.",
                description: "Los perfiles de reunión definen un tipo de reunión una vez y luego reutilizan esa identidad para la generación de resúmenes y el asistente en vivo."
            },
            cloudSync: {
                eyebrow: "Sincronización en la nube",
                title: "Bóveda personal en la nube",
                shortLabel: "Sincronización en la nube",
                mapHint: "Protección de archivos y proveedores",
                description: "Conecte Google Drive, OneDrive o ambos para mantener un archivo local protegido en todos sus dispositivos."
            },
            dataRecovery: {
                eyebrow: "Recuperación",
                title: "Recuperación de datos",
                shortLabel: "Recuperación",
                mapHint: "Copia de seguridad cifrada y restablecimiento",
                description: "La sincronización en la nube es el camino principal de continuidad. Utilice el archivo cifrado como copia de seguridad alternativa o elimine el archivo guardado cuando necesite un reinicio limpio."
            }
        },
        saveBadge: {
            saving: "Guardando cambios",
            attention: "necesita atencion",
            saved: "Guardado automáticamente"
        },
        workspace: {
            appearance: {
                title: "Apariencia",
                description: "Elija un tema fijo o deje que CaptionArc siga su sistema automáticamente."
            },
            uiLanguage: {
                title: "Idioma de la interfaz",
                description: "Aplique un idioma en la ventana emergente, la configuración, el historial de reuniones y la interfaz de usuario durante la reunión."
            },
            meetingFlow: {
                title: "Flujo de reuniones",
                description: "Controle cómo CaptionArc inicia la captura, ayuda con los subtítulos y decide si una reunión reincorporada debe continuar con la misma sesión."
            },
            captureStartup: {
                label: "Captura de inicio",
                off: {
                    name: "Mantener la captura desactivada",
                    description: "No inicialice el cuadro de captura durante la reunión para reuniones admitidas."
                },
                ask: {
                    name: "Pregunta en cada reunión",
                    description: "Muestre un breve mensaje de aprobación antes de que comience cualquier captura. Este es el valor predeterminado."
                },
                always: {
                    name: "Iniciar siempre la captura",
                    description: "Inicie el flujo de captura inmediatamente sin preguntar primero."
                }
            },
            captionActivation: {
                label: "Activación de subtítulos",
                guided: {
                    name: "Guiado",
                    description: "Mantener el flujo actual. CaptionArc muestra ayuda en línea para que puedas activar los subtítulos en vivo."
                },
                automatic: {
                    name: "Automático cuando sea posible",
                    description: "Después de unirse, CaptionArc intenta una vez activar los subtítulos en vivo automáticamente cuando la aplicación de la reunión lo admite y luego vuelve al flujo guiado si no puede."
                }
            },
            sessionContinuation: {
                title: "Ventana de continuación de sesión",
                description: "Decida cuánto tiempo debe ofrecerse CaptionArc para continuar la misma sesión después de volver a unirse.",
                windowLabel: "ventana",
                off: "Apagado",
                oneHour: "1 hora",
                hours: "{count} horas",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes} min"
            },
            inMeetingSurfaces: {
                title: "Superficies de reunión",
                description: "Defina cómo se ven y se comportan las superficies de la reunión en vivo mientras están en la pantalla."
            },
            overlayOpacity: {
                title: "Opacidad de superposición",
                description: "Los valores más bajos hacen que la reunión sea más visible debajo.",
                subtle: "sutil",
                solid: "Sólido"
            },
            overlayClickThrough: {
                label: "Modo de clic",
                description: "Deje que los clics pasen por las superficies de la reunión en vivo mientras permanecen visibles."
            },
            meetingArchive: {
                title: "Archivo de reuniones",
                description: "Decida qué datos de la reunión deben conservarse para su posterior revisión, exportación y generación de resúmenes."
            },
            storeMeetingChat: {
                label: "Chat de reunión de tienda",
                description: "Guarde el chat de reuniones compatible para que pueda aparecer en el historial, las exportaciones y los resúmenes de las reuniones."
            }
        },
        openAiService: {
            title: "OpenAI Servicio",
            sectionDescription: "Administre el servicio compartido OpenAI utilizado por la traducción en vivo, los resúmenes de reuniones y el asistente durante la reunión.",
            sharedService: "Servicio compartido",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "Un servicio compartido OpenAI permite la traducción en vivo, los resúmenes de reuniones y el asistente durante las reuniones.",
            setupDescription: "Agregue la clave API una vez, elija el modelo GPT predeterminado y confirme el acceso antes de confiar en cualquier flujo de trabajo impulsado por IA.",
            verificationLabel: "Pruebe la conexión OpenAI",
            verifyingLabel: "Probando la configuración actual OpenAI",
            highlights: {
                translation: "Traducción en vivo",
                summaries: "Resúmenes de reuniones",
                assistant: "asistente en vivo"
            },
            cards: {
                translationTitle: "Traducción",
                translationBody: "Subtítulos en vivo",
                summariesTitle: "Resúmenes",
                summariesBody: "Resultado posterior a la reunión",
                assistantTitle: "asistente",
                assistantBody: "Guía en vivo"
            },
            state: {
                setupRequired: {
                    label: "Configuración requerida",
                    description: "Agregue la clave API y confirme el modelo GPT predeterminado.",
                    impact: "Las funciones impulsadas por IA no están disponibles hasta que el servicio OpenAI esté completamente configurado."
                },
                actionRequired: {
                    label: "Acción requerida",
                    impact: "Es posible que las funciones impulsadas por IA no estén disponibles hasta que el servicio OpenAI vuelva a funcionar."
                },
                ready: {
                    label: "Listo",
                    impact: "OpenAI está disponible para traducción, resúmenes y orientación en vivo."
                },
                checking: {
                    label: "comprobando",
                    impact: "Se está realizando una verificación de conexión. El resultado actualizará cada área del producto impulsada por IA."
                },
                needsVerification: {
                    label: "Necesita verificación",
                    description: "Ejecute una verificación de conexión una vez para confirmar la clave y el modelo actuales.",
                    impact: "La configuración aún se puede editar, pero la salida de IA debe considerarse como no confirmada hasta que se verifique el servicio."
                }
            },
            banners: {
                needsAttention: "OpenAI necesita atención",
                finishSetup: "Finalice la configuración OpenAI",
                verifySetup: "Verifique la configuración OpenAI"
            },
            apiKeyInput: {
                label: "Clave API",
                provider: "OpenAI",
                storedLocally: "Almacenado localmente",
                credential: "credencial secreta",
                show: "Mostrar clave API",
                hide: "Ocultar clave API",
                helper: "Esta clave permanece en este dispositivo y se utiliza para traducción, resúmenes y orientación en vivo.",
                guide: "OpenAI Guía de claves API"
            },
            modelLabel: "modelo"
        },
        models: {
            gpt5Mini: {
                description: "El mejor valor predeterminado para traducción en vivo: rápido, confiable y de alta calidad para subtítulos ruidosos.",
                badge: "Recomendado"
            },
            gpt52: {
                description: "Es mejor cuando la precisión y los matices de la traducción importan más que la latencia o el costo.",
                badge: "La más alta calidad"
            },
            gpt51: {
                description: "Modelo potente y polivalente con un perfil equilibrado entre calidad y velocidad."
            },
            gpt5Nano: {
                description: "Opción de latencia más baja para respuestas muy rápidas, con una calidad de salida más simple.",
                badge: "Más rápido"
            },
            gpt41: {
                description: "Opción heredada estable si prefiere un modelo de traducción de uso general probado.",
                badge: "Legado"
            },
            gpt41Mini: {
                description: "Variante GPT-4.1 de menor costo para cargas de trabajo más livianas y calidad de traducción moderada.",
                badge: "Encendedor"
            }
        },
        translation: {
            bestFor: {
                title: "Lo mejor para",
                description: "Tono, terminología técnica, manejo de abreviaturas y limpieza de subtítulos ruidosos."
            },
            keepLean: {
                title: "Mantenlo delgado",
                description: "Las instrucciones más breves suelen traducirse más rápido y permanecer más estables en los subtítulos en vivo."
            },
            avoid: {
                title: "evitar",
                description: "Políticas largas, reglas repetidas o requisitos de formato que ralentizan cada solicitud de subtítulos."
            },
            instructionsLabel: "Instrucciones de traducción en vivo",
            instructionsHint: "Se aplica a cada solicitud de traducción de subtítulos. Úselo para limpieza de subtítulos, terminología y tono de traducción."
        },
        profiles: {
            identity: {
                eyebrow: "Identidad del perfil",
                description: "Estos campos definen el perfil de tipo de reunión en sí. Son compartidos por la generación de resumen y el asistente en vivo.",
                nameLabel: "Nombre del perfil",
                namePlaceholder: "Sincronización diaria",
                descriptionLabel: "Breve descripción",
                descriptionPlaceholder: "Registro recurrente del equipo"
            },
            summary: {
                eyebrow: "Resumen",
                description: "Estas configuraciones determinan cómo este perfil de reunión genera resúmenes: cuánto esfuerzo de IA utiliza y qué instrucciones se ejecutan durante la generación de resúmenes.",
                autoSummaryLabel: "Resumen automático de fin de reunión",
                autoSummaryDescription: "Cuando este perfil está activo, se inicia un resumen por sí solo una vez finalizada la reunión.",
                effortLabel: "Esfuerzo resumido",
                instructionsLabel: "Instrucciones resumidas",
                instructionsHint: "Se utiliza cuando este tipo de reunión se selecciona del historial de reuniones.",
                modes: {
                    economy: {
                        name: "Economía",
                        description: "Menor trabajo de IA. Lo mejor para reuniones más cortas cuando la velocidad es lo más importante.",
                        badge: "Más rápido"
                    },
                    balanced: {
                        name: "equilibrado",
                        description: "Recomendado. Adapta la estrategia de resumen para lograr confiabilidad sin abusar del trabajo adicional de IA."
                    },
                    thorough: {
                        name: "minucioso",
                        description: "Utiliza más trabajo de IA para reuniones más largas o más complejas para reducir los errores de resumen.",
                        badge: "mas lento"
                    }
                }
            },
            assistant: {
                eyebrow: "asistente",
                description: "Estas configuraciones definen cómo se comporta la guía en vivo cuando este perfil de reunión está activo.",
                enabledLabel: "Usar asistente con este perfil",
                enabledDescription: "Cuando está habilitado, este perfil de reunión puede generar orientación en vivo en reuniones admitidas.",
                disabledHint: "La configuración del Asistente permanece visible aquí para que puedas revisarla o ajustarla más tarde, pero permanece bloqueada hasta que se activa este perfil.",
                responseIntentLabel: "Modo de guía principal",
                responseFormatLabel: "Formato de respuesta",
                responseDepthLabel: "Profundidad de respuesta",
                responseToneLabel: "Tono de respuesta",
                deliveryBiasLabel: "Velocidad versus integridad",
                triggerPolicyLabel: "Cuándo debería activarse la orientación",
                participantScopeLabel: "¿Quién puede activar la orientación?",
                instructionsLabel: "Instrucciones del asistente",
                instructionsHint: "Se utiliza cuando este perfil de reunión está activo y el asistente genera orientación en vivo.",
                intents: {
                    answerForMe: {
                        name: "Responde por mi",
                        description: "Redacte la respuesta directa más sólida que el usuario pueda dar en este momento."
                    },
                    improveMyAnswer: {
                        name: "Mejorar mi respuesta",
                        description: "Apretar lo que el usuario ya parece estar diciendo."
                    },
                    suggestNextPoint: {
                        name: "Sugerir el siguiente punto",
                        description: "Ofrezca el siguiente tema de conversación útil para hacer avanzar la reunión."
                    },
                    summarizeRecentTurn: {
                        name: "Resumir giro reciente",
                        description: "Comprima el intercambio más reciente en un resumen rápido y utilizable."
                    },
                    surfaceRisks: {
                        name: "Riesgos superficiales",
                        description: "Resalte los riesgos, lagunas u objeciones que merecen atención."
                    },
                    coachMe: {
                        name: "Entrename",
                        description: "Guíe al usuario sobre cómo responder de manera más efectiva en el momento."
                    }
                },
                formats: {
                    bullets: {
                        name: "balas",
                        description: "Viñetas muy breves y fáciles de escanear.",
                        badge: "Más rápido"
                    },
                    talkingPoints: {
                        name: "Puntos de conversación",
                        description: "Puntos breves en estilo hablado que el usuario puede decir con naturalidad."
                    },
                    shortParagraph: {
                        name: "Párrafo corto",
                        description: "Un párrafo compacto cuando las viñetas se sentirían demasiado entrecortadas."
                    },
                    structuredSections: {
                        name: "Secciones estructuradas",
                        description: "Segmente la respuesta en pequeñas secciones etiquetadas cuando la claridad sea importante.",
                        badge: "mas lento"
                    },
                    script: {
                        name: "Guión",
                        description: "Escriba una frase más literal que el usuario pueda seguir de cerca."
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "Ultra Breve",
                        description: "Respuesta mínima diseñada para la máxima velocidad.",
                        badge: "Más rápido"
                    },
                    brief: {
                        name: "Breve",
                        description: "Breve y práctico. Buen valor predeterminado para reuniones en vivo."
                    },
                    standard: {
                        name: "Estándar",
                        description: "Un poco más de contexto cuando la velocidad sigue siendo importante."
                    },
                    expanded: {
                        name: "Ampliado",
                        description: "Más explicaciones cuando una respuesta más completa sea útil.",
                        badge: "mas lento"
                    }
                },
                tones: {
                    neutral: {
                        name: "Neutro",
                        description: "Equilibrado y profesional."
                    },
                    direct: {
                        name: "directo",
                        description: "Más conciso y firme."
                    },
                    supportive: {
                        name: "De apoyo",
                        description: "Útil y tranquilizador sin ser vago."
                    },
                    confident: {
                        name: "confiado",
                        description: "Contundente y resolutivo cuando el usuario necesita un fraseo más agudo."
                    },
                    analytical: {
                        name: "analítico",
                        description: "Más orientado al razonamiento y estructurado."
                    }
                },
                delivery: {
                    fastest: {
                        name: "Más rápido",
                        description: "Un fuerte sesgo hacia la velocidad y la utilidad rápida.",
                        badge: "Mejor velocidad"
                    },
                    balanced: {
                        name: "equilibrado",
                        description: "Cambie algo de velocidad para lograr una mayor integridad."
                    },
                    careful: {
                        name: "cuidado",
                        description: "Prefiera una mayor integridad cuando la reunión lo permita.",
                        badge: "mas lento"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "Preguntas y solicitudes",
                        description: "Se activa principalmente en turnos de preguntas o solicitudes.",
                        badge: "Carga más baja"
                    },
                    salienceFirst: {
                        name: "prominencia primero",
                        description: "También reaccione ante problemas, decisiones o puntos de tensión de gran relevancia."
                    },
                    proactive: {
                        name: "Proactivo",
                        description: "Modo más ansioso. Úselo sólo cuando desee más ayuda no solicitada.",
                        badge: "Carga más alta"
                    }
                },
                scope: {
                    everyone: {
                        name: "todos",
                        description: "Considere tanto al usuario como a otros participantes como desencadenantes válidos.",
                        badge: "mas pesado"
                    },
                    othersOnly: {
                        name: "Otros solamente",
                        description: "Ignora los turnos del propio usuario al decidir si responde.",
                        badge: "Encendedor"
                    }
                }
            },
            badges: {
                primary: "Primaria",
                alwaysAvailable: "Siempre disponible",
                customProfile: "Perfil personalizado",
                assistantOn: "Asistente en",
                autoSummary: "Resumen automático"
            },
            editor: {
                title: "Editor de perfil de reunión",
                description: "Elija un perfil, luego edite su identidad compartida, comportamiento resumido y comportamiento del asistente en vivo en un solo lugar.",
                addProfile: "Agregar perfil de reunión",
                listTitle: "Perfiles",
                totalCount: "{count} total",
                defaultOutputLanguage: "Idioma de salida AI predeterminado",
                untitled: "Perfil sin título",
                noDescription: "Aún no hay descripción.",
                noShortDescription: "Este perfil aún no tiene una breve descripción.",
                setAsPrimary: "Establecer como principal",
                builtInTitle: "Perfil predeterminado incorporado",
                builtInDescription: "Este perfil le brinda a CaptionArc un respaldo seguro de uso general tanto para la generación de resúmenes como para orientación en vivo cuando ningún tipo de reunión especializada encaja.",
                newName: "Nuevo tipo de reunión",
                newDescription: "Perfil de reunión personalizado",
                newPrompt: "Resuma esta reunión con precisión en el idioma solicitado. Concéntrese en los puntos que más importan para este tipo de reunión."
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive Carpeta de datos de la aplicación",
                    subtitle: "Almacenamiento de extensión privado dentro de su cuenta de Google."
                },
                oneDrive: {
                    title: "OneDrive Carpeta de aplicaciones",
                    subtitle: "Almacenamiento de extensión privado dentro de su cuenta de Microsoft."
                }
            },
            actions: {
                refreshStatus: "Actualizar estado",
                connect: "Conectar",
                retryNow: "Reintentar ahora",
                reconnect: "Reconectar",
                disconnect: "Desconectar"
            },
            overview: {
                title: "Descripción general de la bóveda",
                loadingDescription: "Cargando el estado actual de sincronización en la nube para este dispositivo.",
                offDescription: "Aún no hay ningún proveedor de nube personal conectado.",
                needsAttentionDescription: "Al menos un destino en la nube necesita intervención antes de que el archivo vuelva a estar completamente protegido.",
                syncingDescription: "La bóveda concilia activamente los cambios locales y remotos en segundo plano.",
                upToDateDescription: "Los destinos de nube conectados se actualizan con el archivo local actual."
            },
            stats: {
                currentDevice: "Dispositivo actual",
                connectedProviders: "Proveedores conectados",
                connectedProvidersNone: "Aún no hay destinos en la nube conectados",
                connectedProvidersOne: "Un destino de nube está activo",
                connectedProvidersTwo: "Ambos destinos de nube están activos",
                lastSuccessfulSync: "Última sincronización exitosa",
                lastSuccessfulSyncHint: "Basado en el punto de control de proveedor exitoso más reciente.",
                queueStatus: "Estado de la cola"
            },
            queue: {
                noQueuedChanges: "Sin cambios en cola",
                queuedChanges: "{count} cambios en cola",
                engineProcessing: "El motor está procesando el trabajo en este momento.",
                tasksReady: "{count} tareas están listas para la siguiente ejecución.",
                engineIdle: "El motor está inactivo hasta el próximo cambio local o remoto."
            },
            syncHealth: {
                title: "Salud de sincronización",
                attention: "Atención",
                status: "Estado"
            },
            pendingChoice: {
                title: "La configuración compartida ya existe en la nube",
                badge: "Se necesita elección",
                description: "Este dispositivo ya tiene su propia configuración compartida y la bóveda en la nube conectada tiene otra configuración. Elija cuál debería convertirse en el punto de partida para futuras sincronizaciones.",
                source: "Fuente: {provider}",
                keepLocal: "Mantener la configuración compartida de este dispositivo",
                useCloud: "Usar configuración compartida en la nube"
            },
            providerCard: {
                account: "cuenta",
                lastSuccessfulSync: "Última sincronización exitosa",
                providerStatus: "Estado del proveedor"
            },
            scope: {
                sharedTitle: "Sincronizado entre dispositivos",
                localTitle: "Este dispositivo solo",
                shared: {
                    meetingSessions: "Sesiones de reunión",
                    translations: "Traducciones",
                    summaries: "Resúmenes",
                    summaryProfiles: "Perfiles resumidos",
                    sharedSettings: "Configuraciones compartidas"
                },
                local: {
                    apiKeys: "Claves API",
                    verificationStatus: "Estado de verificación",
                    deviceIdentity: "Identidad del dispositivo"
                }
            },
            health: {
                syncing: "Sincronización",
                upToDate: "actualizado",
                retryingAutomatically: "Reintentando automáticamente",
                needsAttention: "necesita atencion",
                actionRequired: "Acción requerida",
                off: "Apagado"
            },
            connection: {
                notConnectedTitle: "No conectado",
                notConnectedDescription: "Conéctese para comenzar a proteger este archivo.",
                connectedTitle: "Conectado",
                connectedAt: "Conectado {time}"
            },
            sync: {
                notYet: "todavía no",
                scannedAt: "Escaneado {time}",
                noScanRecorded: "Aún no se ha registrado ningún escaneo."
            },
            statusMessage: {
                disconnected: "Desconectado. Este proveedor no recibe actualizaciones.",
                manualRetryAvailable: "Reintentos automáticos en pausa. Puede activar un reintento manual.",
                syncing: "Sincronizando cambios locales y remotos ahora.",
                retryingAutomatically: "Reintentando automáticamente en segundo plano.",
                needsAttention: "Necesita atención antes de que la protección se restablezca por completo.",
                actionRequired: "Se requiere una acción manual antes de que la sincronización pueda continuar.",
                upToDate: "El proveedor está completamente sincronizado.",
                connectedWaiting: "Conectado y esperando trabajo."
            }
        },
        dataRecovery: {
            backupFile: {
                title: "Archivo de copia de seguridad cifrado",
                description: "La copia de seguridad exportada contiene su configuración, perfiles resumidos, sesiones de reuniones guardadas, transcripciones, historial de chat, traducciones y resúmenes. Úselo cuando la sincronización en la nube no esté disponible o cuando necesite una instantánea cifrada portátil.",
                export: "Exportar todos los datos",
                import: "Importar archivo de copia de seguridad"
            },
            passphrase: {
                label: "Frase de contraseña de respaldo",
                placeholder: "Utilice al menos 8 caracteres",
                show: "Mostrar contraseña de respaldo",
                hide: "Ocultar contraseña de respaldo",
                hint: "Utilice la misma frase de contraseña para exportar e importar. Sin él, la copia de seguridad no se puede descifrar."
            },
            cards: {
                scope: {
                    title: "Alcance",
                    description: "Un archivo cifrado contiene tanto la configuración como el archivo completo de la sesión."
                },
                restoreBehavior: {
                    title: "Restaurar comportamiento",
                    description: "La importación reemplaza el archivo local actual y la configuración con el archivo de respaldo que elija, luego el motor de sincronización puede reconciliarse nuevamente."
                },
                useCase: {
                    title: "Caso de uso",
                    description: "Lo mejor para la migración de máquinas, la recuperación alternativa y la portabilidad de archivos."
                }
            },
            deleteArchive: {
                title: "Eliminar archivo guardado",
                syncedDescription: "Elimine el archivo sincronizado de este dispositivo, sus proveedores de nube conectados y otros dispositivos sincronizados. Su configuración, preferencias y perfiles resumidos de OpenAI permanecen intactos.",
                localDescription: "Elimine todas las sesiones de reuniones guardadas del almacenamiento local. Esto mantiene su configuración, preferencias y perfiles resumidos de OpenAI."
            },
            confirmDelete: {
                syncedTitle: "¿Eliminar el archivo sincronizado en todas partes?",
                localTitle: "¿Borrar los datos de la sesión guardada?",
                syncedLabel: "Eliminar archivo en todas partes",
                localLabel: "Borrar sesiones guardadas",
                syncedDescription: "Esto elimina permanentemente todas las sesiones de reuniones, transcripciones, registros de chat, traducciones y resúmenes guardados de este dispositivo, sus otros dispositivos sincronizados y sus cuentas en la nube conectadas. Tus configuraciones permanecen intactas.",
                localDescription: "Esto elimina todas las sesiones de reuniones, transcripciones, registros de chat, traducciones y resúmenes guardados del almacenamiento local. Tus configuraciones permanecen intactas."
            }
        },
        diagnostics: {
            launcherTitle: "Diagnóstico",
            launcherSubtitle: "Consola",
            closeConsole: "Cerrar la consola de diagnóstico",
            drawerLabel: "Consola de diagnóstico",
            closeDrawer: "Cerrar el cajón de diagnóstico",
            actions: {
                enableSession: "Habilitar esta sesión",
                disableSession: "Deshabilitar esta sesión",
                copyVisible: "Copiar registros visibles",
                copiedVisible: "Registros visibles copiados",
                refresh: "Actualizar diagnóstico",
                clear: "Diagnóstico claro",
                enableSessionDiagnostics: "Habilitar diagnóstico de sesión"
            },
            filters: {
                all: "Todos",
                searchPlaceholder: "Título de búsqueda, resumen, clave, dominio, característica, proveedor",
                visibleCounts: "Conteos visibles:",
                error: "error",
                warn: "Advertir",
                info: "Información",
                debug: "Depurar",
                trace: "traza"
            },
            summary: {
                loadedWindowTitle: "ventana cargada",
                loadedWindowBody: "Últimos {limit} eventos canónicos máx.",
                visibleNowTitle: "Visible ahora",
                visibleNowBody: "Los filtros y la búsqueda se actualizan únicamente en el lado del cliente.",
                snapshotsTitle: "Instantáneas",
                noProvider: "ningún proveedor",
                noResolvedSnapshot: "No hay ninguna instantánea resuelta en la carga útil actual.",
                lastSyncTitle: "Última sincronización",
                waiting: "esperando",
                lastSyncBody: "La actualización se pausa mientras esta pestaña está oculta.",
                eventOne: "{count} evento",
                eventOther: "{count} eventos",
                snapshotOne: "{count} instantánea",
                snapshotOther: "{count} instantáneas"
            },
            row: {
                session: "Sesión",
                request: "Solicitar",
                correlation: "Correlación",
                tab: "Pestaña",
                frame: "marco",
                document: "Documento",
                origin: "Origen",
                copied: "Copiado",
                copyRow: "Copiar fila",
                showDetails: "Mostrar detalles",
                hideDetails: "Ocultar detalles",
                senderUrl: "URL del remitente",
                eventKey: "Clave de evento",
                description: "Descripción",
                eventData: "Datos del evento"
            },
            states: {
                requestErrorPrefix: "Error en la actualización del tiempo de ejecución. La última carga útil exitosa permanece visible hasta el siguiente reintento.",
                captureOffTitle: "La captura de diagnóstico está desactivada para esta sesión.",
                captureOffBody: "El visor está disponible, pero no llegarán nuevos registros hasta que habilite los diagnósticos para esta sesión. Producción mantiene desactivada su política de captura de referencia a menos que la anule intencionalmente aquí.",
                waitingTitle: "Esperando eventos de diagnóstico.",
                waitingBody: "El cajón está conectado al colector canónico. Una vez que la extensión emita nuevos diagnósticos estructurados, aparecerán aquí automáticamente.",
                noMatchesTitle: "Ningún evento coincide con los filtros actuales.",
                noMatchesBody: "Pruebe con un filtro de nivel más amplio o borre el cuadro de búsqueda para volver a mostrar los eventos."
            },
            status: {
                unavailableLabel: "No disponible",
                unavailableDescription: "El visor de diagnósticos no está habilitado para este entorno.",
                syncIssueLabel: "Problema de sincronización",
                syncIssueDescription: "El visor no pudo actualizar los diagnósticos desde el tiempo de ejecución.",
                connectingLabel: "Conectando",
                connectingDescription: "El visor está cargando la configuración de diagnóstico actual.",
                sessionOffLabel: "Sesión cerrada",
                sessionOffDescription: "La captura de diagnóstico está actualmente deshabilitada para esta sesión. Los eventos capturados existentes permanecen visibles.",
                pausedLabel: "En pausa",
                pausedDescription: "El sondeo se detiene mientras la pestaña de opciones está oculta y se reanuda cuando vuelve a ser visible.",
                liveLabel: "en vivo",
                liveDescription: "El espectador está sondeando la última carga útil de diagnóstico canónico.",
                readyLabel: "Listo",
                readyDescription: "Abra el cajón para inspeccionar los últimos diagnósticos canónicos."
            },
            requestErrors: {
                runtimeUnavailable: "La mensajería en tiempo de ejecución no está disponible en el contexto actual.",
                loadConfigFailed: "No se pudo cargar la configuración de diagnóstico.",
                loadPayloadFailed: "No se pudo cargar la carga útil de diagnóstico.",
                updateConfigFailed: "No se pudo actualizar la configuración de diagnóstico.",
                clearFailed: "No se pudieron borrar los diagnósticos."
            }
        },
        runtime: {
            save: {
                loading: "Cargando configuración...",
                saving: "Guardando cambios automáticamente...",
                saved: "Todos los cambios se guardan automáticamente.",
                loadFailed: "No se pudo cargar la configuración guardada.",
                autosaveFailed: "Error al guardar automáticamente. Su último cambio aún es local en esta pestaña."
            },
            connection: {
                addApiKey: "Agregue su clave API OpenAI y luego pruebe la conexión.",
                runTest: "Ejecute Probar conexión para verificar su clave OpenAI y el modelo seleccionado.",
                testing: "Probando la configuración actual OpenAI...",
                apiKeyRequired: "Se requiere OpenAI clave API antes de poder probar la conexión.",
                modelRequired: "Elija un modelo OpenAI antes de probar la conexión.",
                apiKeyRejected: "OpenAI rechazó la clave API.",
                modelUnavailable: "Modelo OpenAI no disponible para esta clave: {model}.",
                requestFailed: "La solicitud OpenAI falló con {status}.",
                networkFailed: "No se pudo comunicar con OpenAI. Verifique su conexión de red e inténtelo nuevamente.",
                reachable: "OpenAI es accesible y {model} está disponible."
            },
            dataTransfer: {
                idle: "Utilice una copia de seguridad cifrada como ruta de recuperación alternativa para la configuración y el historial de sesiones, o elimine el archivo guardado en todas partes cuando la sincronización en la nube esté conectada.",
                exporting: "Preparando un archivo cifrado alternativo con configuración e historial de sesiones...",
                exportSuccess: "Copia de seguridad cifrada exportada con {count} sesión guardada{suffix}.",
                exportFailed: "No se pudo exportar el paquete de datos.",
                importing: "Descifrando la copia de seguridad y restaurando la configuración y el historial de sesiones...",
                importSuccess: "Copia de seguridad importada. Restaurada {count} sesión{suffix}.",
                importFailed: "No se pudo importar el paquete de datos.",
                clearingSynced: "Eliminando el archivo sincronizado de este dispositivo y propagando la eliminación a los proveedores de nube conectados...",
                clearingLocal: "Eliminando todas las sesiones guardadas del almacenamiento local...",
                clearSuccessSynced: "El archivo se eliminó de este dispositivo y la eliminación se puso en cola para sus proveedores de nube conectados. Su configuración fue preservada.",
                clearSuccessLocal: "Se eliminaron las sesiones guardadas. Su configuración fue preservada.",
                clearFailed: "No se pudo borrar el archivo de la sesión guardada."
            },
            cloudSync: {
                idleAvailable: "La sincronización en la nube está disponible cuando conectas Google Drive o OneDrive.",
                idleConnected: "El estado de sincronización en la nube está actualizado.",
                idleDisconnected: "Conecte un proveedor de nube para proteger su archivo automáticamente.",
                loadFailed: "No se pudo cargar el estado de sincronización en la nube.",
                updated: "Estado de sincronización en la nube actualizado.",
                actionFailed: "Error en la acción de sincronización en la nube.",
                connecting: "Conectando proveedor de nube...",
                disconnecting: "Desconectando el proveedor de la nube...",
                retrying: "Reintentando la sincronización en la nube...",
                reconnecting: "Actualizando el acceso al proveedor de la nube...",
                resolvingChoice: "Aplicando la opción de configuración compartida..."
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "Archivo",
            title: "Historial de reuniones",
            subtitle: "Explore sesiones guardadas, vuelva a abrir detalles de transcripciones, exporte registros y administre el almacenamiento local sin salir de la extensión.",
            openSettings: "Abrir configuración",
            searchLabel: "Sesiones de búsqueda",
            searchPlaceholder: "Busque títulos, ID de reuniones, oradores, subtítulos o traducciones...",
            clearSearch: "Borrar búsqueda",
            sortLabel: "ordenar",
            providerFilterLabel: "Filtrar por proveedor",
            statusFilterLabel: "Filtrar por estado",
            resetFilters: "Restablecer filtros",
            resultCountOne: "{count} reunión",
            resultCountOther: "{count} reuniones",
            resultCountFiltered: "{filtered} de {total} reuniones",
            translatedCaptionCountOne: "{count} título traducido almacenado en su archivo.",
            translatedCaptionCountOther: "{count} subtítulos traducidos almacenados en su archivo.",
            archiveSnapshotTitle: "Instantánea del archivo",
            archiveSnapshotSessions: "Sesiones",
            archiveSnapshotCurrentView: "Vista actual",
            archiveSnapshotProviderFocus: "Enfoque del proveedor",
            archiveSnapshotStarFilter: "Filtro de estrellas",
            archiveSnapshotUrlHint: "El estado de búsqueda, los filtros, la clasificación y la sesión abierta actualmente se reflejan en la URL de la página, por lo que la actualización y la navegación resultan predecibles.",
            storageFullTitle: "El almacenamiento local se está llenando",
            storageFullDescription: "Su archivo está utilizando el {percentage}% de la cuota de extensión local. Revise sesiones anteriores o exporte registros importantes desde Configuración antes de que el almacenamiento se convierta en una limitación.",
            reviewOldestSessions: "Revisar sesiones más antiguas",
            loadingTitle: "Cargando historial de reuniones",
            loadingDescription: "Obteniendo sus sesiones guardadas, estado de almacenamiento y metadatos resumidos del trabajo.",
            detailLoadingTitle: "Cargando detalles de la sesión",
            detailLoadingDescription: "Preparar la transcripción completa, los metadatos, los resúmenes y el estado del trabajo para esta reunión.",
            emptyInitialTitle: "Aún no hay historial de reuniones",
            emptyInitialDescription: "Las sesiones de reunión aparecen aquí automáticamente después de que la extensión captura subtítulos en una reunión de navegador compatible. Una vez que te unas a una llamada y los subtítulos fluyan, el archivo comenzará a construirse por sí solo.",
            emptyFilteredTitle: "Ninguna reunión coincide con esta vista",
            emptyFilteredDescription: "La búsqueda actual, el filtro de proveedor o la vista de clasificación no coincidieron con ninguna sesión guardada. Restablezca la vista actual o revise sus sesiones más antiguas para continuar navegando.",
            deleteSessionTitle: "¿Eliminar esta sesión de reunión?",
            deleteSessionDescription: "Esto elimina \"{title}\" del historial local. Esta acción no se puede deshacer.",
            deleteSessionConfirm: "Eliminar sesión"
        },
        dependency: {
            title: "OpenAI necesita atención",
            actionRequired: "Acción requerida",
            needsVerification: "Necesita verificación",
            impact: "{message} La generación de resúmenes, la traducción de subtítulos guardados y la revisión del asistente no están disponibles hasta que el servicio esté listo nuevamente."
        },
        filters: {
            providerAll: "Todos los proveedores",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams Web",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "Lo nuevo primero",
            sortOldest: "El más viejo primero",
            starAll: "Todas las sesiones",
            starStarred: "Solo destacados",
            activeQuery: "Consulta: \"{query}\"",
            activeViewingOldest: "Ver primero las reuniones más antiguas"
        },
        storageIndicator: {
            usage: "{used} de {quota}",
            highUsage: "Alto uso",
            reviewSoon: "Revisar pronto",
            healthy: "saludable"
        },
        confirmDialog: {
            closeDialog: "Cerrar diálogo",
            confirmAction: "Confirmar acción"
        },
        sessionList: {
            today: "hoy",
            yesterday: "ayer",
            justNow: "Justo ahora",
            inProgress: "En progreso",
            noPreview: "Aún no hay subtítulos capturados ni mensajes de chat de reunión disponibles para esta sesión.",
            removeStar: "Quitar estrella",
            starSession: "Sesión estrella",
            openDetails: "Abrir detalles",
            deleteSession: "Eliminar sesión",
            generatingSummary: "Generando resumen",
            starred: "Destacado",
            captionCountOne: "{count} título",
            captionCountOther: "{count} subtítulos",
            translatedOriginalOnly: "Sólo originales",
            translatedCount: "{count} traducido",
            chatCountOne: "{count} charla",
            chatCountOther: "{count} charlas",
            directCall: "llamada directa",
            hideIdentifiers: "Ocultar identificadores",
            showIdentifiers: "Mostrar identificadores",
            loadingMore: "Cargando más reuniones..."
        },
        detail: {
            backToHistory: "volver a la historia",
            reviewDescription: "Revise la transcripción capturada, las traducciones guardadas, la cobertura de extracción y los resúmenes de IA de esta reunión.",
            inProgress: "En progreso",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}m",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}m {seconds}s"
            },
            actions: {
                saveTitle: "Guardar título",
                cancelTitleEditing: "Cancelar edición de título",
                renameSession: "Cambiar nombre de sesión",
                retry: "Reintentar"
            },
            exportMenu: {
                open: "Abrir opciones de exportación",
                close: "Cerrar opciones de exportación",
                title: "Exportar transcripción",
                description: "Elija si las traducciones guardadas y los resúmenes guardados deben incluirse en la exportación Markdown.",
                includeTranslationsLabel: "Incluir traducciones guardadas",
                includeTranslationsAvailable: "Las traducciones guardadas se incluirán en el archivo de exportación.",
                includeTranslationsUnavailable: "Aún no hay traducciones guardadas disponibles para esta sesión.",
                includeSummariesLabel: "Incluir resúmenes guardados",
                includeSummariesAvailable: "Los resúmenes de reuniones guardados se adjuntarán al archivo de exportación.",
                includeSummariesUnavailable: "Aún no hay resúmenes de reuniones guardados disponibles para esta sesión.",
                export: "Descargar Markdown"
            },
            metadataLabels: {
                provider: "Proveedor",
                callTitle: "Título de la llamada",
                meetingTitle: "Título de la reunión",
                meetingUrl: "URL de la reunión",
                started: "iniciado",
                ended: "Terminado",
                status: "Estado",
                primaryId: "ID principal",
                meetingCode: "código de reunión",
                meetingId: "ID de reunión",
                conferenceId: "ID de conferencia",
                meetingNumber: "Número de reunión",
                threadId: "ID del hilo",
                callType: "tipo de llamada"
            },
            status: {
                ended: "Terminado",
                live: "en vivo"
            },
            sections: {
                metadata: {
                    title: "Metadatos de la reunión",
                    description: "Revise la identidad de la reunión, el horario y los identificadores almacenados para esta sesión guardada.",
                    expand: "Mostrar metadatos",
                    collapse: "Ocultar metadatos"
                },
                continuations: {
                    title: "Continuaciones de sesión",
                    description: "Inspeccione cada reincorporación y el tiempo total transcurrido fuera antes de que se reanudara la misma sesión.",
                    expand: "Mostrar continuaciones",
                    collapse: "Ocultar continuaciones"
                },
                extraction: {
                    title: "Informe de extracción",
                    description: "Inspeccione la cobertura de la transcripción, la extracción del hablante y las huellas dactilares de integridad del archivo guardado.",
                    expand: "Mostrar informe de extracción",
                    collapse: "Ocultar informe de extracción"
                },
                summary: {
                    title: "Resumen de la reunión",
                    description: "Genere o revise resúmenes de IA guardados para este perfil e idioma de reunión.",
                    expand: "Mostrar resumen",
                    collapse: "Ocultar resumen"
                },
                transcript: {
                    title: "Transcripción",
                    description: "Revise los subtítulos guardados, el chat de la reunión, las traducciones y los resultados del asistente en orden cronológico."
                }
            },
            stats: {
                capturedCaptions: "Subtítulos capturados",
                translatedCaptions: "Subtítulos traducidos",
                duration: "Duración",
                meetingChatMessages: "Mensajes de chat de reuniones",
                rejoins: "Se reincorpora",
                totalAwayTime: "Tiempo total fuera",
                lastRejoin: "Último reingreso",
                canonicalEvents: "Eventos canónicos",
                uniqueSpeakers: "Oradores únicos",
                metadataCoverage: "Cobertura de metadatos",
                providerIds: "ID de proveedor"
            },
            rejoin: {
                label: "Volver a unirse a {index}",
                awayFor: "Ausente por {gap}",
                leftMeeting: "reunión izquierda",
                returnedToMeeting: "Regresó a la reunión"
            },
            extraction: {
                eventLogFingerprint: "Huella digital del registro de eventos",
                searchFingerprint: "Buscar huella digital",
                summaryFingerprint: "Resumen de huellas dactilares",
                timelineRange: "Rango de línea de tiempo",
                lastEvent: "último evento",
                noEvents: "Sin eventos",
                coverageBreakdown: "Desglose de cobertura",
                sessionOffsets: "Compensaciones de sesión",
                translatedEvents: "Eventos traducidos",
                finalCaptionEvents: "Eventos de subtítulos finales",
                speakers: "Altavoces",
                noSpeakers: "No se detectaron altavoces.",
                warnings: "Advertencias"
            },
            summaryJob: {
                states: {
                    preflighting: "Preparando resumen",
                    extracting: "Analizando la transcripción",
                    merging: "Fusionando evidencia",
                    synthesizing: "Resumen de escritura",
                    continuing: "Resumen continuo",
                    reconciling: "Salida de conciliación",
                    completed: "Resumen listo",
                    failed: "Resumen fallido",
                    cancelled: "Resumen cancelado",
                    default: "Preparando resumen"
                },
                progress: {
                    ready: "Listo",
                    preparing: "Preparando evidencia",
                    step: "Paso {current} de {total}",
                    mergingEvidence: "Fusionando evidencia",
                    preparingFinal: "Preparando resumen final",
                    continuation: "Continuación {current} de {total}",
                    continuing: "Generación continua",
                    finalChecks: "Ejecución de controles finales"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI no disponible",
                unavailable: "La generación de resumen no está disponible",
                generating: "Generando resumen",
                generateAnother: "Generar otro resumen",
                generate: "Generar resumen de reunión",
                generateWithProfile: "Utilice {profile} para crear o actualizar un resumen de reunión guardado.",
                selectMeetingType: "Seleccione un perfil de reunión y un idioma de salida antes de generar un resumen.",
                generateAnotherAction: "Generar otro resumen {profile}",
                generateAction: "Generar resumen {profile}",
                genericProfile: "perfil seleccionado",
                inProgress: "La generación del resumen aún está en progreso.",
                noSummaryYet: "Aún no se ha guardado ningún resumen de {profile} en {language}.",
                noSummaryHint: "Genere uno ahora o cambie el perfil o el idioma de la reunión para revisar otra versión guardada.",
                latestSaved: "Último resumen guardado: {profile} en {language}.",
                evidenceChunks: "{count} fragmentos de evidencia",
                continuations: "{count} continuaciones",
                reconciled: "reconciliado",
                executionStrategy: {
                    singleShot: "Disparo único",
                    structuredSingleShot: "Tiro único estructurado",
                    multiStage: "multietapa"
                },
                version: {
                    latest: "Último · {time}",
                    automatic: "Automático",
                    manual: "manuales",
                    auto: "Automático",
                    alt: "perfil alternativo",
                    session: "Perfil de sesión",
                    default: "Perfil predeterminado",
                    sessionProfile: "Perfil de sesión: {name}",
                    unknownProfile: "Perfil desconocido",
                    generatedWithAnotherProfile: "Generado con otro perfil",
                    generatedAt: "Generado {time}"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "La traducción de subtítulos guardados no está disponible",
                translatingAllCaptions: "Traduciendo todos los subtítulos",
                translateAllCaptions: "Traducir todos los subtítulos",
                batchTranslateSubtitle: "Cree traducciones guardadas para cada título en {language}.",
                translateAllCaptionsTo: "Traducir todos los subtítulos a {language}",
                emptyTitle: "Sin transcripciones ni elementos de chat",
                emptyDescription: "Esta sesión aún no tiene subtítulos guardados ni mensajes de chat de reunión.",
                meetingChat: "Charla de reunión",
                translationAvailable: "Traducción guardada",
                message: "Mensaje",
                caption: "Subtítulo",
                translation: "Traducción",
                noChatTranslation: "Aún no hay traducción guardada para este mensaje de chat.",
                noCaptionTranslation: "Aún no hay traducción guardada para este título.",
                translatingChatMessage: "Traducir mensaje de chat",
                translatingCaption: "Traduciendo título",
                translateChatMessage: "Traducir mensaje de chat",
                translateCaption: "Traducir título",
                translateThisItem: "Traducir este {item} a {language}",
                aiAssistant: "asistente de IA",
                triggeredByChat: "Activado por este mensaje de chat",
                triggeredByCaption: "Activado por este título"
            },
            export: {
                sessionDetailsHeading: "Detalles de la sesión",
                titleLabel: "Título",
                providerLabel: "Proveedor",
                startedLabel: "iniciado",
                primaryIdLabel: "ID principal",
                endedLabel: "Terminado",
                durationLabel: "Duración",
                statusLabel: "Estado",
                capturedChatMessagesLabel: "Mensajes de chat capturados",
                savedTranslationsLabel: "Traducciones guardadas",
                totalAwayBeforeRejoinsLabel: "Tiempo total fuera antes de reincorporarse",
                savedSummariesHeading: "Resúmenes guardados",
                generatedLabel: "generado",
                modelLabel: "modelo",
                summaryEffortLabel: "Esfuerzo resumido",
                executionStrategyLabel: "Estrategia de ejecución",
                evidenceChunksLabel: "Fragmentos de evidencia",
                continuationsLabel: "Continuaciones",
                reconciledLabel: "reconciliado",
                coveredCaptionsLabel: "Subtítulos cubiertos",
                yes: "si",
                sessionContinuationsHeading: "Continuaciones de sesión",
                leftAtLabel: "A la izquierda en",
                rejoinedAtLabel: "Se reincorporó a",
                awayForLabel: "Lejos por",
                sessionResumeHeading: "La sesión {index} se reanudó a las {time} después del {gap}"
            }
        },
        runtime: {
            settingsLoadFailed: "No se pudo cargar la configuración de la extensión.",
            loadHistoryFailed: "No se pudo cargar el historial de reuniones.",
            loadSessionDetailFailed: "No se pudieron cargar los detalles de la sesión de la reunión.",
            sessionDeleted: "Sesión eliminada.",
            sessionDeleteFailed: "No se pudo eliminar la sesión.",
            titleUpdated: "Título actualizado.",
            titleUpdateFailed: "No se pudo actualizar el título.",
            starUpdateFailed: "No se pudo actualizar la estrella.",
            sessionNotFound: "Sesión de reunión no encontrada.",
            chatMessageNotFound: "Mensaje de chat no encontrado.",
            captionNotFound: "Línea de título no encontrada.",
            translationFailed: "La traducción falló.",
            captionTranslated: "Título traducido a {language}.",
            chatTranslated: "Mensaje de chat traducido a {language}.",
            captionTranslateFailed: "No se pudo traducir el título.",
            chatTranslateFailed: "No se pudo traducir el mensaje de chat.",
            analyzingTranscript: "Analizando la transcripción",
            noSummarySource: "No hay transcripciones ni contenido del chat de la reunión disponibles para resumir.",
            summaryGenerationFailed: "Error al generar el resumen.",
            summaryGenerated: "Resumen generado en {language}.",
            summaryCancelFailed: "No se pudo cancelar la generación del resumen.",
            batchTranslationFailed: "No se pudieron traducir todos los subtítulos.",
            allCaptionsAlreadyTranslated: "Todos los subtítulos ya tienen {language} traducciones.",
            batchTranslatedOne: "Título {count} traducido a {language}{suffix}.",
            batchTranslatedOther: "{count} subtítulos traducidos a {language}{suffix}.",
            batchSkippedSuffix: ", {count} omitido",
            errorOutdated: "{fallback} Detalles: el tiempo de ejecución de la extensión no está actualizado. Vuelva a cargar la extensión y vuelva a intentarlo.",
            errorNoDetails: "{fallback} Detalles: No se devolvieron detalles de error adicionales.",
            errorModelStopped: "{fallback} Detalles: el modelo se detuvo antes de que se pudiera completar el resumen. La aplicación ahora vuelve a intentarlo automáticamente, pero esta respuesta aún no se pudo recuperar por completo. Intente regenerar o utilizar un modelo con un presupuesto de producción mayor.",
            errorNoProviderDetails: "{fallback} Detalles: No se devolvieron detalles adicionales del proveedor.",
            errorWithDetails: "{fallback} Detalles: {details}"
        }
    },
    content: {
        copyFeedback: "¡Copiado!",
        timeline: {
            meetingChat: "Charla de reunión"
        },
        translation: {
            errorFallback: "error",
            requestFailed: "La traducción falló",
            retryAction: "Reintentar traducción"
        },
        empty: {
            waitingForCaptionsTitle: "Esperando subtítulos...",
            waitingForCaptionsBody: "Habilite los subtítulos en su reunión para comenzar a capturar texto",
            waitingForCaptionsGoogleMeet: "Active los subtítulos en Google Meet para comenzar a capturar texto",
            waitingForCaptionsTeams: "Abra Más > Idioma y voz > Mostrar subtítulos en vivo para comenzar a capturar texto",
            waitingForCaptionsZoom: "Abra Más > Subtítulos > Mostrar subtítulos para comenzar a capturar texto",
            capturePendingTitle: "La captura te está esperando",
            capturePendingBody: "Responda el mensaje de inicio para permitir que esta reunión comience a capturarse.",
            captureStartingTitle: "Iniciando captura",
            captureStartingBody: "Preparando la sesión de la reunión y los observadores de inicio ahora.",
            captureDismissedTitle: "La captura se mantuvo apagada",
            captureDismissedBody: "Esta reunión fue descartada del mensaje de inicio y permanecerá desactivada.",
            sessionEndedTitle: "Sesión finalizada",
            sessionEndedBody: "Esta reunión ya no está activa en esta página.",
            waitingToJoinTitle: "Esperando para unirse a la reunión",
            waitingToJoinBody: "Únase a la reunión para iniciar el cronómetro de la sesión y capturar el flujo.",
            enablingCaptionsTitle: "Habilitar subtítulos en vivo",
            enablingCaptionsBody: "CaptionArc está intentando activar los subtítulos para esta reunión ahora.",
            readyTitle: "La captura está lista",
            readyBody: "Comience a hablar y las líneas de subtítulos aparecerán aquí a medida que continúe la reunión.",
            close: "Cerrar"
        },
        sessionSeparator: {
            title: "Sesión {index}",
            detail: "Se reincorporó {time} · Ausente {gap}",
            ariaLabel: "Sesión {index} reanudada"
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "La IA necesita atención",
                finishOpenAiSetup: "Finalizar la configuración de OpenAI",
                openAiUnavailable: "OpenAI no está disponible",
                capturePendingTitle: "Captura pendiente",
                waitingForAnswer: "Esperando tu respuesta",
                startingCaptureTitle: "Iniciando captura",
                preparingMeeting: "Preparando esta reunión",
                captureSkippedTitle: "Captura omitida",
                meetingStaysOff: "Esta reunión se queda fuera",
                sessionEndedTitle: "Sesión finalizada",
                rejoinToContinue: "Volver a unirse para continuar o reiniciar",
                waitingToJoinTitle: "esperando para unirse",
                sessionStartsAfterJoin: "La sesión comienza después de unirse",
                enablingCaptionsTitle: "Habilitar subtítulos",
                tryingLiveCaptions: "Intentando activar los subtítulos en vivo",
                setupRequiredTitle: "Configuración requerida",
                turnOnMeetingCaptions: "Activar subtítulos de reuniones",
                translationIssueTitle: "Problema de traducción",
                retryAvailable: "Reintentar está disponible",
                translatingLiveTitle: "Traduciendo en vivo",
                liveTranslationTitle: "Traducción en vivo",
                capturingLiveTitle: "Capturando en vivo",
                originalCaptionsOnly: "Solo subtítulos originales",
                readyToCaptureTitle: "Listo para capturar",
                waitingForSpeech: "esperando el discurso",
                waitingForCaptionsTitle: "Esperando subtítulos"
            },
            main: {
                captureOnHoldTitle: "Captura en espera",
                waitingForAnswer: "Esperando tu respuesta",
                startingCaptureTitle: "Iniciando captura",
                preparingMeeting: "Preparando esta reunión",
                captureSkippedTitle: "Captura omitida",
                meetingStaysOff: "Esta reunión se queda fuera",
                sessionEndedTitle: "Sesión finalizada",
                rejoinToContinue: "Volver a unirse para continuar o reiniciar",
                waitingToJoinTitle: "esperando para unirse",
                meetingOverlay: "Superposición de reuniones",
                enablingLiveCaptionsTitle: "Habilitar subtítulos en vivo",
                preparingCapture: "Preparando la captura",
                liveCaptureTitle: "Captura en vivo"
            },
            profileControl: {
                defaultBadge: "Predeterminado"
            },
            translationToggle: {
                label: "Automático"
            },
            translationDock: {
                eyebrow: "Traducción en vivo",
                consent: {
                    title: "La captura necesita confirmación",
                    body: "Apruebe el mensaje de inicio para comenzar a capturar esta reunión.",
                    badge: "esperando"
                },
                starting: {
                    title: "Iniciando captura",
                    body: "Preparando la sesión y el canal de observadores ahora.",
                    badge: "Comenzando"
                },
                dismissed: {
                    title: "La captura se mantuvo apagada",
                    body: "Esta reunión fue descartada del mensaje de inicio.",
                    badge: "Apagado"
                },
                setup: {
                    title: "OpenAI configuración requerida",
                    body: "Finalice la configuración de OpenAI en Configuración para habilitar la traducción en vivo.",
                    badge: "Configuración"
                },
                unavailable: {
                    title: "OpenAI no está disponible",
                    body: "Verifique la configuración OpenAI en Configuración antes de que se pueda reanudar la traducción en vivo.",
                    badge: "Problema"
                },
                off: {
                    title: "La traducción está apagada",
                    body: "Objetivo: {language}. Actívelo para salida en vivo.",
                    badge: "Apagado"
                },
                error: {
                    title: "La traducción necesita atención",
                    body: "Algunas líneas fallaron. El reintento está disponible en las tarjetas afectadas.",
                    badge: "Problema"
                },
                translating: {
                    title: "Traduciendo a {language}",
                    body: "Se están traduciendo nuevas líneas en vivo.",
                    badge: "trabajando"
                },
                live: {
                    title: "Traducción en vivo activa",
                    body: "Representación de salida en vivo en {language}."
                },
                ready: {
                    title: "La traducción está armada",
                    body: "Los subtítulos están activados. Las nuevas líneas se traducirán a {language}.",
                    badge: "Listo"
                },
                waiting: {
                    title: "Esperando subtítulos",
                    body: "Active los subtítulos de la reunión para iniciar la traducción.",
                    badge: "esperando"
                }
            },
            tooltips: {
                compactAiSetup: "Finalice la configuración de OpenAI en Configuración para restaurar la traducción, los resúmenes y la guía del asistente.",
                compactAiIssue: "Las funciones dependientes de {message} OpenAI permanecen en pausa hasta que se resuelva el problema.",
                translationOff: "Desactivar la traducción en vivo",
                translationOn: "Activar la traducción en vivo",
                translationSetup: "Finalice la configuración de OpenAI en Configuración para habilitar la traducción en vivo.",
                translationUnavailable: "La traducción en vivo se pausa hasta que OpenAI vuelva a estar disponible.",
                captureHelp: "Ayuda de captura",
                hideCaptureHelp: "Ocultar ayuda de captura",
                switchToCompactView: "Cambiar a vista compacta",
                expandOverlay: "Expandir superposición",
                openProfilePicker: "Abrir selector de perfil de reunión"
            }
        },
        captureGuide: {
            eyebrow: "Configuración de captura",
            title: "Ayuda de captura",
            statusReady: "La captura comienza cuando está lista",
            footer: "CaptionArc comenzará a capturar tan pronto como aparezcan subtítulos en vivo en esta pestaña.",
            stepsCount: "{count} pasos",
            waitingTitle: "Esperando subtítulos en vivo",
            closeAriaLabel: "Cerrar guía de captura",
            startsAutomatically: "Comienza automáticamente",
            tooltipOpen: "Ayuda de captura",
            tooltipClose: "Ocultar ayuda de captura",
            providers: {
                googleMeet: {
                    title: "Habilitar captura en Google Meet",
                    body: "CaptionArc puede comenzar una vez que los subtítulos Google Meet estén activados en esta reunión del navegador.",
                    status: "Comienza automáticamente",
                    footer: "CaptionArc comenzará a capturar automáticamente tan pronto como aparezcan subtítulos en vivo en esta pestaña.",
                    troubleshooting: "Si no ve un control de subtítulos, verifique si la reunión o el estado del navegador aún se están cargando.",
                    steps: {
                        openControls: {
                            title: "Abrir los controles de la reunión",
                            detail: "Mueva el mouse para revelar la barra de herramientas inferior de la reunión."
                        },
                        openCaptions: {
                            title: "Controles de subtítulos abiertos",
                            detail: "Haga clic en los subtítulos o en el control CC en la barra de herramientas de la reunión."
                        },
                        turnOn: {
                            title: "Activar subtítulos",
                            detail: "Una vez que los subtítulos estén habilitados, CaptionArc comenzará a capturar texto automáticamente."
                        }
                    }
                },
                microsoftTeams: {
                    title: "Habilitar captura en Microsoft Teams",
                    body: "CaptionArc puede comenzar una vez que se activan los subtítulos en vivo desde la barra de herramientas de la reunión Teams.",
                    status: "Comienza automáticamente",
                    footer: "CaptionArc comenzará a capturar automáticamente tan pronto como aparezcan subtítulos en vivo en esta pestaña.",
                    troubleshooting: "Si los subtítulos no están disponibles, es posible que la política del organizador o del administrador esté restringiendo los controles de subtítulos.",
                    steps: {
                        openMore: {
                            title: "Abrir más",
                            detail: "Utilice la barra de herramientas superior de la reunión y abra el menú Más."
                        },
                        openLanguage: {
                            title: "Lenguaje y habla abiertos",
                            detail: "Dentro de Más, elige Idioma y habla."
                        },
                        chooseCaptions: {
                            title: "Elija Mostrar subtítulos en vivo",
                            detail: "Seleccione Mostrar subtítulos en vivo y CaptionArc detectará la ventana de subtítulos automáticamente."
                        }
                    }
                },
                zoomWeb: {
                    title: "Habilitar captura en Zoom Web App",
                    body: "CaptionArc puede comenzar una vez que los subtítulos Zoom Web App estén habilitados en esta reunión del navegador.",
                    status: "Habilitar subtítulos manualmente",
                    footer: "CaptionArc comenzará a capturar tan pronto como aparezcan los subtítulos de Zoom en esta pestaña.",
                    troubleshooting: "Algunas reuniones Zoom pueden preferir la aplicación de escritorio o restringir los controles de subtítulos según la configuración del anfitrión.",
                    steps: {
                        openControls: {
                            title: "Controles de reunión abiertos",
                            detail: "Utilice la barra de herramientas durante la reunión en la parte inferior de la ventana Zoom Web App."
                        },
                        openMore: {
                            title: "Abrir más",
                            detail: "Abra el menú Más en la barra de herramientas de la reunión."
                        },
                        openCaptions: {
                            title: "Subtítulos abiertos",
                            detail: "Dentro de Más, abre el submenú Subtítulos."
                        },
                        chooseShow: {
                            title: "Elija Mostrar subtítulos",
                            detail: "Seleccione Mostrar subtítulos para que la superficie de subtítulos Zoom esté disponible en esta pestaña."
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "Sesión de reunión",
            turns: "{count} vueltas",
            chat: "{count} charla",
            chatCaptureTooltip: "La captura de chat de reuniones está habilitada. Los nuevos mensajes de chat de reuniones admitidos se guardarán con esta sesión.",
            autoSummarySetupTooltip: "Los resúmenes automáticos permanecen en pausa hasta que se completa la configuración de OpenAI.",
            autoSummaryUnavailableTooltip: "Los resúmenes automáticos se pausan hasta que OpenAI vuelva a estar disponible.",
            autoSummaryReadyTooltip: "{profile} se ejecutará automáticamente cuando finalice esta reunión.",
            aiAlertSetupTooltip: "Finalice la configuración de OpenAI en Configuración para restaurar la traducción, los resúmenes y la guía del asistente.",
            aiAlertUnavailableTooltip: "Las herramientas de reunión dependientes de {message} OpenAI permanecen en pausa hasta que se resuelva el problema.",
            liveState: {
                awaitingReply: {
                    label: "esperando respuesta",
                    tooltip: "Capture está esperando su decisión de inicio para esta reunión."
                },
                starting: {
                    label: "Comenzando",
                    tooltip: "Se aprobó la captura y se prepara la sesión de la reunión."
                },
                off: {
                    label: "Apagado",
                    tooltip: "La captura para esta reunión se descartó desde el mensaje de inicio."
                },
                ended: {
                    label: "Terminado",
                    tooltip: "Esta sesión ha terminado. Vuelva a unirse para continuar la última sesión o iniciar una nueva."
                },
                lobby: {
                    label: "vestíbulo",
                    tooltip: "Únase a la reunión para iniciar el cronómetro de la sesión y capturar el flujo."
                },
                live: {
                    label: "en vivo",
                    tooltip: "Actualmente se están capturando subtítulos en esta reunión."
                },
                armed: {
                    label: "armado",
                    tooltip: "Los subtítulos están habilitados y la superposición está esperando las siguientes líneas."
                },
                waiting: {
                    label: "esperando",
                    tooltip: "Los subtítulos de la reunión aún no están habilitados."
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "Por defecto se utiliza la acción estándar.",
            timeoutHint: "El valor predeterminado es {action}",
            captureConsent: {
                title: "¿Habilitar captura para esta reunión?",
                body: "Si omite esto, la captura permanece desactivada para esta visita a la reunión.",
                ariaLabel: "Capturar confirmación de inicio",
                secondaryAction: "Ahora no",
                primaryAction: "Habilitar"
            },
            sessionContinuation: {
                title: "¿Continuar la sesión anterior?",
                body: "Te reincorporaste a la misma reunión poco después de salir. Si no hay respuesta se inicia una nueva sesión.",
                ariaLabel: "Confirmación de continuación de sesión",
                secondaryAction: "Nueva sesión",
                primaryAction: "Continuar"
            },
            sessionEnded: {
                title: "Sesión finalizada",
                body: "Quédese aquí para revisar los elementos capturados o cierre la superposición. Si no hay respuesta lo cierra.",
                ariaLabel: "Confirmación de sesión finalizada",
                secondaryAction: "Cerrar",
                primaryAction: "quédate aquí"
            }
        },
        assistant: {
            statusLabel: {
                queued: "En cola",
                working: "trabajando",
                ready: "Listo",
                paused: "En pausa",
                issue: "Problema",
                unavailable: "No disponible",
                watching: "mirando"
            },
            statusDescription: {
                queued: "Se detectó un momento útil.",
                working: "Generando guía en vivo.",
                latestReady: "La última guía del asistente está lista.",
                ready: "El asistente está listo para el siguiente momento.",
                paused: "El asistente está desactivado para esta sesión.",
                issue: "El asistente necesita atención.",
                unavailable: "OpenAI no está disponible en este momento.",
                watching: "Esperando un momento útil."
            },
            emptyState: {
                setupTitle: "Finalice la configuración de OpenAI para usar el asistente.",
                setupBody: "La configuración de OpenAI está incompleta, por lo que la guía en vivo aún no se puede ejecutar.",
                unavailableTitle: "El asistente no está disponible temporalmente",
                unavailableBody: "{message} El asistente se reanudará después de que OpenAI vuelva a estar sano.",
                watchingTitle: "El asistente está viendo esta reunión.",
                watchingBody: "Cuando aparezca una pregunta, solicitud o riesgo útil, aparecerá aquí orientación en vivo.",
                offTitle: "El asistente está desactivado para esta sesión.",
                offBody: "Vuelva a activarlo cuando desee que se reanude la guía en vivo.",
                errorTitle: "El asistente necesita atención.",
                errorBody: "Un problema de generación interrumpió la guía en vivo. Se volverá a intentar el siguiente momento válido.",
                preparingTitle: "El asistente está preparando la guía.",
                preparingBody: "Se detectó un momento útil y la primera guía en vivo ya está en cola.",
                workingTitle: "El asistente está trabajando.",
                workingBody: "Se están generando instrucciones en vivo para el momento actual de la reunión."
            },
            footer: {
                setup: "Complete la configuración de OpenAI",
                unavailable: "OpenAI no está disponible",
                sessionStartsAfterJoin: "La sesión comienza después de unirse",
                workingLiveGuidance: "Trabajando en guía en vivo",
                turnedOffForSession: "Desactivado para esta sesión",
                generationNeedsAttention: "La generación necesita atención.",
                latestGuidanceReady: "La última guía está lista",
                watchingSession: "Viendo esta sesión",
                notes: "{count} notas",
                liveCount: "{count} en vivo",
                aiAlertSetup: "Finalice la configuración de OpenAI en Configuración antes de que se pueda ejecutar la guía del asistente.",
                aiAlertUnavailable: "{message} La guía del asistente permanece en pausa hasta que OpenAI vuelva a estar disponible."
            },
            source: {
                meetingChat: "Charla de reunión",
                caption: "Subtítulo",
                unknownSpeaker: "Desconocido"
            },
            pendingReply: "El asistente está preparando una respuesta para este momento.",
            ui: {
                toggleLiveLabel: "en vivo",
                readyTitle: "El asistente está listo",
                watchingSession: "Viendo esta sesión",
                watching: "mirando",
                waitingForMoment: "Esperando un momento útil.",
                headerTitle: "Asistente de IA",
                footerTitle: "asistente de IA",
                panelAriaLabel: "Guía en vivo del asistente de IA",
                openSettings: "Abrir la configuración del asistente",
                setupBeforeEnable: "Finalice la configuración de OpenAI antes de encender el asistente.",
                unavailableUntilOpenAi: "El asistente no está disponible hasta que OpenAI vuelva a estar disponible",
                turnOffForSession: "Desactivar el asistente para esta sesión",
                turnOnForSession: "Activar el asistente para esta sesión",
                openPanel: "Abrir panel asistente",
                collapsePanel: "Contraer panel asistente",
                resizePanel: "Cambiar tamaño del panel asistente"
            }
        }
    },
    popup: {
        header: {
            devBadge: "desarrollador",
            openMeetingHistory: "Abrir historial de reuniones",
            openSettings: "Abrir configuración"
        },
        setup: {
            verificationNotTested: "No probado",
            notConfigured: "OpenAI no configurado",
            setupRequired: {
                label: "Configuración requerida",
                description: "Agregue su clave API OpenAI y elija un modelo."
            },
            needsAttention: {
                label: "necesita atencion",
                description: "Revise la configuración de OpenAI en Configuración."
            },
            ready: {
                label: "Listo",
                description: "OpenAI, el modelo y el idioma de destino están listos para la salida en vivo."
            },
            verifySetup: {
                label: "Verificar configuración",
                description: "Ejecute una prueba de conexión en Configuración para confirmar la configuración OpenAI."
            }
        },
        overlay: {
            badge: "Superposición",
            title: "Visibilidad en vivo",
            switchAriaLabel: "Alternar visibilidad de superposición en vivo",
            switchDisabledTitle: "Habilite el inicio de la captura en Configuración para usar la visibilidad en vivo.",
            state: {
                inactive: "Inactivo",
                visible: "Visibles",
                hidden: "Oculto"
            },
            mode: {
                captureStartupOff: "El inicio de captura está desactivado",
                available: "La superposición permanece disponible",
                hidden: "La superposición permanece oculta"
            },
            helper: {
                captureStartupOff: "La visibilidad en vivo está disponible después de que Inicio se configura en Preguntar o Siempre en Configuración.",
                instantToggle: "Alternancia instantánea para reuniones abiertas. La posición, el tamaño y el estado compacto se recuerdan por aplicación de reunión."
            }
        },
        pulse: {
            title: "Pulso del espacio de trabajo"
        },
        rows: {
            live: {
                capturing: {
                    label: "Capturando en vivo",
                    detail: "{platform} está escuchando activamente en esta pestaña.",
                    badge: "en vivo"
                },
                lobby: {
                    label: "Listo cuando te unes",
                    detail: "{platform} está abierto y esperando en el vestíbulo.",
                    badge: "vestíbulo"
                },
                startupOff: {
                    label: "El inicio de captura está desactivado",
                    detail: "Vuelva a configurar Inicio en Preguntar o Siempre cuando desee volver a escuchar en vivo.",
                    badge: "Apagado"
                },
                idle: {
                    label: "Sin reunión en vivo",
                    detail: "Abra una pestaña de reunión compatible y CaptionArc se despertará aquí.",
                    badge: "inactivo"
                }
            },
            summary: {
                busy: {
                    label: "El resumen de IA está funcionando",
                    detail: "De fondo se está preparando un resumen de la reunión.",
                    badge: "Ocupado"
                },
                failed: {
                    label: "El resumen necesita atención",
                    detail: "El último resumen no terminó limpiamente.",
                    badge: "Reintentar"
                },
                automatic: {
                    label: "El resumen automático está armado",
                    detail: "{profileName} comenzará un resumen por sí solo después de que finalice cada reunión.",
                    badge: "Automático"
                },
                manual: {
                    label: "Modo resumen manual",
                    detail: "No hay nada en cola en este momento. Los resúmenes solo se publican cuando usted los solicita.",
                    badge: "manuales"
                },
                defaultProfileName: "El perfil predeterminado"
            },
            archive: {
                empty: {
                    label: "El archivo todavía está vacío.",
                    detail: "Sus reuniones y resúmenes guardados comenzarán a recopilarse aquí una vez que se ejecute la captura.",
                    badge: "Nuevo"
                },
                ready: {
                    label: "{count} reuniones guardadas",
                    detail: "{used} usado. {updated}."
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "Aún no se han guardado reuniones",
            updatedJustNow: "Actualizado hace un momento",
            updatedMinutesAgo: "Actualizado hace {minutes}m",
            updatedHoursAgo: "Actualizado hace {hours}h",
            updatedDaysAgo: "Actualizado hace {days}d"
        },
        meta: {
            aiService: "servicio de inteligencia artificial",
            model: "modelo",
            target: "Objetivo",
            startup: "Inicio",
            modelNotSelected: "No seleccionado",
            pendingIndicator: "OpenAI aún no se ha verificado.",
            startupValues: {
                off: "Apagado",
                always: "siempre",
                ask: "preguntar"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
