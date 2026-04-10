import type { UiMessageCatalog } from "../types";

export const koMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "빠른 액세스",
        actions: {
            cancel: "취소",
            clear: "지우기",
            close: "닫기",
            collapse: "접기",
            confirmDelete: "삭제 확인",
            delete: "삭제",
            expand: "펼치기",
            hide: "숨기기",
            loading: "로드 중...",
            open: "열기",
            show: "쇼",
            continue: "계속",
            working: "일하는 중..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "아직 콘텐츠가 없습니다.",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "회의"
        },
        theme: {
            group: "테마",
            system: "시스템 테마 사용",
            light: "밝은 테마 사용",
            dark: "어두운 테마 사용"
        },
        optional: "(선택사항)",
        uiLanguage: {
            label: "인터페이스 언어",
            description: "팝업, 설정, 기록, 회의 내 UI에서 사용되는 언어를 선택하세요.",
            system: "브라우저 언어 사용",
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
            privacyPolicy: "개인정보 처리방침",
            termsOfService: "서비스 약관"
        },
        legal: {
            version: "버전 {version}",
            copyright: "저작권 © {year} CaptionArc"
        },
        notifications: {
            summaryReady: {
                title: "{title} 요약이 준비되었습니다",
                message: "클릭하여 회의 기록에서 전체 요약을 여세요."
            }
        },
        firstRunTerms: {
            eyebrow: "초기 설정",
            title: "계속하려면 약관을 검토하고 동의하세요",
            body: "설정을 계속하기 전에 CaptionArc는 현재 서비스 약관에 대한 1회 동의를 요구합니다.",
            version: "약관 버전 {version}",
            reviewPrompt: "동의하기 전에 현재 서비스 약관과 개인정보 처리방침을 검토하세요.",
            acceptanceNote: "계속하면 현재 서비스 약관을 검토했고 개인정보 처리방침을 이해했음을 확인하는 것으로 간주됩니다.",
            declinedBody: "현재 서비스 약관이 거부되었기 때문에 이 기기에서 CaptionArc는 비활성 상태로 유지됩니다.",
            declinedPrompt: "계속할 준비가 되면 현재 약관을 다시 검토하세요.",
            declinedNote: "이 기기에서 현재 서비스 약관이 수락될 때까지 CaptionArc는 차단된 상태로 유지됩니다.",
            accept: "약관 동의"
        },
        legalPages: {
            shared: {
                eyebrow: "법률",
                loadingDescription: "이 확장 프로그램의 최신 게시 법률 문서를 불러오는 중입니다."
            },
            privacyPolicy: {
                title: "개인정보 처리방침",
                subtitle: "저장소에 게시된 동일한 개인정보 처리방침의 제품 내 사본입니다.",
                sourceNote: "이 페이지는 저장소에 게시된 동일한 markdown 원본을 렌더링하여 확장 프로그램 내부 사본과 공개 문서가 일치하도록 합니다.",
                loadingTitle: "개인정보 처리방침 불러오는 중"
            },
            termsOfService: {
                title: "서비스 약관",
                subtitle: "CaptionArc의 현재 약관, 책임 및 법적 경계를 검토하세요.",
                acceptEyebrow: "초기 설정",
                acceptSubtitle: "이 기기에서 동의하기 전에 현재 약관을 끝까지 스크롤하세요.",
                acceptPrompt: "동의를 활성화하려면 현재 서비스 약관을 읽어야 합니다.",
                scrollRequired: "동의를 활성화하려면 문서 끝까지 스크롤하세요.",
                scrollReady: "약관 끝에 도달했습니다. 이제 동의하고 이 페이지를 닫을 수 있습니다.",
                accept: "동의하고 닫기",
                decline: "거부하고 닫기",
                declineNote: "이 약관에 동의하지 않으면 이 페이지를 닫고 CaptionArc를 사용하지 마세요.",
                sourceNote: "이 페이지는 저장소에 게시된 동일한 markdown 원본을 렌더링하여 확장 프로그램 내부 사본과 공개 문서가 일치하도록 합니다.",
                alreadyAcceptedTitle: "현재 약관은 이미 동의되었습니다",
                alreadyAcceptedBody: "이 기기에는 현재 약관 버전에 대한 동의 기록이 이미 있습니다.",
                declinedTitle: "이 기기에서 현재 약관이 거부되었습니다",
                declinedBody: "이 기기에서 현재 약관 버전이 수락될 때까지 CaptionArc는 차단된 상태로 유지됩니다.",
                version: "버전 {version}",
                loadingTitle: "서비스 약관 불러오는 중"
            }
        },
        units: {
            byte: "비",
            kilobyte: "KB",
            megabyte: "MB"
        }
    },
    options: {
        header: {
            eyebrow: "설정",
            title: "CaptionArc 설정",
            subtitle: "하나의 소형 제어 화면에서 공유 AI 서비스, 회의 프로필, 실시간 번역 동작, 클라우드 보호 및 복구를 구성하세요.",
            openMeetingHistory: "회의 기록"
        },
        navigation: {
            title: "설정 지도",
            description: "콘솔을 통해 섹션별로 이동하세요.",
            quickJump: "빠른 점프"
        },
        loading: "로드 중...",
        snapshot: {
            aiEngine: "AI 엔진",
            serviceStatus: "서비스 상태",
            model: "모델",
            primaryProfile: "기본 프로필",
            theme: "테마",
            cloudVault: "클라우드 볼트",
            meetingUi: "회의 UI",
            none: "없음",
            system: "시스템",
            light: "빛",
            dark: "어둠",
            providerOne: "{count} 제공업체",
            providerOther: "{count} 제공업체",
            visibleClickThrough: "표시 · 클릭연결",
            visibleInteractive: "가시적·대화형",
            hidden: "숨겨진"
        },
        sections: {
            workspace: {
                eyebrow: "작업공간",
                title: "경험 및 기본값",
                description: "공유 기본값을 한 번 설정한 다음 시각적 동작, 회의 흐름 및 보관 규칙을 명확하게 구분하세요.",
                shortLabel: "작업공간",
                mapHint: "모양, 회의 흐름 및 보관 기본값"
            },
            openAiService: {
                eyebrow: "OpenAI 서비스",
                title: "공유 AI 서비스",
                shortLabel: "OpenAI",
                mapHint: "번역, 요약, 보조자",
                description: "실시간 번역, 회의 요약 및 회의 내 도우미에 사용되는 공유 OpenAI 서비스를 관리합니다."
            },
            translation: {
                eyebrow: "번역",
                title: "실시간 번역",
                shortLabel: "번역",
                mapHint: "실시간 캡션 동작 및 조정",
                description: "요약 생성이나 보조 동작을 변경하지 않고 OpenAI에서 실시간 캡션 번역을 처리하는 방법을 조정하세요."
            },
            profiles: {
                eyebrow: "AI와의 만남",
                title: "회의 프로필",
                shortLabel: "프로필",
                mapHint: "ID, 요약 및 보조자",
                description: "미팅 프로필은 하나의 미팅 유형을 한 번 정의한 다음 요약 생성 및 라이브 도우미를 위해 해당 ID를 재사용합니다."
            },
            cloudSync: {
                eyebrow: "클라우드 동기화",
                title: "개인 클라우드 볼트",
                shortLabel: "클라우드 동기화",
                mapHint: "아카이브 보호 및 제공자",
                description: "Google Drive, OneDrive 또는 둘 다를 연결하여 장치 전체에서 하나의 로컬 우선 아카이브를 보호합니다."
            },
            dataRecovery: {
                eyebrow: "회복",
                title: "데이터 복구",
                shortLabel: "회복",
                mapHint: "암호화된 백업 및 재설정",
                description: "클라우드 동기화는 기본 연속성 경로입니다. 암호화된 아카이브를 대체 백업으로 사용하거나, 완전히 재설정이 필요한 경우 저장된 아카이브를 삭제하세요."
            }
        },
        saveBadge: {
            saving: "변경사항 저장",
            attention: "주의가 필요함",
            saved: "자동으로 저장됨"
        },
        workspace: {
            appearance: {
                title: "외관",
                description: "고정 테마를 선택하거나 CaptionArc이 시스템을 자동으로 따르도록 하세요."
            },
            uiLanguage: {
                title: "인터페이스 언어",
                description: "팝업, 설정, 회의 기록, 회의 내 UI에 하나의 언어를 적용합니다."
            },
            meetingFlow: {
                title: "회의 흐름",
                description: "CaptionArc이 캡처를 시작하고, 캡션을 지원하고, 다시 참여한 회의가 동일한 세션을 계속해야 하는지 결정하는 방법을 제어합니다."
            },
            captureStartup: {
                label: "캡처 시작",
                off: {
                    name: "캡처를 계속 꺼두세요",
                    description: "지원되는 회의에 대해 회의 내 캡처 상자를 초기화하지 마십시오."
                },
                ask: {
                    name: "회의 때마다 물어보세요",
                    description: "캡처가 시작되기 전에 짧은 승인 프롬프트를 표시합니다. 이것이 기본값입니다."
                },
                always: {
                    name: "항상 캡처 시작",
                    description: "먼저 묻지 않고 즉시 캡처 흐름을 시작합니다."
                }
            },
            captionActivation: {
                label: "캡션 활성화",
                guided: {
                    name: "안내",
                    description: "현재의 흐름을 유지하세요. CaptionArc은(는) 실시간 캡션을 직접 켤 수 있도록 인라인 도움말을 표시합니다."
                },
                automatic: {
                    name: "가능하면 자동으로",
                    description: "참여한 후 CaptionArc은(는) 회의 앱에서 자동으로 실시간 캡션을 켜려고 한 번 시도한 다음, 활성화할 수 없는 경우 안내 흐름으로 돌아갑니다."
                }
            },
            sessionContinuation: {
                title: "세션 계속 창",
                description: "CaptionArc이(가) 다시 참여한 후 동일한 세션을 계속하도록 제공해야 하는 기간을 결정합니다.",
                windowLabel: "창",
                off: "끄기",
                oneHour: "1시간",
                hours: "{count}시간",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes}분"
            },
            inMeetingSurfaces: {
                title: "회의 내 표면",
                description: "화면에 표시되는 동안 실시간 회의 표면의 모양과 동작을 결정합니다."
            },
            overlayOpacity: {
                title: "오버레이 불투명도",
                description: "값이 낮을수록 회의가 아래에 더 잘 보입니다.",
                subtle: "미묘한",
                solid: "솔리드"
            },
            overlayClickThrough: {
                label: "클릭연결 모드",
                description: "클릭이 계속 표시되는 동안 실시간 회의 화면을 통과할 수 있습니다."
            },
            meetingArchive: {
                title: "회의 자료실",
                description: "향후 검토, 내보내기 및 요약 생성을 위해 어떤 회의 데이터를 보관해야 하는지 결정합니다."
            },
            storeMeetingChat: {
                label: "매장 미팅 채팅",
                description: "지원되는 회의 채팅을 저장하여 회의 기록, 내보내기 및 요약에 표시할 수 있습니다."
            }
        },
        legalRisk: {
            shared: {
                eyebrow: "주의해서 사용",
                warningLabel: "법률 및 개인정보 안내"
            },
            captureStartupAlways: {
                dialog: {
                    title: "항상 자동 시작 캡처는 동의 보호를 약화시킬 수 있습니다",
                    body: "이 모드는 회의별 승인 안내를 건너뛰고, 지원되는 회의를 감지하자마자 캡처를 시작합니다.",
                    pointOne: "회의에서 파생된 콘텐츠를 캡처하고 보관해도 된다고 확신하는 경우에만 사용하세요.",
                    pointTwo: "활성화한 기능에 따라 저장된 자막이나 채팅이 이후 요약, 실시간 안내 또는 내보내기에 사용될 수 있습니다.",
                    pointThree: "공지, 동의, 직장 정책, 플랫폼 정책 등 사용에 적용되는 요구사항에 대한 책임은 여전히 사용자에게 있습니다.",
                    confirm: "항상 자동 시작 캡처 사용"
                },
                warning: {
                    title: "항상 자동 시작 캡처가 활성화됨",
                    body: "CaptionArc 는 회의별 승인 단계를 건너뜁니다. 회의 파생 콘텐츠를 적법하게 캡처하고 보관할 수 있는 경우에만 이 설정을 유지하세요."
                }
            },
            captionActivationAutomatic: {
                dialog: {
                    title: "자동 자막 활성화는 회의 앱을 대신 조작합니다",
                    body: "이 모드는 지원되는 회의 화면이 허용할 때 실시간 자막을 자동으로 켜려고 시도합니다.",
                    pointOne: "자동 활성화는 매번 수동 단계 없이 회의 UI 를 변경하므로 안내형 모드보다 더 민감할 수 있습니다.",
                    pointTwo: "자동 자막 활성화가 정책과 워크플로에 맞는 환경에서만 유지하세요.",
                    pointThree: "이 자동화를 사용할 책임은 공급자 규칙과 회의 기대가 허용하는 경우에 한해 여전히 사용자에게 있습니다.",
                    confirm: "자동 자막 활성화 사용"
                },
                warning: {
                    title: "자동 자막 활성화가 활성화됨",
                    body: "공급자가 지원하면 CaptionArc 가 자막을 자동으로 켜려고 시도합니다. 정책상 민감한 회의에서는 이 모드를 신중하게 검토하세요."
                }
            },
            storeMeetingChat: {
                dialog: {
                    title: "회의 채팅 저장은 개인정보 민감도를 높일 수 있습니다",
                    body: "이 설정이 켜져 있으면 지원되는 회의 채팅이 저장된 회의 기록의 일부가 되며, 기록, 내보내기, AI 지원 후속 흐름에 나타날 수 있습니다.",
                    pointOne: "회의 채팅에는 보이는 자막만보다 더 민감하거나 식별 가능한 내용이 포함될 수 있습니다.",
                    pointTwo: "이 기능들을 사용할 때 저장된 채팅은 이후 요약, 번역, 도우미 컨텍스트에 포함될 수 있습니다.",
                    pointThree: "해당 콘텐츠 보관이 공지, 동의, 기밀성 기대에 맞는 경우에만 채팅 저장을 사용하세요.",
                    confirm: "회의 채팅 저장 사용"
                },
                warning: {
                    title: "회의 채팅 저장이 활성화됨",
                    body: "지원되는 회의 채팅이 기록, 내보내기, AI 지원 후속 처리를 위해 보관되고 있습니다. 이런 보관이 적절한 경우에만 이 설정을 유지하세요."
                }
            }
        },
        openAiService: {
            title: "OpenAI 서비스",
            sectionDescription: "실시간 번역, 회의 요약 및 회의 내 도우미에 사용되는 공유 OpenAI 서비스를 관리합니다.",
            sharedService: "공유 서비스",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "하나의 공유 OpenAI 서비스는 실시간 번역, 회의 요약 및 회의 내 도우미를 지원합니다.",
            setupDescription: "AI 기반 워크플로를 사용하기 전에 API 키를 한 번 추가하고 기본 GPT 모델을 선택한 다음 액세스를 확인하세요.",
            verificationLabel: "OpenAI 연결 테스트",
            verifyingLabel: "현재 OpenAI 설정 테스트",
            highlights: {
                translation: "실시간 번역",
                summaries: "회의 요약",
                assistant: "라이브 어시스턴트"
            },
            cards: {
                translationTitle: "번역",
                translationBody: "라이브 캡션",
                summariesTitle: "요약",
                summariesBody: "회의 후 출력",
                assistantTitle: "어시스턴트",
                assistantBody: "실시간 안내"
            },
            state: {
                setupRequired: {
                    label: "설정 필요",
                    description: "API 키를 추가하고 기본 GPT 모델을 확인하세요.",
                    impact: "AI 기반 기능은 OpenAI 서비스가 완전히 구성될 때까지 사용할 수 없습니다."
                },
                actionRequired: {
                    label: "조치 필요",
                    impact: "OpenAI 서비스가 다시 작동할 때까지 AI 기반 기능을 사용하지 못할 수 있습니다."
                },
                ready: {
                    label: "준비",
                    impact: "OpenAI에서는 번역, 요약, 실시간 안내가 가능합니다."
                },
                checking: {
                    label: "확인 중",
                    impact: "연결 확인이 진행 중입니다. 결과는 제품의 모든 AI 기반 영역을 업데이트합니다."
                },
                needsVerification: {
                    label: "확인 필요",
                    description: "연결 확인을 한 번 실행하여 현재 키와 모델을 확인하세요.",
                    impact: "설정은 계속 편집할 수 있지만 AI 출력은 서비스가 확인될 때까지 확인되지 않은 것으로 처리되어야 합니다."
                }
            },
            banners: {
                needsAttention: "OpenAI에 주의가 필요합니다",
                finishSetup: "OpenAI 설정 완료",
                verifySetup: "OpenAI 설정 확인"
            },
            apiKeyInput: {
                label: "API 키",
                provider: "OpenAI",
                storedLocally: "로컬에 저장됨",
                credential: "비밀 자격 증명",
                show: "API 키 표시",
                hide: "API 키 숨기기",
                helper: "이 키는 이 장치에 남아 있으며 번역, 요약 및 실시간 안내에 사용됩니다.",
                guide: "OpenAI API 키 가이드"
            },
            modelLabel: "모델"
        },
        models: {
            gpt5Mini: {
                description: "실시간 번역을 위한 최상의 기본값: 시끄러운 자막을 위한 빠르고 안정적이며 고품질입니다.",
                badge: "추천"
            },
            gpt52: {
                description: "지연 시간이나 비용보다 번역 정확성과 미묘한 차이가 더 중요한 경우에 가장 적합합니다.",
                badge: "최고 품질"
            },
            gpt51: {
                description: "균형 잡힌 품질과 속도 프로필을 갖춘 강력한 만능 모델입니다."
            },
            gpt5Nano: {
                description: "매우 빠른 응답과 더욱 단순한 출력 품질을 위한 최저 대기 시간 옵션입니다.",
                badge: "가장 빠른"
            },
            gpt41: {
                description: "입증된 범용 번역 모델을 선호하는 경우 안정적인 레거시 선택입니다.",
                badge: "레거시"
            },
            gpt41Mini: {
                description: "더 가벼운 작업량과 중간 수준의 번역 품질을 위한 저렴한 GPT-4.1 변형입니다.",
                badge: "라이터"
            }
        },
        translation: {
            bestFor: {
                title: "다음에 가장 적합",
                description: "톤, 기술 용어, 약어 처리 및 시끄러운 자막 정리."
            },
            keepLean: {
                title: "날씬하게 유지하세요",
                description: "짧은 지침은 일반적으로 더 빠르게 번역되고 라이브 캡션 전체에서 더 안정적으로 유지됩니다."
            },
            avoid: {
                title: "피하다",
                description: "모든 캡션 요청 속도를 늦추는 긴 정책, 반복되는 규칙 또는 형식 요구 사항."
            },
            instructionsLabel: "실시간 번역 지침",
            instructionsHint: "모든 캡션 번역 요청에 적용됩니다. 자막 정리, 용어, 번역 톤에 사용하세요."
        },
        profiles: {
            identity: {
                eyebrow: "프로필 신원",
                description: "이러한 필드는 회의 유형 프로필 자체를 정의합니다. 요약 생성 및 라이브 도우미가 공유합니다.",
                nameLabel: "프로필 이름",
                namePlaceholder: "매일 동기화",
                descriptionLabel: "간단한 설명",
                descriptionPlaceholder: "반복되는 팀 체크인"
            },
            summary: {
                eyebrow: "요약",
                description: "이러한 설정은 이 회의 프로필이 요약을 생성하는 방법, 즉 얼마나 많은 AI 노력이 사용되는지, 요약 생성 중에 어떤 지침이 실행되는지를 결정합니다.",
                autoSummaryLabel: "자동 회의 종료 요약",
                autoSummaryDescription: "이 프로필이 활성화되면 회의가 끝난 후 요약이 자체적으로 시작됩니다.",
                effortLabel: "요약 노력",
                instructionsLabel: "요약 지침",
                instructionsHint: "회의 기록에서 이 회의 유형을 선택한 경우 사용됩니다.",
                modes: {
                    economy: {
                        name: "경제",
                        description: "AI 작업을 줄입니다. 속도가 가장 중요한 짧은 회의에 적합합니다.",
                        badge: "가장 빠른"
                    },
                    balanced: {
                        name: "균형 잡힌",
                        description: "추천합니다. 추가 AI 작업을 과도하게 사용하지 않고 안정성을 위해 요약 전략을 조정합니다."
                    },
                    thorough: {
                        name: "철저한",
                        description: "요약 실패를 줄이기 위해 더 길거나 더 복잡한 회의에 더 많은 AI 작업을 사용합니다.",
                        badge: "가장 느림"
                    }
                }
            },
            assistant: {
                eyebrow: "어시스턴트",
                description: "이러한 설정은 이 회의 프로필이 활성화되었을 때 실시간 안내가 작동하는 방식을 정의합니다.",
                enabledLabel: "이 프로필로 어시스턴트 사용",
                enabledDescription: "활성화되면 이 회의 프로필은 지원되는 회의에서 실시간 안내를 생성할 수 있습니다.",
                disabledHint: "어시스턴트 설정은 나중에 검토하거나 조정할 수 있도록 여기에 표시되지만 이 프로필이 켜질 때까지는 잠긴 상태로 유지됩니다.",
                responseIntentLabel: "기본 안내 모드",
                responseFormatLabel: "응답 형식",
                responseDepthLabel: "응답 깊이",
                responseToneLabel: "응답 톤",
                deliveryBiasLabel: "속도 대 완전성",
                triggerPolicyLabel: "안내가 실행되어야 하는 경우",
                participantScopeLabel: "안내를 실행할 수 있는 사람",
                instructionsLabel: "어��스턴트 지침",
                instructionsHint: "이 회의 프로필이 활성화되어 있고 보조자가 실시간 안내를 생성할 때 사용됩니다.",
                intents: {
                    answerForMe: {
                        name: "나를 위한 대답",
                        description: "사용자가 지금 당장 줄 수 있는 가장 강력한 직접적인 답변을 작성하세요."
                    },
                    improveMyAnswer: {
                        name: "내 답변 개선",
                        description: "사용자가 이미 말하는 것 같은 내용을 강화하세요."
                    },
                    suggestNextPoint: {
                        name: "다음 포인트 제안",
                        description: "회의를 진행하기 위해 다음으로 유용한 대화 요점을 제시하세요."
                    },
                    summarizeRecentTurn: {
                        name: "최근 턴 요약",
                        description: "최신 교환을 빠르게 사용할 수 있는 요약으로 압축합니다."
                    },
                    surfaceRisks: {
                        name: "표면 위험",
                        description: "주의를 기울여야 할 위험, 격차 또는 반대 의견을 강조합니다."
                    },
                    coachMe: {
                        name: "코치 미",
                        description: "사용자에게 그 순간에 더욱 효과적으로 대응하는 방법을 안내하세요."
                    }
                },
                formats: {
                    bullets: {
                        name: "총알",
                        description: "스캔하기 쉬운 매우 짧은 글머리 기호입니다.",
                        badge: "가장 빠른"
                    },
                    talkingPoints: {
                        name: "요점",
                        description: "사용자가 자연스럽게 말할 수 있는 짧은 말하기 스타일의 포인트입니다."
                    },
                    shortParagraph: {
                        name: "짧은 단락",
                        description: "총알이 너무 고르지 않게 느껴질 때 간결한 단락."
                    },
                    structuredSections: {
                        name: "구조화된 섹션",
                        description: "명확성이 중요한 경우 답변을 작은 라벨이 붙은 섹션으로 나누세요.",
                        badge: "가장 느림"
                    },
                    script: {
                        name: "스크립트",
                        description: "사용자가 밀접하게 따를 수 있는 좀 더 문자 그대로의 문구를 작성하세요."
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "울트라 브리프",
                        description: "최고 속도를 위해 설계된 최소한의 답변입니다.",
                        badge: "가장 빠른"
                    },
                    brief: {
                        name: "간략한",
                        description: "짧고 실용적입니다. 실시간 회의에 적합한 기본값입니다."
                    },
                    standard: {
                        name: "표준",
                        description: "속도가 여전히 중요할 때 좀 더 많은 맥락을 살펴보겠습니다."
                    },
                    expanded: {
                        name: "확장됨",
                        description: "더 자세한 답변이 유용할 경우 추가 설명을 제공합니다.",
                        badge: "가장 느림"
                    }
                },
                tones: {
                    neutral: {
                        name: "중립",
                        description: "균형있고 전문적입니다."
                    },
                    direct: {
                        name: "직접",
                        description: "더욱 간결하고 확고해졌습니다."
                    },
                    supportive: {
                        name: "지지적",
                        description: "막연하지 않고 도움이 되고 안심이 됩니다."
                    },
                    confident: {
                        name: "자신감",
                        description: "사용자가 더 날카로운 표현을 필요로 할 때 강력하고 단호합니다."
                    },
                    analytical: {
                        name: "분석적",
                        description: "더 추론 지향적이고 구조적입니다."
                    }
                },
                delivery: {
                    fastest: {
                        name: "가장 빠른",
                        description: "속도와 빠른 유용성에 크게 편향되어 있습니다.",
                        badge: "최고의 속도"
                    },
                    balanced: {
                        name: "균형 잡힌",
                        description: "더 나은 완성도를 위해 약간의 속도를 교환하십시오."
                    },
                    careful: {
                        name: "조심해",
                        description: "회의에서 허용하는 경우 더 높은 완성도를 선호합니다.",
                        badge: "가장 느림"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "질문과 요청",
                        description: "주로 질문형 또는 요청형 차례에 트리거됩니다.",
                        badge: "최저 부하"
                    },
                    salienceFirst: {
                        name: "눈에 띄는 우선",
                        description: "또한 현저한 문제, 결정 또는 긴장 지점에 반응합니다."
                    },
                    proactive: {
                        name: "사전 예방적",
                        description: "가장 열성적인 모드. 원치 않는 도움을 더 원할 때만 사용하십시오.",
                        badge: "최고 부하"
                    }
                },
                scope: {
                    everyone: {
                        name: "모두",
                        description: "사용자와 다른 참가자를 모두 유효한 트리거로 간주합니다.",
                        badge: "무거움"
                    },
                    othersOnly: {
                        name: "기타만",
                        description: "응답 여부를 결정할 때 사용자 자신의 차례를 무시하십시오.",
                        badge: "라이터"
                    }
                }
            },
            badges: {
                primary: "기본",
                alwaysAvailable: "항상 사용 가능",
                customProfile: "맞춤 프로필",
                assistantOn: "어시스턴트 켜짐",
                autoSummary: "자동 요약"
            },
            editor: {
                title: "회의 프로필 편집자",
                description: "하나의 프로필을 선택한 다음 공유 ID, 요약 동작, 라이브 어시스턴트 동작을 한 곳에서 편집하세요.",
                addProfile: "회의 프로필 추가",
                listTitle: "프로필",
                totalCount: "총 {count}",
                defaultOutputLanguage: "기본 AI 출력 언어",
                untitled: "제목 없는 프로필",
                noDescription: "아직 설명이 없습니다.",
                noShortDescription: "이 프로필에는 아직 간단한 설명이 없습니다.",
                setAsPrimary: "기본으로 설정",
                builtInTitle: "내장된 기본 프로필",
                builtInDescription: "이 프로필은 특수 회의 유형이 적합하지 않을 때 요약 생성 및 실시간 안내 모두를 위한 ���전한 범용 폴백을 CaptionArc에 제공합니다.",
                newName: "새로운 회의 유형",
                newDescription: "맞춤형 회의 프로필",
                newPrompt: "요청한 언어로 이 회의를 정확하게 요약하세요. 이 회의 유형에서 가장 중요한 사항에 집중하세요."
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive 앱 데이터 폴더",
                    subtitle: "Google 계정 내부의 비공개 확장 저장소입니다."
                },
                oneDrive: {
                    title: "OneDrive 앱 폴더",
                    subtitle: "Microsoft 계정 내의 개인 확장 저장소입니다."
                }
            },
            actions: {
                refreshStatus: "새로고침 상태",
                connect: "연결하다",
                retryNow: "지금 다시 시도하세요",
                reconnect: "다시 연결",
                disconnect: "연결 끊기"
            },
            overview: {
                title: "Vault 개요",
                loadingDescription: "이 기기의 현재 클라우드 동기화 상태를 로드하는 중입니다.",
                offDescription: "아직 연결된 개인 클라우드 제공업체가 없습니다.",
                needsAttentionDescription: "아카이브가 다시 완전히 보호되기 전에 하나 이상의 클라우드 대상에 개입이 필요합니다.",
                syncingDescription: "Vault는 백그라운드에서 로컬 및 원격 변경 사항을 적극적으로 조정합니다.",
                upToDateDescription: "연결된 클라우드 대상은 현재 로컬 아카이브를 따라잡습니다."
            },
            stats: {
                currentDevice: "현재 장치",
                connectedProviders: "연결된 제공업체",
                connectedProvidersNone: "아직 연결된 클라우드 대상이 없습니다.",
                connectedProvidersOne: "하나의 클라우드 대상이 활성 상태입니다.",
                connectedProvidersTwo: "두 클라우드 대상 모두 활성 상태입니다.",
                lastSuccessfulSync: "마지막으로 성공한 동기화",
                lastSuccessfulSyncHint: "가장 최근에 성공한 공급자 체크포인트를 기반으로 합니다.",
                queueStatus: "대기열 상태"
            },
            queue: {
                noQueuedChanges: "대기 중인 변경사항 없음",
                queuedChanges: "{count} 대기 중인 변경사항",
                engineProcessing: "엔진이 지금 작업을 처리 중입니다.",
                tasksReady: "{count} 작업이 다음 실행을 위해 준비되었습니다.",
                engineIdle: "엔진은 다음 로컬 또는 원격 변경이 이루어질 때까지 유휴 상태입니다."
            },
            syncHealth: {
                title: "상태 동기화",
                attention: "주의",
                status: "상태"
            },
            pendingChoice: {
                title: "공유 설정이 이미 클라우드에 존재합니다.",
                badge: "선택이 필요함",
                description: "이 장치에는 이미 자체 공유 설정이 있으며 연결된 클라우드 볼트에는 다른 세트가 있습니다. 향후 동기화의 시작점이 될 항목을 선택하세요.",
                source: "출처: {provider}",
                keepLocal: "이 기기의 공유 설정 유지",
                useCloud: "클라우드 공유 설정 사용"
            },
            providerCard: {
                account: "계정",
                lastSuccessfulSync: "마지막으로 성공한 동기화",
                providerStatus: "제공자 상태"
            },
            scope: {
                sharedTitle: "여러 기기에서 동기화됨",
                localTitle: "이 장치만",
                shared: {
                    meetingSessions: "회의 세션",
                    translations: "번역",
                    summaries: "요약",
                    summaryProfiles: "요약 프로필",
                    sharedSettings: "공유 설정"
                },
                local: {
                    apiKeys: "API 키",
                    verificationStatus: "확인 상태",
                    deviceIdentity: "장치 ID"
                }
            },
            health: {
                syncing: "동기화 중",
                upToDate: "최신",
                retryingAutomatically: "자동으로 재시도 중",
                needsAttention: "주의가 필요함",
                actionRequired: "조치 필요",
                off: "끄기"
            },
            connection: {
                notConnectedTitle: "연결되지 않음",
                notConnectedDescription: "이 아카이브 보호를 시작하려면 연결하세요.",
                connectedTitle: "연결됨",
                connectedAt: "{time}에 연결됨"
            },
            sync: {
                notYet: "아직은 아님",
                scannedAt: "{time} 스캔됨",
                noScanRecorded: "아직 스캔이 기록되지 않았습니다."
            },
            statusMessage: {
                disconnected: "연결이 끊어졌습니다. 이 공급자는 업데이트를 받고 있지 않습니다.",
                manualRetryAvailable: "자동 재시도가 일시중지되었습니다. 수동 재시도를 트리거할 수 있습니다.",
                syncing: "지금 로컬 및 원격 변경 사항을 동기화하는 중입니다.",
                retryingAutomatically: "백그라운드에서 자동으로 다시 시도하는 중입니다.",
                needsAttention: "보호가 완전히 복원되기 전에 주의가 필요합니다.",
                actionRequired: "동기화를 계속하려면 수동 조치가 필요합니다.",
                upToDate: "공급자가 완전히 동기화되었습니다.",
                connectedWaiting: "연결되어 작업을 기다리고 있습니다."
            }
        },
        dataRecovery: {
            backupFile: {
                title: "암호화된 백업 파일",
                description: "내보낸 백업에는 설정, 요약 프로필, 저장된 회의 세션, 대화 내용, 채팅 기록, 번역 및 요약이 포함됩니다. 클라우드 동기화를 사용할 수 없거나 휴대용 암호화 스냅샷이 필요할 때 사용하세요.",
                export: "모든 데이터 내보내기",
                import: "백업 파일 가져오기"
            },
            passphrase: {
                label: "백업 암호",
                placeholder: "8자 이상 사용하세요.",
                show: "백업 암호 표시",
                hide: "백업 암호 숨기기",
                hint: "내보내기와 가져오기에 동일한 암호를 사용하십시오. 그렇지 않으면 백업의 암호를 해독할 수 없습니다."
            },
            cards: {
                scope: {
                    title: "범위",
                    description: "하나의 암호화된 파일에는 설정과 전체 세션 아카이브가 모두 포함됩니다."
                },
                restoreBehavior: {
                    title: "복원 동작",
                    description: "가져오기는 현재 로컬 아카이브 및 설정을 선택한 백업 파일로 대체한 다음 동기화 엔진이 다시 조정할 수 있습니다."
                },
                useCase: {
                    title: "사용 사례",
                    description: "머신 마이그레이션, 대체 복구, 아카이브 이식성에 가장 적합합니다."
                }
            },
            deleteArchive: {
                title: "저장된 아카이브 삭제",
                syncedDescription: "이 장치, 연결된 클라우드 공급자 및 기타 동기화된 장치에서 동기화된 아카이브를 삭제합니다. OpenAI 설정, 기본 설정 및 요약 프로필은 그대로 유지됩니다.",
                localDescription: "로컬 저장소에서 저장된 모든 회의 세션을 제거합니다. 이렇게 하면 OpenAI 설정, 기본 설정 및 요약 프로필이 유지됩니다."
            },
            confirmDelete: {
                syncedTitle: "모든 곳에서 동기화된 보관 파일을 삭제하시겠습니까?",
                localTitle: "저장된 세션 데이터를 삭제하시겠습니까?",
                syncedLabel: "모든 곳에서 아카이브 삭제",
                localLabel: "저장된 세션 지우기",
                syncedDescription: "이렇게 하면 이 장치, 다른 동기화된 장치 및 연결된 클라우드 계정에서 저장된 모든 회의 세션, 대화 내용, 채팅 기록, 번역 및 요약이 영구적으로 삭제됩니다. 설정은 그대로 유지됩니다.",
                localDescription: "이렇게 하면 저장된 모든 회의 세션, 기록, 채팅 기록, 번역 및 요약이 로컬 저장소에서 제거됩니다. 설정은 그대로 유지됩니다."
            }
        },
        diagnostics: {
            launcherTitle: "진단",
            launcherSubtitle: "콘솔",
            closeConsole: "진단 콘솔 닫기",
            drawerLabel: "진단 콘솔",
            closeDrawer: "진단 창 닫기",
            actions: {
                enableSession: "이 세션 활성화",
                disableSession: "이 세션을 비활성화합니다",
                copyVisible: "표시되는 로그 복사",
                copiedVisible: "보이는 로그를 복사했습니다.",
                refresh: "진단 새로 고침",
                clear: "명확한 진단",
                enableSessionDiagnostics: "세션 진단 활성화"
            },
            filters: {
                all: "모두",
                searchPlaceholder: "검색 제목, 요약, 키, 도메인, 기능, 공급자",
                visibleCounts: "보이는 개수:",
                error: "오류",
                warn: "경고",
                info: "정보",
                debug: "디버그",
                trace: "추적"
            },
            summary: {
                loadedWindowTitle: "로드된 창",
                loadedWindowBody: "최신 {limit} 정식 이벤트 최대",
                visibleNowTitle: "지금 표시",
                visibleNowBody: "필터 및 검색은 클라이언트측에서만 업데이트됩니다.",
                snapshotsTitle: "스냅샷",
                noProvider: "공급자 없음",
                noResolvedSnapshot: "현재 페이로드에 해결된 스냅샷이 없습니다.",
                lastSyncTitle: "마지막 동기화",
                waiting: "대기 중",
                lastSyncBody: "이 탭이 숨겨져 있는 동안 일시중지를 새로 고칩니다.",
                eventOne: "{count} 이벤트",
                eventOther: "{count} 이벤트",
                snapshotOne: "{count} 스냅샷",
                snapshotOther: "{count} 스냅샷"
            },
            row: {
                session: "세션",
                request: "요청",
                correlation: "상관��계",
                tab: "탭",
                frame: "프레임",
                document: "문서",
                origin: "원산지",
                copied: "복사됨",
                copyRow: "행 복사",
                showDetails: "세부정보 표시",
                hideDetails: "세부정보 숨기기",
                senderUrl: "발신자 URL",
                eventKey: "이벤트 키",
                description: "설명",
                eventData: "이벤트 데이터"
            },
            states: {
                requestErrorPrefix: "런타임 새로고침에 실패했습니다. 마지막으로 성공한 페이로드는 다음 재시도까지 계속 표시됩니다.",
                captureOffTitle: "이 세션에 대한 진단 캡처가 꺼져 있습니다.",
                captureOffBody: "뷰어를 사용할 수 있지만 이 세션에 대한 진단을 활성화할 때까지 새 로그가 도착하지 않습니다. 여기에서 의도적으로 재정의하지 않는 한 프로덕션에서는 기본 캡처 정책을 꺼진 상태로 유지합니다.",
                waitingTitle: "진단 이벤트를 기다리는 중입니다.",
                waitingBody: "서랍은 표준 수집기에 연결됩니다. 확장 프로그램이 새로운 구조화된 진단을 내보내면 여��에 자동으로 표시됩니다.",
                noMatchesTitle: "현재 필터와 일치하는 이벤트가 없습니다.",
                noMatchesBody: "더 넓은 수준의 필터를 사용해 보거나 검색 상자를 지워 이벤트를 다시 볼 수 있도록 하세요."
            },
            status: {
                unavailableLabel: "이용 불가",
                unavailableDescription: "이 환경에서는 진단 뷰어가 활성화되지 않습니다.",
                syncIssueLabel: "동기화 문제",
                syncIssueDescription: "뷰어가 런타임에서 진단을 새로 고칠 수 없습니다.",
                connectingLabel: "연결 중",
                connectingDescription: "뷰어가 현재 진단 구성을 로드하는 중입니다.",
                sessionOffLabel: "세션 꺼짐",
                sessionOffDescription: "현재 이 세션에 대한 진단 캡처가 비활성화되어 있습니다. 기존에 캡처된 이벤트는 계속 표시됩니다.",
                pausedLabel: "일시중지됨",
                pausedDescription: "옵션 탭이 숨겨져 있으면 폴링이 일시 중지되고 다시 표시되면 다시 시작됩니다.",
                liveLabel: "라이브",
                liveDescription: "뷰어는 최신 표준 진단 페이로드를 폴링하고 있습니다.",
                readyLabel: "준비",
                readyDescription: "서랍을 열어 최신 표준 진단을 검사하세요."
            },
            requestErrors: {
                runtimeUnavailable: "현재 컨텍스트에서는 런타임 메시징을 사용할 수 없습니다.",
                loadConfigFailed: "진단 구성을 로드할 수 없습니다.",
                loadPayloadFailed: "진단 페이로드를 로드할 수 없습니다.",
                updateConfigFailed: "진단 구성을 업데이트할 수 없습니다.",
                clearFailed: "진단을 지울 수 없습니다."
            }
        },
        runtime: {
            save: {
                loading: "설정 로드 중...",
                saving: "변경사항을 자동으로 저장하는 중...",
                saved: "모든 변경 사항이 자동으로 저장되었습니다.",
                loadFailed: "저장된 설정을 로드할 수 없습니다.",
                autosaveFailed: "자동 저장에 실패했습니다. 마지막 변경 사항은 여전히 ​​이 탭에만 적용됩니다."
            },
            connection: {
                addApiKey: "OpenAI API 키를 추가한 다음 연결을 테스트하세요.",
                runTest: "연결 테스트를 실행하여 OpenAI 키와 선택한 모델을 확인하세요.",
                testing: "현재 OpenAI 설정 테스트 중...",
                apiKeyRequired: "연결을 테스트하려면 OpenAI API 키가 필요합니다.",
                modelRequired: "연결을 테스트하기 전에 OpenAI 모델을 선택하세요.",
                apiKeyRejected: "OpenAI이(가) API 키를 거부했습니다.",
                modelUnavailable: "OpenAI 모델은 이 키에 사용할 수 없습니다: {model}.",
                requestFailed: "OpenAI 요청이 {status}으로 실패했습니다.",
                networkFailed: "OpenAI에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도하세요.",
                reachable: "OpenAI에 연결할 수 있고 {model}에 사용할 수 있습니다."
            },
            dataTransfer: {
                idle: "암호화된 백업을 설정 및 세션 기록의 대체 복구 경로로 사용하거나, 클라우드 동기화가 연결된 경우 저장된 아카���브를 모든 위치에서 제거하세요.",
                exporting: "설정 및 세션 기록이 포함된 대체 암호화 아카이브를 준비하는 중...",
                exportSuccess: "{count} 저장된 세션{suffix}을(를) 사용하여 암호화된 백업을 내보냈습니다.",
                exportFailed: "데이터 번들을 내보내지 못했습니다.",
                importing: "백업 암호 해독 및 설정 및 세션 기록 복원 중...",
                importSuccess: "백업을 가져왔습니다. {count} 세션{suffix}을(를) 복원했습니다.",
                importFailed: "데이터 번들을 가져오지 못했습니다.",
                clearingSynced: "이 기기에서 동기화된 보관 파일을 삭제하고 연결된 클라우드 제공업체에 삭제 내용을 전파하는 중...",
                clearingLocal: "로컬 저장소에서 저장된 모든 세션을 제거하는 중...",
                clearSuccessSynced: "보관 파일이 이 기기에서 삭제되었으며 연결된 클라우드 제공업체에 대해 삭제가 대기 중입니다. 설정이 보존되었습니다.",
                clearSuccessLocal: "저장된 세션이 삭제되었습니다. 설정이 보존되었습니다.",
                clearFailed: "저장된 세션 보관 파일을 지우지 못했습니다."
            },
            cloudSync: {
                idleAvailable: "Google Drive 또는 OneDrive을 연결하면 클라우드 동기화를 사용할 수 있습니다.",
                idleConnected: "클라우드 동기화 상태가 최신입니다.",
                idleDisconnected: "아카이브를 자동으로 보호하려면 클라우드 공급자를 연결하세요.",
                loadFailed: "클라우드 동기화 상태를 로드할 수 없습니다.",
                updated: "클라우드 동기화 상태가 업데이트되었습니다.",
                actionFailed: "클라우드 동기화 작업이 실패했습니다.",
                connecting: "클라우드 제공업체 연결 중...",
                disconnecting: "클라우드 제공업체 연결 해제 중...",
                retrying: "클라우드 동기화를 다시 시도하는 중...",
                reconnecting: "클라우드 제공업체 액세스 새로 고침 중...",
                resolvingChoice: "공유 설정 선택을 적용하는 중..."
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "아카이브",
            title: "회의 기록",
            subtitle: "확장 프로그램을 종료하지 않고도 저장된 세션을 탐색하고, 기록 세부정보를 다시 열고, 기록을 내보내고, 로컬 저장소를 관리�� 수 있습니다.",
            openSettings: "설정 열기",
            searchLabel: "세션 검색",
            searchPlaceholder: "제목, 회의 ID, 발표자, 캡션, 번역 등을 검색하세요...",
            clearSearch: "검색 지우기",
            sortLabel: "정렬",
            providerFilterLabel: "제공업체별로 필터링",
            statusFilterLabel: "상태별로 필터링",
            resetFilters: "필터 재설정",
            resultCountOne: "{count} 회의",
            resultCountOther: "{count} 회의",
            resultCountFiltered: "{total} 회의 중 {filtered}",
            translatedCaptionCountOne: "{count} 번역된 캡션이 아카이브 전체에 저장되어 있습니다.",
            translatedCaptionCountOther: "{count} 번역된 캡션이 아카이브 전체에 저장되어 있습니다.",
            archiveSnapshotTitle: "아카이브 스냅샷",
            archiveSnapshotSessions: "세션",
            archiveSnapshotCurrentView: "현재 보기",
            archiveSnapshotProviderFocus: "공급자 중심",
            archiveSnapshotStarFilter: "스타 필터",
            archiveSnapshotUrlHint: "검색 상태, 필터, 정렬 및 현재 열려 있는 세션이 페이지 URL에 계속 반영되므로 새로 고침 및 탐색이 예측 가능한 것처럼 느껴집니다.",
            storageFullTitle: "로컬 저장소가 가득 찼습니다.",
            storageFullDescription: "귀하의 아카이브는 로컬 확장 할당량의 {percentage}%를 사용하고 있습니다. 저장 공간이 제한되기 전에 이전 세션을 검토하거나 설정에서 중요한 기록을 내보내세요.",
            reviewOldestSessions: "가장 오래된 세션 검토",
            loadingTitle: "회의 기록 로드 중",
            loadingDescription: "저장된 세션, 스토리지 상태, 요약 작업 메타데이터를 가져오는 중입니다.",
            detailLoadingTitle: "세션 세부정보 로드 중",
            detailLoadingDescription: "이 회의에 대한 전체 기록, 메타데이터, 요약 및 작업 상태를 준비합니다.",
            emptyInitialTitle: "아직 회의 기록이 없습니다.",
            emptyInitialDescription: "확장 프로그램이 지원되는 브라우저 회의에서 캡션을 캡처한 후 회의 세션이 여기에 자동으로 나타납니다. 통화에 참여하고 캡션이 흐르면 ​​아카이브가 자체적으로 구축되기 시작합니다.",
            emptyFilteredTitle: "이 보기와 일치하는 회의가 없습니다.",
            emptyFilteredDescription: "현재 검색, 공급자 필터 또는 정렬 보기가 저장된 세션과 일치하지 않습니다. 탐색을 계속하려면 현재 보기를 재설정하거나 가장 오래된 세션을 검토하세요.",
            deleteSessionTitle: "이 회의 세션을 삭제하시겠습니까?",
            deleteSessionDescription: "이렇게 하면 로컬 기록에서 \"{title}\"이(가) 제거됩니다. 이 작업은 취소할 수 없습니다.",
            deleteSessionConfirm: "세션 삭제"
        },
        dependency: {
            title: "OpenAI에 주의가 필요합니다",
            actionRequired: "조치 필요",
            needsVerification: "확인 필요",
            impact: "{message} 요약 생성, 저장된 캡션 번역 및 보조 리뷰는 서비스가 다시 준비될 때까지 사용할 수 없습니다."
        },
        filters: {
            providerAll: "모든 제공업체",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams 웹",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "최신순",
            sortOldest: "오래된 것부터",
            starAll: "모든 세션",
            starStarred: "별표만 표시됨",
            activeQuery: "쿼리: \"{query}\"",
            activeViewingOldest: "가장 오래된 회의부터 보기"
        },
        storageIndicator: {
            usage: "{used}/{quota}",
            highUsage: "높은 사용량",
            reviewSoon: "곧 검토",
            healthy: "건강하다"
        },
        confirmDialog: {
            closeDialog: "대화상자 닫기",
            confirmAction: "조치 확인"
        },
        sessionList: {
            today: "오늘",
            yesterday: "어제",
            justNow: "지금 막",
            inProgress: "진행중",
            noPreview: "아직 이 세션에는 캡처된 캡션이나 회의 채팅 메시지가 없습니다.",
            removeStar: "별표 제거",
            starSession: "스타 세션",
            openDetails: "세부정보 열기",
            deleteSession: "세션 삭제",
            generatingSummary: "요약 생성 중",
            starred: "별표 표시됨",
            captionCountOne: "{count} 캡션",
            captionCountOther: "{count} 캡션",
            translatedOriginalOnly: "원본만",
            translatedCount: "{count} 번역됨",
            chatCountOne: "{count} 채팅",
            chatCountOther: "{count} 채팅",
            directCall: "직접 통화",
            hideIdentifiers: "식별자 숨기기",
            showIdentifiers: "식별자 표시",
            loadingMore: "더 많은 회의 로드 중..."
        },
        detail: {
            backToHistory: "역사로 돌아가기",
            reviewDescription: "이 회의에 대해 캡처된 기록, 저장된 번역, 추출 범위 및 AI 요약을 검토합니다.",
            inProgress: "진행중",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}분",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}분 {seconds}초"
            },
            actions: {
                saveTitle: "제목 저장",
                cancelTitleEditing: "제목 편집 취소",
                renameSession: "세션 이름 바꾸기",
                retry: "재시도"
            },
            exportMenu: {
                open: "내보내기 옵션 열기",
                close: "내보내기 옵션 닫기",
                title: "성적표 내보내기",
                description: "저장된 번역과 저장된 요약을 Markdown 내보내기에 포함할지 여부를 선택하세요.",
                includeTranslationsLabel: "저장된 번역 포함",
                includeTranslationsAvailable: "저장된 번역은 내보내기 파일에 포함됩니다.",
                includeTranslationsUnavailable: "이 세션에는 아직 저장된 번역이 없습니다.",
                includeSummariesLabel: "저장된 요약 포함",
                includeSummariesAvailable: "저장된 회의 요약이 내보내기 파일에 추가됩니다.",
                includeSummariesUnavailable: "이 세션에는 아직 저장된 회의 요약이 없습니다.",
                export: "Markdown 다운로드"
            },
            metadataLabels: {
                provider: "공급자",
                callTitle: "통화 제목",
                meetingTitle: "회의 제목",
                meetingUrl: "회의 URL",
                started: "시작됨",
                ended: "종료됨",
                status: "상태",
                primaryId: "기본 ID",
                meetingCode: "회의 코드",
                meetingId: "회의 ID",
                conferenceId: "컨퍼런스 ID",
                meetingNumber: "회의 번호",
                threadId: "스레드 ID",
                callType: "통화 유형"
            },
            status: {
                ended: "종료됨",
                live: "라이브"
            },
            sections: {
                metadata: {
                    title: "회의 메타데이터",
                    description: "이 저장된 세션에 대한 회의 ID, 시간 및 저장된 식별자를 검토하세요.",
                    expand: "메타데이터 표시",
                    collapse: "메타데이터 숨기기"
                },
                continuations: {
                    title: "세션 연속",
                    description: "동일한 세션이 다시 시작되기 전에 각 재참여 및 총 소요 시간을 검사합니다.",
                    expand: "연속 보기",
                    collapse: "연속 숨기기"
                },
                extraction: {
                    title: "추출보고서",
                    description: "저장된 아카이브에 대한 대화 내용 범위, 화자 추출 및 무결성 지문을 검사합니다.",
                    expand: "추출 보고서 표시",
                    collapse: "추출 보고서 숨기기"
                },
                summary: {
                    title: "회의 요약",
                    description: "이 회의 프로필 및 언어에 대해 저장된 AI 요약을 생성하거나 검토합니다.",
                    expand: "요약 표시",
                    collapse: "요약 숨기기"
                },
                transcript: {
                    title: "성적 증명서",
                    description: "저장된 캡션, 회의 채팅, 번역, 보조 출력을 타임라인 순서대로 검토하세요."
                }
            },
            stats: {
                capturedCaptions: "캡처된 캡션",
                translatedCaptions: "번역된 캡션",
                duration: "기간",
                meetingChatMessages: "미팅 채팅 메시지",
                rejoins: "재결합",
                totalAwayTime: "총 외출 시간",
                lastRejoin: "마지막 재가입",
                canonicalEvents: "정식 이벤트",
                uniqueSpeakers: "독특한 스피커",
                metadataCoverage: "메타데이터 범위",
                providerIds: "공급자 ID"
            },
            rejoin: {
                label: "{index}에 다시 참여",
                awayFor: "{gap} 동안 자리 비움",
                leftMeeting: "회의 종료",
                returnedToMeeting: "회의로 돌아옴"
            },
            extraction: {
                eventLogFingerprint: "이벤트 로그 지문",
                searchFingerprint: "지문 검색",
                summaryFingerprint: "요약 지문",
                timelineRange: "타임라인 범위",
                lastEvent: "마지막 이벤트",
                noEvents: "이벤트 없음",
                coverageBreakdown: "보장 내역",
                sessionOffsets: "세션 오프셋",
                translatedEvents: "번역된 이벤트",
                finalCaptionEvents: "최종 자막 이벤트",
                speakers: "스피커",
                noSpeakers: "감지된 스피커가 없습니다.",
                warnings: "경고"
            },
            summaryJob: {
                states: {
                    preflighting: "요약 준비 중",
                    extracting: "성적표 분석 중",
                    merging: "증거 병합",
                    synthesizing: "글쓰기 요약",
                    continuing: "계속 요약",
                    reconciling: "출력 조정",
                    completed: "요약 준비됨",
                    failed: "요약 실패",
                    cancelled: "요약이 취소되었습니다.",
                    default: "요약 준비 중"
                },
                progress: {
                    ready: "준비",
                    preparing: "증거 준비",
                    step: "{total}의 {current} 단계",
                    mergingEvidence: "증거 병합",
                    preparingFinal: "최종 요약 준비 중",
                    continuation: "{total}의 {current} 연속",
                    continuing: "계속되는 세대",
                    finalChecks: "최종 점검 실행"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI 사용할 수 없음",
                unavailable: "요약 생성을 사용할 수 없습니다.",
                generating: "요약 생성 중",
                generateAnother: "다른 요약 생성",
                generate: "회의 요약 생성",
                generateWithProfile: "저장된 회의 요약을 생성하거나 새로 고치려면 {profile}을(를) 사용하세요.",
                selectMeetingType: "요약을 생성하기 전에 회의 프로필과 출력 언어를 선택하세요.",
                generateAnotherAction: "다른 {profile} 요약 생성",
                generateAction: "{profile} 요약 생성",
                genericProfile: "선택한 프로필",
                inProgress: "요약 생성이 아직 진행 중입니다.",
                noSummaryYet: "아직 {language}에 저장된 {profile} 요약이 없습니다.",
                noSummaryHint: "지금 하나를 생성하거나 회의 프로필이나 언어를 전환하여 저장된 다른 버전을 검토하세요.",
                latestSaved: "최근 저장된 요약: {language}의 {profile}.",
                evidenceChunks: "{count} 증거 덩어리",
                continuations: "{count} 계속",
                reconciled: "화해됨",
                executionStrategy: {
                    singleShot: "단발",
                    structuredSingleShot: "구조화된 단일 샷",
                    multiStage: "다단계"
                },
                version: {
                    latest: "최신 · {time}",
                    automatic: "자동",
                    manual: "매뉴얼",
                    auto: "자동",
                    alt: "대체 프로필",
                    session: "세션 프로필",
                    default: "기본 프로필",
                    sessionProfile: "세션 프로필: {name}",
                    unknownProfile: "알 수 없는 프로필",
                    generatedWithAnotherProfile: "다른 프로필로 생성됨",
                    generatedAt: "{time} 생성됨"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "저장된 자막 번역을 사용할 수 없습니다.",
                translatingAllCaptions: "모든 캡션 번역",
                translateAllCaptions: "모든 캡션 번역",
                batchTranslateSubtitle: "{language}의 모든 캡션에 대해 저장된 번역을 만듭니다.",
                translateAllCaptionsTo: "모든 캡션을 {language}로 번역합니다.",
                emptyTitle: "스크립트나 채팅 항목 없음",
                emptyDescription: "이 세션에는 아직 저장된 캡션이나 회의 채팅 메시지가 없습니다.",
                meetingChat: "회의 채팅",
                translationAvailable: "번역이 저장되었습니다",
                message: "메시지",
                caption: "캡션",
                translation: "번역",
                noChatTranslation: "이 채팅 메시지에 대해 저장된 번역이 아직 없습니다.",
                noCaptionTranslation: "아직 이 캡션에 대해 저장된 번역이 없습니다.",
                translatingChatMessage: "채팅 메시지 번역 중",
                translatingCaption: "캡션 번역 중",
                translateChatMessage: "채팅 메시지 번역",
                translateCaption: "캡션 번역",
                translateThisItem: "이 {item}을(를) {language}(으)로 번역하세요",
                aiAssistant: "AI 비서",
                triggeredByChat: "이 채팅 메시지에 의해 실행됨",
                triggeredByCaption: "이 캡션으로 인해 발생함"
            },
            export: {
                sessionDetailsHeading: "세션 세부정보",
                titleLabel: "제목",
                providerLabel: "공급자",
                startedLabel: "시작됨",
                primaryIdLabel: "기본 ID",
                endedLabel: "종료됨",
                durationLabel: "기간",
                statusLabel: "상태",
                capturedChatMessagesLabel: "캡처된 채팅 메시지",
                savedTranslationsLabel: "저장된 번역",
                totalAwayBeforeRejoinsLabel: "다시 합류하기 전 총 자리 비움 시간",
                savedSummariesHeading: "저장된 요약",
                generatedLabel: "생성됨",
                modelLabel: "모델",
                summaryEffortLabel: "요약 노력",
                executionStrategyLabel: "실행 전략",
                evidenceChunksLabel: "증거 덩어리",
                continuationsLabel: "계속",
                reconciledLabel: "화해됨",
                coveredCaptionsLabel: "해당 캡션",
                yes: "예",
                sessionContinuationsHeading: "세션 연속",
                leftAtLabel: "출발 시간",
                rejoinedAtLabel: "다음 시간에 다시 합류했습니다.",
                awayForLabel: "다음 시간 동안 자리를 비움",
                sessionResumeHeading: "{index} 세션이 {gap} 이후 {time}에서 재개되었습니다."
            }
        },
        runtime: {
            settingsLoadFailed: "확장 프로그램 설정을 로드하지 못했습니다.",
            loadHistoryFailed: "회의 기록을 로드하지 못했습니다.",
            loadSessionDetailFailed: "회의 세션 세부정보를 로드하지 못했습니다.",
            sessionDeleted: "세션이 삭제되었습니다.",
            sessionDeleteFailed: "세션을 삭제하지 못했습니다.",
            titleUpdated: "제목이 업데이트되었습니다.",
            titleUpdateFailed: "제목을 업데이트하지 못했습니다.",
            starUpdateFailed: "별표를 업데이트하지 못했습니다.",
            sessionNotFound: "회의 세션을 찾을 수 없습니다.",
            chatMessageNotFound: "채팅 메시지를 찾을 수 없습니다.",
            captionNotFound: "캡션 줄을 찾을 수 없습니다.",
            translationFailed: "번역에 실패했습니다.",
            captionTranslated: "캡션이 {language}로 번역되었습니다.",
            chatTranslated: "채팅 메시지가 {language}로 번역되었습니다.",
            captionTranslateFailed: "캡션을 번역하지 못했습니다.",
            chatTranslateFailed: "채팅 메시지를 번역하지 못했습니다.",
            analyzingTranscript: "성적표 분석 중",
            noSummarySource: "요약할 수 있는 기록이나 회의 채팅 콘텐츠가 없습니다.",
            summaryGenerationFailed: "요약 생성에 실패했습니다.",
            summaryGenerated: "{language}에서 생성된 요약입니다.",
            summaryCancelFailed: "요약 생성을 취소하지 못했습니다.",
            batchTranslationFailed: "모든 캡션을 번역하지 못했습니다.",
            allCaptionsAlreadyTranslated: "모든 캡션에는 이미 {language} 번역이 있습니다.",
            batchTranslatedOne: "{count} 캡션이 {language}{suffix}로 번역되었습니다.",
            batchTranslatedOther: "{count} 캡션이 {language}{suffix}로 번역되었습니다.",
            batchSkippedSuffix: ", {count} 건너뛰었습니다.",
            errorOutdated: "{fallback} 세부 정보: 확장 런타임이 오래되었습니다. 확장 프로그램을 다시 로드하고 다시 시도하세요.",
            errorNoDetails: "{fallback} 세부 정보: 추가 오류 세부 정보가 반환되지 않았습니다.",
            errorModelStopped: "{fallback} 세부정보: 요약이 완료되기 전에 모델이 중지되었습니다. 이제 앱이 자동으로 다시 시도하지만 이 응답은 여전히 ​​완전히 복구되지 않습니다. 출력 예산이 더 큰 모델을 다시 생성하거나 사용해 보십시오.",
            errorNoProviderDetails: "{fallback} 세부정보: 추가 제공업체 세부정보가 반환되지 않았습니다.",
            errorWithDetails: "{fallback} 세부정보: {details}"
        }
    },
    content: {
        copyFeedback: "복사되었습니다!",
        timeline: {
            meetingChat: "회의 채팅"
        },
        translation: {
            errorFallback: "오류",
            requestFailed: "번역 실패",
            retryAction: "번역 재시도"
        },
        empty: {
            waitingForCaptionsTitle: "자막을 기다리는 중...",
            waitingForCaptionsBody: "텍스트 캡처를 시작하려면 회의에서 캡션을 활성화하세요.",
            waitingForCaptionsGoogleMeet: "텍스트 캡처를 시작하려면 Google Meet에서 캡션을 켜세요.",
            waitingForCaptionsTeams: "더보기 > 언어 및 음성 > 실시간 캡션 표시를 열어 텍스트 캡처를 시작하세요.",
            waitingForCaptionsZoom: "더보기 > 캡션 > 캡션 표시를 열어 텍스트 캡처를 시작하세요.",
            capturePendingTitle: "캡처가 당신을 기다리고 있습니다",
            capturePendingBody: "이 회의의 캡처를 시작하려면 시작 프롬프트에 응답하세요.",
            captureStartingTitle: "캡처 시작",
            captureStartingBody: "지금 회의 세션과 시작 참관인을 준비하고 있습니다.",
            captureDismissedTitle: "캡처가 중단됨",
            captureDismissedBody: "이 회의는 시작 프롬프트에서 종료되었으며 꺼진 상태로 유지됩니다.",
            sessionEndedTitle: "세션이 종료되었습니다.",
            sessionEndedBody: "이 회의는 이 페이지에서 더 이상 활성화되지 않습니다.",
            waitingToJoinTitle: "회의 참여를 기다리는 중",
            waitingToJoinBody: "세션 타이머를 시작하고 흐름을 캡처하려면 회의에 참여하세요.",
            enablingCaptionsTitle: "라이브 캡션 활성화",
            enablingCaptionsBody: "CaptionArc이(가) 지금 이 회의에 캡션을 켜려고 합니다.",
            readyTitle: "캡처가 준비되었습니다",
            readyBody: "말하기 시작하면 회의가 계속되는 동안 캡션 줄이 여기에 표시됩니다.",
            close: "닫기"
        },
        sessionSeparator: {
            title: "세션 {index}",
            detail: "{time}에 다시 합류함 · 원정 중 {gap}",
            ariaLabel: "{index} 세션이 재개되었습니다."
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "AI에 관심이 필요하다",
                finishOpenAiSetup: "OpenAI 설정 완료",
                openAiUnavailable: "OpenAI을(를) 사용할 수 없습니다",
                capturePendingTitle: "캡처 대기 중",
                waitingForAnswer: "귀하의 답변을 기다리고 있습니다",
                startingCaptureTitle: "캡처 시작",
                preparingMeeting: "이번 회의 준비 중",
                captureSkippedTitle: "캡처를 건너뛰었습니다.",
                meetingStaysOff: "이 회의는 계속 중단됩니다.",
                sessionEndedTitle: "세션이 종료되었습니다.",
                rejoinToContinue: "계속하거나 다시 시작하려면 다시 참여하세요.",
                waitingToJoinTitle: "참여를 기다리는 중",
                sessionStartsAfterJoin: "참여 후 세션이 시작됩니다.",
                enablingCaptionsTitle: "캡션 활성화",
                tryingLiveCaptions: "실시간 자막을 켜려고 합니다.",
                setupRequiredTitle: "설정 필요",
                turnOnMeetingCaptions: "회의 캡션 켜기",
                translationIssueTitle: "번역 문제",
                retryAvailable: "재시도 가능",
                translatingLiveTitle: "실시간 번역",
                liveTranslationTitle: "실시간 번역",
                capturingLiveTitle: "라이브 캡처",
                originalCaptionsOnly: "원본 캡션만",
                readyToCaptureTitle: "캡처 준비 완료",
                waitingForSpeech: "연설을 기다리는 중",
                waitingForCaptionsTitle: "캡션을 기다리는 중"
            },
            main: {
                captureOnHoldTitle: "캡처 보류 중",
                waitingForAnswer: "귀하의 답변을 기다리고 있습니다",
                startingCaptureTitle: "캡처 시작",
                preparingMeeting: "이번 회의 준비 중",
                captureSkippedTitle: "캡처를 건너뛰었습니다.",
                meetingStaysOff: "이 회의는 계속 중단됩니다.",
                sessionEndedTitle: "세션이 종료되었습니다.",
                rejoinToContinue: "계속하거나 다시 시작하려면 다시 참여하세요.",
                waitingToJoinTitle: "참여를 기다리는 중",
                meetingOverlay: "회의 오버레이",
                enablingLiveCaptionsTitle: "라이브 캡션 활성화",
                preparingCapture: "캡처 준비 중",
                liveCaptureTitle: "라이브 캡처"
            },
            profileControl: {
                defaultBadge: "기본값"
            },
            translationToggle: {
                label: "자동"
            },
            translationDock: {
                eyebrow: "실시간 번역",
                consent: {
                    title: "캡처에 확인이 필요함",
                    body: "이 회의 캡처를 시작하려면 시작 메시지를 승인하세요.",
                    badge: "대기 중"
                },
                starting: {
                    title: "캡처 시작",
                    body: "이제 세션 및 관찰자 파이프라인을 준비합니다.",
                    badge: "시작"
                },
                dismissed: {
                    title: "캡처가 중단됨",
                    body: "이 회의는 시작 프롬프트에서 종료되었습니다.",
                    badge: "끄기"
                },
                setup: {
                    title: "OpenAI 설정 필요",
                    body: "실시간 번역을 활성화하려면 설정에서 OpenAI 설정을 완료하세요.",
                    badge: "설정"
                },
                unavailable: {
                    title: "OpenAI을(를) 사용할 수 없습니다",
                    body: "실시간 번역을 재개하기 전에 설정에서 OpenAI 설정을 확인하세요.",
                    badge: "이슈"
                },
                off: {
                    title: "번역이 꺼져 있습니다",
                    body: "대상: {language}. 라이브 출력을 위해 켜십시오.",
                    badge: "끄기"
                },
                error: {
                    title: "번역에 주의가 필요합니다",
                    body: "일부 회선이 실패했습니다. 영향을 받은 카드에서는 재시도가 가능합니다.",
                    badge: "이슈"
                },
                translating: {
                    title: "{language}로 번역 중",
                    body: "새로운 대사가 실시간으로 번역되고 있습니다.",
                    badge: "일 중"
                },
                live: {
                    title: "실시간 번역 활성화",
                    body: "{language}에서 라이브 출력을 렌더링하는 중입니다."
                },
                ready: {
                    title: "번역이 무장되었습니다",
                    body: "자막이 켜져 있습니다. 새 줄은 {language}로 변환됩니다.",
                    badge: "준비"
                },
                waiting: {
                    title: "캡션을 기다리는 중",
                    body: "번역을 시작하려면 회의 캡션을 켜세요.",
                    badge: "대기 중"
                }
            },
            tooltips: {
                compactAiSetup: "번역, 요약, 보조 안내를 복원하려면 설정에서 OpenAI 설정을 완료하세요.",
                compactAiIssue: "{message} OpenAI 종속 기능은 문제가 해결될 때까지 일시 중지 상태로 유지됩니다.",
                translationOff: "실시간 번역 끄기",
                translationOn: "실시�� 번역 켜기",
                translationSetup: "실시간 번역을 활성화하려면 설정에서 OpenAI 설정을 완료하세요.",
                translationUnavailable: "OpenAI을(를) 다시 사용할 수 있을 때까지 실시간 번역이 일시중지됩니다.",
                captureHelp: "도움말 캡처",
                hideCaptureHelp: "캡처 도움말 숨기기",
                switchToCompactView: "간략 보기로 전환",
                expandOverlay: "오버레이 펼치기",
                openProfilePicker: "회의 프로필 선택기 열기"
            }
        },
        captureGuide: {
            eyebrow: "캡처 설정",
            title: "도움말 캡처",
            statusReady: "준비되면 캡처가 시작됩니다.",
            footer: "CaptionArc은(는) 이 탭에 실시간 캡션이 표시되는 즉시 캡처를 시작합니다.",
            stepsCount: "{count}걸음",
            waitingTitle: "실시간 자막을 기다리는 중",
            closeAriaLabel: "캡처 가이드 닫기",
            startsAutomatically: "자동으로 시작",
            tooltipOpen: "도움말 캡처",
            tooltipClose: "캡처 도움말 숨기기",
            providers: {
                googleMeet: {
                    title: "Google Meet에서 캡처 활성화",
                    body: "이 브라우저 회의에서 Google Meet 캡션이 켜져 있으��� CaptionArc을(를) 시작할 수 있습니다.",
                    status: "자동으로 시작",
                    footer: "CaptionArc은(는) 이 탭에 실시간 캡션이 표시되는 즉시 자동으로 캡처를 시작합니다.",
                    troubleshooting: "캡션 컨트롤이 표시되지 않으면 회의 또는 브라우저 상태가 아직 로드 중인지 확인하세요.",
                    steps: {
                        openControls: {
                            title: "모임 제어 열기",
                            detail: "마우스를 움직여 하단 회의 도구 모음을 표시하세요."
                        },
                        openCaptions: {
                            title: "캡션 컨트롤 열기",
                            detail: "회의 도구 모음에서 캡션 또는 CC 컨트롤을 클릭합니다."
                        },
                        turnOn: {
                            title: "캡션 켜기",
                            detail: "캡션이 활성화되면 CaptionArc이(가) 자동으로 텍스트 캡처를 시작합니다."
                        }
                    }
                },
                microsoftTeams: {
                    title: "Microsoft Teams에서 캡처 활성화",
                    body: "CaptionArc은(는) Teams 회의 도구 모음에서 실시간 캡션을 켜면 시작할 수 있습니다.",
                    status: "자동으로 시작",
                    footer: "CaptionArc은(는) 이 탭에 실시간 캡션이 표시되는 즉시 자동으로 캡처를 시작합니다.",
                    troubleshooting: "캡션을 사용할 수 없는 경우 주최자 또는 관리자 정책이 캡션 제어를 제한하고 있을 수 있습니다.",
                    steps: {
                        openMore: {
                            title: "더 열어보세요",
                            detail: "상단 회의 도구 모음을 사용하고 더보기 메뉴를 엽니다."
                        },
                        openLanguage: {
                            title: "열린 언어와 연설",
                            detail: "더보기에서 언어 및 음성을 선택합니다."
                        },
                        chooseCaptions: {
                            title: "라이브 캡션 표시를 선택하세요.",
                            detail: "라이브 캡션 표시를 선택하면 CaptionArc이 캡션 창을 자동으로 감지합니다."
                        }
                    }
                },
                zoomWeb: {
                    title: "Zoom Web App에서 캡처 활성화",
                    body: "이 브라우저 회의에서 Zoom Web App 캡션이 활성화되면 CaptionArc을(를) 시작할 수 있습니다.",
                    status: "캡션을 수동으로 활성화",
                    footer: "CaptionArc은(는) 이 탭에 Zoom 캡션이 표시되는 즉시 캡처를 시작합니다.",
                    troubleshooting: "일부 Zoom 회의에서는 데스크톱 앱을 선호하거�� 호스트 설정에 따라 캡션 제어를 제한할 수 있습니다.",
                    steps: {
                        openControls: {
                            title: "회의 제어 열기",
                            detail: "Zoom Web App 창 하단에 있는 회의 내 도구 모음을 사용하세요."
                        },
                        openMore: {
                            title: "더 열어보세요",
                            detail: "회의 내 도구 모음에서 더 보기 메뉴를 엽니다."
                        },
                        openCaptions: {
                            title: "오픈 캡션",
                            detail: "더보기 안에서 캡션 하위 메뉴를 엽니다."
                        },
                        chooseShow: {
                            title: "캡션 표시를 선택하세요",
                            detail: "이 탭에서 Zoom 자막 화면을 사용할 수 있도록 하려면 캡션 표시를 선택하세요."
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "회의 세션",
            turns: "{count} 턴",
            chat: "{count} 채팅",
            chatCaptureTooltip: "회의 채팅 캡처가 활성화되었습니다. 새로 지원되는 회의 채팅 메시지가 이 세션과 함께 저장됩니다.",
            autoSummarySetupTooltip: "OpenAI 설정이 완료될 때까지 자동 요약이 일시중지 상태로 유지됩니다.",
            autoSummaryUnavailableTooltip: "OpenAI을(를) 다시 사용할 수 있을 때까지 자동 요약이 일시 중지됩니다.",
            autoSummaryReadyTooltip: "이 회의가 끝나면 {profile}이(가) 자동으로 실행됩니다.",
            aiAlertSetupTooltip: "번역, 요약, 보조 안내를 복원하려면 설정에서 OpenAI 설정을 완료하세요.",
            aiAlertUnavailableTooltip: "{message} OpenAI 종속 회의 도구는 문제가 해결될 때까지 일시 중지 상태로 유지됩니다.",
            liveState: {
                awaitingReply: {
                    label: "답장을 기다리는 중",
                    tooltip: "Capture는 이 회의에 대한 시작 결정을 기다리고 있습니다."
                },
                starting: {
                    label: "시작",
                    tooltip: "캡처가 승인되었으며 회의 세션을 준비 중입니다."
                },
                off: {
                    label: "끄기",
                    tooltip: "시작 프롬프트에서 이 회의에 대한 캡처가 취소되었습니다."
                },
                ended: {
                    label: "종료됨",
                    tooltip: "이 세션이 종료되었습니다. 마지막 세션을 계속하거나 새 세션을 시작하려면 다시 참여하세요."
                },
                lobby: {
                    label: "로비",
                    tooltip: "세션 타이머를 시작하고 흐름을 캡처하려면 회의에 참여하세요."
                },
                live: {
                    label: "라이브",
                    tooltip: "현재 이 회의에서 캡션을 캡처하는 중입니다."
                },
                armed: {
                    label: "무장",
                    tooltip: "캡션이 활성화되었으며 오버레이가 다음 줄을 기다리고 있습니다."
                },
                waiting: {
                    label: "대기 중",
                    tooltip: "회의 캡션은 아직 활성화되지 않았습니다."
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "기본 동작은 표준 동작입니다.",
            timeoutHint: "기본값은 {action}입니다.",
            captureConsent: {
                title: "이 회의에 대한 캡처를 활성화하���겠습니까?",
                body: "이것을 건너뛰면 이번 회의 방문 동안 캡처가 꺼집니다.",
                ariaLabel: "캡처 시작 확인",
                secondaryAction: "지금은 아님",
                primaryAction: "활성화"
            },
            sessionContinuation: {
                title: "이전 세션을 계속하시겠습니까?",
                body: "귀하는 나간 직후 동일한 회의에 다시 참여했습니다. 응답이 없으면 새 세션이 시작됩니다.",
                ariaLabel: "세션 계속 확인",
                secondaryAction: "새 세션",
                primaryAction: "계속"
            },
            sessionEnded: {
                title: "세션이 종료되었습니다.",
                body: "여기에서 캡처된 항목을 검토하거나 오버레이를 닫으세요. 응답이 없으면 닫힙니다.",
                ariaLabel: "세션 종료 확인",
                secondaryAction: "닫기",
                primaryAction: "여기있어"
            }
        },
        assistant: {
            statusLabel: {
                queued: "대기 중",
                working: "일 중",
                ready: "준비",
                paused: "일시중지됨",
                issue: "이슈",
                unavailable: "이용 불가",
                watching: "시청 중"
            },
            statusDescription: {
                queued: "유용한 순간이 감지되었습니다.",
                working: "실시간 안내를 생성합니다.",
                latestReady: "최신 어시스턴트 안내가 준비되어 있습니다.",
                ready: "어시스턴트는 다음 순간을 위해 준비되어 있습니다.",
                paused: "이 세션에는 어시스턴트가 꺼져 있습니다.",
                issue: "어시스턴트에 주의가 필요합니다.",
                unavailable: "지금은 OpenAI을(를) 사용할 수 없습니다.",
                watching: "유용한 순간을 기다리고 있습니다."
            },
            emptyState: {
                setupTitle: "어시스턴트를 사용하려면 OpenAI 설정을 완료하세요.",
                setupBody: "OpenAI 설정이 완료되지 않아 실시간 안내를 아직 실행할 수 없습니다.",
                unavailableTitle: "어시스턴트를 일시적으로 사용할 수 없습니다.",
                unavailableBody: "{message} 보조자는 OpenAI이 다시 건강해지면 재개됩니다.",
                watchingTitle: "어시스턴트가 이 회의를 지켜보고 있습니다",
                watchingBody: "유용한 질문, 요청 또는 위���이 나타나면 여기에 실시간 안내가 표시됩니다.",
                offTitle: "이 세션에서는 어시스턴트가 꺼져 있습니다.",
                offBody: "실시간 안내를 다시 시작하고 싶을 때마다 이 기능을 다시 켜세요.",
                errorTitle: "어시스턴트에 주의가 필요합니다",
                errorBody: "생성 문제로 인해 실시간 안내가 중단되었습니다. 다음 유효한 순간에 다시 시도합니다.",
                preparingTitle: "어시스턴트가 안내를 준비 중입니다.",
                preparingBody: "유용한 순간이 감지되었으며 현재 첫 번째 실시간 안내가 대기 중입니다.",
                workingTitle: "어시스턴트 작업 중",
                workingBody: "현재 회의 순간에 대한 실시간 안내가 생성되고 있습니다."
            },
            footer: {
                setup: "OpenAI 설정 완료",
                unavailable: "OpenAI을(를) 사용할 수 없습니다",
                sessionStartsAfterJoin: "참여 후 세션이 시작됩니다.",
                workingLiveGuidance: "실시간 안내 작업 중",
                turnedOffForSession: "이 세션에서는 사용 중지됨",
                generationNeedsAttention: "세대의 관심이 필요하다",
                latestGuidanceReady: "최신 안내가 준비되었습니다",
                watchingSession: "이 세션을 시청 중",
                notes: "{count} 메모",
                liveCount: "{count} 라이브",
                aiAlertSetup: "보조자 안내를 실행하기 전에 설정에서 OpenAI 설정을 완료하세요.",
                aiAlertUnavailable: "{message} 보조자 안내는 OpenAI을 다시 사용할 수 있을 때까지 일시중지된 상태로 유지됩니다."
            },
            source: {
                meetingChat: "회의 채팅",
                caption: "캡션",
                unknownSpeaker: "알 수 없음"
            },
            pendingReply: "현재 어시스턴트가 답장을 준비하고 있습니다.",
            ui: {
                toggleLiveLabel: "라이브",
                readyTitle: "어시스턴트가 준비되었습니다",
                watchingSession: "이 세션을 시청 중",
                watching: "시청 중",
                waitingForMoment: "유용한 순간을 기다리고 있습니다.",
                headerTitle: "AI 어시스턴트",
                footerTitle: "AI 비서",
                panelAriaLabel: "AI 비서 실시간 안내",
                openSettings: "어시스턴트 설정 열기",
                setupBeforeEnable: "어시스턴트를 켜기 전에 OpenAI 설정을 완료하세요.",
                unavailableUntilOpenAi: "OpenAI을 다시 사용할 수 있을 때까지 어시스턴트를 사용할 수 없습니다.",
                turnOffForSession: "이 세션에 대해 어시스턴트 끄기",
                turnOnForSession: "이 세션에 어시스턴트 켜기",
                openPanel: "어시스턴트 패널 열기",
                collapsePanel: "보조 패널 접기",
                resizePanel: "크기 조정 보조 패널"
            }
        }
    },
    popup: {
        header: {
            devBadge: "데브",
            openMeetingHistory: "회의 기록 열기",
            openSettings: "설정 열기"
        },
        setup: {
            verificationNotTested: "테스트되지 않음",
            notConfigured: "OpenAI이 구성되지 않았습니다.",
            setupRequired: {
                label: "설정 필요",
                description: "OpenAI API 키를 추가하고 모델을 선택하세요."
            },
            needsAttention: {
                label: "주의가 필요함",
                description: "설정에서 OpenAI 설정을 검토하세요."
            },
            ready: {
                label: "준비",
                description: "OpenAI, 모델 및 대상 언어가 실시간 출력 준비가 되었습니다."
            },
            verifySetup: {
                label: "설정 확인",
                description: "설정에서 한 번의 연결 테스트를 실행하여 OpenAI 설정을 확인하세요."
            }
        },
        overlay: {
            badge: "오버레이",
            title: "실시간 가시성",
            switchAriaLabel: "실시간 오버레이 가시성 전환",
            switchDisabledTitle: "실시간 가시성을 사용하려면 설정에서 캡처 시작을 활성화하세요.",
            state: {
                inactive: "비활성",
                visible: "보이는",
                hidden: "숨겨진"
            },
            mode: {
                captureStartupOff: "캡처 시작이 꺼져 있습니다",
                available: "오버레이 유지 가능",
                hidden: "오버레이가 숨겨져 있음"
            },
            helper: {
                captureStartupOff: "설정에서 시작이 묻기 또는 항상으로 설정된 후에 실시간 가시성을 사용할 수 있습니다.",
                instantToggle: "공개 회의를 위한 인스턴트 토글. 위치, 크기, 컴팩트 상태는 회의 앱별로 기억됩니다."
            }
        },
        pulse: {
            title: "작업 공간 펄스"
        },
        rows: {
            live: {
                capturing: {
                    label: "라이브 캡처",
                    detail: "{platform}님이 이 탭에서 적극적으로 듣고 있습니다.",
                    badge: "라이브"
                },
                lobby: {
                    label: "가입하면 준비됨",
                    detail: "{platform}은(는) 영업 중이며 로비에 대기하고 있습니다.",
                    badge: "로비"
                },
                startupOff: {
                    label: "캡처 시작이 꺼져 있습니다",
                    detail: "다시 실시간으로 듣고 싶으면 시작을 묻기 또는 항상으로 다시 설정하세요.",
                    badge: "끄기"
                },
                idle: {
                    label: "실시간 회의 없음",
                    detail: "지원되는 회의 탭을 열면 CaptionArc이 여기에서 깨어납니다.",
                    badge: "유휴"
                }
            },
            summary: {
                busy: {
                    label: "AI 요약이 작동 중입니다.",
                    detail: "백그라운드에서 회의 요약을 수집하는 중입니다.",
                    badge: "바쁨"
                },
                failed: {
                    label: "요약에 주의가 필요함",
                    detail: "마지막 요약이 깔끔하게 끝나지 않았습니다.",
                    badge: "재시도"
                },
                automatic: {
                    label: "자동 요약이 활성화되었습니다.",
                    detail: "{profileName}은(는) 각 회의가 끝난 후 자체적으로 요약을 시작합니다.",
                    badge: "자동"
                },
                manual: {
                    label: "수동 요약 모드",
                    detail: "지금은 대기 중인 항목이 없습니다. 요약은 귀하가 요청할 때만 실행됩니다.",
                    badge: "매뉴얼"
                },
                defaultProfileName: "기본 프로필"
            },
            archive: {
                empty: {
                    label: "아카이브가 아직 비어 있습니다.",
                    detail: "캡처가 실행되면 저장된 회의 및 요약이 여기에 수집되기 시작합니다.",
                    badge: "새로운"
                },
                ready: {
                    label: "{count} 회의가 저장되었습니다.",
                    detail: "{used}이(가) 사용되었습니다. {updated}."
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "아직 저장된 회의가 없습니다.",
            updatedJustNow: "방금 업데이트됨",
            updatedMinutesAgo: "{minutes}분 전에 업데이트됨",
            updatedHoursAgo: "{hours}시간 전에 업데이트됨",
            updatedDaysAgo: "{days}d 전에 업데이트됨"
        },
        meta: {
            aiService: "AI 서비스",
            model: "모델",
            target: "대상",
            startup: "시작",
            modelNotSelected: "선택��지 않음",
            pendingIndicator: "OpenAI은(는) 아직 확인되지 않았습니다.",
            startupValues: {
                off: "끄기",
                always: "항상",
                ask: "물어보세요"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
