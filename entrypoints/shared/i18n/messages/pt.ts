import type { UiMessageCatalog } from "../types";

export const ptMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "Acesso rápido",
        actions: {
            cancel: "Cancelar",
            clear: "Limpar",
            close: "Fechar",
            collapse: "Recolher",
            confirmDelete: "Confirmar exclusão",
            delete: "Excluir",
            expand: "Expandir",
            hide: "Esconder",
            loading: "Carregando...",
            open: "Abrir",
            show: "Mostrar",
            continue: "Continuar",
            working: "Trabalhando..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "Ainda não há conteúdo.",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "Reunião"
        },
        theme: {
            group: "Tema",
            system: "Usar tema do sistema",
            light: "Use tema claro",
            dark: "Usar tema escuro"
        },
        optional: "(opcional)",
        uiLanguage: {
            label: "Idioma da interface",
            description: "Escolha o idioma usado pelo pop-up, configurações, histórico e interface de usuário na reunião.",
            system: "Usar o idioma do navegador",
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
            privacyPolicy: "Política de Privacidade",
            termsOfService: "Termos de Serviço"
        },
        legal: {
            version: "Versão {version}",
            copyright: "Direitos autorais © {year} CaptionArc"
        },
        notifications: {
            summaryReady: {
                title: "Resumo pronto para {title}",
                message: "Clique para abrir o resumo completo no histórico de reuniões."
            }
        },
        firstRunTerms: {
            eyebrow: "Configuração inicial",
            title: "Revise e aceite os termos para continuar",
            body: "O CaptionArc exige uma aceitação única dos Termos de Serviço atuais antes de continuar a configuração.",
            version: "Versão dos termos {version}",
            reviewPrompt: "Revise os Termos de Serviço e a Política de Privacidade atuais antes de aceitar.",
            acceptanceNote: "Ao continuar, você confirma que revisou os Termos de Serviço atuais e entende a Política de Privacidade.",
            declinedBody: "O CaptionArc permanece inativo neste dispositivo porque os Termos de Serviço atuais foram recusados.",
            declinedPrompt: "Revise os termos atuais novamente quando estiver pronto para continuar.",
            declinedNote: "O CaptionArc permanecerá bloqueado até que os Termos de Serviço atuais sejam aceitos para este dispositivo.",
            accept: "Aceitar termos"
        },
        legalPages: {
            shared: {
                eyebrow: "Jurídico",
                loadingDescription: "Carregando a cópia jurídica publicada mais recente desta extensão."
            },
            privacyPolicy: {
                title: "Política de Privacidade",
                subtitle: "Uma cópia no produto da mesma Política de Privacidade publicada no repositório.",
                sourceNote: "Esta página renderiza a mesma fonte markdown publicada no repositório para manter alinhadas a cópia dentro da extensão e o documento público.",
                loadingTitle: "Carregando Política de Privacidade"
            },
            termsOfService: {
                title: "Termos de Serviço",
                subtitle: "Revise os termos atuais, as responsabilidades e os limites legais do CaptionArc.",
                acceptEyebrow: "Configuração inicial",
                acceptSubtitle: "Role pelos termos atuais antes de aceitá-los neste dispositivo.",
                acceptPrompt: "Leia os Termos de Serviço atuais para liberar a aceitação.",
                scrollRequired: "Role até o final do documento para habilitar a aceitação.",
                scrollReady: "Você chegou ao final dos termos. Agora pode aceitar e fechar esta página.",
                accept: "Aceitar e fechar",
                decline: "Recusar e fechar",
                declineNote: "Se você não concorda com estes termos, feche esta página e evite usar o CaptionArc.",
                sourceNote: "Esta página renderiza a mesma fonte markdown publicada no repositório para manter alinhadas a cópia dentro da extensão e o documento público.",
                alreadyAcceptedTitle: "Os termos atuais já foram aceitos",
                alreadyAcceptedBody: "Este dispositivo já possui um aceite registrado para a versão atual dos termos.",
                declinedTitle: "Os termos atuais foram recusados neste dispositivo",
                declinedBody: "O CaptionArc permanecerá bloqueado até que a versão atual dos termos seja aceita neste dispositivo.",
                version: "Versão {version}",
                loadingTitle: "Carregando Termos de Serviço"
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
            eyebrow: "Configurações",
            title: "CaptionArc Configurações",
            subtitle: "Configure o serviço de IA compartilhado, perfis de reunião, comportamento de tradução ao vivo, proteção na nuvem e recuperação em uma superfície de controle compacta.",
            openMeetingHistory: "Histórico de reuniões"
        },
        navigation: {
            title: "Mapa de configurações",
            description: "Mova seção por seção pelo console.",
            quickJump: "Salto rápido"
        },
        loading: "Carregando...",
        snapshot: {
            aiEngine: "Motor de IA",
            serviceStatus: "Status do serviço",
            model: "Modelo",
            primaryProfile: "Perfil principal",
            theme: "Tema",
            cloudVault: "Cofre na nuvem",
            meetingUi: "IU da reunião",
            none: "Nenhum",
            system: "Sistema",
            light: "Luz",
            dark: "Escuro",
            providerOne: "{count} provedor",
            providerOther: "{count} provedores",
            visibleClickThrough: "Visível · clique",
            visibleInteractive: "Visível · interativo",
            hidden: "Oculto"
        },
        sections: {
            workspace: {
                eyebrow: "Espaço de trabalho",
                title: "Experiência e padrões",
                description: "Defina os padrões compartilhados uma vez e mantenha o comportamento visual, o fluxo da reunião e as regras de arquivamento claramente separados.",
                shortLabel: "Espaço de trabalho",
                mapHint: "Aparência, fluxo de reunião e padrões de arquivo"
            },
            openAiService: {
                eyebrow: "OpenAI Serviço",
                title: "Serviço de IA compartilhado",
                shortLabel: "OpenAI",
                mapHint: "Tradução, resumos e assistente",
                description: "Gerencie o serviço OpenAI compartilhado usado pela tradução ao vivo, resumos de reuniões e assistente de reunião."
            },
            translation: {
                eyebrow: "Tradução",
                title: "Tradução ao vivo",
                shortLabel: "Tradução",
                mapHint: "Comportamento e ajuste de legenda ao vivo",
                description: "Ajuste como OpenAI lida com a tradução de legendas ao vivo sem alterar a geração de resumo ou o comportamento do assistente."
            },
            profiles: {
                eyebrow: "Reunião com IA",
                title: "Perfis de reunião",
                shortLabel: "Perfis",
                mapHint: "Identidade, resumo e assistente",
                description: "Os perfis de reunião definem um tipo de reunião uma vez e depois reutilizam essa identidade para geração de resumo e assistente ao vivo."
            },
            cloudSync: {
                eyebrow: "Sincronização na nuvem",
                title: "Cofre de nuvem pessoal",
                shortLabel: "Sincronização na nuvem",
                mapHint: "Proteção e provedores de arquivos",
                description: "Conecte Google Drive, OneDrive ou ambos para manter um arquivo local protegido em seus dispositivos."
            },
            dataRecovery: {
                eyebrow: "Recuperação",
                title: "Recuperação de dados",
                shortLabel: "Recuperação",
                mapHint: "Backup e redefinição criptografados",
                description: "A sincronização na nuvem é o principal caminho de continuidade. Use o arquivo criptografado como backup alternativo ou exclua o arquivo salvo quando precisar de uma redefinição limpa."
            }
        },
        saveBadge: {
            saving: "Salvando alterações",
            attention: "Precisa de atenção",
            saved: "Salvo automaticamente"
        },
        workspace: {
            appearance: {
                title: "Aparência",
                description: "Escolha um tema fixo ou deixe CaptionArc seguir seu sistema automaticamente."
            },
            uiLanguage: {
                title: "Idioma da interface",
                description: "Aplique um idioma em pop-ups, configurações, histórico de reuniões e interface de usuário na reunião."
            },
            meetingFlow: {
                title: "Fluxo da reunião",
                description: "Controle como CaptionArc inicia a captura, ajuda com legendas e decide se uma reunião reingressada deve continuar na mesma sessão."
            },
            captureStartup: {
                label: "Capturar inicialização",
                off: {
                    name: "Mantenha a captura desativada",
                    description: "Não inicialize a caixa de captura na reunião para reuniões suportadas."
                },
                ask: {
                    name: "Pergunte em todas as reuniões",
                    description: "Mostre um breve aviso de aprovação antes do início de qualquer captura. Este é o padrão."
                },
                always: {
                    name: "Sempre inicie a captura",
                    description: "Inicie o fluxo de captura imediatamente, sem perguntar primeiro."
                }
            },
            captionActivation: {
                label: "Ativação de legenda",
                guided: {
                    name: "Guiado",
                    description: "Mantenha o fluxo atual. CaptionArc mostra ajuda embutida para que você mesmo possa ativar as legendas ao vivo."
                },
                automatic: {
                    name: "Automático quando possível",
                    description: "Depois de ingressar, CaptionArc tenta uma vez ativar as legendas ao vivo automaticamente quando o aplicativo de reunião oferece suporte e, em seguida, volta ao fluxo guiado se não for possível."
                }
            },
            sessionContinuation: {
                title: "Janela de continuação da sessão",
                description: "Decida quanto tempo CaptionArc deve oferecer para continuar a mesma sessão após voltar.",
                windowLabel: "Janela",
                off: "Desligado",
                oneHour: "1 hora",
                hours: "{count} horas",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes} minutos"
            },
            inMeetingSurfaces: {
                title: "Superfícies de reunião",
                description: "Defina a aparência e o comportamento das superfícies de reunião ao vivo enquanto estão na tela."
            },
            overlayOpacity: {
                title: "Opacidade de sobreposição",
                description: "Valores mais baixos mantêm a reunião mais visível por baixo.",
                subtle: "Sutil",
                solid: "Sólido"
            },
            overlayClickThrough: {
                label: "Modo clique",
                description: "Deixe os cliques passarem pelas superfícies da reunião ao vivo enquanto permanecem visíveis."
            },
            meetingArchive: {
                title: "Arquivo de reuniões",
                description: "Decida quais dados da reunião devem ser retidos para posterior revisão, exportação e geração de resumo."
            },
            storeMeetingChat: {
                label: "Armazenar bate-papo de reunião",
                description: "Salve o bate-papo da reunião compatível para que ele possa aparecer no histórico, nas exportações e nos resumos da reunião."
            }
        },
        legalRisk: {
            shared: {
                eyebrow: "Use com cuidado",
                warningLabel: "Aviso legal e de privacidade"
            },
            captureStartupAlways: {
                dialog: {
                    title: "A captura com início automático reduz as salvaguardas de consentimento",
                    body: "Este modo ignora a confirmação por reunião e inicia a captura assim que uma reunião compatível é detectada.",
                    pointOne: "Use-o apenas em reuniões nas quais você tenha segurança de que pode capturar e reter conteúdo derivado da reunião.",
                    pointTwo: "Dependendo do que você ativar, outros recursos poderão usar depois legendas ou chat salvos para resumos, orientação ao vivo ou exportações.",
                    pointThree: "Você continua responsável por quaisquer requisitos de aviso, consentimento, política de trabalho ou política da plataforma aplicáveis ao seu uso.",
                    confirm: "Ativar captura com início automático"
                },
                warning: {
                    title: "A captura com início automático está ativa",
                    body: "O CaptionArc vai ignorar a etapa de aprovação por reunião. Mantenha isso ativo apenas onde você puder capturar e reter conteúdo derivado da reunião de forma lícita."
                }
            },
            captionActivationAutomatic: {
                dialog: {
                    title: "A ativação automática de legendas interage com o app da reunião por você",
                    body: "Este modo tenta ligar automaticamente as legendas ao vivo quando a superfície de reunião compatível permite isso.",
                    pointOne: "A ativação automática pode ser mais sensível do que o modo guiado porque altera a interface da reunião sem uma etapa manual sua a cada vez.",
                    pointTwo: "Mantenha isso apenas em ambientes nos quais a ativação automática de legendas seja aceitável para sua política e seu fluxo de trabalho.",
                    pointThree: "Você continua responsável por usar essa automação apenas onde as regras do provedor e as expectativas da reunião permitirem.",
                    confirm: "Ativar legendas automáticas"
                },
                warning: {
                    title: "A ativação automática de legendas está ativa",
                    body: "O CaptionArc tentará ligar as legendas automaticamente quando o provedor permitir. Revise este modo com cuidado em reuniões sensíveis a políticas."
                }
            },
            storeMeetingChat: {
                dialog: {
                    title: "Armazenar o chat da reunião pode aumentar a sensibilidade de privacidade",
                    body: "Quando isso permanece ativo, o chat compatível da reunião passa a fazer parte do registro salvo da reunião e pode aparecer no histórico, nas exportações e nos fluxos de acompanhamento com IA.",
                    pointOne: "O chat da reunião pode conter material mais sensível ou identificável do que as legendas visíveis sozinhas.",
                    pointTwo: "O chat salvo poderá depois ser incluído em resumos, traduções e contexto do assistente quando esses recursos forem usados.",
                    pointThree: "Use o armazenamento de chat apenas onde reter esse conteúdo seja compatível com seus avisos, consentimento e expectativas de confidencialidade.",
                    confirm: "Ativar armazenamento do chat"
                },
                warning: {
                    title: "O armazenamento do chat está ativo",
                    body: "O chat compatível está sendo retido para histórico, exportação e acompanhamento com IA. Mantenha isso ativo apenas onde essa retenção for apropriada."
                }
            }
        },
        openAiService: {
            title: "OpenAI Serviço",
            sectionDescription: "Gerencie o serviço OpenAI compartilhado usado pela tradução ao vivo, resumos de reuniões e assistente de reunião.",
            sharedService: "Serviço compartilhado",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "Um serviço OpenAI compartilhado possibilita tradução ao vivo, resumos de reuniões e assistente de reunião.",
            setupDescription: "Adicione a chave de API uma vez, escolha o modelo GPT padrão e confirme o acesso antes de confiar em qualquer fluxo de trabalho baseado em IA.",
            verificationLabel: "Teste a conexão OpenAI",
            verifyingLabel: "Testando a configuração atual do OpenAI",
            highlights: {
                translation: "Tradução ao vivo",
                summaries: "Resumos de reuniões",
                assistant: "Assistente ao vivo"
            },
            cards: {
                translationTitle: "Tradução",
                translationBody: "Legendas ao vivo",
                summariesTitle: "Resumos",
                summariesBody: "Resultado pós-reunião",
                assistantTitle: "Assistente",
                assistantBody: "Orientação ao vivo"
            },
            state: {
                setupRequired: {
                    label: "Configuração necessária",
                    description: "Adicione a chave API e confirme o modelo GPT padrão.",
                    impact: "Os recursos alimentados por IA permanecem indisponíveis até que o serviço OpenAI esteja totalmente configurado."
                },
                actionRequired: {
                    label: "Ação necessária",
                    impact: "Os recursos com tecnologia de IA podem ficar indisponíveis até que o serviço OpenAI esteja funcionando novamente."
                },
                ready: {
                    label: "Pronto",
                    impact: "OpenAI está disponível para tradução, resumos e orientação ao vivo."
                },
                checking: {
                    label: "Verificando",
                    impact: "Uma verificação de conexão está em andamento. O resultado atualizará todas as áreas do produto com tecnologia de IA."
                },
                needsVerification: {
                    label: "Precisa de verificação",
                    description: "Execute uma verificação de conexão uma vez para confirmar a chave e o modelo atuais.",
                    impact: "As configurações ainda podem ser editadas, mas a saída de IA deve ser tratada como não confirmada até que o serviço seja verificado."
                }
            },
            banners: {
                needsAttention: "OpenAI precisa de atenção",
                finishSetup: "Conclua a configuração de OpenAI",
                verifySetup: "Verifique a configuração de OpenAI"
            },
            apiKeyInput: {
                label: "Chave de API",
                provider: "OpenAI",
                storedLocally: "Armazenado localmente",
                credential: "Credencial secreta",
                show: "Mostrar chave de API",
                hide: "Ocultar chave de API",
                helper: "Essa chave permanece neste dispositivo e é usada para tradução, resumos e orientação ao vivo.",
                guide: "OpenAI Guia de chave de API"
            },
            modelLabel: "Modelo"
        },
        models: {
            gpt5Mini: {
                description: "Melhor padrão para tradução ao vivo: rápido, confiável e de alta qualidade para legendas barulhentas.",
                badge: "Recomendado"
            },
            gpt52: {
                description: "Melhor quando a precisão e as nuances da tradução são mais importantes do que a latência ou o custo.",
                badge: "Mais alta qualidade"
            },
            gpt51: {
                description: "Modelo forte e versátil com um perfil equilibrado entre qualidade e velocidade."
            },
            gpt5Nano: {
                description: "Opção de menor latência para respostas muito rápidas, com qualidade de saída mais simples.",
                badge: "Mais rápido"
            },
            gpt41: {
                description: "Escolha legada estável se você preferir um modelo de tradução comprovado de uso geral.",
                badge: "Legado"
            },
            gpt41Mini: {
                description: "Variante GPT-4.1 de custo mais baixo para cargas de trabalho mais leves e qualidade de tradução moderada.",
                badge: "Mais leve"
            }
        },
        translation: {
            bestFor: {
                title: "Melhor para",
                description: "Tom, terminologia técnica, tratamento de abreviaturas e limpeza de legendas barulhentas."
            },
            keepLean: {
                title: "Mantenha-o magro",
                description: "Instruções mais curtas geralmente são traduzidas mais rapidamente e permanecem mais estáveis nas legendas ao vivo."
            },
            avoid: {
                title: "Evite",
                description: "Políticas longas, regras repetidas ou requisitos de formatação que retardam cada solicitação de legenda."
            },
            instructionsLabel: "Instruções de tradução ao vivo",
            instructionsHint: "Aplicado a todas as solicitações de tradução de legenda. Use-o para limpeza de legendas, terminologia e tom de tradução."
        },
        profiles: {
            identity: {
                eyebrow: "Identidade do perfil",
                description: "Esses campos definem o próprio perfil do tipo de reunião. Eles são compartilhados pela geração de resumo e pelo assistente ao vivo.",
                nameLabel: "Nome do perfil",
                namePlaceholder: "Sincronização diária",
                descriptionLabel: "Breve descrição",
                descriptionPlaceholder: "Check-in recorrente da equipe"
            },
            summary: {
                eyebrow: "Resumo",
                description: "Essas configurações determinam como esse perfil de reunião gera resumos: quanto esforço de IA ele usa e quais instruções são executadas durante a geração do resumo.",
                autoSummaryLabel: "Resumo automático de final de reunião",
                autoSummaryDescription: "Quando este perfil está ativo, um resumo começa sozinho após o término da reunião.",
                effortLabel: "Esforço resumido",
                instructionsLabel: "Instruções resumidas",
                instructionsHint: "Usado quando esse tipo de reunião é selecionado no histórico de reuniões.",
                modes: {
                    economy: {
                        name: "Economia",
                        description: "Menor trabalho de IA. Ideal para reuniões mais curtas, quando a velocidade é mais importante.",
                        badge: "Mais rápido"
                    },
                    balanced: {
                        name: "Equilibrado",
                        description: "Recomendado. Adapta a estratégia de resumo para confiabilidade sem abusar do trabalho extra de IA."
                    },
                    thorough: {
                        name: "Completo",
                        description: "Usa mais trabalho de IA para reuniões mais longas ou complexas para reduzir falhas de resumo.",
                        badge: "Mais lento"
                    }
                }
            },
            assistant: {
                eyebrow: "Assistente",
                description: "Essas configurações definem como a orientação ao vivo se comporta quando esse perfil de reunião está ativo.",
                enabledLabel: "Use o assistente com este perfil",
                enabledDescription: "Quando ativado, este perfil de reunião pode gerar orientação ao vivo em reuniões suportadas.",
                disabledHint: "As configurações do assistente permanecem visíveis aqui para que você possa revisá-las ou ajustá-las mais tarde, mas permanecem bloqueadas até que este perfil seja ativado.",
                responseIntentLabel: "Modo de orientação principal",
                responseFormatLabel: "Formato de resposta",
                responseDepthLabel: "Profundidade da resposta",
                responseToneLabel: "Tom de resposta",
                deliveryBiasLabel: "Velocidade vs integridade",
                triggerPolicyLabel: "Quando a orientação deve ser acionada",
                participantScopeLabel: "Quem pode acionar a orientação",
                instructionsLabel: "Instruções do assistente",
                instructionsHint: "Usado quando este perfil de reunião está ativo e o assistente gera orientação ao vivo.",
                intents: {
                    answerForMe: {
                        name: "Responda para mim",
                        description: "Elabore a resposta direta mais forte que o usuário pode dar agora."
                    },
                    improveMyAnswer: {
                        name: "Melhorar minha resposta",
                        description: "Aperte o que o usuário já parece estar dizendo."
                    },
                    suggestNextPoint: {
                        name: "Sugira o próximo ponto",
                        description: "Ofereça o próximo ponto de discussão útil para levar a reunião adiante."
                    },
                    summarizeRecentTurn: {
                        name: "Resuma o turno recente",
                        description: "Comprima a troca mais recente em uma recapitulação rápida e utilizável."
                    },
                    surfaceRisks: {
                        name: "Riscos de Superfície",
                        description: "Destaque riscos, lacunas ou objeções que merecem atenção."
                    },
                    coachMe: {
                        name: "Treine-me",
                        description: "Oriente o usuário sobre como responder de forma mais eficaz no momento."
                    }
                },
                formats: {
                    bullets: {
                        name: "Marcadores",
                        description: "Marcadores muito curtos e fáceis de digitalizar.",
                        badge: "Mais rápido"
                    },
                    talkingPoints: {
                        name: "Pontos de discussão",
                        description: "Pontos curtos de estilo falado que o usuário pode dizer naturalmente."
                    },
                    shortParagraph: {
                        name: "Parágrafo curto",
                        description: "Um parágrafo compacto quando as balas pareceriam muito instáveis."
                    },
                    structuredSections: {
                        name: "Seções Estruturadas",
                        description: "Segmente a resposta em pequenas seções rotuladas quando a clareza for importante.",
                        badge: "Mais lento"
                    },
                    script: {
                        name: "Roteiro",
                        description: "Escreva uma frase mais literal que o usuário possa seguir de perto."
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "Ultra Breve",
                        description: "Resposta mínima projetada para maior velocidade.",
                        badge: "Mais rápido"
                    },
                    brief: {
                        name: "Breve",
                        description: "Curto e prático. Bom padrão para reuniões ao vivo."
                    },
                    standard: {
                        name: "Padrão",
                        description: "Um pouco mais de contexto quando a velocidade ainda é importante."
                    },
                    expanded: {
                        name: "Expandido",
                        description: "Mais explicações quando uma resposta mais completa for útil.",
                        badge: "Mais lento"
                    }
                },
                tones: {
                    neutral: {
                        name: "Neutro",
                        description: "Equilibrado e profissional."
                    },
                    direct: {
                        name: "Direto",
                        description: "Mais conciso e firme."
                    },
                    supportive: {
                        name: "Apoio",
                        description: "Útil e reconfortante sem ser vago."
                    },
                    confident: {
                        name: "Confiante",
                        description: "Forte e decisivo quando o usuário precisa de um fraseado mais nítido."
                    },
                    analytical: {
                        name: "Analítico",
                        description: "Mais orientado ao raciocínio e estruturado."
                    }
                },
                delivery: {
                    fastest: {
                        name: "Mais rápido",
                        description: "Tende fortemente em direção à velocidade e à utilidade rápida.",
                        badge: "Melhor velocidade"
                    },
                    balanced: {
                        name: "Equilibrado",
                        description: "Troque um pouco de velocidade por uma melhor completude."
                    },
                    careful: {
                        name: "Cuidado",
                        description: "Prefira maior completude quando a reunião permitir.",
                        badge: "Mais lento"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "Perguntas e solicitações",
                        description: "Acione principalmente em turnos do tipo pergunta ou solicitação.",
                        badge: "Carga mais baixa"
                    },
                    salienceFirst: {
                        name: "Saliência primeiro",
                        description: "Reaja também a problemas, decisões ou pontos de tensão de grande importância."
                    },
                    proactive: {
                        name: "Proativo",
                        description: "Modo mais ansioso. Use apenas quando desejar mais ajuda não solicitada.",
                        badge: "Carga mais alta"
                    }
                },
                scope: {
                    everyone: {
                        name: "Todos",
                        description: "Considere o usuário e outros participantes como gatilhos válidos.",
                        badge: "Mais pesado"
                    },
                    othersOnly: {
                        name: "Outros apenas",
                        description: "Ignore os turnos do próprio usuário ao decidir se deve responder.",
                        badge: "Mais leve"
                    }
                }
            },
            badges: {
                primary: "Primário",
                alwaysAvailable: "Sempre disponível",
                customProfile: "Perfil personalizado",
                assistantOn: "Assistente ativado",
                autoSummary: "Resumo automático"
            },
            editor: {
                title: "Editor de perfil de reunião",
                description: "Escolha um perfil e edite sua identidade compartilhada, comportamento resumido e comportamento do assistente ao vivo em um só lugar.",
                addProfile: "Adicionar perfil de reunião",
                listTitle: "Perfis",
                totalCount: "{count} total",
                defaultOutputLanguage: "Idioma de saída de IA padrão",
                untitled: "Perfil sem título",
                noDescription: "Nenhuma descrição ainda.",
                noShortDescription: "Este perfil ainda não possui uma breve descrição.",
                setAsPrimary: "Definir como principal",
                builtInTitle: "Perfil padrão integrado",
                builtInDescription: "Este perfil oferece a CaptionArc um substituto seguro de uso geral para geração de resumos e orientação ao vivo quando nenhum tipo de reunião especializada for adequado.",
                newName: "Novo tipo de reunião",
                newDescription: "Perfil de reunião personalizado",
                newPrompt: "Resuma esta reunião com precisão no idioma solicitado. Concentre-se nos pontos que mais importam para este tipo de reunião."
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive Pasta de dados do aplicativo",
                    subtitle: "Armazenamento de extensão privada dentro da sua conta do Google."
                },
                oneDrive: {
                    title: "OneDrive Pasta de aplicativos",
                    subtitle: "Armazenamento de extensão privada dentro da sua conta da Microsoft."
                }
            },
            actions: {
                refreshStatus: "Atualizar status",
                connect: "Conectar",
                retryNow: "Tente novamente agora",
                reconnect: "Reconectar",
                disconnect: "Desconectar"
            },
            overview: {
                title: "Visão geral do cofre",
                loadingDescription: "Carregando o estado atual de sincronização na nuvem para este dispositivo.",
                offDescription: "Nenhum provedor de nuvem pessoal está conectado ainda.",
                needsAttentionDescription: "Pelo menos um destino na nuvem precisa de intervenção antes que o arquivo esteja totalmente protegido novamente.",
                syncingDescription: "O vault está reconciliando ativamente alterações locais e remotas em segundo plano.",
                upToDateDescription: "Os destinos de nuvem conectados são atualizados com o arquivo local atual."
            },
            stats: {
                currentDevice: "Dispositivo atual",
                connectedProviders: "Provedores conectados",
                connectedProvidersNone: "Nenhum destino de nuvem conectado ainda",
                connectedProvidersOne: "Um destino de nuvem está ativo",
                connectedProvidersTwo: "Ambos os destinos de nuvem estão ativos",
                lastSuccessfulSync: "Última sincronização bem-sucedida",
                lastSuccessfulSyncHint: "Com base no ponto de verificação de provedor bem-sucedido mais recente.",
                queueStatus: "Status da fila"
            },
            queue: {
                noQueuedChanges: "Nenhuma alteração na fila",
                queuedChanges: "{count} alterações na fila",
                engineProcessing: "O mecanismo está processando o trabalho agora.",
                tasksReady: "{count} tarefas estão prontas para a próxima execução.",
                engineIdle: "O motor fica ocioso até a próxima mudança local ou remota."
            },
            syncHealth: {
                title: "Sincronizar saúde",
                attention: "Atenção",
                status: "Estado"
            },
            pendingChoice: {
                title: "As configurações compartilhadas já existem na nuvem",
                badge: "Escolha necessária",
                description: "Este dispositivo já possui suas próprias configurações compartilhadas e o cofre na nuvem conectado possui outro conjunto. Escolha qual deles deve se tornar o ponto de partida para sincronização futura.",
                source: "Fonte: {provider}",
                keepLocal: "Manter as configurações compartilhadas deste dispositivo",
                useCloud: "Use configurações compartilhadas na nuvem"
            },
            providerCard: {
                account: "Conta",
                lastSuccessfulSync: "Última sincronização bem-sucedida",
                providerStatus: "Status do provedor"
            },
            scope: {
                sharedTitle: "Sincronizado entre dispositivos",
                localTitle: "Este dispositivo apenas",
                shared: {
                    meetingSessions: "Sessões de reunião",
                    translations: "Traduções",
                    summaries: "Resumos",
                    summaryProfiles: "Perfis resumidos",
                    sharedSettings: "Configurações compartilhadas"
                },
                local: {
                    apiKeys: "Chaves de API",
                    verificationStatus: "Status de verificação",
                    deviceIdentity: "Identidade do dispositivo"
                }
            },
            health: {
                syncing: "Sincronizando",
                upToDate: "Atualizado",
                retryingAutomatically: "Tentando novamente automaticamente",
                needsAttention: "Precisa de atenção",
                actionRequired: "Ação necessária",
                off: "Desligado"
            },
            connection: {
                notConnectedTitle: "Não conectado",
                notConnectedDescription: "Conecte-se para começar a proteger este arquivo.",
                connectedTitle: "Conectado",
                connectedAt: "Conectado {time}"
            },
            sync: {
                notYet: "Ainda não",
                scannedAt: "Digitalizado {time}",
                noScanRecorded: "Nenhuma varredura registrada ainda."
            },
            statusMessage: {
                disconnected: "Desconectado. Este provedor não está recebendo atualizações.",
                manualRetryAvailable: "Novas tentativas automáticas pausadas. Você pode acionar uma nova tentativa manual.",
                syncing: "Sincronizando alterações locais e remotas agora.",
                retryingAutomatically: "Tentando novamente automaticamente em segundo plano.",
                needsAttention: "Necessita de atenção antes que a proteção seja totalmente restaurada.",
                actionRequired: "A ação manual é necessária antes que a sincronização possa continuar.",
                upToDate: "O provedor está totalmente sincronizado.",
                connectedWaiting: "Conectado e esperando trabalho."
            }
        },
        dataRecovery: {
            backupFile: {
                title: "Arquivo de backup criptografado",
                description: "O backup exportado contém suas configurações, perfis resumidos, sessões de reuniões salvas, transcrições, histórico de bate-papo, traduções e resumos. Use-o quando a sincronização na nuvem não estiver disponível ou quando você precisar de um instantâneo criptografado portátil.",
                export: "Exportar todos os dados",
                import: "Importar arquivo de backup"
            },
            passphrase: {
                label: "Senha de backup",
                placeholder: "Use pelo menos 8 caracteres",
                show: "Mostrar senha de backup",
                hide: "Ocultar senha de backup",
                hint: "Use a mesma senha para exportação e importação. Sem ele, o backup não pode ser descriptografado."
            },
            cards: {
                scope: {
                    title: "Escopo",
                    description: "Um arquivo criptografado contém as configurações e o arquivo completo da sessão."
                },
                restoreBehavior: {
                    title: "Restaurar comportamento",
                    description: "A importação substitui o arquivo local atual e as configurações pelo arquivo de backup escolhido e, em seguida, o mecanismo de sincronização pode reconciliar novamente."
                },
                useCase: {
                    title: "Caso de uso",
                    description: "Melhor para migração de máquinas, recuperação alternativa e portabilidade de arquivos."
                }
            },
            deleteArchive: {
                title: "Excluir arquivo salvo",
                syncedDescription: "Exclua o arquivo sincronizado deste dispositivo, dos seus provedores de nuvem conectados e de outros dispositivos sincronizados. Sua configuração, preferências e perfis de resumo de OpenAI permanecem intactos.",
                localDescription: "Remova todas as sessões de reunião salvas do armazenamento local. Isso mantém sua configuração, preferências e perfis de resumo de OpenAI."
            },
            confirmDelete: {
                syncedTitle: "Excluir arquivo sincronizado em todos os lugares?",
                localTitle: "Limpar os dados da sessão salva?",
                syncedLabel: "Exclua o arquivo em todos os lugares",
                localLabel: "Limpar sessões salvas",
                syncedDescription: "Isso exclui permanentemente todas as sessões de reunião, transcrições, registros de bate-papo, traduções e resumos salvos deste dispositivo, de seus outros dispositivos sincronizados e de suas contas de nuvem conectadas. Suas configurações permanecem intactas.",
                localDescription: "Isso remove todas as sessões de reunião salvas, transcrições, registros de bate-papo, traduções e resumos do armazenamento local. Suas configurações permanecem intactas."
            }
        },
        diagnostics: {
            launcherTitle: "Diagnóstico",
            launcherSubtitle: "Consola",
            closeConsole: "Fechar console de diagnóstico",
            drawerLabel: "Console de diagnóstico",
            closeDrawer: "Fechar gaveta de diagnóstico",
            actions: {
                enableSession: "Habilitar esta sessão",
                disableSession: "Desabilitar esta sessão",
                copyVisible: "Copiar registros visíveis",
                copiedVisible: "Registros visíveis copiados",
                refresh: "Atualizar diagnóstico",
                clear: "Diagnóstico claro",
                enableSessionDiagnostics: "Habilitar diagnóstico de sessão"
            },
            filters: {
                all: "Todos",
                searchPlaceholder: "Título de pesquisa, resumo, chave, domínio, recurso, provedor",
                visibleCounts: "Contagens visíveis:",
                error: "Erro",
                warn: "Avisar",
                info: "Informações",
                debug: "Depurar",
                trace: "Rastreamento"
            },
            summary: {
                loadedWindowTitle: "Janela carregada",
                loadedWindowBody: "Últimos {limit} eventos canônicos máx.",
                visibleNowTitle: "Visível agora",
                visibleNowBody: "Filtros e pesquisa são atualizados apenas no lado do cliente.",
                snapshotsTitle: "Instantâneos",
                noProvider: "nenhum provedor",
                noResolvedSnapshot: "Nenhum instantâneo resolvido na carga atual.",
                lastSyncTitle: "Última sincronização",
                waiting: "Esperando",
                lastSyncBody: "Atualiza a pausa enquanto esta guia está oculta.",
                eventOne: "Evento {count}",
                eventOther: "{count} eventos",
                snapshotOne: "{count} instantâneo",
                snapshotOther: "{count} instantâneos"
            },
            row: {
                session: "Sessão",
                request: "Solicitação",
                correlation: "Correlação",
                tab: "Guia",
                frame: "Quadro",
                document: "Documento",
                origin: "Origem",
                copied: "Copiado",
                copyRow: "Copiar linha",
                showDetails: "Mostrar detalhes",
                hideDetails: "Ocultar detalhes",
                senderUrl: "URL do remetente",
                eventKey: "Chave do evento",
                description: "Descrição",
                eventData: "Dados do evento"
            },
            states: {
                requestErrorPrefix: "Falha na atualização do tempo de execução. A última carga bem-sucedida permanece visível até a próxima tentativa.",
                captureOffTitle: "A captura de diagnóstico está desativada para esta sessão.",
                captureOffBody: "O visualizador está disponível, mas nenhum log novo chegará até que você habilite o diagnóstico para esta sessão. A produção mantém sua política de captura de linha de base desativada, a menos que você a substitua intencionalmente aqui.",
                waitingTitle: "Aguardando eventos de diagnóstico.",
                waitingBody: "A gaveta está conectada ao coletor canônico. Assim que a extensão emitir novos diagnósticos estruturados, eles aparecerão aqui automaticamente.",
                noMatchesTitle: "Nenhum evento corresponde aos filtros atuais.",
                noMatchesBody: "Experimente um filtro de nível mais amplo ou desmarque a caixa de pesquisa para exibir os eventos novamente."
            },
            status: {
                unavailableLabel: "Indisponível",
                unavailableDescription: "O visualizador de diagnóstico não está habilitado para este ambiente.",
                syncIssueLabel: "Problema de sincronização",
                syncIssueDescription: "O visualizador não pôde atualizar os diagnósticos do tempo de execução.",
                connectingLabel: "Conectando",
                connectingDescription: "O visualizador está carregando a configuração de diagnóstico atual.",
                sessionOffLabel: "Sessão desativada",
                sessionOffDescription: "A captura de diagnóstico está atualmente desativada para esta sessão. Os eventos capturados existentes permanecem visíveis.",
                pausedLabel: "Pausado",
                pausedDescription: "A votação é pausada enquanto a guia de opções está oculta e continua quando ela fica visível novamente.",
                liveLabel: "Ao vivo",
                liveDescription: "O visualizador está pesquisando a carga útil de diagnóstico canônico mais recente.",
                readyLabel: "Pronto",
                readyDescription: "Abra a gaveta para inspecionar os diagnósticos canônicos mais recentes."
            },
            requestErrors: {
                runtimeUnavailable: "As mensagens de tempo de execução não estão disponíveis no contexto atual.",
                loadConfigFailed: "Não foi possível carregar a configuração de diagnóstico.",
                loadPayloadFailed: "Não foi possível carregar a carga de diagnóstico.",
                updateConfigFailed: "Não foi possível atualizar a configuração de diagnóstico.",
                clearFailed: "Não foi possível limpar o diagnóstico."
            }
        },
        runtime: {
            save: {
                loading: "Carregando configurações...",
                saving: "Salvando alterações automaticamente...",
                saved: "Todas as alterações salvas automaticamente.",
                loadFailed: "Não foi possível carregar as configurações salvas.",
                autosaveFailed: "Falha no salvamento automático. Sua última alteração ainda é local nesta guia."
            },
            connection: {
                addApiKey: "Adicione sua chave de API OpenAI e teste a conexão.",
                runTest: "Execute Test Connection para verificar sua chave OpenAI e modelo selecionado.",
                testing: "Testando a configuração atual do OpenAI...",
                apiKeyRequired: "OpenAI A chave de API é necessária antes que a conexão possa ser testada.",
                modelRequired: "Escolha um modelo OpenAI antes de testar a conexão.",
                apiKeyRejected: "OpenAI rejeitou a chave de API.",
                modelUnavailable: "Modelo OpenAI não disponível para esta chave: {model}.",
                requestFailed: "A solicitação de OpenAI falhou com {status}.",
                networkFailed: "Não foi possível acessar OpenAI. Verifique sua conexão de rede e tente novamente.",
                reachable: "OpenAI está acessível e {model} está disponível."
            },
            dataTransfer: {
                idle: "Use o backup criptografado como um caminho de recuperação alternativo para configurações e histórico de sessões ou remova o arquivo salvo de qualquer lugar quando a sincronização na nuvem estiver conectada.",
                exporting: "Preparando um arquivo criptografado substituto com configurações e histórico de sessão...",
                exportSuccess: "Backup criptografado exportado com {count} sessão salva{suffix}.",
                exportFailed: "Falha ao exportar o pacote de dados.",
                importing: "Descriptografando o backup e restaurando as configurações e o histórico da sessão...",
                importSuccess: "Backup importado. {count} sessão{suffix} restaurada.",
                importFailed: "Falha ao importar o pacote de dados.",
                clearingSynced: "Excluindo o arquivo sincronizado deste dispositivo e propagando a remoção para provedores de nuvem conectados...",
                clearingLocal: "Removendo todas as sessões salvas do armazenamento local...",
                clearSuccessSynced: "O arquivo foi excluído deste dispositivo e a remoção foi colocada na fila dos seus provedores de nuvem conectados. Suas configurações foram preservadas.",
                clearSuccessLocal: "As sessões salvas foram removidas. Suas configurações foram preservadas.",
                clearFailed: "Falha ao limpar o arquivo da sessão salva."
            },
            cloudSync: {
                idleAvailable: "A sincronização na nuvem está disponível quando você conecta Google Drive ou OneDrive.",
                idleConnected: "O status da sincronização na nuvem está atualizado.",
                idleDisconnected: "Conecte um provedor de nuvem para proteger seu arquivo automaticamente.",
                loadFailed: "Não foi possível carregar o estado de sincronização da nuvem.",
                updated: "Status de sincronização na nuvem atualizado.",
                actionFailed: "Falha na ação de sincronização na nuvem.",
                connecting: "Conectando provedor de nuvem...",
                disconnecting: "Desconectando provedor de nuvem...",
                retrying: "Tentando novamente a sincronização na nuvem...",
                reconnecting: "Atualizando o acesso do provedor de nuvem...",
                resolvingChoice: "Aplicando a opção de configurações compartilhadas..."
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "Arquivo",
            title: "Histórico de reuniões",
            subtitle: "Navegue pelas sessões salvas, reabra detalhes da transcrição, exporte registros e gerencie o armazenamento local sem sair da extensão.",
            openSettings: "Abrir configurações",
            searchLabel: "Sessões de pesquisa",
            searchPlaceholder: "Pesquise títulos, IDs de reuniões, palestrantes, legendas ou traduções...",
            clearSearch: "Limpar pesquisa",
            sortLabel: "Classificar",
            providerFilterLabel: "Filtrar por provedor",
            statusFilterLabel: "Filtrar por status",
            resetFilters: "Redefinir filtros",
            resultCountOne: "{count} reunião",
            resultCountOther: "{count} reuniões",
            resultCountFiltered: "{filtered} de {total} reuniões",
            translatedCaptionCountOne: "{count} legenda traduzida armazenada em seu arquivo.",
            translatedCaptionCountOther: "{count} legendas traduzidas armazenadas em seu arquivo.",
            archiveSnapshotTitle: "Arquivar instantâneo",
            archiveSnapshotSessions: "Sessões",
            archiveSnapshotCurrentView: "Visualização atual",
            archiveSnapshotProviderFocus: "Foco do provedor",
            archiveSnapshotStarFilter: "Filtro estrela",
            archiveSnapshotUrlHint: "O estado da pesquisa, os filtros, a classificação e a sessão atualmente aberta permanecem refletidos no URL da página para que a atualização e a navegação pareçam previsíveis.",
            storageFullTitle: "O armazenamento local está ficando cheio",
            storageFullDescription: "Seu arquivo está usando {percentage}% da cota de extensão local. Revise sessões mais antigas ou exporte registros importantes das Configurações antes que o armazenamento se torne uma restrição.",
            reviewOldestSessions: "Revise as sessões mais antigas",
            loadingTitle: "Carregando histórico de reuniões",
            loadingDescription: "Buscando suas sessões salvas, estado de armazenamento e metadados de trabalho resumidos.",
            detailLoadingTitle: "Carregando detalhes da sessão",
            detailLoadingDescription: "Preparar a transcrição completa, metadados, resumos e estado do trabalho para esta reunião.",
            emptyInitialTitle: "Ainda não há histórico de reuniões",
            emptyInitialDescription: "As sessões de reunião aparecem aqui automaticamente depois que a extensão captura legendas em uma reunião de navegador compatível. Depois que você entrar em uma chamada e as legendas começarem a fluir, o arquivo começará a ser construído.",
            emptyFilteredTitle: "Nenhuma reunião corresponde a esta visualização",
            emptyFilteredDescription: "A pesquisa atual, o filtro do provedor ou a visualização de classificação não corresponderam a nenhuma sessão salva. Redefina a visualização atual ou revise as sessões mais antigas para continuar navegando.",
            deleteSessionTitle: "Excluir esta sessão de reunião?",
            deleteSessionDescription: "Isso remove \"{title}\" do histórico local. Esta ação não pode ser desfeita.",
            deleteSessionConfirm: "Excluir sessão"
        },
        dependency: {
            title: "OpenAI precisa de atenção",
            actionRequired: "Ação necessária",
            needsVerification: "Precisa de verificação",
            impact: "{message} A geração de resumo, a tradução de legendas salvas e a revisão do assistente permanecem indisponíveis até que o serviço esteja pronto novamente."
        },
        filters: {
            providerAll: "Todos os provedores",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams Rede",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "O mais novo primeiro",
            sortOldest: "Mais antigo primeiro",
            starAll: "Todas as sessões",
            starStarred: "Apenas com estrela",
            activeQuery: "Consulta: \"{query}\"",
            activeViewingOldest: "Visualizando as reuniões mais antigas primeiro"
        },
        storageIndicator: {
            usage: "{used} de {quota}",
            highUsage: "Alto uso",
            reviewSoon: "Revise em breve",
            healthy: "Saudável"
        },
        confirmDialog: {
            closeDialog: "Fechar caixa de diálogo",
            confirmAction: "Confirmar ação"
        },
        sessionList: {
            today: "Hoje",
            yesterday: "Ontem",
            justNow: "Agora mesmo",
            inProgress: "Em andamento",
            noPreview: "Ainda não há legendas capturadas ou mensagens de bate-papo de reunião disponíveis para esta sessão.",
            removeStar: "Remover estrela",
            starSession: "Sessão estrela",
            openDetails: "Abrir detalhes",
            deleteSession: "Excluir sessão",
            generatingSummary: "Gerando resumo",
            starred: "Com estrela",
            captionCountOne: "{count} legenda",
            captionCountOther: "{count} legendas",
            translatedOriginalOnly: "Apenas originais",
            translatedCount: "{count} traduzido",
            chatCountOne: "{count} bate-papo",
            chatCountOther: "{count} bate-papos",
            directCall: "Chamada direta",
            hideIdentifiers: "Ocultar identificadores",
            showIdentifiers: "Mostrar identificadores",
            loadingMore: "Carregando mais reuniões..."
        },
        detail: {
            backToHistory: "De volta à história",
            reviewDescription: "Revise a transcrição capturada, as traduções salvas, a cobertura da extração e os resumos de IA desta reunião.",
            inProgress: "Em andamento",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}m",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}m {seconds}s"
            },
            actions: {
                saveTitle: "Salvar título",
                cancelTitleEditing: "Cancelar edição do título",
                renameSession: "Renomear sessão",
                retry: "Tentar novamente"
            },
            exportMenu: {
                open: "Abrir opções de exportação",
                close: "Fechar opções de exportação",
                title: "Exportar transcrição",
                description: "Escolha se as traduções salvas e os resumos salvos devem ser incluídos na exportação Markdown.",
                includeTranslationsLabel: "Incluir traduções salvas",
                includeTranslationsAvailable: "As traduções salvas serão incluídas no arquivo de exportação.",
                includeTranslationsUnavailable: "Ainda não há traduções salvas disponíveis para esta sessão.",
                includeSummariesLabel: "Incluir resumos salvos",
                includeSummariesAvailable: "Os resumos das reuniões salvas serão anexados ao arquivo de exportação.",
                includeSummariesUnavailable: "Ainda não há resumos de reuniões salvos disponíveis para esta sessão.",
                export: "Baixar Markdown"
            },
            metadataLabels: {
                provider: "Provedor",
                callTitle: "Título da chamada",
                meetingTitle: "Título da reunião",
                meetingUrl: "URL da reunião",
                started: "Iniciado",
                ended: "Terminou",
                status: "Estado",
                primaryId: "ID principal",
                meetingCode: "Código da reunião",
                meetingId: "ID da reunião",
                conferenceId: "ID da conferência",
                meetingNumber: "Número da reunião",
                threadId: "ID do tópico",
                callType: "Tipo de chamada"
            },
            status: {
                ended: "Terminou",
                live: "Ao vivo"
            },
            sections: {
                metadata: {
                    title: "Metadados da reunião",
                    description: "Revise a identidade da reunião, o horário e os identificadores armazenados desta sessão salva.",
                    expand: "Mostrar metadados",
                    collapse: "Ocultar metadados"
                },
                continuations: {
                    title: "Continuações de sessão",
                    description: "Inspecione cada reingresso e o tempo total gasto antes de a mesma sessão ser retomada.",
                    expand: "Mostrar continuações",
                    collapse: "Ocultar continuações"
                },
                extraction: {
                    title: "Relatório de extração",
                    description: "Inspecione a cobertura da transcrição, a extração do alto-falante e as impressões digitais de integridade do arquivo salvo.",
                    expand: "Mostrar relatório de extração",
                    collapse: "Ocultar relatório de extração"
                },
                summary: {
                    title: "Resumo da reunião",
                    description: "Gere ou revise resumos de IA salvos para este perfil e idioma de reunião.",
                    expand: "Mostrar resumo",
                    collapse: "Ocultar resumo"
                },
                transcript: {
                    title: "Transcrição",
                    description: "Revise legendas salvas, bate-papo de reunião, traduções e resultados do assistente na ordem da linha do tempo."
                }
            },
            stats: {
                capturedCaptions: "Legendas capturadas",
                translatedCaptions: "Legendas traduzidas",
                duration: "Duração",
                meetingChatMessages: "Mensagens de bate-papo de reunião",
                rejoins: "Reingressa",
                totalAwayTime: "Tempo total ausente",
                lastRejoin: "Última reintegração",
                canonicalEvents: "Eventos canônicos",
                uniqueSpeakers: "Alto-falantes exclusivos",
                metadataCoverage: "Cobertura de metadados",
                providerIds: "IDs do provedor"
            },
            rejoin: {
                label: "Junte-se novamente a {index}",
                awayFor: "Ausente por {gap}",
                leftMeeting: "Saiu da reunião",
                returnedToMeeting: "Retornou à reunião"
            },
            extraction: {
                eventLogFingerprint: "Impressão digital do log de eventos",
                searchFingerprint: "Pesquisar impressão digital",
                summaryFingerprint: "Impressão digital resumida",
                timelineRange: "Intervalo da linha do tempo",
                lastEvent: "Último evento",
                noEvents: "Nenhum evento",
                coverageBreakdown: "Detalhamento da cobertura",
                sessionOffsets: "Deslocamentos de sessão",
                translatedEvents: "Eventos traduzidos",
                finalCaptionEvents: "Eventos finais de legenda",
                speakers: "Alto-falantes",
                noSpeakers: "Nenhum alto-falante detectado.",
                warnings: "Avisos"
            },
            summaryJob: {
                states: {
                    preflighting: "Preparando resumo",
                    extracting: "Analisando transcrição",
                    merging: "Mesclando evidências",
                    synthesizing: "Escrevendo resumo",
                    continuing: "Resumo contínuo",
                    reconciling: "Reconciliando saída",
                    completed: "Resumo pronto",
                    failed: "Falha no resumo",
                    cancelled: "Resumo cancelado",
                    default: "Preparando resumo"
                },
                progress: {
                    ready: "Pronto",
                    preparing: "Preparando evidências",
                    step: "Etapa {current} de {total}",
                    mergingEvidence: "Mesclando evidências",
                    preparingFinal: "Preparando o resumo final",
                    continuation: "Continuação {current} de {total}",
                    continuing: "Geração contínua",
                    finalChecks: "Executando verificações finais"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI indisponível",
                unavailable: "A geração de resumo não está disponível",
                generating: "Gerando resumo",
                generateAnother: "Gere outro resumo",
                generate: "Gerar resumo da reunião",
                generateWithProfile: "Use {profile} para criar ou atualizar um resumo de reunião salvo.",
                selectMeetingType: "Selecione um perfil de reunião e um idioma de saída antes de gerar um resumo.",
                generateAnotherAction: "Gere outro resumo {profile}",
                generateAction: "Gerar resumo {profile}",
                genericProfile: "perfil selecionado",
                inProgress: "A geração do resumo ainda está em andamento.",
                noSummaryYet: "Nenhum resumo de {profile} salvo em {language} ainda.",
                noSummaryHint: "Gere uma agora ou altere o perfil ou idioma da reunião para revisar outra versão salva.",
                latestSaved: "Último resumo salvo: {profile} em {language}.",
                evidenceChunks: "{count} pedaços de evidências",
                continuations: "{count} continuações",
                reconciled: "Reconciliado",
                executionStrategy: {
                    singleShot: "Tiro único",
                    structuredSingleShot: "Plano único estruturado",
                    multiStage: "Multiestágio"
                },
                version: {
                    latest: "Últimos · {time}",
                    automatic: "Automático",
                    manual: "Manuais",
                    auto: "Automático",
                    alt: "Perfil alternativo",
                    session: "Perfil da sessão",
                    default: "Perfil padrão",
                    sessionProfile: "Perfil da sessão: {name}",
                    unknownProfile: "Perfil desconhecido",
                    generatedWithAnotherProfile: "Gerado com outro perfil",
                    generatedAt: "Gerado {time}"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "A tradução da legenda salva não está disponível",
                translatingAllCaptions: "Traduzindo todas as legendas",
                translateAllCaptions: "Traduzir todas as legendas",
                batchTranslateSubtitle: "Crie traduções salvas para cada legenda em {language}.",
                translateAllCaptionsTo: "Traduzir todas as legendas para {language}",
                emptyTitle: "Nenhuma transcrição ou itens de bate-papo",
                emptyDescription: "Esta sessão ainda não possui legendas salvas ou mensagens de bate-papo de reunião.",
                meetingChat: "Bate-papo de reunião",
                translationAvailable: "Tradução salva",
                message: "Mensagem",
                caption: "Legenda",
                translation: "Tradução",
                noChatTranslation: "Ainda não há tradução salva para esta mensagem de bate-papo.",
                noCaptionTranslation: "Nenhuma tradução salva para esta legenda ainda.",
                translatingChatMessage: "Traduzindo mensagem de bate-papo",
                translatingCaption: "Traduzindo legenda",
                translateChatMessage: "Traduzir mensagem de bate-papo",
                translateCaption: "Traduzir legenda",
                translateThisItem: "Traduza este {item} para {language}",
                aiAssistant: "Assistente de IA",
                triggeredByChat: "Acionado por esta mensagem de bate-papo",
                triggeredByCaption: "Acionado por esta legenda"
            },
            export: {
                sessionDetailsHeading: "Detalhes da sessão",
                titleLabel: "Título",
                providerLabel: "Provedor",
                startedLabel: "Iniciado",
                primaryIdLabel: "ID principal",
                endedLabel: "Terminou",
                durationLabel: "Duração",
                statusLabel: "Estado",
                capturedChatMessagesLabel: "Mensagens de bate-papo capturadas",
                savedTranslationsLabel: "Traduções salvas",
                totalAwayBeforeRejoinsLabel: "Tempo total de ausência antes de voltar",
                savedSummariesHeading: "Resumos salvos",
                generatedLabel: "Gerado",
                modelLabel: "Modelo",
                summaryEffortLabel: "Esforço resumido",
                executionStrategyLabel: "Estratégia de execução",
                evidenceChunksLabel: "Pedaços de evidências",
                continuationsLabel: "Continuações",
                reconciledLabel: "Reconciliado",
                coveredCaptionsLabel: "Legendas cobertas",
                yes: "Sim",
                sessionContinuationsHeading: "Continuações de sessão",
                leftAtLabel: "À esquerda em",
                rejoinedAtLabel: "Voltou às",
                awayForLabel: "Fora por",
                sessionResumeHeading: "Sessão {index} retomada em {time} após {gap}"
            }
        },
        runtime: {
            settingsLoadFailed: "Falha ao carregar as configurações da extensão.",
            loadHistoryFailed: "Falha ao carregar o histórico da reunião.",
            loadSessionDetailFailed: "Falha ao carregar os detalhes da sessão da reunião.",
            sessionDeleted: "Sessão excluída.",
            sessionDeleteFailed: "Falha ao excluir a sessão.",
            titleUpdated: "Título atualizado.",
            titleUpdateFailed: "Falha ao atualizar o título.",
            starUpdateFailed: "Falha ao atualizar a estrela.",
            sessionNotFound: "Sessão de reunião não encontrada.",
            chatMessageNotFound: "Mensagem de bate-papo não encontrada.",
            captionNotFound: "Linha de legenda não encontrada.",
            translationFailed: "A tradução falhou.",
            captionTranslated: "Legenda traduzida para {language}.",
            chatTranslated: "Mensagem de bate-papo traduzida para {language}.",
            captionTranslateFailed: "Falha ao traduzir a legenda.",
            chatTranslateFailed: "Falha ao traduzir a mensagem do chat.",
            analyzingTranscript: "Analisando transcrição",
            noSummarySource: "Nenhuma transcrição ou conteúdo do bate-papo da reunião está disponível para resumo.",
            summaryGenerationFailed: "Falha na geração do resumo.",
            summaryGenerated: "Resumo gerado em {language}.",
            summaryCancelFailed: "Falha ao cancelar a geração do resumo.",
            batchTranslationFailed: "Falha ao traduzir todas as legendas.",
            allCaptionsAlreadyTranslated: "Todas as legendas já possuem traduções {language}.",
            batchTranslatedOne: "Legenda {count} traduzida para {language}{suffix}.",
            batchTranslatedOther: "{count} legendas traduzidas para {language}{suffix}.",
            batchSkippedSuffix: ", {count} ignorado",
            errorOutdated: "{fallback} Detalhes: o tempo de execução da extensão está desatualizado. Recarregue a extensão e tente novamente.",
            errorNoDetails: "{fallback} Detalhes: nenhum detalhe adicional do erro foi retornado.",
            errorModelStopped: "{fallback} Detalhes: o modelo foi interrompido antes que o resumo pudesse ser concluído. O aplicativo agora tenta novamente automaticamente, mas essa resposta ainda não pôde ser totalmente recuperada. Tente regenerar ou usar um modelo com um orçamento de produção maior.",
            errorNoProviderDetails: "{fallback} Detalhes: nenhum detalhe adicional do provedor foi retornado.",
            errorWithDetails: "{fallback} Detalhes: {details}"
        }
    },
    content: {
        copyFeedback: "Copiado!",
        timeline: {
            meetingChat: "Bate-papo de reunião"
        },
        translation: {
            errorFallback: "Erro",
            requestFailed: "Falha na tradução",
            retryAction: "Tentar novamente a tradução"
        },
        empty: {
            waitingForCaptionsTitle: "Aguardando legendas...",
            waitingForCaptionsBody: "Ative legendas em sua reunião para começar a capturar texto",
            waitingForCaptionsGoogleMeet: "Ative as legendas em Google Meet para começar a capturar texto",
            waitingForCaptionsTeams: "Abra Mais > Idioma e fala > Mostrar legendas ao vivo para começar a capturar texto",
            waitingForCaptionsZoom: "Abra Mais > Legendas > Mostrar legendas para começar a capturar texto",
            capturePendingTitle: "A captura está esperando por você",
            capturePendingBody: "Responda ao prompt de inicialização para permitir que esta reunião comece a ser capturada.",
            captureStartingTitle: "Iniciando captura",
            captureStartingBody: "Preparando a sessão da reunião e os observadores de inicialização agora.",
            captureDismissedTitle: "A captura permaneceu desligada",
            captureDismissedBody: "Esta reunião foi dispensada do prompt de inicialização e permanecerá desativada.",
            sessionEndedTitle: "Sessão encerrada",
            sessionEndedBody: "Esta reunião não está mais ativa nesta página.",
            waitingToJoinTitle: "Aguardando para entrar na reunião",
            waitingToJoinBody: "Participe da reunião para iniciar o cronômetro da sessão e capturar o fluxo.",
            enablingCaptionsTitle: "Habilitando legendas ao vivo",
            enablingCaptionsBody: "CaptionArc está tentando ativar as legendas para esta reunião agora.",
            readyTitle: "A captura está pronta",
            readyBody: "Comece a falar e linhas de legenda aparecerão aqui conforme a reunião continua.",
            close: "Fechar"
        },
        sessionSeparator: {
            title: "Sessão {index}",
            detail: "Voltou {time} · Ausente {gap}",
            ariaLabel: "Sessão {index} retomada"
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "IA precisa de atenção",
                finishOpenAiSetup: "Concluir a configuração de OpenAI",
                openAiUnavailable: "OpenAI não está disponível",
                capturePendingTitle: "Captura pendente",
                waitingForAnswer: "Esperando pela sua resposta",
                startingCaptureTitle: "Iniciando captura",
                preparingMeeting: "Preparando esta reunião",
                captureSkippedTitle: "Captura ignorada",
                meetingStaysOff: "Esta reunião permanece desativada",
                sessionEndedTitle: "Sessão encerrada",
                rejoinToContinue: "Entre novamente para continuar ou reiniciar",
                waitingToJoinTitle: "Esperando para entrar",
                sessionStartsAfterJoin: "A sessão começa após entrar",
                enablingCaptionsTitle: "Habilitando legendas",
                tryingLiveCaptions: "Tentando ativar as legendas ao vivo",
                setupRequiredTitle: "Configuração necessária",
                turnOnMeetingCaptions: "Ative as legendas da reunião",
                translationIssueTitle: "Problema de tradução",
                retryAvailable: "Tentar novamente está disponível",
                translatingLiveTitle: "Traduzindo ao vivo",
                liveTranslationTitle: "Tradução ao vivo",
                capturingLiveTitle: "Capturando ao vivo",
                originalCaptionsOnly: "Somente legendas originais",
                readyToCaptureTitle: "Pronto para capturar",
                waitingForSpeech: "Esperando pelo discurso",
                waitingForCaptionsTitle: "Aguardando legendas"
            },
            main: {
                captureOnHoldTitle: "Captura em espera",
                waitingForAnswer: "Esperando pela sua resposta",
                startingCaptureTitle: "Iniciando captura",
                preparingMeeting: "Preparando esta reunião",
                captureSkippedTitle: "Captura ignorada",
                meetingStaysOff: "Esta reunião permanece desativada",
                sessionEndedTitle: "Sessão encerrada",
                rejoinToContinue: "Entre novamente para continuar ou reiniciar",
                waitingToJoinTitle: "Esperando para entrar",
                meetingOverlay: "Sobreposição de reunião",
                enablingLiveCaptionsTitle: "Habilitando legendas ao vivo",
                preparingCapture: "Preparando captura",
                liveCaptureTitle: "Captura ao vivo"
            },
            profileControl: {
                defaultBadge: "Padrão"
            },
            translationToggle: {
                label: "Automático"
            },
            translationDock: {
                eyebrow: "Tradução ao vivo",
                consent: {
                    title: "A captura precisa de confirmação",
                    body: "Aprove o prompt de inicialização para começar a capturar esta reunião.",
                    badge: "Esperando"
                },
                starting: {
                    title: "Iniciando captura",
                    body: "Preparando a sessão e o pipeline do observador agora.",
                    badge: "Começando"
                },
                dismissed: {
                    title: "A captura permaneceu desligada",
                    body: "Esta reunião foi dispensada do prompt de inicialização.",
                    badge: "Desligado"
                },
                setup: {
                    title: "Configuração de OpenAI necessária",
                    body: "Conclua a configuração de OpenAI em Configurações para ativar a tradução ao vivo.",
                    badge: "Configuração"
                },
                unavailable: {
                    title: "OpenAI não está disponível",
                    body: "Verifique a configuração de OpenAI em Configurações antes que a tradução ao vivo possa ser retomada.",
                    badge: "Problema"
                },
                off: {
                    title: "A tradução está desativada",
                    body: "Alvo: {language}. Ative-o para saída ao vivo.",
                    badge: "Desligado"
                },
                error: {
                    title: "A tradução precisa de atenção",
                    body: "Algumas linhas falharam. A nova tentativa está disponível nos cartões afetados.",
                    badge: "Problema"
                },
                translating: {
                    title: "Traduzindo para {language}",
                    body: "Novas linhas estão sendo traduzidas ao vivo.",
                    badge: "Trabalhando"
                },
                live: {
                    title: "Tradução ao vivo ativa",
                    body: "Renderizando saída ao vivo em {language}."
                },
                ready: {
                    title: "A tradução está armada",
                    body: "As legendas estão ativadas. Novas linhas serão traduzidas para {language}.",
                    badge: "Pronto"
                },
                waiting: {
                    title: "Aguardando legendas",
                    body: "Ative as legendas da reunião para iniciar a tradução.",
                    badge: "Esperando"
                }
            },
            tooltips: {
                compactAiSetup: "Conclua a configuração de OpenAI em Configurações para restaurar tradução, resumos e orientação do assistente.",
                compactAiIssue: "Os recursos dependentes de {message} OpenAI permanecem pausados até que o problema seja resolvido.",
                translationOff: "Desativar a tradução ao vivo",
                translationOn: "Ativar tradução ao vivo",
                translationSetup: "Conclua a configuração de OpenAI em Configurações para ativar a tradução ao vivo.",
                translationUnavailable: "A tradução ao vivo é pausada até que OpenAI esteja disponível novamente.",
                captureHelp: "Capturar ajuda",
                hideCaptureHelp: "Ocultar ajuda de captura",
                switchToCompactView: "Mudar para visualização compacta",
                expandOverlay: "Expandir sobreposição",
                openProfilePicker: "Abrir seletor de perfil de reunião"
            }
        },
        captureGuide: {
            eyebrow: "Configuração de captura",
            title: "Capturar ajuda",
            statusReady: "A captura começa quando estiver pronta",
            footer: "CaptionArc começará a capturar assim que as legendas ao vivo aparecerem nesta guia.",
            stepsCount: "{count} etapas",
            waitingTitle: "Aguardando legendas ao vivo",
            closeAriaLabel: "Fechar guia de captura",
            startsAutomatically: "Inicia automaticamente",
            tooltipOpen: "Capturar ajuda",
            tooltipClose: "Ocultar ajuda de captura",
            providers: {
                googleMeet: {
                    title: "Habilitar captura em Google Meet",
                    body: "CaptionArc pode começar assim que as legendas de Google Meet forem ativadas nesta reunião do navegador.",
                    status: "Inicia automaticamente",
                    footer: "CaptionArc começará a capturar automaticamente assim que as legendas ao vivo aparecerem nesta guia.",
                    troubleshooting: "Se você não vir um controle de legendas, verifique se a reunião ou o estado do navegador ainda está carregando.",
                    steps: {
                        openControls: {
                            title: "Abra os controles da reunião",
                            detail: "Mova o mouse para revelar a barra de ferramentas inferior da reunião."
                        },
                        openCaptions: {
                            title: "Controles de legendas abertas",
                            detail: "Clique nas legendas ou no controle CC na barra de ferramentas da reunião."
                        },
                        turnOn: {
                            title: "Ativar legendas",
                            detail: "Assim que as legendas forem habilitadas, CaptionArc começará a capturar o texto automaticamente."
                        }
                    }
                },
                microsoftTeams: {
                    title: "Habilitar captura em Microsoft Teams",
                    body: "CaptionArc pode começar assim que as legendas ao vivo forem ativadas na barra de ferramentas da reunião Teams.",
                    status: "Inicia automaticamente",
                    footer: "CaptionArc começará a capturar automaticamente assim que as legendas ao vivo aparecerem nesta guia.",
                    troubleshooting: "Se as legendas não estiverem disponíveis, a política do organizador ou do administrador pode estar restringindo os controles de legendas.",
                    steps: {
                        openMore: {
                            title: "Abra mais",
                            detail: "Use a barra de ferramentas superior da reunião e abra o menu Mais."
                        },
                        openLanguage: {
                            title: "Linguagem e fala abertas",
                            detail: "Dentro de Mais, escolha Idioma e fala."
                        },
                        chooseCaptions: {
                            title: "Escolha Mostrar legendas ao vivo",
                            detail: "Selecione Mostrar legendas ao vivo e CaptionArc detectará a janela de legendas automaticamente."
                        }
                    }
                },
                zoomWeb: {
                    title: "Habilitar captura em Zoom Web App",
                    body: "CaptionArc pode começar assim que as legendas de Zoom Web App estiverem habilitadas nesta reunião do navegador.",
                    status: "Habilite legendas manualmente",
                    footer: "CaptionArc começará a capturar assim que as legendas de Zoom aparecerem nesta guia.",
                    troubleshooting: "Algumas reuniões Zoom podem preferir o aplicativo de desktop ou restringir os controles de legenda com base nas configurações do organizador.",
                    steps: {
                        openControls: {
                            title: "Abrir controles de reunião",
                            detail: "Use a barra de ferramentas da reunião na parte inferior da janela Zoom Web App."
                        },
                        openMore: {
                            title: "Abra mais",
                            detail: "Abra o menu Mais na barra de ferramentas da reunião."
                        },
                        openCaptions: {
                            title: "Abrir legendas",
                            detail: "Dentro de Mais, abra o submenu Legendas."
                        },
                        chooseShow: {
                            title: "Escolha Mostrar legendas",
                            detail: "Selecione Mostrar legendas para disponibilizar a superfície de legendas Zoom nesta guia."
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "Sessão de reunião",
            turns: "{count} voltas",
            chat: "{count} bate-papo",
            chatCaptureTooltip: "A captura de bate-papo da reunião está habilitada. Novas mensagens de chat de reunião suportadas serão salvas com esta sessão.",
            autoSummarySetupTooltip: "Os resumos automáticos permanecem pausados até que a configuração de OpenAI seja concluída.",
            autoSummaryUnavailableTooltip: "Os resumos automáticos são pausados até que OpenAI esteja disponível novamente.",
            autoSummaryReadyTooltip: "{profile} será executado automaticamente quando esta reunião terminar.",
            aiAlertSetupTooltip: "Conclua a configuração de OpenAI em Configurações para restaurar tradução, resumos e orientação do assistente.",
            aiAlertUnavailableTooltip: "As ferramentas de reunião dependentes de {message} OpenAI permanecem pausadas até que o problema seja resolvido.",
            liveState: {
                awaitingReply: {
                    label: "Aguardando resposta",
                    tooltip: "O Capture está aguardando sua decisão inicial para esta reunião."
                },
                starting: {
                    label: "Começando",
                    tooltip: "A captura foi aprovada e a sessão da reunião está sendo preparada."
                },
                off: {
                    label: "Desligado",
                    tooltip: "A captura foi dispensada para esta reunião no prompt de inicialização."
                },
                ended: {
                    label: "Terminou",
                    tooltip: "Esta sessão terminou. Volte para continuar a última sessão ou iniciar uma nova."
                },
                lobby: {
                    label: "Saguão",
                    tooltip: "Participe da reunião para iniciar o cronômetro da sessão e capturar o fluxo."
                },
                live: {
                    label: "Ao vivo",
                    tooltip: "As legendas estão sendo capturadas nesta reunião."
                },
                armed: {
                    label: "Armado",
                    tooltip: "As legendas estão habilitadas e a sobreposição aguarda as próximas linhas."
                },
                waiting: {
                    label: "Esperando",
                    tooltip: "As legendas da reunião ainda não estão habilitadas."
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "O padrão é a ação padrão",
            timeoutHint: "O padrão é {action}",
            captureConsent: {
                title: "Ativar captura para esta reunião?",
                body: "Se você ignorar isso, a captura permanecerá desativada nesta visita à reunião.",
                ariaLabel: "Capturar confirmação de inicialização",
                secondaryAction: "Agora não",
                primaryAction: "Habilitar"
            },
            sessionContinuation: {
                title: "Continuar a sessão anterior?",
                body: "Você voltou à mesma reunião logo após sair. Nenhuma resposta inicia uma nova sessão.",
                ariaLabel: "Confirmação de continuação da sessão",
                secondaryAction: "Nova sessão",
                primaryAction: "Continuar"
            },
            sessionEnded: {
                title: "Sessão encerrada",
                body: "Fique para revisar os itens capturados aqui ou feche a sobreposição. Nenhuma resposta o fecha.",
                ariaLabel: "Confirmação de sessão encerrada",
                secondaryAction: "Fechar",
                primaryAction: "Fique aqui"
            }
        },
        assistant: {
            statusLabel: {
                queued: "Na fila",
                working: "Trabalhando",
                ready: "Pronto",
                paused: "Pausado",
                issue: "Problema",
                unavailable: "Indisponível",
                watching: "Assistindo"
            },
            statusDescription: {
                queued: "Um momento útil foi detectado.",
                working: "Gerando orientação ao vivo.",
                latestReady: "A orientação mais recente do assistente está pronta.",
                ready: "O assistente está pronto para o próximo momento.",
                paused: "O Assistente está desativado para esta sessão.",
                issue: "Assistente precisa de atenção.",
                unavailable: "OpenAI não está disponível no momento.",
                watching: "Esperando por um momento útil."
            },
            emptyState: {
                setupTitle: "Conclua a configuração de OpenAI para usar o assistente",
                setupBody: "A configuração de OpenAI está incompleta, portanto a orientação ao vivo ainda não pode ser executada.",
                unavailableTitle: "O Assistente está temporariamente indisponível",
                unavailableBody: "{message} O assistente será retomado depois que OpenAI estiver íntegro novamente.",
                watchingTitle: "O Assistente está assistindo esta reunião",
                watchingBody: "Quando surgir uma pergunta, solicitação ou risco útil, a orientação ao vivo aparecerá aqui.",
                offTitle: "O Assistente está desativado para esta sessão",
                offBody: "Ative-o novamente sempre que desejar que a orientação ao vivo seja retomada.",
                errorTitle: "Assistente precisa de atenção",
                errorBody: "Um problema de geração interrompeu a orientação ao vivo. O próximo momento válido tentará novamente.",
                preparingTitle: "Assistente está preparando orientação",
                preparingBody: "Um momento útil foi detectado e a primeira orientação ao vivo está na fila agora.",
                workingTitle: "Assistente está trabalhando",
                workingBody: "A orientação ao vivo está sendo gerada para o momento atual da reunião."
            },
            footer: {
                setup: "Conclua a configuração de OpenAI",
                unavailable: "OpenAI não está disponível",
                sessionStartsAfterJoin: "A sessão começa após entrar",
                workingLiveGuidance: "Trabalhando com orientação ao vivo",
                turnedOffForSession: "Desativado para esta sessão",
                generationNeedsAttention: "Geração precisa de atenção",
                latestGuidanceReady: "A orientação mais recente está pronta",
                watchingSession: "Assistindo esta sessão",
                notes: "{count} notas",
                liveCount: "{count} ao vivo",
                aiAlertSetup: "Conclua a configuração de OpenAI em Configurações antes que a orientação do assistente possa ser executada.",
                aiAlertUnavailable: "{message} A orientação do assistente permanece pausada até que OpenAI esteja disponível novamente."
            },
            source: {
                meetingChat: "Bate-papo de reunião",
                caption: "Legenda",
                unknownSpeaker: "Desconhecido"
            },
            pendingReply: "O Assistente está preparando uma resposta para este momento.",
            ui: {
                toggleLiveLabel: "Ao vivo",
                readyTitle: "O assistente está pronto",
                watchingSession: "Assistindo esta sessão",
                watching: "Assistindo",
                waitingForMoment: "Esperando por um momento útil.",
                headerTitle: "Assistente de IA",
                footerTitle: "Assistente de IA",
                panelAriaLabel: "Orientação ao vivo do assistente de IA",
                openSettings: "Abra as configurações do assistente",
                setupBeforeEnable: "Conclua a configuração de OpenAI antes de ativar o assistente",
                unavailableUntilOpenAi: "O Assistente ficará indisponível até que OpenAI esteja disponível novamente",
                turnOffForSession: "Desative o assistente nesta sessão",
                turnOnForSession: "Ativar o assistente para esta sessão",
                openPanel: "Abrir painel do assistente",
                collapsePanel: "Recolher painel do assistente",
                resizePanel: "Redimensionar painel do assistente"
            }
        }
    },
    popup: {
        header: {
            devBadge: "Desenvolvedor",
            openMeetingHistory: "Abrir histórico de reuniões",
            openSettings: "Abrir configurações"
        },
        setup: {
            verificationNotTested: "Não testado",
            notConfigured: "OpenAI não configurado",
            setupRequired: {
                label: "Configuração necessária",
                description: "Adicione sua chave de API OpenAI e escolha um modelo."
            },
            needsAttention: {
                label: "Precisa de atenção",
                description: "Revise a configuração de OpenAI em Configurações."
            },
            ready: {
                label: "Pronto",
                description: "OpenAI, modelo e idioma de destino estão prontos para saída ao vivo."
            },
            verifySetup: {
                label: "Verifique a configuração",
                description: "Execute um teste de conexão em Configurações para confirmar a configuração de OpenAI."
            }
        },
        overlay: {
            badge: "Sobreposição",
            title: "Visibilidade ao vivo",
            switchAriaLabel: "Alternar a visibilidade da sobreposição ao vivo",
            switchDisabledTitle: "Ative a inicialização da captura em Configurações para usar a visibilidade ao vivo.",
            state: {
                inactive: "Inativo",
                visible: "Visível",
                hidden: "Oculto"
            },
            mode: {
                captureStartupOff: "A inicialização da captura está desativada",
                available: "A sobreposição permanece disponível",
                hidden: "A sobreposição permanece oculta"
            },
            helper: {
                captureStartupOff: "A visibilidade ao vivo fica disponível depois que a inicialização é definida como Perguntar ou Sempre nas configurações.",
                instantToggle: "Alternância instantânea para reuniões abertas. A posição, o tamanho e o estado compacto são lembrados por aplicativo de reunião."
            }
        },
        pulse: {
            title: "Pulso do espaço de trabalho"
        },
        rows: {
            live: {
                capturing: {
                    label: "Capturando ao vivo",
                    detail: "{platform} está escutando ativamente nesta guia.",
                    badge: "Ao vivo"
                },
                lobby: {
                    label: "Pronto quando você entrar",
                    detail: "{platform} está aberto e aguardando no lobby.",
                    badge: "Saguão"
                },
                startupOff: {
                    label: "A inicialização da captura está desativada",
                    detail: "Volte a inicialização para Perguntar ou Sempre quando quiser ouvir ao vivo novamente.",
                    badge: "Desligado"
                },
                idle: {
                    label: "Nenhuma reunião ao vivo",
                    detail: "Abra uma guia de reunião compatível e CaptionArc irá acordar aqui.",
                    badge: "Inativo"
                }
            },
            summary: {
                busy: {
                    label: "O resumo da IA está funcionando",
                    detail: "Uma recapitulação da reunião está sendo montada em segundo plano.",
                    badge: "Ocupado"
                },
                failed: {
                    label: "Resumo precisa de atenção",
                    detail: "O último resumo não terminou de forma limpa.",
                    badge: "Tentar novamente"
                },
                automatic: {
                    label: "O resumo automático está armado",
                    detail: "{profileName} iniciará uma recapitulação por conta própria após o término de cada reunião.",
                    badge: "Automático"
                },
                manual: {
                    label: "Modo de resumo manual",
                    detail: "Nada está na fila agora. Os resumos só são publicados quando você solicita um.",
                    badge: "Manuais"
                },
                defaultProfileName: "O perfil padrão"
            },
            archive: {
                empty: {
                    label: "O arquivo ainda está vazio",
                    detail: "Suas reuniões e resumos salvos começarão a ser coletados aqui assim que a captura for executada.",
                    badge: "Novo"
                },
                ready: {
                    label: "{count} reuniões salvas",
                    detail: "{used} usado. {updated}."
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "Nenhuma reunião salva ainda",
            updatedJustNow: "Atualizado agora há pouco",
            updatedMinutesAgo: "Atualizado há {minutes}m",
            updatedHoursAgo: "Atualizado há {hours}h",
            updatedDaysAgo: "Atualizado há {days}d"
        },
        meta: {
            aiService: "Serviço de IA",
            model: "Modelo",
            target: "Alvo",
            startup: "Inicialização",
            modelNotSelected: "Não selecionado",
            pendingIndicator: "OpenAI ainda não foi verificado.",
            startupValues: {
                off: "Desligado",
                always: "Sempre",
                ask: "Pergunte"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
