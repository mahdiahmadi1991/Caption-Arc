import type { UiMessageCatalog } from "../types";

export const frMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "Accès rapide",
        actions: {
            cancel: "Annuler",
            clear: "Effacer",
            close: "Fermer",
            collapse: "Réduire",
            confirmDelete: "Confirmer la suppression",
            delete: "Supprimer",
            expand: "Développer",
            hide: "Masquer",
            loading: "Chargement...",
            open: "Ouvert",
            show: "Afficher",
            continue: "Continuer",
            working: "Travailler..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "Pas de contenu pour l'instant.",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "Réunion"
        },
        theme: {
            group: "Thème",
            system: "Utiliser le thème système",
            light: "Utiliser le thème clair",
            dark: "Utiliser un thème sombre"
        },
        optional: "(facultatif)",
        uiLanguage: {
            label: "Langue de l'interface",
            description: "Choisissez la langue utilisée par les fenêtres contextuelles, les paramètres, l'historique et l'interface utilisateur de la réunion.",
            system: "Utiliser la langue du navigateur",
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
        links: {
            github: "GitHub",
            privacyPolicy: "Politique de confidentialité",
            termsOfService: "Conditions d’utilisation"
        },
        legal: {
            version: "Édition {version}",
            copyright: "Droits d’auteur © {year} CaptionArc"
        },
        notifications: {
            summaryReady: {
                title: "Résumé prêt pour {title}",
                message: "Cliquez pour ouvrir le résumé complet dans l'historique des réunions."
            }
        },
        firstRunTerms: {
            eyebrow: "Configuration initiale",
            title: "Consultez et acceptez les conditions pour continuer",
            body: "CaptionArc nécessite une acceptation unique des conditions d’utilisation en vigueur avant de poursuivre la configuration.",
            version: "Version des conditions {version}",
            reviewPrompt: "Consultez les conditions d’utilisation et la politique de confidentialité en vigueur avant d’accepter.",
            acceptanceNote: "En continuant, vous confirmez avoir consulté les conditions d’utilisation en vigueur et compris la politique de confidentialité.",
            declinedBody: "CaptionArc reste inactif sur cet appareil parce que les conditions d’utilisation en vigueur ont été refusées.",
            declinedPrompt: "Consultez à nouveau les conditions actuelles lorsque vous serez prêt à continuer.",
            declinedNote: "CaptionArc reste bloqué jusqu’à ce que les conditions d’utilisation en vigueur soient acceptées pour cet appareil.",
            accept: "Accepter les conditions"
        },
        legalPages: {
            shared: {
                eyebrow: "Mentions légales",
                loadingDescription: "Chargement de la dernière version publiée des documents juridiques de cette extension."
            },
            privacyPolicy: {
                title: "Politique de confidentialité",
                subtitle: "Une copie intégrée au produit de la même politique de confidentialité publiée dans le dépôt.",
                sourceNote: "Cette page restitue la même source markdown que celle publiée dans le dépôt afin que la copie intégrée à l’extension et le document public restent alignés.",
                loadingTitle: "Chargement de la politique de confidentialité"
            },
            termsOfService: {
                title: "Conditions d’utilisation",
                subtitle: "Consultez les conditions actuelles, les responsabilités et les limites juridiques de CaptionArc.",
                acceptEyebrow: "Configuration initiale",
                acceptSubtitle: "Faites défiler les conditions actuelles avant de les accepter sur cet appareil.",
                acceptPrompt: "Lisez les conditions d’utilisation actuelles pour activer l’acceptation.",
                scrollRequired: "Faites défiler jusqu’à la fin du document pour activer l’acceptation.",
                scrollReady: "Vous avez atteint la fin des conditions. Vous pouvez maintenant accepter et fermer cette page.",
                accept: "Accepter et fermer",
                decline: "Refuser et fermer",
                declineNote: "Si vous n’acceptez pas ces conditions, fermez cette page et n’utilisez pas CaptionArc.",
                sourceNote: "Cette page restitue la même source markdown que celle publiée dans le dépôt afin que la copie intégrée à l’extension et le document public restent alignés.",
                alreadyAcceptedTitle: "Conditions actuelles déjà acceptées",
                alreadyAcceptedBody: "Cet appareil dispose déjà d’une acceptation enregistrée pour la version actuelle des conditions.",
                declinedTitle: "Les conditions actuelles ont été refusées sur cet appareil",
                declinedBody: "CaptionArc reste bloqué jusqu’à ce que la version actuelle des conditions soit acceptée sur cet appareil.",
                version: "Édition {version}",
                loadingTitle: "Chargement des conditions d’utilisation"
            }
        },
        units: {
            byte: "B",
            kilobyte: "Ko",
            megabyte: "Mo"
        }
    },
    options: {
        header: {
            eyebrow: "Paramètres",
            title: "CaptionArc Paramètres",
            subtitle: "Configurez le service d'IA partagé, les profils de réunion, le comportement de traduction en direct, la protection cloud et la récupération à partir d'une seule surface de contrôle compacte.",
            openMeetingHistory: "Historique des réunions"
        },
        navigation: {
            title: "Carte des paramètres",
            description: "Déplacez-vous section par section dans la console.",
            quickJump: "Saut rapide"
        },
        loading: "Chargement...",
        snapshot: {
            aiEngine: "Moteur d'IA",
            serviceStatus: "Statut des services",
            model: "Modèle",
            primaryProfile: "Profil principal",
            theme: "Thème",
            cloudVault: "Coffre-fort cloud",
            meetingUi: "Interface utilisateur de réunion",
            none: "Aucun",
            system: "Système",
            light: "Lumière",
            dark: "Sombre",
            providerOne: "Fournisseur {count}",
            providerOther: "{count} fournisseurs",
            visibleClickThrough: "Visible · clic",
            visibleInteractive: "Visible · interactif",
            hidden: "Caché"
        },
        sections: {
            workspace: {
                eyebrow: "Espace de travail",
                title: "Expérience et paramètres par défaut",
                description: "Définissez les valeurs par défaut partagées une fois, puis séparez clairement le comportement visuel, le déroulement des réunions et les règles d'archivage.",
                shortLabel: "Espace de travail",
                mapHint: "Apparence, déroulement des réunions et paramètres d'archivage par défaut"
            },
            openAiService: {
                eyebrow: "Service OpenAI",
                title: "Service d'IA partagé",
                shortLabel: "OpenAI",
                mapHint: "Traduction, résumés et assistant",
                description: "Gérez le service partagé OpenAI utilisé par la traduction en direct, les résumés de réunion et l'assistant de réunion."
            },
            translation: {
                eyebrow: "Traduction",
                title: "Traduction en direct",
                shortLabel: "Traduction",
                mapHint: "Comportement et réglage des sous-titres en direct",
                description: "Ajustez la façon dont OpenAI gère la traduction des sous-titres en direct sans modifier la génération de résumé ou le comportement de l'assistant."
            },
            profiles: {
                eyebrow: "Rencontrer l'IA",
                title: "Profils de réunion",
                shortLabel: "Profils",
                mapHint: "Identité, résumé et assistant",
                description: "Les profils de réunion définissent un type de réunion une fois, puis réutilisent cette identité pour la génération de résumés et l'assistant en direct."
            },
            cloudSync: {
                eyebrow: "Synchronisation dans le cloud",
                title: "Coffre-fort cloud personnel",
                shortLabel: "Synchronisation dans le cloud",
                mapHint: "Protection des archives et fournisseurs",
                description: "Connectez Google Drive, OneDrive ou les deux pour conserver une archive locale protégée sur tous vos appareils."
            },
            dataRecovery: {
                eyebrow: "Récupération",
                title: "Récupération de données",
                shortLabel: "Récupération",
                mapHint: "Sauvegarde et réinitialisation cryptées",
                description: "La synchronisation cloud est la principale voie de continuité. Utilisez l'archive chiffrée comme sauvegarde de secours ou supprimez l'archive enregistrée lorsque vous avez besoin d'une réinitialisation propre."
            }
        },
        saveBadge: {
            saving: "Enregistrer les modifications",
            attention: "A besoin d'attention",
            saved: "Enregistré automatiquement"
        },
        workspace: {
            appearance: {
                title: "Apparence",
                description: "Choisissez un thème fixe ou laissez CaptionArc suivre votre système automatiquement."
            },
            uiLanguage: {
                title: "Langue de l'interface",
                description: "Appliquez une langue dans les fenêtres contextuelles, les paramètres, l'historique des réunions et l'interface utilisateur de la réunion."
            },
            meetingFlow: {
                title: "Flux de réunion",
                description: "Contrôlez la façon dont CaptionArc démarre la capture, aide avec les sous-titres et décide si une réunion rejointe doit continuer la même session."
            },
            captureStartup: {
                label: "Capturer le démarrage",
                off: {
                    name: "Désactiver la capture",
                    description: "N'initialisez pas la zone de capture en cours de réunion pour les réunions prises en charge."
                },
                ask: {
                    name: "Demandez à chaque réunion",
                    description: "Afficher une courte invite d’approbation avant le début de toute capture. C'est la valeur par défaut."
                },
                always: {
                    name: "Commencez toujours la capture",
                    description: "Démarrez le flux de capture immédiatement sans demander au préalable."
                }
            },
            captionActivation: {
                label: "Activation des sous-titres",
                guided: {
                    name: "Guidé",
                    description: "Gardez le flux actuel. CaptionArc affiche l'aide en ligne afin que vous puissiez activer les sous-titres en direct sur vous-même."
                },
                automatic: {
                    name: "Automatique lorsque cela est possible",
                    description: "Après votre inscription, CaptionArc essaie une fois d'activer automatiquement les sous-titres en direct lorsque l'application de réunion le prend en charge, puis revient au flux guidé si ce n'est pas le cas."
                }
            },
            sessionContinuation: {
                title: "Fenêtre de suite de session",
                description: "Décidez combien de temps CaptionArc doit proposer de continuer la même session après avoir rejoint le groupe.",
                windowLabel: "Fenêtre",
                off: "Désactivé",
                oneHour: "1 heure",
                hours: "{count} heures",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes} minutes"
            },
            inMeetingSurfaces: {
                title: "Surfaces de réunion",
                description: "Façonnez l’apparence et le comportement des surfaces de réunion en direct lorsqu’elles sont à l’écran."
            },
            overlayOpacity: {
                title: "Opacité de superposition",
                description: "Des valeurs plus faibles rendent la réunion plus visible en dessous.",
                subtle: "Subtil",
                solid: "Solide"
            },
            overlayClickThrough: {
                label: "Mode clic",
                description: "Laissez les clics passer à travers les surfaces de réunion en direct tout en restant visibles."
            },
            meetingArchive: {
                title: "Archives des réunions",
                description: "Décidez quelles données de réunion doivent être conservées pour une révision, une exportation et une génération de résumé ultérieures."
            },
            storeMeetingChat: {
                label: "Chat de réunion en magasin",
                description: "Enregistrez le chat de réunion pris en charge afin qu'il puisse apparaître dans l'historique des réunions, les exportations et les résumés."
            }
        },
        legalRisk: {
            shared: {
                eyebrow: "À utiliser avec précaution",
                warningLabel: "Avis juridique et confidentialité"
            },
            captureStartupAlways: {
                dialog: {
                    title: "Le démarrage automatique de la capture réduit les garde-fous de consentement",
                    body: "Ce mode ignore la demande d'approbation à chaque réunion et lance la capture dès qu'une réunion prise en charge est détectée.",
                    pointOne: "Utilisez-le uniquement dans les réunions où vous êtes sûr de pouvoir capturer et conserver du contenu dérivé de la réunion.",
                    pointTwo: "Selon ce que vous activez, d'autres fonctions pourront ensuite utiliser les sous-titres ou le chat enregistrés pour les résumés, l'aide en direct ou les exportations.",
                    pointThree: "Vous restez responsable de toute exigence d'information, de consentement, de politique interne ou de politique de plateforme applicable à votre usage.",
                    confirm: "Activer la capture automatique"
                },
                warning: {
                    title: "La capture automatique est active",
                    body: "CaptionArc ignorera l'étape d'approbation par réunion. Ne laissez ce mode actif que lorsque la capture et la conservation de contenu dérivé de la réunion sont licites et appropriées."
                }
            },
            captionActivationAutomatic: {
                dialog: {
                    title: "L'activation automatique des sous-titres agit dans l'application de réunion à votre place",
                    body: "Ce mode tente d'activer automatiquement les sous-titres en direct lorsque la surface de réunion prise en charge le permet.",
                    pointOne: "L'activation automatique peut être plus sensible que le mode guidé, car elle modifie l'interface de réunion sans étape manuelle de votre part à chaque fois.",
                    pointTwo: "Conservez-la uniquement dans les environnements où l'activation automatique des sous-titres est acceptable selon votre politique et votre flux de travail.",
                    pointThree: "Vous restez responsable de l'usage de cette automatisation uniquement là où les règles du fournisseur et les attentes de la réunion l'autorisent.",
                    confirm: "Activer les sous-titres automatiques"
                },
                warning: {
                    title: "L'activation automatique des sous-titres est active",
                    body: "CaptionArc tentera d'activer automatiquement les sous-titres lorsque le fournisseur le permet. Vérifiez ce mode avec soin pour les réunions sensibles du point de vue des politiques."
                }
            },
            storeMeetingChat: {
                dialog: {
                    title: "Le stockage du chat de réunion peut accroître la sensibilité liée à la vie privée",
                    body: "Si cette option reste activée, le chat pris en charge devient une partie de votre enregistrement de réunion sauvegardé et peut apparaître dans l'historique, les exportations et les suivis assistés par IA.",
                    pointOne: "Le chat de réunion peut contenir des informations plus sensibles ou plus identifiantes que les sous-titres visibles seuls.",
                    pointTwo: "Le chat enregistré pourra ensuite être inclus dans les résumés, les traductions et le contexte de l'assistant lorsque ces fonctions sont utilisées.",
                    pointThree: "N'utilisez le stockage du chat que lorsque la conservation de ce contenu correspond à vos obligations d'information, de consentement et de confidentialité.",
                    confirm: "Activer le stockage du chat"
                },
                warning: {
                    title: "Le stockage du chat est actif",
                    body: "Le chat pris en charge est conservé pour l'historique, l'exportation et le suivi assisté par IA. Laissez ce mode actif uniquement lorsque cette conservation est appropriée."
                }
            }
        },
        openAiService: {
            title: "Service OpenAI",
            sectionDescription: "Gérez le service partagé OpenAI utilisé par la traduction en direct, les résumés de réunion et l'assistant de réunion.",
            sharedService: "Service partagé",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "Un service partagé OpenAI alimente la traduction en direct, les résumés de réunion et l'assistant de réunion.",
            setupDescription: "Ajoutez la clé API une fois, choisissez le modèle GPT par défaut et confirmez l'accès avant de vous fier à un flux de travail basé sur l'IA.",
            verificationLabel: "Testez la connexion OpenAI",
            verifyingLabel: "Test de la configuration actuelle de OpenAI",
            highlights: {
                translation: "Traduction en direct",
                summaries: "Résumés des réunions",
                assistant: "Assistant en direct"
            },
            cards: {
                translationTitle: "Traduction",
                translationBody: "Sous-titres en direct",
                summariesTitle: "Résumés",
                summariesBody: "Résultats post-réunion",
                assistantTitle: "Assistante",
                assistantBody: "Guidage en direct"
            },
            state: {
                setupRequired: {
                    label: "Configuration requise",
                    description: "Ajoutez la clé API et confirmez le modèle GPT par défaut.",
                    impact: "Les fonctionnalités basées sur l'IA restent indisponibles jusqu'à ce que le service OpenAI soit entièrement configuré."
                },
                actionRequired: {
                    label: "Action requise",
                    impact: "Les fonctionnalités basées sur l'IA peuvent ne pas être disponibles jusqu'à ce que le service OpenAI fonctionne à nouveau."
                },
                ready: {
                    label: "Prêt",
                    impact: "OpenAI est disponible pour la traduction, les résumés et les conseils en direct."
                },
                checking: {
                    label: "Vérification",
                    impact: "Une vérification de connexion est en cours. Le résultat mettra à jour chaque zone du produit alimentée par l’IA."
                },
                needsVerification: {
                    label: "Vérification nécessaire",
                    description: "Exécutez une vérification de connexion une fois pour confirmer la clé et le modèle actuels.",
                    impact: "Les paramètres peuvent toujours être modifiés, mais la sortie AI doit être traitée comme non confirmée jusqu'à ce que le service soit vérifié."
                }
            },
            banners: {
                needsAttention: "OpenAI a besoin d'attention",
                finishSetup: "Terminez la configuration OpenAI",
                verifySetup: "Vérifiez la configuration OpenAI"
            },
            apiKeyInput: {
                label: "Clé API",
                provider: "OpenAI",
                storedLocally: "Stocké localement",
                credential: "Identifiant secret",
                show: "Afficher la clé API",
                hide: "Masquer la clé API",
                helper: "Cette clé reste sur cet appareil et est utilisée pour la traduction, les résumés et les conseils en direct.",
                guide: "OpenAI Guide des clés API"
            },
            modelLabel: "Modèle"
        },
        models: {
            gpt5Mini: {
                description: "Meilleure valeur par défaut pour la traduction en direct : rapide, fiable et de haute qualité pour les sous-titres bruyants.",
                badge: "Recommandé"
            },
            gpt52: {
                description: "Idéal lorsque la précision et les nuances de la traduction comptent plus que la latence ou le coût.",
                badge: "La plus haute qualité"
            },
            gpt51: {
                description: "Modèle polyvalent et robuste avec un profil qualité/vitesse équilibré."
            },
            gpt5Nano: {
                description: "Option de latence la plus faible pour des réponses très rapides, avec une qualité de sortie plus simple.",
                badge: "Le plus rapide"
            },
            gpt41: {
                description: "Choix hérité stable si vous préférez un modèle de traduction polyvalent éprouvé.",
                badge: "Héritage"
            },
            gpt41Mini: {
                description: "Variante GPT-4.1 à moindre coût pour des charges de travail plus légères et une qualité de traduction modérée.",
                badge: "Plus léger"
            }
        },
        translation: {
            bestFor: {
                title: "Idéal pour",
                description: "Tonalité, terminologie technique, gestion des abréviations et nettoyage bruyant des sous-titres."
            },
            keepLean: {
                title: "Gardez-le mince",
                description: "Les instructions plus courtes sont généralement traduites plus rapidement et restent plus stables dans les sous-titres en direct."
            },
            avoid: {
                title: "Éviter",
                description: "Des politiques longues, des règles répétées ou des exigences de formatage qui ralentissent chaque demande de sous-titre."
            },
            instructionsLabel: "Instructions de traduction en direct",
            instructionsHint: "Appliqué à chaque demande de traduction de légende. Utilisez-le pour le nettoyage des sous-titres, la terminologie et le ton de la traduction."
        },
        profiles: {
            identity: {
                eyebrow: "Identité du profil",
                description: "Ces champs définissent le profil de type de réunion lui-même. Ils sont partagés par la génération de résumés et le live assistant.",
                nameLabel: "Nom du profil",
                namePlaceholder: "Synchronisation quotidienne",
                descriptionLabel: "Brève description",
                descriptionPlaceholder: "Enregistrement récurrent de l'équipe"
            },
            summary: {
                eyebrow: "Résumé",
                description: "Ces paramètres déterminent la manière dont ce profil de réunion génère des résumés : la quantité d'effort d'IA qu'il utilise et les instructions exécutées lors de la génération du résumé.",
                autoSummaryLabel: "Résumé automatique de fin de réunion",
                autoSummaryDescription: "Lorsque ce profil est actif, un résumé démarre tout seul après la fin de la réunion.",
                effortLabel: "Effort sommaire",
                instructionsLabel: "Instructions récapitulatives",
                instructionsHint: "Utilisé lorsque ce type de réunion est sélectionné dans l'historique des réunions.",
                modes: {
                    economy: {
                        name: "Économie",
                        description: "Réduire le travail de l'IA. Idéal pour les réunions plus courtes où la vitesse compte le plus.",
                        badge: "Le plus rapide"
                    },
                    balanced: {
                        name: "Équilibré",
                        description: "Recommandé. Adapte la stratégie récapitulative pour la fiabilité sans abuser du travail supplémentaire de l'IA."
                    },
                    thorough: {
                        name: "Complètement",
                        description: "Utilise davantage de travail d’IA pour des réunions plus longues ou plus complexes afin de réduire les échecs sommaires.",
                        badge: "Le plus lent"
                    }
                }
            },
            assistant: {
                eyebrow: "Assistante",
                description: "Ces paramètres définissent le comportement du guidage en direct lorsque ce profil de réunion est actif.",
                enabledLabel: "Utiliser l'assistant avec ce profil",
                enabledDescription: "Lorsqu'il est activé, ce profil de réunion peut générer des conseils en direct dans les réunions prises en charge.",
                disabledHint: "Les paramètres de l'Assistant restent visibles ici afin que vous puissiez les consulter ou les ajuster plus tard, mais ils restent verrouillés jusqu'à ce que ce profil soit activé.",
                responseIntentLabel: "Mode de guidage principal",
                responseFormatLabel: "Format de réponse",
                responseDepthLabel: "Profondeur de réponse",
                responseToneLabel: "Tonalité de réponse",
                deliveryBiasLabel: "Vitesse vs exhaustivité",
                triggerPolicyLabel: "Quand le guidage doit-il se déclencher",
                participantScopeLabel: "Qui peut déclencher des conseils",
                instructionsLabel: "Instructions pour l'assistant",
                instructionsHint: "Utilisé lorsque ce profil de réunion est actif et que l'assistant génère un guidage en direct.",
                intents: {
                    answerForMe: {
                        name: "Répondez pour moi",
                        description: "Rédigez la réponse directe la plus forte que l’utilisateur puisse donner dès maintenant."
                    },
                    improveMyAnswer: {
                        name: "Améliorer ma réponse",
                        description: "Renforcez ce que l'utilisateur semble déjà dire."
                    },
                    suggestNextPoint: {
                        name: "Suggérer le point suivant",
                        description: "Proposez le prochain point de discussion utile pour faire avancer la réunion."
                    },
                    summarizeRecentTurn: {
                        name: "Résumer le tour récent",
                        description: "Compressez le dernier échange en un récapitulatif rapide et utilisable."
                    },
                    surfaceRisks: {
                        name: "Risques de surface",
                        description: "Mettez en évidence les risques, les lacunes ou les objections qui méritent votre attention."
                    },
                    coachMe: {
                        name: "Entraîne-moi",
                        description: "Guidez l’utilisateur sur la façon de réagir plus efficacement sur le moment."
                    }
                },
                formats: {
                    bullets: {
                        name: "Balles",
                        description: "Puces très courtes et faciles à analyser.",
                        badge: "Le plus rapide"
                    },
                    talkingPoints: {
                        name: "Points de discussion",
                        description: "Des points courts et parlés que l’utilisateur peut exprimer naturellement."
                    },
                    shortParagraph: {
                        name: "Paragraphe court",
                        description: "Un paragraphe compact où les puces semblent trop saccadées."
                    },
                    structuredSections: {
                        name: "Sections structurées",
                        description: "Segmentez la réponse en petites sections étiquetées lorsque la clarté est importante.",
                        badge: "Le plus lent"
                    },
                    script: {
                        name: "Scénario",
                        description: "Écrivez une formulation plus littérale que l’utilisateur pourra suivre de près."
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "Ultra bref",
                        description: "Réponse minimale conçue pour la vitesse la plus élevée.",
                        badge: "Le plus rapide"
                    },
                    brief: {
                        name: "Bref",
                        description: "Court et pratique. Bon par défaut pour les réunions en direct."
                    },
                    standard: {
                        name: "Norme",
                        description: "Un peu plus de contexte alors que la vitesse est toujours importante."
                    },
                    expanded: {
                        name: "Élargi",
                        description: "Plus d'explications lorsqu'une réponse plus complète est utile.",
                        badge: "Le plus lent"
                    }
                },
                tones: {
                    neutral: {
                        name: "Neutre",
                        description: "Équilibré et professionnel."
                    },
                    direct: {
                        name: "Direct",
                        description: "Plus concis et ferme."
                    },
                    supportive: {
                        name: "Soutien",
                        description: "Serviable et rassurant sans être vague."
                    },
                    confident: {
                        name: "Confiant",
                        description: "Fort et décisif lorsque l’utilisateur a besoin d’une formulation plus précise."
                    },
                    analytical: {
                        name: "Analytique",
                        description: "Plus orienté raisonnement et structuré."
                    }
                },
                delivery: {
                    fastest: {
                        name: "Le plus rapide",
                        description: "Tendance fortement vers la vitesse et l’utilité rapide.",
                        badge: "Meilleure vitesse"
                    },
                    balanced: {
                        name: "Équilibré",
                        description: "Échangez un peu de vitesse pour une meilleure exhaustivité."
                    },
                    careful: {
                        name: "Attention",
                        description: "Préférez une plus grande exhaustivité lorsque la réunion le permet.",
                        badge: "Le plus lent"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "Questions et demandes",
                        description: "Déclenchez principalement lors de tours de type question ou demande.",
                        badge: "Charge la plus basse"
                    },
                    salienceFirst: {
                        name: "La saillance d'abord",
                        description: "Réagissez également aux problèmes, décisions ou points de tension très importants."
                    },
                    proactive: {
                        name: "Proactif",
                        description: "Mode le plus impatient. À utiliser uniquement lorsque vous souhaitez davantage d'aide non sollicitée.",
                        badge: "Charge la plus élevée"
                    }
                },
                scope: {
                    everyone: {
                        name: "Tout le monde",
                        description: "Considérez à la fois l’utilisateur et les autres participants comme des déclencheurs valides.",
                        badge: "Plus lourd"
                    },
                    othersOnly: {
                        name: "Autres uniquement",
                        description: "Ignorez le tour de l'utilisateur lorsqu'il décide de répondre ou non.",
                        badge: "Plus léger"
                    }
                }
            },
            badges: {
                primary: "Primaire",
                alwaysAvailable: "Toujours disponible",
                customProfile: "Profil personnalisé",
                assistantOn: "Assistant sur",
                autoSummary: "Résumé automatique"
            },
            editor: {
                title: "Éditeur de profil de réunion",
                description: "Choisissez un profil, puis modifiez son identité partagée, son comportement récapitulatif et le comportement de son assistant en direct en un seul endroit.",
                addProfile: "Ajouter un profil de réunion",
                listTitle: "Profils",
                totalCount: "{count} total",
                defaultOutputLanguage: "Langue de sortie IA par défaut",
                untitled: "Profil sans titre",
                noDescription: "Aucune description pour l'instant.",
                noShortDescription: "Ce profil n'a pas encore de brève description.",
                setAsPrimary: "Définir comme principal",
                builtInTitle: "Profil par défaut intégré",
                builtInDescription: "Ce profil donne à CaptionArc une solution de secours générale et sûre pour la génération de résumés et les conseils en direct lorsqu'aucun type de réunion spécialisé ne convient.",
                newName: "Nouveau type de réunion",
                newDescription: "Profil de réunion personnalisé",
                newPrompt: "Résumez précisément cette réunion dans la langue demandée. Concentrez-vous sur les points qui comptent le plus pour ce type de réunion."
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive Dossier de données d'application",
                    subtitle: "Stockage d'extensions privées dans votre compte Google."
                },
                oneDrive: {
                    title: "OneDrive Dossier d'application",
                    subtitle: "Stockage d'extensions privées dans votre compte Microsoft."
                }
            },
            actions: {
                refreshStatus: "Actualiser l'état",
                connect: "Se connecter",
                retryNow: "Réessayez maintenant",
                reconnect: "Reconnecter",
                disconnect: "Déconnecter"
            },
            overview: {
                title: "Présentation du coffre-fort",
                loadingDescription: "Chargement de l'état actuel de synchronisation cloud pour cet appareil.",
                offDescription: "Aucun fournisseur de cloud personnel n'est encore connecté.",
                needsAttentionDescription: "Au moins une destination cloud nécessite une intervention avant que l'archive ne soit à nouveau entièrement protégée.",
                syncingDescription: "Le coffre-fort réconcilie activement les modifications locales et distantes en arrière-plan.",
                upToDateDescription: "Les destinations cloud connectées sont rattrapées par l'archive locale actuelle."
            },
            stats: {
                currentDevice: "Appareil actuel",
                connectedProviders: "Fournisseurs connectés",
                connectedProvidersNone: "Aucune destination cloud connectée pour le moment",
                connectedProvidersOne: "Une destination cloud est active",
                connectedProvidersTwo: "Les deux destinations cloud sont actives",
                lastSuccessfulSync: "Dernière synchronisation réussie",
                lastSuccessfulSyncHint: "Basé sur le point de contrôle réussi le plus récent du fournisseur.",
                queueStatus: "Statut de la file d'attente"
            },
            queue: {
                noQueuedChanges: "Aucune modification en file d'attente",
                queuedChanges: "{count} modifications mises en file d'attente",
                engineProcessing: "Le moteur est actuellement en train de travailler.",
                tasksReady: "Les tâches {count} sont prêtes pour la prochaine exécution.",
                engineIdle: "Le moteur reste au ralenti jusqu'au prochain changement local ou à distance."
            },
            syncHealth: {
                title: "Synchroniser la santé",
                attention: "Attention",
                status: "Statut"
            },
            pendingChoice: {
                title: "Les paramètres partagés existent déjà dans le cloud",
                badge: "Choix nécessaire",
                description: "Cet appareil possède déjà ses propres paramètres partagés et le coffre-fort cloud connecté en possède un autre. Choisissez lequel doit devenir le point de départ d’une synchronisation future.",
                source: "Source : {provider}",
                keepLocal: "Conserver les paramètres partagés de cet appareil",
                useCloud: "Utiliser les paramètres partagés dans le cloud"
            },
            providerCard: {
                account: "Compte",
                lastSuccessfulSync: "Dernière synchronisation réussie",
                providerStatus: "Statut du fournisseur"
            },
            scope: {
                sharedTitle: "Synchronisé sur tous les appareils",
                localTitle: "Cet appareil uniquement",
                shared: {
                    meetingSessions: "Séances de réunion",
                    translations: "Traductions",
                    summaries: "Résumés",
                    summaryProfiles: "Profils récapitulatifs",
                    sharedSettings: "Paramètres partagés"
                },
                local: {
                    apiKeys: "Clés API",
                    verificationStatus: "Statut de vérification",
                    deviceIdentity: "Identité de l'appareil"
                }
            },
            health: {
                syncing: "Synchronisation",
                upToDate: "À jour",
                retryingAutomatically: "Réessayer automatiquement",
                needsAttention: "A besoin d'attention",
                actionRequired: "Action requise",
                off: "Désactivé"
            },
            connection: {
                notConnectedTitle: "Non connecté",
                notConnectedDescription: "Connectez-vous pour commencer à protéger cette archive.",
                connectedTitle: "Connecté",
                connectedAt: "Connecté {time}"
            },
            sync: {
                notYet: "Pas encore",
                scannedAt: "Numérisé {time}",
                noScanRecorded: "Aucun scan enregistré pour l'instant."
            },
            statusMessage: {
                disconnected: "Déconnecté. Ce fournisseur ne reçoit pas de mises à jour.",
                manualRetryAvailable: "Les tentatives automatiques ont été suspendues. Vous pouvez déclencher une nouvelle tentative manuelle.",
                syncing: "Synchronisation des modifications locales et distantes maintenant.",
                retryingAutomatically: "Réessayer automatiquement en arrière-plan.",
                needsAttention: "Nécessite une attention particulière avant que la protection ne soit entièrement rétablie.",
                actionRequired: "Une action manuelle est requise avant que la synchronisation puisse continuer.",
                upToDate: "Le fournisseur est entièrement synchronisé.",
                connectedWaiting: "Connecté et en attente de travail."
            }
        },
        dataRecovery: {
            backupFile: {
                title: "Fichier de sauvegarde crypté",
                description: "La sauvegarde exportée contient vos paramètres, profils de résumé, sessions de réunion enregistrées, transcriptions, historique des discussions, traductions et résumés. Utilisez-le lorsque la synchronisation cloud n'est pas disponible ou lorsque vous avez besoin d'un instantané chiffré portable.",
                export: "Exporter toutes les données",
                import: "Importer le fichier de sauvegarde"
            },
            passphrase: {
                label: "Phrase secrète de sauvegarde",
                placeholder: "Utilisez au moins 8 caractères",
                show: "Afficher la phrase secrète de sauvegarde",
                hide: "Masquer la phrase secrète de sauvegarde",
                hint: "Utilisez la même phrase secrète pour l’exportation et l’importation. Sans cela, la sauvegarde ne peut pas être déchiffrée."
            },
            cards: {
                scope: {
                    title: "Portée",
                    description: "Un fichier crypté contient à la fois les paramètres et l'archive complète de la session."
                },
                restoreBehavior: {
                    title: "Restaurer le comportement",
                    description: "L'importation remplace l'archive locale et les paramètres actuels par le fichier de sauvegarde que vous choisissez, puis le moteur de synchronisation peut à nouveau se réconcilier."
                },
                useCase: {
                    title: "Cas d'utilisation",
                    description: "Idéal pour la migration de machines, la récupération de secours et la portabilité des archives."
                }
            },
            deleteArchive: {
                title: "Supprimer l'archive enregistrée",
                syncedDescription: "Supprimez l'archive synchronisée de cet appareil, de vos fournisseurs de cloud connectés et d'autres appareils synchronisés. Votre configuration OpenAI, vos préférences et vos profils récapitulatifs restent intacts.",
                localDescription: "Supprimez toutes les sessions de réunion enregistrées du stockage local. Cela conserve votre configuration, vos préférences et vos profils récapitulatifs OpenAI."
            },
            confirmDelete: {
                syncedTitle: "Supprimer les archives synchronisées partout ?",
                localTitle: "Effacer les données de session enregistrées ?",
                syncedLabel: "Supprimer les archives partout",
                localLabel: "Effacer les sessions enregistrées",
                syncedDescription: "Cela supprime définitivement chaque session de réunion enregistrée, transcription, enregistrement de discussion, traduction et résumé de cet appareil, de vos autres appareils synchronisés et de vos comptes cloud connectés. Vos paramètres restent intacts.",
                localDescription: "Cela supprime chaque session de réunion enregistrée, transcription, enregistrement de discussion, traduction et résumé du stockage local. Vos paramètres restent intacts."
            }
        },
        diagnostics: {
            launcherTitle: "Diagnostic",
            launcherSubtitle: "Console",
            closeConsole: "Fermer la console de diagnostic",
            drawerLabel: "Console de diagnostic",
            closeDrawer: "Fermer le tiroir de diagnostic",
            actions: {
                enableSession: "Activer cette session",
                disableSession: "Désactiver cette session",
                copyVisible: "Copier les journaux visibles",
                copiedVisible: "Journaux visibles copiés",
                refresh: "Actualiser les diagnostics",
                clear: "Diagnostic clair",
                enableSessionDiagnostics: "Activer les diagnostics de session"
            },
            filters: {
                all: "Tout",
                searchPlaceholder: "Titre de recherche, résumé, clé, domaine, fonctionnalité, fournisseur",
                visibleCounts: "Comptes visibles :",
                error: "Erreur",
                warn: "Avertir",
                info: "Informations",
                debug: "Débogage",
                trace: "Tracer"
            },
            summary: {
                loadedWindowTitle: "Fenêtre chargée",
                loadedWindowBody: "Derniers {limit} événements canoniques max.",
                visibleNowTitle: "Visible maintenant",
                visibleNowBody: "Les filtres et la recherche sont mis à jour uniquement côté client.",
                snapshotsTitle: "Instantanés",
                noProvider: "pas de fournisseur",
                noResolvedSnapshot: "Aucun instantané résolu dans la charge utile actuelle.",
                lastSyncTitle: "Dernière synchronisation",
                waiting: "En attente",
                lastSyncBody: "Actualise la pause pendant que cet onglet est masqué.",
                eventOne: "Événement {count}",
                eventOther: "{count} événements",
                snapshotOne: "{count} instantané",
                snapshotOther: "{count} instantanés"
            },
            row: {
                session: "Séance",
                request: "Demande",
                correlation: "Corrélation",
                tab: "Onglet",
                frame: "Cadre",
                document: "Documenter",
                origin: "Origine",
                copied: "Copié",
                copyRow: "Copier la ligne",
                showDetails: "Afficher les détails",
                hideDetails: "Masquer les détails",
                senderUrl: "URL de l'expéditeur",
                eventKey: "Clé d'événement",
                description: "Descriptif",
                eventData: "Données d'événement"
            },
            states: {
                requestErrorPrefix: "L'actualisation de l'exécution a échoué. La dernière charge utile réussie reste visible jusqu'à la prochaine tentative.",
                captureOffTitle: "La capture des diagnostics est désactivée pour cette session.",
                captureOffBody: "La visionneuse est disponible, mais aucun nouveau journal n'arrivera tant que vous n'aurez pas activé les diagnostics pour cette session. Production conserve sa politique de capture de base désactivée, sauf si vous la remplacez intentionnellement ici.",
                waitingTitle: "En attente des événements de diagnostic.",
                waitingBody: "Le tiroir est relié au collecteur canonique. Une fois que l'extension émet de nouveaux diagnostics structurés, ils apparaîtront ici automatiquement.",
                noMatchesTitle: "Aucun événement ne correspond aux filtres actuels.",
                noMatchesBody: "Essayez un filtre de niveau plus large ou décochez le champ de recherche pour réafficher les événements."
            },
            status: {
                unavailableLabel: "Indisponible",
                unavailableDescription: "La visionneuse de diagnostics n’est pas activée pour cet environnement.",
                syncIssueLabel: "Problème de synchronisation",
                syncIssueDescription: "La visionneuse n'a pas pu actualiser les diagnostics à partir du runtime.",
                connectingLabel: "Connexion",
                connectingDescription: "La visionneuse charge la configuration actuelle des diagnostics.",
                sessionOffLabel: "Séance terminée",
                sessionOffDescription: "La capture des diagnostics est actuellement désactivée pour cette session. Les événements capturés existants restent visibles.",
                pausedLabel: "En pause",
                pausedDescription: "L'interrogation s'interrompt pendant que l'onglet Options est masqué et reprend lorsqu'il redevient visible.",
                liveLabel: "En direct",
                liveDescription: "La visionneuse interroge la dernière charge utile de diagnostic canonique.",
                readyLabel: "Prêt",
                readyDescription: "Ouvrez le tiroir pour inspecter les derniers diagnostics canoniques."
            },
            requestErrors: {
                runtimeUnavailable: "La messagerie d'exécution n'est pas disponible dans le contexte actuel.",
                loadConfigFailed: "Impossible de charger la configuration des diagnostics.",
                loadPayloadFailed: "Impossible de charger la charge utile des diagnostics.",
                updateConfigFailed: "Impossible de mettre à jour la configuration des diagnostics.",
                clearFailed: "Impossible d'effacer les diagnostics."
            }
        },
        runtime: {
            save: {
                loading: "Chargement des paramètres...",
                saving: "Enregistrement automatique des modifications...",
                saved: "Toutes les modifications sont enregistrées automatiquement.",
                loadFailed: "Impossible de charger vos paramètres enregistrés.",
                autosaveFailed: "L'enregistrement automatique a échoué. Votre dernière modification est toujours locale à cet onglet."
            },
            connection: {
                addApiKey: "Ajoutez votre clé API OpenAI, puis testez la connexion.",
                runTest: "Exécutez Test Connection pour vérifier votre clé OpenAI et le modèle sélectionné.",
                testing: "Test de la configuration actuelle de OpenAI...",
                apiKeyRequired: "La clé API OpenAI est requise avant que la connexion puisse être testée.",
                modelRequired: "Choisissez un modèle OpenAI avant de tester la connexion.",
                apiKeyRejected: "OpenAI a rejeté la clé API.",
                modelUnavailable: "Modèle OpenAI non disponible pour cette clé : {model}.",
                requestFailed: "La requête OpenAI a échoué avec {status}.",
                networkFailed: "Impossible d'atteindre OpenAI. Vérifiez votre connexion réseau et réessayez.",
                reachable: "OpenAI est joignable et {model} est disponible."
            },
            dataTransfer: {
                idle: "Utilisez la sauvegarde cryptée comme chemin de récupération de secours pour les paramètres et l'historique de session, ou supprimez l'archive enregistrée partout lorsque la synchronisation cloud est connectée.",
                exporting: "Préparation d'une archive chiffrée de secours avec les paramètres et l'historique des sessions...",
                exportSuccess: "Sauvegarde cryptée exportée avec {count} session enregistrée{suffix}.",
                exportFailed: "Échec de l'exportation du groupe de données.",
                importing: "Décryptage de la sauvegarde et restauration des paramètres et de l'historique des sessions...",
                importSuccess: "Sauvegarde importée. {count} session{suffix} restaurée.",
                importFailed: "Échec de l'importation du groupe de données.",
                clearingSynced: "Suppression de l'archive synchronisée de cet appareil et propagation de la suppression aux fournisseurs de cloud connectés...",
                clearingLocal: "Suppression de toutes les sessions enregistrées du stockage local...",
                clearSuccessSynced: "L'archive a été supprimée de cet appareil et la suppression a été mise en file d'attente pour vos fournisseurs de cloud connectés. Vos paramètres ont été conservés.",
                clearSuccessLocal: "Les sessions enregistrées ont été supprimées. Vos paramètres ont été conservés.",
                clearFailed: "Échec de la suppression de l'archive de la session enregistrée."
            },
            cloudSync: {
                idleAvailable: "La synchronisation cloud est disponible lorsque vous connectez Google Drive ou OneDrive.",
                idleConnected: "L'état de la synchronisation cloud est à jour.",
                idleDisconnected: "Connectez un fournisseur de cloud pour protéger automatiquement vos archives.",
                loadFailed: "Impossible de charger l'état de synchronisation cloud.",
                updated: "Statut de synchronisation cloud mis à jour.",
                actionFailed: "L'action de synchronisation dans le cloud a échoué.",
                connecting: "Connexion du fournisseur de cloud...",
                disconnecting: "Déconnexion du fournisseur de cloud...",
                retrying: "Nouvelle tentative de synchronisation cloud...",
                reconnecting: "Actualisation de l'accès au fournisseur de cloud...",
                resolvingChoice: "Application du choix des paramètres partagés..."
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "Archiver",
            title: "Historique des réunions",
            subtitle: "Parcourez les sessions enregistrées, rouvrez les détails de la transcription, exportez les enregistrements et gérez le stockage local sans quitter l'extension.",
            openSettings: "Ouvrir les paramètres",
            searchLabel: "Sessions de recherche",
            searchPlaceholder: "Recherchez des titres, des identifiants de réunion, des intervenants, des légendes ou des traductions...",
            clearSearch: "Effacer la recherche",
            sortLabel: "Trier",
            providerFilterLabel: "Filtrer par fournisseur",
            statusFilterLabel: "Filtrer par statut",
            resetFilters: "Réinitialiser les filtres",
            resultCountOne: "Réunion {count}",
            resultCountOther: "{count} réunions",
            resultCountFiltered: "{filtered} des {total} réunions",
            translatedCaptionCountOne: "{count} légende traduite stockée dans vos archives.",
            translatedCaptionCountOther: "{count} sous-titres traduits stockés dans vos archives.",
            archiveSnapshotTitle: "Archiver un instantané",
            archiveSnapshotSessions: "Séances",
            archiveSnapshotCurrentView: "Vue actuelle",
            archiveSnapshotProviderFocus: "Focus sur le fournisseur",
            archiveSnapshotStarFilter: "Filtre étoile",
            archiveSnapshotUrlHint: "L'état de la recherche, les filtres, le tri et la session actuellement ouverte restent reflétés dans l'URL de la page afin que l'actualisation et la navigation semblent prévisibles.",
            storageFullTitle: "Le stockage local est saturé",
            storageFullDescription: "Votre archive utilise {percentage} % du quota d'extension locale. Passez en revue les anciennes sessions ou exportez les enregistrements importants depuis les paramètres avant que le stockage ne devienne une contrainte.",
            reviewOldestSessions: "Revoir les sessions les plus anciennes",
            loadingTitle: "Chargement de l'historique des réunions",
            loadingDescription: "Récupération de vos sessions enregistrées, de l'état de stockage et des métadonnées récapitulatives des tâches.",
            detailLoadingTitle: "Chargement des détails de la session",
            detailLoadingDescription: "Préparer la transcription complète, les métadonnées, les résumés et l'état du travail pour cette réunion.",
            emptyInitialTitle: "Pas d'historique des réunions pour l'instant",
            emptyInitialDescription: "Les sessions de réunion apparaissent ici automatiquement une fois que l'extension capture les sous-titres dans une réunion sur navigateur prise en charge. Une fois que vous avez rejoint un appel et que les sous-titres circulent, l'archive commencera à se construire d'elle-même.",
            emptyFilteredTitle: "Aucune réunion ne correspond à cette vue",
            emptyFilteredDescription: "La recherche actuelle, le filtre de fournisseur ou la vue de tri ne correspondent à aucune session enregistrée. Réinitialisez la vue actuelle ou consultez vos sessions les plus anciennes pour continuer la navigation.",
            deleteSessionTitle: "Supprimer cette session de réunion ?",
            deleteSessionDescription: "Cela supprime \"{title}\" de l'historique local. Cette action ne peut pas être annulée.",
            deleteSessionConfirm: "Supprimer la séance"
        },
        dependency: {
            title: "OpenAI a besoin d'attention",
            actionRequired: "Action requise",
            needsVerification: "Vérification nécessaire",
            impact: "{message} La génération de résumés, la traduction des sous-titres enregistrés et la révision par l'assistant restent indisponibles jusqu'à ce que le service soit à nouveau prêt."
        },
        filters: {
            providerAll: "Tous les fournisseurs",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams Web",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "Le plus récent en premier",
            sortOldest: "Le plus ancien en premier",
            starAll: "Toutes les séances",
            starStarred: "Favoris uniquement",
            activeQuery: "Requête : \"{query}\"",
            activeViewingOldest: "Afficher en premier les réunions les plus anciennes"
        },
        storageIndicator: {
            usage: "{used} sur {quota}",
            highUsage: "Utilisation élevée",
            reviewSoon: "Réviser bientôt",
            healthy: "Sain"
        },
        confirmDialog: {
            closeDialog: "Fermer la boîte de dialogue",
            confirmAction: "Confirmer l'action"
        },
        sessionList: {
            today: "Aujourd'hui",
            yesterday: "Hier",
            justNow: "Juste maintenant",
            inProgress: "En cours",
            noPreview: "Aucun sous-titre capturé ni message de discussion de réunion n'est encore disponible pour cette session.",
            removeStar: "Supprimer l'étoile",
            starSession: "Séance d'étoiles",
            openDetails: "Ouvrir les détails",
            deleteSession: "Supprimer la séance",
            generatingSummary: "Générer un résumé",
            starred: "Favoris",
            captionCountOne: "Légende {count}",
            captionCountOther: "{count} légendes",
            translatedOriginalOnly: "Original uniquement",
            translatedCount: "{count} traduit",
            chatCountOne: "{count} discuter",
            chatCountOther: "{count} discussions",
            directCall: "Appel direct",
            hideIdentifiers: "Masquer les identifiants",
            showIdentifiers: "Afficher les identifiants",
            loadingMore: "Chargement de plus de réunions..."
        },
        detail: {
            backToHistory: "Retour à l'histoire",
            reviewDescription: "Consultez la transcription capturée, les traductions enregistrées, la couverture de l'extraction et les résumés de l'IA pour cette réunion.",
            inProgress: "En cours",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}m",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}m {seconds}s"
            },
            actions: {
                saveTitle: "Enregistrer le titre",
                cancelTitleEditing: "Annuler la modification du titre",
                renameSession: "Renommer la session",
                retry: "Réessayer"
            },
            exportMenu: {
                open: "Ouvrir les options d'exportation",
                close: "Fermer les options d'exportation",
                title: "Exporter la transcription",
                description: "Choisissez si les traductions enregistrées et les résumés enregistrés doivent être inclus dans l'exportation Markdown.",
                includeTranslationsLabel: "Inclure les traductions enregistrées",
                includeTranslationsAvailable: "Les traductions enregistrées seront incluses dans le fichier d'exportation.",
                includeTranslationsUnavailable: "Aucune traduction enregistrée n'est encore disponible pour cette session.",
                includeSummariesLabel: "Inclure les résumés enregistrés",
                includeSummariesAvailable: "Les résumés des réunions enregistrés seront ajoutés au fichier d'exportation.",
                includeSummariesUnavailable: "Aucun résumé de réunion enregistré n'est encore disponible pour cette session.",
                export: "Télécharger Markdown"
            },
            metadataLabels: {
                provider: "Fournisseur",
                callTitle: "Titre de l'appel",
                meetingTitle: "Titre de la réunion",
                meetingUrl: "URL de la réunion",
                started: "Commencé",
                ended: "Terminé",
                status: "Statut",
                primaryId: "Identifiant principal",
                meetingCode: "Code de réunion",
                meetingId: "ID de réunion",
                conferenceId: "ID de conférence",
                meetingNumber: "Numéro de réunion",
                threadId: "ID du fil de discussion",
                callType: "Type d'appel"
            },
            status: {
                ended: "Terminé",
                live: "En direct"
            },
            sections: {
                metadata: {
                    title: "Métadonnées de réunion",
                    description: "Vérifiez l'identité de la réunion, le calendrier et les identifiants stockés pour cette session enregistrée.",
                    expand: "Afficher les métadonnées",
                    collapse: "Masquer les métadonnées"
                },
                continuations: {
                    title: "Suite des séances",
                    description: "Inspectez chaque réinscription et le temps total passé avant la reprise de la même session.",
                    expand: "Afficher les suites",
                    collapse: "Masquer les suites"
                },
                extraction: {
                    title: "Rapport d'extraction",
                    description: "Inspectez la couverture de la transcription, l’extraction des locuteurs et les empreintes digitales d’intégrité de l’archive enregistrée.",
                    expand: "Afficher le rapport d'extraction",
                    collapse: "Masquer le rapport d'extraction"
                },
                summary: {
                    title: "Résumé de la réunion",
                    description: "Générez ou consultez les résumés IA enregistrés pour ce profil de réunion et cette langue.",
                    expand: "Afficher le résumé",
                    collapse: "Masquer le résumé"
                },
                transcript: {
                    title: "Transcription",
                    description: "Consultez les sous-titres enregistrés, les discussions de réunion, les traductions et les résultats de l'assistant dans l'ordre chronologique."
                }
            },
            stats: {
                capturedCaptions: "Légendes capturées",
                translatedCaptions: "Légendes traduites",
                duration: "Durée",
                meetingChatMessages: "Messages de discussion de réunion",
                rejoins: "Rejoint",
                totalAwayTime: "Temps total d'absence",
                lastRejoin: "Dernière réinscription",
                canonicalEvents: "Événements canoniques",
                uniqueSpeakers: "Des enceintes uniques",
                metadataCoverage: "Couverture des métadonnées",
                providerIds: "ID de fournisseur"
            },
            rejoin: {
                label: "Rejoindre {index}",
                awayFor: "Absent pour {gap}",
                leftMeeting: "Réunion de gauche",
                returnedToMeeting: "Retourné à la réunion"
            },
            extraction: {
                eventLogFingerprint: "Empreinte digitale du journal des événements",
                searchFingerprint: "Rechercher une empreinte digitale",
                summaryFingerprint: "Empreinte digitale récapitulative",
                timelineRange: "Plage de chronologie",
                lastEvent: "Dernier événement",
                noEvents: "Aucun événement",
                coverageBreakdown: "Répartition de la couverture",
                sessionOffsets: "Décalages de session",
                translatedEvents: "Événements traduits",
                finalCaptionEvents: "Événements de sous-titres finaux",
                speakers: "Haut-parleurs",
                noSpeakers: "Aucun haut-parleur détecté.",
                warnings: "Avertissements"
            },
            summaryJob: {
                states: {
                    preflighting: "Préparation du résumé",
                    extracting: "Analyser la transcription",
                    merging: "Fusionner les preuves",
                    synthesizing: "Rédaction d'un résumé",
                    continuing: "Résumé continu",
                    reconciling: "Rapprochement des résultats",
                    completed: "Résumé prêt",
                    failed: "Échec du résumé",
                    cancelled: "Résumé annulé",
                    default: "Préparation du résumé"
                },
                progress: {
                    ready: "Prêt",
                    preparing: "Préparer les preuves",
                    step: "Étape {current} de {total}",
                    mergingEvidence: "Fusionner les preuves",
                    preparingFinal: "Préparation du résumé final",
                    continuation: "Suite {current} de {total}",
                    continuing: "Génération continue",
                    finalChecks: "Effectuer les contrôles finaux"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI indisponible",
                unavailable: "La génération de résumé n'est pas disponible",
                generating: "Générer un résumé",
                generateAnother: "Générer un autre résumé",
                generate: "Générer un résumé de la réunion",
                generateWithProfile: "Utilisez {profile} pour créer ou actualiser un résumé de réunion enregistré.",
                selectMeetingType: "Sélectionnez un profil de réunion et une langue de sortie avant de générer un résumé.",
                generateAnotherAction: "Générer un autre résumé {profile}",
                generateAction: "Générer un résumé {profile}",
                genericProfile: "profil sélectionné",
                inProgress: "La génération du résumé est toujours en cours.",
                noSummaryYet: "Aucun résumé {profile} n'a encore été enregistré dans {language}.",
                noSummaryHint: "Générez-en un maintenant ou changez de profil ou de langue de réunion pour consulter une autre version enregistrée.",
                latestSaved: "Dernier résumé enregistré : {profile} dans {language}.",
                evidenceChunks: "{count} morceaux de preuves",
                continuations: "{count} suites",
                reconciled: "Réconcilié",
                executionStrategy: {
                    singleShot: "Coup unique",
                    structuredSingleShot: "Plan unique structuré",
                    multiStage: "Multi-étapes"
                },
                version: {
                    latest: "Dernière · {time}",
                    automatic: "Automatique",
                    manual: "Manuel",
                    auto: "Automatique",
                    alt: "Profil alternatif",
                    session: "Profil de session",
                    default: "Profil par défaut",
                    sessionProfile: "Profil de session : {name}",
                    unknownProfile: "Profil inconnu",
                    generatedWithAnotherProfile: "Généré avec un autre profil",
                    generatedAt: "Généré {time}"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "La traduction des sous-titres enregistrés n'est pas disponible",
                translatingAllCaptions: "Traduire toutes les légendes",
                translateAllCaptions: "Traduire toutes les légendes",
                batchTranslateSubtitle: "Créez des traductions enregistrées pour chaque légende dans {language}.",
                translateAllCaptionsTo: "Traduire toutes les légendes en {language}",
                emptyTitle: "Aucune transcription ni élément de discussion",
                emptyDescription: "Cette session n'a pas encore de sous-titres enregistrés ni de messages de discussion de réunion.",
                meetingChat: "Discussion en réunion",
                translationAvailable: "Traduction enregistrée",
                message: "Message",
                caption: "Légende",
                translation: "Traduction",
                noChatTranslation: "Aucune traduction enregistrée pour ce message de chat pour l'instant.",
                noCaptionTranslation: "Aucune traduction enregistrée pour cette légende pour l'instant.",
                translatingChatMessage: "Traduire le message de discussion",
                translatingCaption: "Traduction de la légende",
                translateChatMessage: "Traduire le message de discussion",
                translateCaption: "Traduire la légende",
                translateThisItem: "Traduisez ceci {item} en {language}",
                aiAssistant: "Assistant IA",
                triggeredByChat: "Déclenché par ce message de chat",
                triggeredByCaption: "Déclenché par cette légende"
            },
            export: {
                sessionDetailsHeading: "Détails de la séance",
                titleLabel: "Titre",
                providerLabel: "Fournisseur",
                startedLabel: "Commencé",
                primaryIdLabel: "Identifiant principal",
                endedLabel: "Terminé",
                durationLabel: "Durée",
                statusLabel: "Statut",
                capturedChatMessagesLabel: "Messages de discussion capturés",
                savedTranslationsLabel: "Traductions enregistrées",
                totalAwayBeforeRejoinsLabel: "Temps d'absence total avant les retours",
                savedSummariesHeading: "Résumés enregistrés",
                generatedLabel: "Généré",
                modelLabel: "Modèle",
                summaryEffortLabel: "Effort sommaire",
                executionStrategyLabel: "Stratégie d'exécution",
                evidenceChunksLabel: "Morceaux de preuves",
                continuationsLabel: "Suite",
                reconciledLabel: "Réconcilié",
                coveredCaptionsLabel: "Sous-titres cachés",
                yes: "Oui",
                sessionContinuationsHeading: "Suite des séances",
                leftAtLabel: "Laissé à",
                rejoinedAtLabel: "Rejoint à",
                awayForLabel: "Absent pour",
                sessionResumeHeading: "La session {index} a repris à {time} après {gap}"
            }
        },
        runtime: {
            settingsLoadFailed: "Échec du chargement des paramètres de l'extension.",
            loadHistoryFailed: "Échec du chargement de l'historique des réunions.",
            loadSessionDetailFailed: "Échec du chargement des détails de la session de réunion.",
            sessionDeleted: "Séance supprimée.",
            sessionDeleteFailed: "Échec de la suppression de la session.",
            titleUpdated: "Titre mis à jour.",
            titleUpdateFailed: "Échec de la mise à jour du titre.",
            starUpdateFailed: "Échec de la mise à jour de l'étoile.",
            sessionNotFound: "Session de réunion introuvable.",
            chatMessageNotFound: "Message de discussion introuvable.",
            captionNotFound: "Ligne de légende introuvable.",
            translationFailed: "La traduction a échoué.",
            captionTranslated: "Légende traduite en {language}.",
            chatTranslated: "Message de discussion traduit en {language}.",
            captionTranslateFailed: "Échec de la traduction de la légende.",
            chatTranslateFailed: "Échec de la traduction du message de discussion.",
            analyzingTranscript: "Analyser la transcription",
            noSummarySource: "Aucune transcription ou contenu de discussion de réunion n’est disponible pour le résumé.",
            summaryGenerationFailed: "La génération du résumé a échou��.",
            summaryGenerated: "Résumé généré dans {language}.",
            summaryCancelFailed: "Échec de l'annulation de la génération du résumé.",
            batchTranslationFailed: "Échec de la traduction de toutes les légendes.",
            allCaptionsAlreadyTranslated: "Toutes les légendes ont déjà {language} traductions.",
            batchTranslatedOne: "Légende {count} traduite en {language}{suffix}.",
            batchTranslatedOther: "Légendes {count} traduites en {language}{suffix}.",
            batchSkippedSuffix: ", {count} ignoré",
            errorOutdated: "{fallback} Détails : Le runtime de l'extension est obsolète. Rechargez l'extension et réessayez.",
            errorNoDetails: "{fallback} Détails : aucun détail d'erreur supplémentaire n'a été renvoyé.",
            errorModelStopped: "{fallback} Détails : Le modèle s'est arrêté avant que le résumé puisse être terminé. L'application réessaye automatiquement, mais cette réponse n'a toujours pas pu être entièrement récupérée. Essayez de régénérer ou d'utiliser un modèle avec un budget de sortie plus important.",
            errorNoProviderDetails: "{fallback} Détails : aucun détail supplémentaire sur le fournisseur n'a été renvoyé.",
            errorWithDetails: "{fallback} Détails : {details}"
        }
    },
    content: {
        copyFeedback: "Copié!",
        timeline: {
            meetingChat: "Discussion en réunion"
        },
        translation: {
            errorFallback: "Erreur",
            requestFailed: "La traduction a échoué",
            retryAction: "Réessayer la traduction"
        },
        empty: {
            waitingForCaptionsTitle: "En attendant les légendes...",
            waitingForCaptionsBody: "Activez les sous-titres dans votre réunion pour commencer à capturer du texte",
            waitingForCaptionsGoogleMeet: "Activez les sous-titres dans Google Meet pour commencer à capturer du texte",
            waitingForCaptionsTeams: "Ouvrez Plus > Langue et parole > Afficher les sous-titres en direct pour commencer à capturer du texte",
            waitingForCaptionsZoom: "Ouvrez Plus > Légendes > Afficher les légendes pour commencer à capturer du texte",
            capturePendingTitle: "La capture vous attend",
            capturePendingBody: "Répondez à l’invite de démarrage pour permettre à cette réunion de démarrer la capture.",
            captureStartingTitle: "Démarrer la capture",
            captureStartingBody: "Préparation de la séance de réunion et des observateurs des startups maintenant.",
            captureDismissedTitle: "La capture est restée désactivée",
            captureDismissedBody: "Cette réunion a été supprimée de l'invite de démarrage et restera désactivée.",
            sessionEndedTitle: "Séance terminée",
            sessionEndedBody: "Cette réunion n'est plus active sur cette page.",
            waitingToJoinTitle: "En attente de rejoindre la réunion",
            waitingToJoinBody: "Rejoignez la réunion pour démarrer le chronomètre de session et capturer le flux.",
            enablingCaptionsTitle: "Activation des sous-titres en direct",
            enablingCaptionsBody: "CaptionArc essaie maintenant d'activer les sous-titres pour cette réunion.",
            readyTitle: "La capture est prête",
            readyBody: "Commencez à parler et des lignes de légende apparaîtront ici au fur et à mesure que la réunion se poursuit.",
            close: "Fermer"
        },
        sessionSeparator: {
            title: "Séance {index}",
            detail: "Rejoint {time} · Absent {gap}",
            ariaLabel: "Reprise de la session {index}"
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "L’IA a besoin d’attention",
                finishOpenAiSetup: "Terminer la configuration de OpenAI",
                openAiUnavailable: "OpenAI n'est pas disponible",
                capturePendingTitle: "Capture en attente",
                waitingForAnswer: "En attendant ta réponse",
                startingCaptureTitle: "Démarrer la capture",
                preparingMeeting: "Préparer cette réunion",
                captureSkippedTitle: "Capture ignorée",
                meetingStaysOff: "Cette réunion reste interrompue",
                sessionEndedTitle: "Séance terminée",
                rejoinToContinue: "Rejoignez-nous pour continuer ou redémarrer",
                waitingToJoinTitle: "En attendant de rejoindre",
                sessionStartsAfterJoin: "La session commence après l'adhésion",
                enablingCaptionsTitle: "Activation des sous-titres",
                tryingLiveCaptions: "J'essaie d'activer les sous-titres en direct",
                setupRequiredTitle: "Configuration requise",
                turnOnMeetingCaptions: "Activer les sous-titres des réunions",
                translationIssueTitle: "Problème de traduction",
                retryAvailable: "Une nouvelle tentative est disponible",
                translatingLiveTitle: "Traduire en direct",
                liveTranslationTitle: "Traduction en direct",
                capturingLiveTitle: "Capturer en direct",
                originalCaptionsOnly: "Légendes originales uniquement",
                readyToCaptureTitle: "Prêt à capturer",
                waitingForSpeech: "En attendant le discours",
                waitingForCaptionsTitle: "En attente des sous-titres"
            },
            main: {
                captureOnHoldTitle: "Capture en attente",
                waitingForAnswer: "En attendant ta réponse",
                startingCaptureTitle: "Démarrer la capture",
                preparingMeeting: "Préparer cette réunion",
                captureSkippedTitle: "Capture ignorée",
                meetingStaysOff: "Cette réunion reste interrompue",
                sessionEndedTitle: "Séance terminée",
                rejoinToContinue: "Rejoignez-nous pour continuer ou redémarrer",
                waitingToJoinTitle: "En attendant de rejoindre",
                meetingOverlay: "Superposition de réunion",
                enablingLiveCaptionsTitle: "Activation des sous-titres en direct",
                preparingCapture: "Préparation de la capture",
                liveCaptureTitle: "Capture en direct"
            },
            profileControl: {
                defaultBadge: "Par défaut"
            },
            translationToggle: {
                label: "Automatique"
            },
            translationDock: {
                eyebrow: "Traduction en direct",
                consent: {
                    title: "La capture doit être confirmée",
                    body: "Approuvez l’invite de démarrage pour commencer à capturer cette réunion.",
                    badge: "En attente"
                },
                starting: {
                    title: "Démarrer la capture",
                    body: "Préparation de la session et du pipeline d'observateurs maintenant.",
                    badge: "Démarrage"
                },
                dismissed: {
                    title: "La capture est restée désactivée",
                    body: "Cette réunion a été ignorée de l'invite de démarrage.",
                    badge: "Désactivé"
                },
                setup: {
                    title: "Configuration OpenAI requise",
                    body: "Terminez la configuration de OpenAI dans Paramètres pour activer la traduction en direct.",
                    badge: "Configuration"
                },
                unavailable: {
                    title: "OpenAI n'est pas disponible",
                    body: "Vérifiez la configuration OpenAI dans Paramètres avant que la traduction en direct puisse reprendre.",
                    badge: "Problème"
                },
                off: {
                    title: "La traduction est désactivée",
                    body: "Cible : {language}. Allumez-le pour une sortie en direct.",
                    badge: "Désactivé"
                },
                error: {
                    title: "La traduction a besoin d’attention",
                    body: "Certaines lignes ont échoué. Une nouvelle tentative est disponible sur les cartes concernées.",
                    badge: "Problème"
                },
                translating: {
                    title: "Traduction en {language}",
                    body: "Les nouvelles lignes sont traduites en direct.",
                    badge: "Travailler"
                },
                live: {
                    title: "Traduction en direct active",
                    body: "Rendu de la sortie en direct dans {language}."
                },
                ready: {
                    title: "La traduction est armée",
                    body: "Les sous-titres sont activés. Les nouvelles lignes seront traduites par {language}.",
                    badge: "Prêt"
                },
                waiting: {
                    title: "En attente des sous-titres",
                    body: "Activez les sous-titres des réunions pour lancer la traduction.",
                    badge: "En attente"
                }
            },
            tooltips: {
                compactAiSetup: "Terminez la configuration de OpenAI dans Paramètres pour restaurer la traduction, les résumés et les conseils de l'assistant.",
                compactAiIssue: "Les fonctionnalités dépendantes de {message} OpenAI restent suspendues jusqu'à ce que le problème soit résolu.",
                translationOff: "Désactiver la traduction en direct",
                translationOn: "Activer la traduction en direct",
                translationSetup: "Terminez la configuration de OpenAI dans Paramètres pour activer la traduction en direct.",
                translationUnavailable: "La traduction en direct est suspendue jusqu'à ce que OpenAI soit à nouveau disponible.",
                captureHelp: "Aide à la capture",
                hideCaptureHelp: "Masquer l'aide à la capture",
                switchToCompactView: "Passer à la vue compacte",
                expandOverlay: "Développer la superposition",
                openProfilePicker: "Sélecteur de profil de réunion ouverte"
            }
        },
        captureGuide: {
            eyebrow: "Configuration de la capture",
            title: "Aide à la capture",
            statusReady: "La capture démarre lorsque vous êtes prêt",
            footer: "CaptionArc commencera la capture dès que les sous-titres en direct apparaîtront dans cet onglet.",
            stepsCount: "{count} étapes",
            waitingTitle: "En attente des sous-titres en direct",
            closeAriaLabel: "Fermer le guide de capture",
            startsAutomatically: "Démarre automatiquement",
            tooltipOpen: "Aide à la capture",
            tooltipClose: "Masquer l'aide à la capture",
            providers: {
                googleMeet: {
                    title: "Activer la capture dans Google Meet",
                    body: "CaptionArc peut démarrer une fois que les sous-titres Google Meet sont activés dans cette réunion par navigateur.",
                    status: "Démarre automatiquement",
                    footer: "CaptionArc commencera automatiquement la capture dès que les sous-titres en direct apparaîtront dans cet onglet.",
                    troubleshooting: "Si vous ne voyez pas de contrôle de sous-titres, vérifiez si l'état de la réunion ou du navigateur est toujours en cours de chargement.",
                    steps: {
                        openControls: {
                            title: "Ouvrir les commandes de la réunion",
                            detail: "Déplacez votre souris pour afficher la barre d'outils de réunion inférieure."
                        },
                        openCaptions: {
                            title: "Contrôles des sous-titres ouverts",
                            detail: "Cliquez sur les légendes ou le contrôle CC dans la barre d'outils de la réunion."
                        },
                        turnOn: {
                            title: "Activer les sous-titres",
                            detail: "Une fois les sous-titres activés, CaptionArc commencera automatiquement à capturer le texte."
                        }
                    }
                },
                microsoftTeams: {
                    title: "Activer la capture dans Microsoft Teams",
                    body: "CaptionArc peut démarrer une fois que les sous-titres en direct sont activés à partir de la barre d'outils de la réunion Teams.",
                    status: "Démarre automatiquement",
                    footer: "CaptionArc commencera automatiquement la capture dès que les sous-titres en direct apparaîtront dans cet onglet.",
                    troubleshooting: "Si les sous-titres ne sont pas disponibles, la politique de l'organisateur ou de l'administrateur peut restreindre les contrôles des sous-titres.",
                    steps: {
                        openMore: {
                            title: "Ouvrir plus",
                            detail: "Utilisez la barre d'outils supérieure de la réunion et ouvrez le menu Plus."
                        },
                        openLanguage: {
                            title: "Langue ouverte et parole",
                            detail: "Dans Plus, choisissez Langue et parole."
                        },
                        chooseCaptions: {
                            title: "Choisissez Afficher les sous-titres en direct",
                            detail: "Sélectionnez Afficher les sous-titres en direct et CaptionArc détectera automatiquement la fenêtre des sous-titres."
                        }
                    }
                },
                zoomWeb: {
                    title: "Activer la capture dans Zoom Web App",
                    body: "CaptionArc pourra démarrer une fois que les sous-titres Zoom Web App seront activés dans cette réunion par navigateur.",
                    status: "Activer les sous-titres manuellement",
                    footer: "CaptionArc commencera la capture dès que les légendes Zoom apparaîtront dans cet onglet.",
                    troubleshooting: "Certaines réunions Zoom peuvent préférer l'application de bureau ou restreindre les contrôles des sous-titres en fonction des paramètres de l'hôte.",
                    steps: {
                        openControls: {
                            title: "Ouvrir les contrôles de la réunion",
                            detail: "Utilisez la barre d'outils de réunion en bas de la fenêtre Zoom Web App."
                        },
                        openMore: {
                            title: "Ouvrir plus",
                            detail: "Ouvrez le menu Plus dans la barre d'outils de la réunion."
                        },
                        openCaptions: {
                            title: "Sous-titres ouverts",
                            detail: "Dans Plus, ouvrez le sous-menu Légendes."
                        },
                        chooseShow: {
                            title: "Choisissez Afficher les sous-titres",
                            detail: "Sélectionnez Afficher les sous-titres pour rendre la surface des sous-titres Zoom disponible dans cet onglet."
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "Séance de réunion",
            turns: "{count} tours",
            chat: "{count} discuter",
            chatCaptureTooltip: "La capture du chat de réunion est activée. Les nouveaux messages de discussion de réunion pris en charge seront enregistrés avec cette session.",
            autoSummarySetupTooltip: "Les résumés automatiques restent en pause jusqu'à ce que la configuration de OpenAI soit terminée.",
            autoSummaryUnavailableTooltip: "Les résumés automatiques sont suspendus jusqu'à ce que OpenAI soit à nouveau disponible.",
            autoSummaryReadyTooltip: "{profile} s'exécutera automatiquement à la fin de cette réunion.",
            aiAlertSetupTooltip: "Terminez la configuration de OpenAI dans Paramètres pour restaurer la traduction, les résumés et les conseils de l'assistant.",
            aiAlertUnavailableTooltip: "Les outils de réunion dépendants de {message} OpenAI restent en pause jusqu'à ce que le problème soit résolu.",
            liveState: {
                awaitingReply: {
                    label: "En attente de réponse",
                    tooltip: "Capture attend votre décision de démarrage pour cette réunion."
                },
                starting: {
                    label: "Démarrage",
                    tooltip: "La capture a été approuvée et la séance de réunion est en cours de préparation."
                },
                off: {
                    label: "Désactivé",
                    tooltip: "La capture a été ignorée pour cette réunion à partir de l'invite de démarrage."
                },
                ended: {
                    label: "Terminé",
                    tooltip: "Cette séance est terminée. Rejoignez-nous pour continuer la dernière session ou en démarrer une nouvelle."
                },
                lobby: {
                    label: "Hall d'entrée",
                    tooltip: "Rejoignez la réunion pour démarrer le chronomètre de session et capturer le flux."
                },
                live: {
                    label: "En direct",
                    tooltip: "Les sous-titres sont actuellement capturés lors de cette réunion."
                },
                armed: {
                    label: "Armé",
                    tooltip: "Les sous-titres sont activés et la superposition attend les lignes suivantes."
                },
                waiting: {
                    label: "En attente",
                    tooltip: "Les sous-titres des réunions ne sont pas encore activés."
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "Par défaut, l'action standard",
            timeoutHint: "La valeur par défaut est {action}",
            captureConsent: {
                title: "Activer la capture pour cette réunion ?",
                body: "Si vous ignorez cette étape, la capture reste désactivée pour cette visite de réunion.",
                ariaLabel: "Capturer la confirmation de démarrage",
                secondaryAction: "Pas maintenant",
                primaryAction: "Activer"
            },
            sessionContinuation: {
                title: "Continuer la séance précédente ?",
                body: "Vous avez rejoint la même réunion peu de temps après votre départ. Aucune réponse ne démarre une nouvelle session.",
                ariaLabel: "Confirmation de poursuite de la session",
                secondaryAction: "Nouvelle séance",
                primaryAction: "Continuer"
            },
            sessionEnded: {
                title: "Séance terminée",
                body: "Restez ici pour examiner les éléments capturés ou fermez la superposition. Aucune réponse ne le ferme.",
                ariaLabel: "Confirmation de fin de session",
                secondaryAction: "Fermer",
                primaryAction: "Reste ici"
            }
        },
        assistant: {
            statusLabel: {
                queued: "En file d'attente",
                working: "Travailler",
                ready: "Prêt",
                paused: "En pause",
                issue: "Problème",
                unavailable: "Indisponible",
                watching: "Regarder"
            },
            statusDescription: {
                queued: "Un moment utile a été détecté.",
                working: "Générer des conseils en direct.",
                latestReady: "Les dernières instructions de l'assistant sont prêtes.",
                ready: "L'assistant est prêt pour le moment suivant.",
                paused: "L'Assistant est absent pour cette session.",
                issue: "L'assistant a besoin d'attention.",
                unavailable: "OpenAI n'est pas disponible pour le moment.",
                watching: "En attendant un moment utile."
            },
            emptyState: {
                setupTitle: "Terminez la configuration de OpenAI pour utiliser l'assistant",
                setupBody: "La configuration de OpenAI est incomplète, le guidage en direct ne peut donc pas encore s'exécuter.",
                unavailableTitle: "L'assistant est temporairement indisponible",
                unavailableBody: "{message} L'assistant reprendra une fois que OpenAI sera à nouveau en bonne santé.",
                watchingTitle: "L'assistant regarde cette réunion",
                watchingBody: "Lorsqu'une question, une demande ou un risque utile apparaît, des conseils en direct s'afficheront ici.",
                offTitle: "L'Assistant est absent pour cette session",
                offBody: "Réactivez-le chaque fois que vous souhaitez que le guidage en direct reprenne.",
                errorTitle: "L'assistant a besoin d'attention",
                errorBody: "Un problème de génération a interrompu le guidage en direct. Le prochain moment valide réessayera.",
                preparingTitle: "L'assistant prépare des conseils",
                preparingBody: "Un moment utile a été détecté et le premier guidage en direct est désormais mis en file d'attente.",
                workingTitle: "L'assistant travaille",
                workingBody: "Un guidage en direct est généré pour le moment de la réunion en cours."
            },
            footer: {
                setup: "Terminer la configuration de OpenAI",
                unavailable: "OpenAI n'est pas disponible",
                sessionStartsAfterJoin: "La session commence après l'adhésion",
                workingLiveGuidance: "Travailler sur le guidage en direct",
                turnedOffForSession: "Désactivé pour cette session",
                generationNeedsAttention: "La génération a besoin d’attention",
                latestGuidanceReady: "Les dernières directives sont prêtes",
                watchingSession: "Je regarde cette séance",
                notes: "Remarques {count}",
                liveCount: "{count} en direct",
                aiAlertSetup: "Terminez la configuration de OpenAI dans Paramètres avant que le guidage de l'assistant puisse s'exécuter.",
                aiAlertUnavailable: "{message} Le guidage de l'assistant reste en pause jusqu'à ce que OpenAI soit à nouveau disponible."
            },
            source: {
                meetingChat: "Discussion en réunion",
                caption: "Légende",
                unknownSpeaker: "Inconnu"
            },
            pendingReply: "L'assistant prépare une réponse pour le moment.",
            ui: {
                toggleLiveLabel: "En direct",
                readyTitle: "L'assistant est prêt",
                watchingSession: "Je regarde cette séance",
                watching: "Regarder",
                waitingForMoment: "En attendant un moment utile.",
                headerTitle: "Assistant IA",
                footerTitle: "Assistant IA",
                panelAriaLabel: "Guidage en direct de l'assistant IA",
                openSettings: "Ouvrir les paramètres de l'assistant",
                setupBeforeEnable: "Terminez la configuration de OpenAI avant d'activer l'assistant.",
                unavailableUntilOpenAi: "L'Assistant n'est pas disponible jusqu'à ce que OpenAI soit à nouveau disponible",
                turnOffForSession: "Désactiver l'assistant pour cette session",
                turnOnForSession: "Activer l'assistant pour cette session",
                openPanel: "Ouvrir le panneau Assistant",
                collapsePanel: "Réduire le panneau Assistant",
                resizePanel: "Redimensionner le panneau Assistant"
            }
        }
    },
    popup: {
        header: {
            devBadge: "Développeur",
            openMeetingHistory: "Ouvrir l'historique des réunions",
            openSettings: "Ouvrir les paramètres"
        },
        setup: {
            verificationNotTested: "Non testé",
            notConfigured: "OpenAI non configuré",
            setupRequired: {
                label: "Configuration requise",
                description: "Ajoutez votre clé API OpenAI et choisissez un modèle."
            },
            needsAttention: {
                label: "A besoin d'attention",
                description: "Vérifiez la configuration OpenAI dans Paramètres."
            },
            ready: {
                label: "Prêt",
                description: "OpenAI, le modèle et la langue cible sont prêts pour la sortie en direct."
            },
            verifySetup: {
                label: "Vérifier la configuration",
                description: "Exécutez un test de connexion dans Paramètres pour confirmer la configuration OpenAI."
            }
        },
        overlay: {
            badge: "Superposition",
            title: "Visibilité en direct",
            switchAriaLabel: "Activer/désactiver la visibilité de la superposition en direct",
            switchDisabledTitle: "Activez le démarrage de la capture dans Paramètres pour utiliser la visibilité en direct.",
            state: {
                inactive: "Inactif",
                visible: "Visible",
                hidden: "Caché"
            },
            mode: {
                captureStartupOff: "Le démarrage de la capture est désactivé",
                available: "Les séjours superposés sont disponibles",
                hidden: "La superposition reste masquée"
            },
            helper: {
                captureStartupOff: "La visibilité en direct devient disponible une fois que le démarrage est défini sur Demander ou Toujours dans les paramètres.",
                instantToggle: "Basculement instantané pour les réunions ouvertes. La position, la taille et l’état compact sont mémorisés par application de réunion."
            }
        },
        pulse: {
            title: "Impulsion de l’espace de travail"
        },
        rows: {
            live: {
                capturing: {
                    label: "Capturer en direct",
                    detail: "{platform} écoute activement dans cet onglet.",
                    badge: "En direct"
                },
                lobby: {
                    label: "Prêt lorsque vous rejoignez",
                    detail: "{platform} est ouvert et en attente dans le hall.",
                    badge: "Hall d'entrée"
                },
                startupOff: {
                    label: "Le démarrage de la capture est désactivé",
                    detail: "Remettez le démarrage sur Demander ou Toujours lorsque vous souhaitez à nouveau écouter en direct.",
                    badge: "Désactivé"
                },
                idle: {
                    label: "Pas de réunion en direct",
                    detail: "Ouvrez un onglet de réunion pris en charge et CaptionArc se réveillera ici.",
                    badge: "Inactif"
                }
            },
            summary: {
                busy: {
                    label: "Le résumé de l'IA fonctionne",
                    detail: "Un récapitulatif de la réunion est en cours d'élaboration en arrière-plan.",
                    badge: "Occupé"
                },
                failed: {
                    label: "Le résumé mérite attention",
                    detail: "Le dernier résumé ne s’est pas terminé proprement.",
                    badge: "Réessayer"
                },
                automatic: {
                    label: "Le résumé automatique est armé",
                    detail: "{profileName} lancera automatiquement un récapitulatif après la fin de chaque réunion.",
                    badge: "Automatique"
                },
                manual: {
                    label: "Mode résumé manuel",
                    detail: "Rien n'est en attente pour le moment. Les résumés ne s'exécutent que lorsque vous en demandez un.",
                    badge: "Manuel"
                },
                defaultProfileName: "Le profil par défaut"
            },
            archive: {
                empty: {
                    label: "L'archive est toujours vide",
                    detail: "Vos réunions et résumés enregistrés commenceront à être collectés ici une fois la capture terminée.",
                    badge: "Nouveau"
                },
                ready: {
                    label: "{count} réunions enregistrées",
                    detail: "{used} utilisé. {updated}."
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "Aucune réunion enregistrée pour le moment",
            updatedJustNow: "Mis à jour tout à l'heure",
            updatedMinutesAgo: "Mis à jour il y a {minutes} m",
            updatedHoursAgo: "Mis à jour il y a {hours}h",
            updatedDaysAgo: "Mis à jour il y a {days}d"
        },
        meta: {
            aiService: "Service d'IA",
            model: "Modèle",
            target: "Cible",
            startup: "Démarrage",
            modelNotSelected: "Non sélectionné",
            pendingIndicator: "OpenAI n'a pas encore été vérifié.",
            startupValues: {
                off: "Désactivé",
                always: "Toujours",
                ask: "Demander"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
