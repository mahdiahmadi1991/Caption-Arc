import type { UiMessageCatalog } from "../types";

export const zhMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "快速访问",
        actions: {
            cancel: "取消",
            clear: "清除",
            close: "关闭",
            collapse: "崩溃",
            confirmDelete: "确认删除",
            delete: "删除",
            expand: "展开",
            hide: "隐藏",
            loading: "加载中...",
            open: "打开",
            show: "显示",
            continue: "继续",
            working: "工作..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "还没有内容。",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "会议"
        },
        theme: {
            group: "主题",
            system: "使用系统主题",
            light: "使用浅色主题",
            dark: "使用深色主题"
        },
        optional: "（可选）",
        helpPopover: {
            eyebrow: "字段说明",
            moreAbout: "更多了解 {label}",
            close: "关闭说明"
        },
        uiLanguage: {
            label: "界面语言",
            description: "选择弹出窗口、设置、历史记录和会议中 UI 使用的语言。",
            system: "使用浏览器语言",
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
            privacyPolicy: "隐私政策",
            termsOfService: "服务条款"
        },
        legal: {
            version: "版本 {version}",
            copyright: "版权所有 © {year} CaptionArc"
        },
        notifications: {
            summaryReady: {
                title: "{title} 的摘要已准备就绪",
                message: "点击可在会议历史中打开完整摘要。"
            }
        },
        firstRunTerms: {
            eyebrow: "首次设置",
            title: "查看并接受条款后继续",
            body: "在继续设置之前，CaptionArc 需要您一次性接受当前的服务条款。",
            version: "条款版本 {version}",
            reviewPrompt: "接受前请先查看当前的服务条款和隐私政策。",
            acceptanceNote: "继续即表示您确认已查看当前服务条款并理解隐私政策。",
            declinedBody: "由于当前服务条款已被拒绝，CaptionArc 在此设备上将保持未激活状态。",
            declinedPrompt: "当您准备继续时，请再次查看当前条款。",
            declinedNote: "在此设备接受当前服务条款之前，CaptionArc 将保持被阻止状态。",
            accept: "接受条款"
        },
        legalPages: {
            shared: {
                eyebrow: "法律",
                loadingDescription: "正在加载此扩展程序当前发布的法律文档。"
            },
            privacyPolicy: {
                title: "隐私政策",
                subtitle: "在产品内显示与仓库中发布的同一份隐私政策。",
                sourceNote: "此页面渲染与仓库中发布的相同 markdown 源，以便扩展内副本与公开文档保持一致。",
                loadingTitle: "正在加载隐私政策"
            },
            termsOfService: {
                title: "服务条款",
                subtitle: "查看 CaptionArc 当前的条款、责任和法律边界。",
                acceptEyebrow: "首次设置",
                acceptSubtitle: "在此设备上接受之前，请滚动阅读当前条款直到末尾。",
                acceptPrompt: "阅读当前服务条款后才能启用接受。",
                scrollRequired: "请滚动到文档末尾以启用接受。",
                scrollReady: "您已到达条款末尾。现在可以接受并关闭此页面。",
                accept: "接受并关闭",
                decline: "拒绝并关闭",
                declineNote: "如果您不同意这些条款，请关闭此页面并不要使用 CaptionArc。",
                sourceNote: "此页面渲染与仓库中发布的相同 markdown 源，以便扩展内副本与公开文档保持一致。",
                alreadyAcceptedTitle: "当前条款已被接受",
                alreadyAcceptedBody: "此设备已记录当前条款版本的接受状态。",
                declinedTitle: "当前条款已在此设备上被拒绝",
                declinedBody: "在此设备接受当前条款版本之前，CaptionArc 将保持被阻止状态。",
                version: "版本 {version}",
                loadingTitle: "正在加载服务条款"
            }
        },
        units: {
            byte: "乙",
            kilobyte: "知识库",
            megabyte: "MB"
        }
    },
    options: {
        header: {
            eyebrow: "设置",
            title: "CaptionArc 设置",
            subtitle: "从一个紧凑的控制界面配置共享 AI 服务、会议配置文件、实时翻译行为、云保护和恢复。",
            openMeetingHistory: "会议历史"
        },
        navigation: {
            title: "设置图",
            description: "通过控制台逐节移动。",
            quickJump: "快速跳跃"
        },
        loading: "加载中...",
        snapshot: {
            aiEngine: "人工智能引擎",
            serviceStatus: "服务���态",
            model: "型号",
            primaryProfile: "主要简介",
            theme: "主题",
            cloudVault: "云保管库",
            meetingUi: "会议界面",
            none: "无",
            system: "系统",
            light: "光",
            dark: "黑暗",
            providerOne: "{count} 提供商",
            providerOther: "{count} 提供商",
            visibleClickThrough: "可见·点击",
            visibleInteractive: "可见·互动",
            hidden: "隐藏"
        },
        sections: {
            workspace: {
                eyebrow: "工作空间",
                title: "经验和默认值",
                description: "设置共享默认值一次，然后将视觉行为、会议流程和存档规则清晰分开。",
                shortLabel: "工作空间",
                mapHint: "外观、会议流程和存档默认值"
            },
            openAiService: {
                eyebrow: "OpenAI 服务",
                title: "共享人工智能服务",
                shortLabel: "OpenAI",
                mapHint: "翻译、摘要和助理",
                description: "管理实时翻译、会议摘要和会议助理使用的共享 OpenAI 服务。"
            },
            translation: {
                eyebrow: "翻译",
                title: "实时翻译",
                shortLabel: "翻译",
                mapHint: "实时字幕行为和调整",
                description: "调整 OpenAI 处理实时字幕翻译的方式，而无需更改摘要生成或助手行为。"
            },
            profiles: {
                eyebrow: "遇见人工智能",
                title: "会议简介",
                shortLabel: "型材",
                mapHint: "身份、概要和助手",
                description: "会议配置文件定义一种会议类型一次，然后重复使用该身份来生成摘要和实时助理。"
            },
            cloudSync: {
                eyebrow: "云同步",
                title: "个人云保管库",
                shortLabel: "云同步",
                mapHint: "档案保护和提供者",
                description: "连接 Google Drive、OneDrive 或两者，以在您的设备上���护本地优先存档。"
            },
            dataRecovery: {
                eyebrow: "恢复",
                title: "数据恢复",
                shortLabel: "恢复",
                mapHint: "加密备份和重置",
                description: "云同步是主要的连续性路径。使用加密的存档作为后备备份，或者在需要干净重置时删除已保存的存档。"
            }
        },
        workspace: {
            appearance: {
                title: "外观",
                description: "选择固定主题或让 CaptionArc 自动遵循您的系统。"
            },
            uiLanguage: {
                title: "界面语言",
                description: "在弹出窗口、设置、会议历史记录和会议中 UI 中应用一种语言。"
            },
            meetingFlow: {
                title: "会议流程",
                description: "控制 CaptionArc 如何开始捕获、帮助添加字幕以及决定重新加入的会议是否应继续同一会话。"
            },
            captureStartup: {
                label: "捕获启动",
                off: {
                    name: "保持捕捉关闭",
                    description: "不要为受支持的会议初始化会议中捕获框。"
                },
                ask: {
                    name: "每次会议都询问",
                    description: "在任何捕获开始之前显示简短的批准提示。这是默认设置。"
                },
                always: {
                    name: "始终开始捕获",
                    description: "立即启动捕获流程，无需先询问。"
                }
            },
            captionActivation: {
                label: "字幕激活",
                guided: {
                    name: "引导",
                    description: "保持电流流动。 CaptionArc 显示内联帮助，以便您可以自己打开实时字幕。"
                },
                automatic: {
                    name: "尽可能自动",
                    description: "加入后，CaptionArc 会在会议应用程序支持时尝试自动打开实时字幕，如果不能，则退回到引导流程。"
                }
            },
            sessionContinuation: {
                title: "会话继续窗口",
                description: "决定在会话最近一次活动之后（包括你离开会议的时间），CaptionArc 还应持续提供继续同一会话多长时间。",
                windowLabel: "窗户",
                off: "关闭",
                oneHour: "1小时",
                hours: "{count} 小时",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes} 分钟"
            },
            inMeetingSurfaces: {
                title: "会议中的表面",
                description: "塑造实时会议表面在屏幕上时的外观和行为。"
            },
            overlayOpacity: {
                title: "叠加不透明度",
                description: "较低的值可以使下方的会议更加明显。",
                subtle: "微妙",
                solid: "固体"
            },
            overlayClickThrough: {
                label: "点击模式",
                description: "让点击穿过实时会议���面，同时保持可见。"
            },
            meetingArchive: {
                title: "会议档案",
                description: "决定应保留哪些会议数据以供以后查看、导出和生成摘要。"
            },
            meetingArchiveRetention: {
        label: "归档保留期限",
        description:
          "选择 CaptionArc 在将已结束且未加星标的会话从本地归档中移除之前应保留多久。选择关闭可禁用所有自动归档删除。",
        off: "关闭",
        days: "{count} 天",
        oneYear: "1 年",
      },
      storeMeetingChat: {
                label: "商店会议聊天",
                description: "保存支持的会议聊天，以便它可以显示在会议历史记录、导出和摘要中。"
            }
        },
        legalRisk: {
            shared: {
                eyebrow: "请谨慎使用",
                warningLabel: "法律与隐私提示"
            },
            captureStartupAlways: {
                dialog: {
                    title: "始终自动开始捕获会降低同意保护",
                    body: "此模式会跳过每场会议的批准提示，并在检测到受支持的会议后立即开始捕获流程。",
                    pointOne: "仅在你确信自己可以捕获并保留会议衍生内容的会议中使用此模式。",
                    pointTwo: "根据你启用的功能，已保存的字幕或聊天之后可能会用于摘要、实时辅助或导出。",
                    pointThree: "与通知、同意、工作场所政策或平台政策相关的要求，仍由你自行负责。",
                    confirm: "启用自动开始捕获"
                },
                warning: {
                    title: "自动开始捕获已启用",
                    body: "CaptionArc 将跳过每场会议的批准步骤。只有在你可以合法捕获并保留会议衍生内容的场景中才应保持启用。"
                }
            },
            captionActivationAutomatic: {
                dialog: {
                    title: "自动字幕激活会代你与会议应用交互",
                    body: "当受支持的会议界面允许时，此模式会尝试自动打开实时字幕。",
                    pointOne: "自动激活可能比引导模式更敏感，因为它会在每次没有你手动操作的情况下更改会议界面。",
                    pointTwo: "只有在你的政策和工作流程接受自动字幕激活的环境中才应保持启用。",
                    pointThree: "你仍需自行负责仅在提供商规则和会议预期允许的情况下使用此自动化。",
                    confirm: "启用自动字幕激活"
                },
                warning: {
                    title: "自动字幕激活已启用",
                    body: "当提供商支持时，CaptionArc 会尝试自动打开字幕。对于政策敏感的会议，请谨慎使用此模式。"
                }
            },
            storeMeetingChat: {
                dialog: {
                    title: "保存会议聊天可能提高隐私敏感度",
                    body: "启用后，受支持的会议聊天会成为你已保存会议记录的一部分，并可能出现在历史记录、导出内容以及 AI 辅助后续流程中。",
                    pointOne: "与可见字幕相比，会议聊天可能包含更敏感或更容易识别身份的内容。",
                    pointTwo: "在使用这些功能时，已保存的聊天之后可能被纳入摘要、翻译和助手上下文。",
                    pointThree: "只有在保留这些内容符合你的通知、同意和保密预期时，才应启用聊天保存。",
                    confirm: "启用会议聊天保存"
                },
                warning: {
                    title: "会议聊天保存已启用",
                    body: "受支持的会议聊天正在被保留，用于历史记录、导出和 AI 辅助后续流程。只有在这种保留是合适的情况下才应保持启用。"
                }
            }
        },
        openAiService: {
            title: "OpenAI 服务",
            sectionDescription: "管理实时翻译、会议摘要和会议助理使用的共享 OpenAI 服务。",
            sharedService: "共享服务",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "一项共享 OpenAI 服务支持实时翻译、会议摘要和会议助理。",
            setupDescription: "添加一次 API 密钥，选择默认 GPT 模型，并在依赖任何人工智能驱动的工作流程之前确认访问。",
            verificationLabel: "测试 OpenAI 连接",
            verifyingLabel: "测试当前 OpenAI 设置",
            highlights: {
                translation: "实时翻译",
                summaries: "会议纪要",
                assistant: "直播助理"
            },
            cards: {
                translationTitle: "翻译",
                translationBody: "实时字幕",
                summariesTitle: "摘要",
                summariesBody: "会后输出",
                assistantTitle: "助理",
                assistantBody: "现场指导"
            },
            state: {
                setupRequired: {
                    label: "需要设置",
                    description: "添加 API 密钥并确认默认 GPT 模型。",
                    impact: "在 OpenAI 服务完全配置之前，AI 支持的功能将保持不可用。"
                },
                actionRequired: {
                    label: "需要采取行动",
                    impact: "在 OpenAI 服务重新工作之前，AI 支持的功能可能不可用。"
                },
                ready: {
                    label: "准备好",
                    impact: "OpenAI 可用于翻译、摘要和实时指导。"
                },
                checking: {
                    label: "检查",
                    impact: "正在进行连接检查。结果将更新产品的每个人工智能驱动的区域。"
                },
                needsVerification: {
                    label: "需要验证",
                    description: "运行一次连接检查以确认当前密钥和型号。",
                    impact: "仍然可以编辑设置，但在服务得到验证之前，AI 输出应被视为未确认。"
                }
            },
            banners: {
                needsAttention: "OpenAI 需要注意",
                finishSetup: "完成 OpenAI 设置",
                verifySetup: "验证 OpenAI 设置"
            },
            apiKeyInput: {
                label: "API密钥",
                provider: "OpenAI",
                storedLocally: "本地存储",
                credential: "秘密凭证",
                show: "显示 API 密钥",
                hide: "隐藏 API 密钥",
                helper: "该密钥保留在该设备上，用于翻译、摘要和实时指导。",
                guide: "OpenAI API 密钥指南"
            },
            modelLabel: "型号"
        },
        models: {
            gpt5Mini: {
                description: "实时翻译的最佳默认设置：快速、可靠且高质量，适合嘈杂的字幕。",
                badge: "推荐"
            },
            gpt52: {
                description: "当翻译准确性和细微差别比延迟或成本更重要时，效果最佳。",
                badge: "最高品质"
            },
            gpt51: {
                description: "强大的全能模型，具有平衡的质量与速度配置。"
            },
            gpt5: {
                description: "当你想要比 Mini 或 Nano 更强的通用质量、但又不需要升级到 GPT-5.2 时，可选择这款旗舰 GPT-5 模型。",
                badge: "旗舰"
            },
            gpt5Nano: {
                description: "最低延迟选项可实现非常快速的响应，并具有更简单的输出质量。",
                badge: "最快"
            },
            gpt41: {
                description: "如果您更喜欢经过验证的通用翻译模型，那么这是稳定的传统选择。",
                badge: "遗产"
            },
            gpt41Mini: {
                description: "成本较低的 GPT-4.1 变体，适用于较轻的工作负载和中等翻译质量。",
                badge: "打火机"
            },
            gpt41Nano: {
                description: "最小的 GPT-4.1 选项，适合对成本和延迟最敏感的超轻量任务。"
            },
        },
        help: {
          apiKey: `在这里填写 CaptionArc 在此设备上要使用的 OpenAI API 密钥。

- 该密钥只保留在本设备上，不会进入同步或备份导出。
- 最好使用符合你自身访问和计费策略的密钥。
- 如果验证失败，请检查密钥状态、项目额度以及模型访问权限。`,
          model: `选择用于实时翻译、摘要和助手输出的 OpenAI 模型。

- 更轻量的模型通常在会议中响应更快。
- 更强的模型通常写得更好，但也可能更慢、更贵。
- 如果不确定，保留推荐默认值即可。

示例：实时会议时使用更快的模型，如果之后更看重摘要质量，再切换到更强的模型。`,
          uiLanguage: `这个选项会修改 CaptionArc 界面本身的语言。

- 它会影响设置页、会议历史、快捷界面以及会议中的 UI 文案。
- 它不会自动改变实时翻译或摘要输出的语言。
- 如果你希望 CaptionArc 自动跟随环境语言，请使用浏览器/系统选项。`,
          translationInstructions: `这些说明会随每次实时翻译请求一起发送。

- 保持简短、具体。
- 用它说明术语、语气和字幕清理规则。
- 过长的提示通常会让实时翻译更慢、更不稳定。

示例：\`产品名保留英文，并优先使用简短的字幕式句子。\``,
          captureStartupBehavior: `这项设置决定 CaptionArc 检测到受支持会议后会发生什么。

- **询问** 会在开始采集前先请求确认。
- **始终** 会不再额外确认，直接开始采集。
- **关闭** 会保持采集待命，直到你手动开启。

如果你想要更稳妥的默认行为，选择 **询问**。`,
          captionActivationBehavior: `这项设置决定会议字幕如何被开启。

- **引导式** 会把最后一步留给你自己操作。
- **自动** 会在平台界面允许时尝试自动开启字幕。
- 自动模式更敏感，因为它会代替你与会议界面交互。

除非你明确需要自动开启，否则更建议使用 **引导式**。`,
          sessionContinuationWindow: `这项时间窗口决定当你重新加入同一个会议时，CaptionArc 可以在多长时间内继续沿用同一会话。

- 窗口越短，越容易创建新会话。
- 窗口越长，相关的重连越容易被归到同一会话里。
- \`0 分钟\` 表示每次重新加入都会开始一个新会话。

示例：设为 \`120 分钟\` 时，如果会议在 10:00 结束，只要你在 12:00 前重新加入同一个会议，就仍可继续同一会话。`,
          overlayClickThrough: `这个选项控制会议中的悬浮层是拦截鼠标点击，还是让点击继续传给下方会议界面。

- 当你希望点击穿过悬浮层直接作用到会议界面时，请开启它。
- 当你需要直接操作悬浮层上的 CaptionArc 控件时，请关闭它。
- 点击穿透适合被动阅读，但如果你经常调整控件，会不那么方便。`,
          meetingArchiveRetention: `这项设置控制本地归档中已结束且未加星会话的自动清理。

- 更短的时长会更早删除旧历史。
- 更长的时长会在设备上保留更多历史。
- **关闭** 会禁用所有自动归档删除。

已加星的会话仍会受到保护，不会被自动清理。`,
          storeMeetingChat: `这项设置决定受支持的会议聊天是否会成为已保存会议记录的一部分。

- 开启后，聊天内容可能出现在历史、导出、摘要和助手上下文中。
- 与可见字幕相比，聊天通常包含更敏感的姓名、决定或链接。
- 只有在保存聊天明确符合你的策略和保密要求时才建议开启。`,
          meetingOutputLanguage: `设置会议输出的默认语言，例如摘要和 Meeting AI 回复。

- 这和界面语言、实时翻译是分开的。
- 请选择你大多数时候希望阅读最终结果的语言。
- 之后如果需要，仍然可以再改输出语言。`,
          profileName: `这个名称用于在设置界面和后续 AI 工作流中识别会议配置文件。

- 名称要足够短，方便你在配置列表里快速扫读。
- 请命名会议类型，而不是某一场一次性的会议。
- 好的名称应该让你一眼就知道这个配置文件什么时候该再次使用。

示例：客户发现访谈、每周团队同步、董事会更新。`,
          profileDescription: `这个描述用于快速说明该会议配置文件适合在什么场景下使用。

- 简要写明会议目的、参与人群或常见节奏。
- 保持简短具体，这样你一眼就能认出正确的配置文件。
- 这里是配置文件元数据，不适合写很长的 AI 指令。

示例：由产品、设计和工程负责人参加的每周跨职能回顾。`,
          autoSummary: `决定这个配置文件是否在会议结束后自动生成摘要。

- 对于几乎每次都需要摘要的固定会议类型，可以开启。
- 如果你只想按需生成摘要，就保持关闭。
- 自动摘要仍然依赖有效的 OpenAI 配置和已保存的会议数据。`,
          summaryEffort: `控制这个配置文件在生成摘要时投入多少 AI 工作量。

- 更低的 effort 更快也更省成本。
- 更高的 effort 更适合较长或较乱的会议。
- 如果不确定，**Balanced** 通常是最稳妥的默认值。`,
          summaryInstructions: `这些说明用于塑造这个配置文件的摘要风格。

- 可用于指定结构、受众和重复术语。
- 请把重点放在摘要输出本身，而不是实时助手行为。
- 简短、明确的说明通常比很长的规则文本更有效。

示例：\`先写管理层摘要，再列出带负责人的行动项。\``,
          assistantEnabled: `为这个配置文件开启或关闭 Meeting AI。

- 关闭后，其余 Meeting AI 设置仍然可见，但不会影响实时建议。
- 只在实时建议确实有帮助的会议类型上开启它。
- 不同配置文件可以有不同的 Meeting AI 默认值。`,
          assistantResponseIntent: `决定这个配置文件中的 Meeting AI 应优先完成什么任务。

- 你可以让它更偏向回答、辅导、总结，或提示风险。
- 它改变的不只是措辞，还会改变建议的整体方向。
- 请选择最符合你在这种会议里常见帮助需求的 intent。`,
          assistantResponseFormat: `控制 Meeting AI 回复的呈现形式。

- 简短的项目符号格式更适合在会议中快速浏览。
- 更口语化的格式更适合你想直接说出口的场景。
- 请选择在时间压力下你最容易消化的格式。`,
          assistantResponseDepth: `控制 Meeting AI 回复应该多简短或多展开。

- 更低的 depth 更适合速度和快速扫描。
- 更高的 depth 会带来更多上下文和推理，但在实时使用中也会更重。
- 快节奏通话建议更轻，战略会议可以更深。`,
          assistantResponseTone: `调整 Meeting AI 文案的默认语气。

- 语气会让建议显得更直接、更中性或更圆融。
- 它不会改变核心事实，但会改变建议落地的方式。
- 请按会议的社交语境来选，不要只按个人偏好。`,
          assistantDeliveryBias: `决定更快输出和更完整指导之间的取舍。

- 如果时机最重要，更快的输出更合适。
- 如果细腻度比延迟更重要，更完整的输出更合适。
- 如果不确定，保留中间档即可。`,
          assistantTriggerPolicy: `决定 Meeting AI 在会议过程中应在什么时机给出建议。

- 更保守的策略会减少噪音。
- 更主动的策略会带来更多建议，但也可能更容易打断你。
- 选择在关键时刻仍能帮到你的最低级别即可。`,
          assistantParticipantScope: `决定哪些参与者的发言或活动会影响 Meeting AI 的建议。

- 更窄的范围可以让助手更聚焦于与你角色最相关的人。
- 更宽的范围适合你需要把握整个房间的讨论氛围时。
- 如果助手显得太吵或太容易分心，可以缩小范围。`,
          assistantInstructions: `这些说明用于定制这个配置文件下的 Meeting AI 行为。

- 可用于定义回复风格、重复约束和领域预期。
- 请把它和摘要说明、实时翻译说明区分开。
- 少量稳定规则通常比很长的例外列表更有效。

示例：\`优先给出简短 talking points，并在起草回答前先指出隐藏风险。\``,
        },
        translation: {
            bestFor: {
                title: "最适合",
                description: "语气、技术术语、缩写处理和嘈杂的字幕清理。"
            },
            keepLean: {
                title: "保持精益",
                description: "较短的指令通常翻译得更快，并且在实时字幕中保持更稳定。"
            },
            avoid: {
                title: "避免",
                description: "冗长的策略、重复的规则或格式要求会减慢每个字幕请求的速度。"
            },
            instructionsLabel: "实时翻译说明",
            instructionsHint: "适用于每个字幕翻译请求。用它来清理字幕、术语和翻译语气。"
        },
        profiles: {
            identity: {
                eyebrow: "个人资料身份",
                description: "这些字段定义会议类型配置文件本身。它们由摘要生成和实时助手共享。",
                nameLabel: "个人资料名称",
                namePlaceholder: "每日同步",
                descriptionLabel: "简短描述",
                descriptionPlaceholder: "定期团队签到"
            },
            summary: {
                eyebrow: "总结",
                description: "这些设置决定了此会议配置文件生成摘要的方式：它使用了多少 AI 工作以及在摘要生成过程中运行哪些指令。",
                autoSummaryLabel: "自动会议结束总结",
                autoSummaryDescription: "当此配置文件处于活动状态时，会议结束后会自行开始摘要。",
                effortLabel: "总结努力",
                instructionsLabel: "摘要说明",
                instructionsHint: "当从会议历史记录中选择此会议类型时使用。",
                modes: {
                    economy: {
                        name: "经济",
                        description: "降低人工智能工作量。当速度最重要时，最适合较短的会议。",
                        badge: "最快"
                    },
                    balanced: {
                        name: "平衡",
                        description: "推荐。调整摘要策略以提高可靠性，而无需过度使用额外的人工智能工作。"
                    },
                    thorough: {
                        name: "彻底",
                        description: "在更长或更复杂的会议中使用更多的人工智能工作，以减少总结失败。",
                        badge: "最慢"
                    }
                }
            },
            assistant: {
                eyebrow: "助理",
                description: "这些设置定义当该会议配置文件处于活动状态时实时指导的行为方式。",
                enabledLabel: "使用具有此配置文件的助手",
                enabledDescription: "启���后，此会议配置文件可以在支持的会议中生成实时指导。",
                disabledHint: "助理设置在此处保持可见，以便您稍后查看或调整它们，但在打开此配置文件之前，它们将保持锁定状态。",
                responseIntentLabel: "初级引导方式",
                responseFormatLabel: "响应格式",
                responseDepthLabel: "响应深度",
                responseToneLabel: "回应音",
                deliveryBiasLabel: "速度与完整性",
                triggerPolicyLabel: "何时应触发指导",
                participantScopeLabel: "谁可以触发指导",
                instructionsLabel: "助理指示",
                instructionsHint: "当此会议配置文件处于活动状态并且助手生成实时指导时使用。",
                intents: {
                    answerForMe: {
                        name: "为我解答",
                        description: "起草用户现在可以给出的最有力的直接答案。"
                    },
                    improveMyAnswer: {
                        name: "改进我的答案",
                        description: "加强用户已经说过的话。"
                    },
                    suggestNextPoint: {
                        name: "建议下一点",
                        description: "提出下一个有用的话题来推动会议向前发展。"
                    },
                    summarizeRecentTurn: {
                        name: "总结最近的转折",
                        description: "将最新的交流压缩为快速可用的回顾。"
                    },
                    surfaceRisks: {
                        name: "表面风险",
                        description: "突出显示值得关注的风险、差距或异议。"
                    },
                    coachMe: {
                        name: "教练我",
                        description: "指导用户如何在当下更有效地做出响应。"
                    }
                },
                formats: {
                    bullets: {
                        name: "子弹",
                        description: "非常短的易于扫描的要点。",
                        badge: "最快"
                    },
                    talkingPoints: {
                        name: "谈话要点",
                        description: "用户可以自然地说出的简短口语要点。"
                    },
                    shortParagraph: {
                        name: "短段落",
                        description: "当子弹感觉太断断续续时，这是一个紧凑的段落。"
                    },
                    structuredSections: {
                        name: "结构化部分",
                        description: "当清晰度很重要时，将答案分成小的标记部分。",
                        badge: "最慢"
                    },
                    script: {
                        name: "脚本",
                        description: "编写用户可以密切关注的更字面的措辞。"
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "超简短",
                        description: "为最高速度而设计的最小答案。",
                        badge: "最快"
                    },
                    brief: {
                        name: "简介",
                        description: "简短而实用。实时会议的良好默认设置。"
                    },
                    standard: {
                        name: "标准型",
                        description: "当速度仍然很重要时，请提供更多背景信息。"
                    },
                    expanded: {
                        name: "扩展",
                        description: "当更完整的答案有用时提供更多解释。",
                        badge: "最慢"
                    }
                },
                tones: {
                    neutral: {
                        name: "中性",
                        description: "平衡且专业。"
                    },
                    direct: {
                        name: "直接",
                        description: "更加简洁、坚定。"
                    },
                    supportive: {
                        name: "支持",
                        description: "很有帮助且令人放心，毫不含糊。"
                    },
                    confident: {
                        name: "自信",
                        description: "当用户需要更清晰的措辞时，表现出强有力和果断的态度。"
                    },
                    analytical: {
                        name: "分析型",
                        description: "更加注重推理和结构化。"
                    }
                },
                delivery: {
                    fastest: {
                        name: "最快",
                        description: "严重偏向于速度和快速有用性。",
                        badge: "最佳速度"
                    },
                    balanced: {
                        name: "平衡",
                        description: "牺牲一些速度以获得更好的完整性。"
                    },
                    careful: {
                        name: "小心",
                        description: "当会议允许时，希望有更高的完整���。",
                        badge: "最慢"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "问题和要求",
                        description: "主要在类似问题或类似请求的回合中触发。",
                        badge: "最低负载"
                    },
                    salienceFirst: {
                        name: "显着性第一",
                        description: "还要对突出的问题、决定或紧张点做出反应。"
                    },
                    proactive: {
                        name: "积极主动",
                        description: "最渴望的模式。仅当您需要更多主动帮助时才使用。",
                        badge: "最高负载"
                    }
                },
                scope: {
                    everyone: {
                        name: "大家",
                        description: "将用户和其他参与者视为有效的触发器。",
                        badge: "较重"
                    },
                    othersOnly: {
                        name: "仅限其他人",
                        description: "在决定是否回答时忽略用户自己的回合。",
                        badge: "打火机"
                    }
                }
            },
            badges: {
                primary: "小学",
                alwaysAvailable: "随时可用",
                customProfile: "自定义配置文件",
                assistantOn: "助理开启",
                autoSummary: "自动摘要"
            },
            editor: {
                title: "会议资料编辑器",
                description: "选择一个配置文件，然后在一处编辑其共享身份、摘要行为和实时助理行为。",
                addProfile: "添加会议资料",
                listTitle: "型材",
                totalCount: "总共 {count}",
                defaultOutputLanguage: "默认AI输出语言",
                untitled: "无标题个人资料",
                noDescription: "还没有描述。",
                noShortDescription: "此配置文件还没有简短的描述。",
                setAsPrimary: "设置为主",
                builtInTitle: "内置默认配置文件",
                builtInDescription: "当没有专门的会议类型适合时，此配置文件为 CaptionArc 提供了安全的通用后备，用于生成摘要和实时指导。",
                newName: "新的会议类型",
                newDescription: "自定义会议资料",
                newPrompt: "用要求的语言准确地总结这次会议。重点关注对于这种会议类型最重要的要点。"
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive 应用程序数据文件夹",
                    subtitle: "您的 Google 帐户内的私人扩展存储。"
                },
                oneDrive: {
                    title: "OneDrive 应用程序文件夹",
                    subtitle: "您的 Microsoft 帐户内的私人扩展存储。"
                }
            },
            actions: {
                refreshStatus: "刷新状态",
                connect: "连接",
                retryNow: "立即重试",
                reconnect: "重新连接",
                disconnect: "断开连接"
            },
            overview: {
                title: "保险库概述",
                loadingDescription: "加载该设备当前的云同步状态。",
                offDescription: "尚未连接个人云提供商。",
                needsAttentionDescription: "在存档再次受到完全保护之前，至少需要一个云目的地进行干���。",
                syncingDescription: "Vault 正在后台主动协调本地和远程更改。",
                upToDateDescription: "连接的云目的地与当前的本地存档同步。"
            },
            stats: {
                currentDevice: "当前设备",
                connectedProviders: "互联提供商",
                connectedProvidersNone: "尚未连接云目的地",
                connectedProvidersOne: "一个云目标处于活动状态",
                connectedProvidersTwo: "两个云目的地均处于活动状态",
                lastSuccessfulSync: "上次成功同步",
                lastSuccessfulSyncHint: "基于最近成功的提供商检查点。",
                queueStatus: "队列状态"
            },
            queue: {
                noQueuedChanges: "没有排队的更改",
                queuedChanges: "{count} 排队更改",
                engineProcessing: "引擎正在处理工作。",
                tasksReady: "{count} 任务已准备好下次运行。",
                engineIdle: "发动机处于闲置状态，直到下一次本地或远程更改。"
            },
            syncHealth: {
                title: "同步健康状况",
                attention: "注意",
                status: "状态"
            },
            pendingChoice: {
                title: "共享设置已存在于云中",
                badge: "需要选择",
                description: "该设备已有自己的共享设置，连接的云保管库还有另一组。选择哪一个应成为未来同步的起点。",
                source: "来源：{provider}",
                keepLocal: "保留此设备的共享设置",
                useCloud: "使用云共享设置"
            },
            providerCard: {
                account: "账户",
                lastSuccessfulSync: "上次成功同步",
                providerStatus: "提供者状态"
            },
            scope: {
                sharedTitle: "跨设备同步",
                localTitle: "仅此设备",
                shared: {
                    meetingSessions: "会议会议",
                    translations: "翻���",
                    summaries: "摘要",
                    meetingProfiles: "会议配置档案",
                    sharedSettings: "共享设置"
                },
                local: {
                    apiKeys: "API 密钥",
                    verificationStatus: "验证状态",
                    deviceIdentity: "设备身份"
                }
            },
            health: {
                syncing: "正在同步",
                upToDate: "最新",
                retryingAutomatically: "自动重试",
                needsAttention: "需要注意",
                actionRequired: "需要采取行动",
                off: "关闭"
            },
            connection: {
                notConnectedTitle: "未连接",
                notConnectedDescription: "连接以开始保护此存档。",
                connectedTitle: "已连接",
                connectedAt: "已连接 {time}"
            },
            sync: {
                notYet: "还没有",
                scannedAt: "已扫描 {time}",
                noScanRecorded: "尚未记录扫描。"
            },
            statusMessage: {
                disconnected: "已断开连接。该提供商未收到更新。",
                manualRetryAvailable: "自动重试已暂停。您可以触发手动重试。",
                syncing: "立即同步本地和远程更改。",
                retryingAutomatically: "在后台自动重试。",
                needsAttention: "在保护完全恢复之前需要注意。",
                actionRequired: "需要手动操作才能继续同步。",
                upToDate: "提供者完全同步。",
                connectedWaiting: "已连接并等待工作。"
            }
        },
        dataRecovery: {
            backupFile: {
                title: "加密备份文件",
                description: "导出的备份包含你的共享设置、会议配置档案、已保存的会议会话、转录、聊天记录、翻译和摘要。设备本地机密（例如 OpenAI API 密钥）不会进入备份。当云同步不可用，或你需要可携带的加密快照时，可使用它。",
                export: "导出所有数据",
                import: "导入备份文件"
            },
            passphrase: {
                label: "备份密码",
                placeholder: "至少使用 8 个字符",
                show: "显示备份密码",
                hide: "隐藏备份密码",
                hint: "导出和导入使用相同的密码。没有它，备份就无法解密。"
            },
            cards: {
                scope: {
                    title: "适用范围",
                    description: "一个加密文件包含设置和完整的会话存档。"
                },
                restoreBehavior: {
                    title: "恢复行为",
                    description: "导入会将当前本地存档和设置替换为您选择的备份文件，然后同步引擎可以再次协调。"
                },
                useCase: {
                    title: "使用案例",
                    description: "最适合机器迁移、回退恢复和存档可移植性。"
                }
            },
            deleteArchive: {
                title: "删除已保存的存档",
                syncedDescription: "从此设备、已连接的云提供商以及其他已同步设备中删除同步归档。你的 OpenAI 设置、偏好和会议配置档案会保留。",
                localDescription: "从本地存储中移除所有已保存的会议会话。这会保留你的 OpenAI 设置、偏好和会议配置档案。"
            },
            confirmDelete: {
                syncedTitle: "到处删除同步存档？",
                localTitle: "清除保存的会话数据？",
                syncedLabel: "到处删除存档",
                localLabel: "清除已保存的会话",
                syncedDescription: "这会从此设备、其他同步设备和连接的云帐户中永久删除每个已保存的会议会话、文字记录、聊天记录、翻译和摘要。您的设置保持不变。",
                localDescription: "这将从本地存储中删除所有已保存的会议会话、文字记录、���天记录、翻译和摘要。您的设置保持不变。"
            }
        },
        diagnostics: {
            launcherTitle: "诊断",
            launcherSubtitle: "控制台",
            closeConsole: "关闭诊断控制台",
            drawerLabel: "诊断控制台",
            closeDrawer: "关闭诊断抽屉",
            actions: {
                enableSession: "启用此会话",
                disableSession: "禁用此会话",
                copyVisible: "复制可见日志",
                copiedVisible: "复制的可见日志",
                refresh: "刷新诊断",
                clear: "清晰的诊断",
                enableSessionDiagnostics: "启用会话诊断"
            },
            filters: {
                all: "全部",
                searchPlaceholder: "搜索标题、摘要、关键字、域、功能、提供商",
                visibleCounts: "可见计数：",
                error: "错误",
                warn: "警告",
                info: "信息",
                debug: "调试",
                trace: "踪迹"
            },
            summary: {
                loadedWindowTitle: "加载窗口",
                loadedWindowBody: "最新 {limit} 典型事件最多",
                visibleNowTitle: "现在可见",
                visibleNowBody: "过滤器和搜索仅更新客户端。",
                snapshotsTitle: "快照",
                noProvider: "没有提供者",
                noResolvedSnapshot: "当前负���中没有解析的快照。",
                lastSyncTitle: "上次同步",
                waiting: "等待",
                lastSyncBody: "隐藏此选项卡时刷新暂停。",
                eventOne: "{count} 事件",
                eventOther: "{count} 事件",
                snapshotOne: "{count} 快照",
                snapshotOther: "{count} 快照"
            },
            row: {
                session: "会议",
                request: "请求",
                correlation: "相关性",
                tab: "选项卡",
                frame: "框架",
                document: "文件",
                origin: "产地",
                copied: "已复制",
                copyRow: "复制行",
                showDetails: "显示详情",
                hideDetails: "隐藏详细信息",
                senderUrl: "发件人网址",
                eventKey: "事件键",
                description: "描述",
                eventData: "事件数据"
            },
            states: {
                requestErrorPrefix: "运��时刷新失败。最后一次成功的有效负载将保持可见，直到下次重试。",
                captureOffTitle: "此会话的诊断捕获已关闭。",
                captureOffBody: "查看器可用，但在您为此会话启用诊断之前不会收到新日志。生产环境会保持其基线捕获策略处于关闭状态，除非您有意在此处覆盖它。",
                waitingTitle: "等待诊断事件。",
                waitingBody: "抽屉连接到规范收集器。一旦扩展发出新的结构化诊断，它们将自动出现在此处。",
                noMatchesTitle: "没有事件与当前过滤器匹配。",
                noMatchesBody: "尝试使用更广泛的级别过滤器或清除搜索框以使事件重新显示在视图中。"
            },
            status: {
                unavailableLabel: "不可用",
                unavailableDescription: "此环境未启用诊断查看器。",
                syncIssueLabel: "同步问题",
                syncIssueDescription: "查看器无法从运行时刷新诊断。",
                connectingLabel: "正在连接",
                connectingDescription: "查看器正在加载当前的诊断配置。",
                sessionOffLabel: "会话关闭",
                sessionOffDescription: "当前对此会话禁用诊断捕获。现有捕获的事件仍然可见。",
                pausedLabel: "已暂停",
                pausedDescription: "当选项选项卡隐藏时，轮询会暂停，当选项选项卡再次可见时，轮询会恢复。",
                liveLabel: "直播",
                liveDescription: "查看器正在轮询最新的规范诊断负载。",
                readyLabel: "准备好",
                readyDescription: "打开抽屉检查最新的规范诊断。"
            },
            requestErrors: {
                runtimeUnavailable: "运行时消息传递在当前上下文中不可用。",
                loadConfigFailed: "无法加载诊断配置。",
                loadPayloadFailed: "无法加载诊断负载。",
                updateConfigFailed: "无法更��诊断配置。",
                clearFailed: "无法清除诊断。"
            }
        },
        runtime: {
            connection: {
                addApiKey: "添加您的 OpenAI API 密钥，然后测试连接。",
                runTest: "运行测试连接以验证您的 OpenAI 密钥和所选型号。",
                testing: "测试当前的 OpenAI 设置...",
                apiKeyRequired: "测试连接之前需要 OpenAI API 密钥。",
                modelRequired: "在测试连接之前选择 OpenAI 型号。",
                apiKeyRejected: "OpenAI 拒绝了 API 密钥。",
                modelUnavailable: "OpenAI 型号不适用于此密钥：{model}。",
                requestFailed: "OpenAI 请求失败，原因是 {status}。",
                networkFailed: "无法到达 OpenAI。检查您的网络连接并重试。",
                reachable: "OpenAI 可达且 {model} 可用。"
            },
            dataTransfer: {
                idle: "使用加密备份作为设置和会话历史记录的后备恢复路径，或者在连接云同步时删除各处保存的存档。",
                exporting: "正在准备包含设置和会话历史记录的后备加密存档...",
                exportSuccess: "使用 {count} 保存的会话 {suffix} 导出的加密备份。",
                exportFailed: "导出数据包失败。",
                importing: "正在解密备份并恢复设置和会话历史记录...",
                importSuccess: "备份导入。已恢复 {count} 会话 {suffix}。",
                importFailed: "导入数据包失败。",
                clearingSynced: "正在从此设备中删除同步存档并将删除内容传播到连接的云提供商...",
                clearingLocal: "从本地存储中删除所有已保存的会话...",
                clearSuccessSynced: "存档已从此设备中删除，并且已将删除排队等待您连接的云提供商。您的设置已保留。",
                clearSuccessLocal: "已保存的会话已被删除。您的设置已保留。",
                clearFailed: "无法清除已保存的会话存档。"
            },
            cloudSync: {
                idleAvailable: "当您连接 Google Drive 或 OneDrive 时，云同步可用。",
                idleConnected: "云同步状态是最新的。",
                idleDisconnected: "连接云提供商以自动保护您的存档。",
                loadFailed: "无法加载云同步状态。",
                updated: "云同步状态已更新。",
                actionFailed: "云同步操作失败。",
                connecting: "正在连接云提供商...",
                disconnecting: "正在断开云提供商的连接...",
                retrying: "正在重试云同步...",
                reconnecting: "正在刷新云提供商访问权限...",
                resolvingChoice: "正在应用共享设置选项..."
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "存档",
            title: "会议历史",
            subtitle: "浏览保存的会话、重新打开记录详细信息、导出记录以及管理本地存储，而无需离开扩展程序。",
            openSettings: "打开设置",
            searchLabel: "搜索会话",
            searchPlaceholder: "搜索标题、会议 ID、演讲者、说明文字或翻译...",
            clearSearch: "清除搜索",
            sortLabel: "排序",
            providerFilterLabel: "按提供商过滤",
            statusFilterLabel: "按状态过滤",
            resetFilters: "重置过滤器",
            resultCountOne: "{count} 会议",
            resultCountOther: "{count} 会议",
            resultCountFiltered: "{filtered} 次会议（共 {total} 次）",
            translatedCaptionCountOne: "{count} 翻译后的标题存储在您的存档中。",
            translatedCaptionCountOther: "{count} 翻译后的字幕存储在您的存档中。",
            archiveSnapshotTitle: "存档快照",
            archiveSnapshotSessions: "会议",
            archiveSnapshotCurrentView: "当前视图",
            archiveSnapshotProviderFocus: "供应商焦点",
            archiveSnapshotStarFilter: "星形滤镜",
            archiveSnapshotUrlHint: "搜索状态、过滤器、排序和当前打开的会话都会反映在页面 URL 中，因此刷新和导航感觉是可预测的。",
            storageFullTitle: "本地存储即将满",
            storageFullDescription: "您的存档正在使用 {percentage}% 的本地扩展配额。在存储成为限制之前，查看较旧的会话或从“设置”中导出重要记录。",
            reviewOldestSessions: "查看最旧的会话",
            loadingTitle: "加载会议历史记录",
            loadingDescription: "获取已保存的会话、存储状态和摘要作业元数据。",
            detailLoadingTitle: "正在加载会话详细信息",
            detailLoadingDescription: "准备本次会议的完整记录、元数据、摘要和工作状态。",
            emptyInitialTitle: "还没有会议记录",
            emptyInitialDescription: "扩展程序在支持的浏览器会议中捕获字幕后，会议会话会自动显示在此处。一旦您加入通话并且字幕开始流动，存档就会开始自行构建。",
            emptyFilteredTitle: "没有会议符合此视图",
            emptyFilteredDescription: "当前搜索、提供程序过滤器或排序视图与任何已保存的会话不匹配。重置当前视图或查看最旧的会话以继续浏览。",
            deleteSessionTitle: "删除此会议会话吗？",
            deleteSessionDescription: "这将从本地历史记录中删除“{title}”。此操作无法撤消。",
            deleteSessionConfirm: "删除会话"
        },
        dependency: {
            title: "OpenAI 需要注意",
            actionRequired: "需要采取行动",
            needsVerification: "需要验证",
            impact: "{message} 在服务再次准备就绪之前，摘要生成、保存的字幕翻译和辅助审阅将保持不可用。"
        },
        filters: {
            providerAll: "所有提供商",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams 网页",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "最新的优先",
            sortOldest: "最老的在前",
            starAll: "���有会议",
            starStarred: "仅加星标",
            activeQuery: "查询：“{query}”",
            activeViewingOldest: "首先查看最旧的会议"
        },
        storageIndicator: {
            usage: "{used} 共 {quota}",
            highUsage: "使用率高",
            reviewSoon: "即将审核",
            healthy: "健康"
        },
        confirmDialog: {
            closeDialog: "关闭对话框",
            confirmAction: "确认动作"
        },
        sessionList: {
            today: "今天",
            yesterday: "昨天",
            justNow: "刚才",
            inProgress: "进行中",
            noPreview: "此会话尚无可用的捕获字幕或会议聊天消息。",
            removeStar: "删除星星",
            starSession: "明星专场",
            openDetails: "打开详情",
            deleteSession: "删除会话",
            generatingSummary: "生成摘要",
            starred: "已加星标",
            captionCountOne: "{count} 标题",
            captionCountOther: "{count} 字幕",
            translatedOriginalOnly: "仅限原创",
            translatedCount: "{count} 已翻译",
            chatCountOne: "{count} 聊天",
            chatCountOther: "{count} 聊天",
            directCall: "直接致电",
            hideIdentifiers: "隐藏标识符",
            showIdentifiers: "显示标识符",
            loadingMore: "正在加载更多会议..."
        },
        detail: {
            backToHistory: "回到历史",
            reviewDescription: "查看本次会议的捕获记录、保存的翻译、提取范围和 AI 摘要。",
            inProgress: "进行中",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}m",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}m {seconds}s"
            },
            actions: {
                saveTitle: "保存标题",
                cancelTitleEditing: "取消标题编辑",
                renameSession: "重命名会话",
                retry: "重试"
            },
            exportMenu: {
                open: "打开导出选项",
                close: "关闭导出选项",
                title: "导出成绩单",
                description: "选择是否应将保存的翻译和保存的摘要包含在 Markdown 导出中。",
                includeTranslationsLabel: "包括保存的翻译",
                includeTranslationsAvailable: "保存的翻译将包含在导出文件中。",
                includeTranslationsUnavailable: "此会话尚无可用的已保存翻译。",
                includeSummariesLabel: "包括保存的摘要",
                includeSummariesAvailable: "保存的会议摘要将附加到导出文件中。",
                includeSummariesUnavailable: "本次会议尚无已保存的会议摘要。",
                export: "下载Markdown"
            },
            metadataLabels: {
                provider: "提供者",
                callTitle: "调用标题",
                meetingTitle: "会议标题",
                meetingUrl: "会议网址",
                started: "开始",
                ended: "结束",
                status: "状态",
                primaryId: "主要 ID",
                meetingCode: "会议代码",
                meetingId: "会议ID",
                conferenceId: "会议ID",
                meetingNumber: "会议号码",
                threadId: "线程ID",
                callType: "通话类型"
            },
            status: {
                ended: "结束",
                live: "直播"
            },
            sections: {
                metadata: {
                    title: "会议元数据",
                    description: "查看此已保存会话的会议身份、时间和存储的标识符。",
                    expand: "显示元数据",
                    collapse: "隐藏元数据"
                },
                continuations: {
                    title: "会话延续",
                    description: "检查每次重新加入以及同一会话恢复之前所花费的总时间。",
                    expand: "显示续集",
                    collapse: "隐藏延续"
                },
                extraction: {
                    title: "提取报告",
                    description: "检查已保存存档的转录覆盖率、说话者提取和完整性指纹。",
                    expand: "显示提取报告",
                    collapse: "隐藏提取报告"
                },
                summary: {
                    title: "会议纪要",
                    description: "生成或查看已保存的此会议资料和语言的 AI 摘要。",
                    expand: "显示摘要",
                    collapse: "隐藏摘要"
                },
                transcript: {
                    title: "成绩单",
                    description: "按时间线顺序查看保存的字幕、会议聊天、翻译和助理输出。"
                }
            },
            stats: {
                capturedCaptions: "捕获的字幕",
                translatedCaptions: "翻译字幕",
                duration: "持续时间",
                meetingChatMessages: "会议聊天消息",
                rejoins: "重新加入",
                totalAwayTime: "总离开时间",
                lastRejoin: "最后重新加入",
                canonicalEvents: "典型事件",
                uniqueSpeakers: "独特的扬声器",
                metadataCoverage: "元数据覆盖范围",
                providerIds: "提供商 ID"
            },
            rejoin: {
                label: "重新加入 {index}",
                awayFor: "离开{gap}",
                leftMeeting: "离开会议",
                returnedToMeeting: "返回会议"
            },
            extraction: {
                eventLogFingerprint: "事件日志指纹",
                searchFingerprint: "搜索指纹",
                summaryFingerprint: "摘要指纹",
                timelineRange: "时间线范围",
                lastEvent: "最后活动",
                noEvents: "没有活动",
                coverageBreakdown: "覆盖范围细分",
                sessionOffsets: "会话偏移量",
                translatedEvents: "翻译事件",
                finalCaptionEvents: "最终字幕事件",
                speakers: "扬声器",
                noSpeakers: "未检测到扬声器。",
                warnings: "警告"
            },
            summaryJob: {
                states: {
                    preflighting: "准备总结",
                    extracting: "分析转录本",
                    merging: "合并证据",
                    synthesizing: "写作总结",
                    continuing: "持续总结",
                    reconciling: "协调输出",
                    completed: "总结已准备好",
                    failed: "摘要失败",
                    cancelled: "摘要已取消",
                    default: "准备总结"
                },
                progress: {
                    ready: "准备好",
                    preparing: "准备证据",
                    step: "第 {current} 步（共 {total}）",
                    mergingEvidence: "合并证据",
                    preparingFinal: "准备最终总结",
                    continuation: "{total} 的延续 {current}",
                    continuing: "持续一代",
                    finalChecks: "运行最终检查"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI 不可用",
                unavailable: "摘要生成不可用",
                generating: "生成摘要",
                generateAnother: "生成另一个摘要",
                generate: "生成会议摘要",
                generateWithProfile: "使用 {profile} 创建或刷新已保存的会议摘要。",
                selectMeetingType: "在生成摘要之前选择会议配置文件和输出语言。",
                generateAnotherAction: "生成另一个 {profile} 摘要",
                generateAction: "生成 {profile} 摘要",
                genericProfile: "选定的个人资料",
                inProgress: "摘要生成仍在进行中。",
                noSummaryYet: "{language} 中尚未保存 {profile} 摘要。",
                noSummaryHint: "立即生成一个或切换会议配置文件或语言以查看另一个保存的版本。",
                latestSaved: "最新保存的摘要：{language} 中的 {profile}。",
                evidenceChunks: "{count} 证据块",
                continuations: "{count} 延续",
                reconciled: "和解了",
                executionStrategy: {
                    singleShot: "单发",
                    structuredSingleShot: "结构化单镜头",
                    multiStage: "多级"
                },
                version: {
                    latest: "最新 · {time}",
                    automatic: "自动",
                    manual: "手册",
                    auto: "汽车",
                    alt: "替代简介",
                    session: "会议简介",
                    default: "默认配置文件",
                    sessionProfile: "会话配置文件：{name}",
                    unknownProfile: "个人资料未知",
                    generatedWithAnotherProfile: "使用另一个配置文件生成",
                    generatedAt: "生成 {time}"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "保存的字幕翻译不可用",
                translatingAllCaptions: "翻译所有字幕",
                translateAllCaptions: "翻译所有字幕",
                batchTranslateSubtitle: "为 {language} 中的每个字幕创建保存的翻译。",
                translateAllCaptionsTo: "将所有字幕翻译为 {language}",
                emptyTitle: "没有文字记录或聊天项目",
                emptyDescription: "此会话尚未保存任何标题或会议聊天消息。",
                meetingChat: "会议聊天",
                translationAvailable: "翻译已保存",
                message: "留言",
                caption: "标题",
                translation: "翻译",
                noChatTranslation: "尚未保存此聊天消息的翻译。",
                noCaptionTranslation: "尚未保存此标题的翻译。",
                translatingChatMessage: "翻译聊天消息",
                translatingCaption: "翻译标题",
                translateChatMessage: "翻译聊天消息",
                translateCaption: "翻译标题",
                translateThisItem: "将此 {item} 翻译为 {language}",
                aiAssistant: "人工智能助手",
                triggeredByChat: "由该聊天消息触发",
                triggeredByCaption: "被这个标题触发"
            },
            export: {
                sessionDetailsHeading: "会议详情",
                titleLabel: "标题",
                providerLabel: "提供者",
                startedLabel: "开始",
                primaryIdLabel: "主要 ID",
                endedLabel: "结束",
                durationLabel: "持续时间",
                statusLabel: "状态",
                capturedChatMessagesLabel: "捕��的聊天消息",
                savedTranslationsLabel: "保存的翻译",
                totalAwayBeforeRejoinsLabel: "重新加入前的总离开时间",
                savedSummariesHeading: "保存的摘要",
                generatedLabel: "生成",
                modelLabel: "型号",
                summaryEffortLabel: "总结努力",
                executionStrategyLabel: "执行策略",
                evidenceChunksLabel: "证据块",
                continuationsLabel: "延续",
                reconciledLabel: "和解了",
                coveredCaptionsLabel: "覆盖字幕",
                yes: "是的",
                sessionContinuationsHeading: "会话延续",
                leftAtLabel: "离开于",
                rejoinedAtLabel: "重新加入于",
                awayForLabel: "离开为",
                sessionResumeHeading: "会话 {index} 在 {gap} 之后于 {time} 恢复"
            }
        },
        runtime: {
            settingsLoadFailed: "无法加载扩展设置。",
            loadHistoryFailed: "无法加载会议历史记录。",
            loadSessionDetailFailed: "无法加载会议会话详细信息。",
            sessionDeleted: "会话已删除。",
            sessionDeleteFailed: "删除会话失败。",
            titleUpdated: "标题已更新。",
            titleUpdateFailed: "无法更新标题。",
            starUpdateFailed: "更新星星失败。",
            sessionNotFound: "未找到会议会话。",
            chatMessageNotFound: "找不到聊天消息。",
            captionNotFound: "未找到字幕行。",
            translationFailed: "翻译失败。",
            captionTranslated: "标题已翻译为 {language}。",
            chatTranslated: "聊天消息已翻译为 {language}��",
            captionTranslateFailed: "无法翻译标题。",
            chatTranslateFailed: "无法翻译聊天消息。",
            analyzingTranscript: "分析转录本",
            noSummarySource: "没有可用于摘要的文字记录或会议聊天内容。",
            summaryGenerationFailed: "摘要生成失败。",
            summaryGenerated: "在 {language} 中生成摘要。",
            summaryCancelFailed: "无法取消摘要生成。",
            batchTranslationFailed: "无法翻译所有字幕。",
            allCaptionsAlreadyTranslated: "所有字幕均已具有 {language} 翻译。",
            batchTranslatedOne: "{count} 标题已翻译为 {language}{suffix}。",
            batchTranslatedOther: "{count} 字幕已翻译为 {language}{suffix}。",
            batchSkippedSuffix: ", {count} 已跳过",
            errorOutdated: "{fallback} 详细信息：扩展运行时已过期。重新加载扩展并重试。",
            errorNoDetails: "{fallback} 详细信息：未返回其他错误详细信息。",
            errorModelStopped: "{fallback} 详细信息：模型在摘要完成之前停止。该应用程序现在会自动重试，但该响应仍然无法完全恢复。尝试重新生成或使用具有更大输出预算的模型。",
            errorNoProviderDetails: "{fallback} 详细信息：未返回其他提供者详细信息。",
            errorWithDetails: "{fallback} 详细信息：{details}"
        }
    },
    content: {
        copyFeedback: "复制了！",
        timeline: {
            meetingChat: "会议聊天"
        },
        translation: {
            errorFallback: "错误",
            requestFailed: "翻译失败",
            retryAction: "重试翻译"
        },
        empty: {
            waitingForCaptionsTitle: "等待字幕...",
            waitingForCaptionsBody: "在会议中启用字幕以开始捕获文本",
            waitingForCaptionsGoogleMeet: "打开 Google Meet 中的字幕以开始捕获文本",
            waitingForCaptionsTeams: "打开更多 > 语言和语音 > 显示实时字幕以开始捕获文本",
            waitingForCaptionsZoom: "打开“更多”>“字幕”>“显示字幕”以开始捕获文本",
            capturePendingTitle: "捕捉正在等你",
            capturePendingBody: "回答启动提示以允许该会议开始捕获。",
            captureStartingTitle: "开始捕捉",
            captureStartingBody: "现在正在准备会议并启动观察员。",
            captureDismissedTitle: "捕捉功能关闭",
            captureDismissedBody: "该会议已从启动提示中取消，并将保持关闭状态。",
            sessionEndedTitle: "会议结束",
            sessionEndedBody: "该会议在此页面上不再有效。",
            waitingToJoinTitle: "等待加入会议",
            waitingToJoinBody: "加入会议以启动会话计时器并捕获流程。",
            enablingCaptionsTitle: "启用实时字幕",
            enablingCaptionsBody: "CaptionArc 现在正在尝试为本次会议打开字幕。",
            readyTitle: "捕捉已准备就绪",
            readyBody: "开始讲话，随着会议的继续，字幕行将出现在此处。",
            segmentEmptyTitle: "没有转录或聊天条目",
            segmentEmptyBody: "此会话未捕获任何字幕或会议聊天消息。",
            close: "关闭"
        },
        sessionSeparator: {
            title: "会话 {index}",
            detail: "重新加入 {time} · 离开 {gap}",
            ariaLabel: "会话 {index} 恢复"
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "人工智能需要关注",
                finishOpenAiSetup: "完成 OpenAI 设置",
                openAiUnavailable: "OpenAI 不可用",
                capturePendingTitle: "捕获待处理",
                waitingForAnswer: "等待您的答复",
                startingCaptureTitle: "开始捕捉",
                preparingMeeting: "准备这次会议",
                captureSkippedTitle: "捕获已跳过",
                meetingStaysOff: "本次会议暂停",
                sessionEndedTitle: "会议结束",
                rejoinToContinue: "重新加入以继续或重新启动",
                waitingToJoinTitle: "等待加入",
                sessionStartsAfterJoin: "加入后会话开始",
                enablingCaptionsTitle: "启用字幕",
                tryingLiveCaptions: "尝试打开实时字幕",
                setupRequiredTitle: "需要设置",
                turnOnMeetingCaptions: "打开会议字幕",
                translationIssueTitle: "翻译问题",
                retryAvailable: "可以重试",
                translatingLiveTitle: "现场翻译",
                liveTranslationTitle: "实时翻译",
                capturingLiveTitle: "实时捕捉",
                originalCaptionsOnly: "仅原始字幕",
                readyToCaptureTitle: "准备捕捉",
                waitingForSpeech: "等待发言",
                waitingForCaptionsTitle: "等待字幕"
            },
            main: {
                captureOnHoldTitle: "捕捉暂停",
                waitingForAnswer: "等待您的答复",
                startingCaptureTitle: "开始捕捉",
                preparingMeeting: "准备这次会议",
                captureSkippedTitle: "捕获已跳过",
                meetingStaysOff: "本次会议暂停",
                sessionEndedTitle: "会议结束",
                rejoinToContinue: "重新加入以继续或重新启动",
                waitingToJoinTitle: "等待加入",
                meetingOverlay: "会议叠加",
                enablingLiveCaptionsTitle: "启用实时字幕",
                preparingCapture: "准备捕捉",
                liveCaptureTitle: "实时捕捉"
            },
            profileControl: {
                defaultBadge: "默认"
            },
            translationToggle: {
                label: "汽车"
            },
            translationDock: {
                eyebrow: "实时翻译",
                consent: {
                    title: "捕获需要确认",
                    body: "批准启动提示以开始捕获此会议。",
                    badge: "等待"
                },
                starting: {
                    title: "开始捕捉",
                    body: "现在正在准备会话和观察者管道。",
                    badge: "开始"
                },
                dismissed: {
                    title: "捕捉功能关闭",
                    body: "这次会议已从启动提示中取消。",
                    badge: "关闭"
                },
                setup: {
                    title: "需要 OpenAI 设置",
                    body: "在“设置”中完成 OpenAI 设置以启用实时翻译。",
                    badge: "设置"
                },
                unavailable: {
                    title: "OpenAI 不可用",
                    body: "在恢复实时翻译之前，请检查“设置”中的 OpenAI 设置。",
                    badge: "问题"
                },
                off: {
                    title: "翻译已关闭",
                    body: "目标：{language}。打开它进行实时输出。",
                    badge: "关闭"
                },
                error: {
                    title: "翻译需要注意",
                    body: "有些线路失败了。受影响的卡上可以重试。",
                    badge: "问题"
                },
                translating: {
                    title: "翻译为 {language}",
                    body: "新线路正在实时翻译。",
                    badge: "工作"
                },
                live: {
                    title: "实时翻译活跃",
                    body: "在 {language} 中渲染实时输出。"
                },
                ready: {
                    title: "翻译已武装起来",
                    body: "字幕已打开。新行将转换为 {language}。",
                    badge: "准备好"
                },
                waiting: {
                    title: "等待字幕",
                    body: "打开会议字幕即可开始翻译。",
                    badge: "等待"
                }
            },
            tooltips: {
                compactAiSetup: "在“设置”中完成 OpenAI 设置以恢复翻译、摘要和助理指导。",
                compactAiIssue: "{message} OpenAI 相关功能将保持暂停状态，直到问题得到解决。",
                translationOff: "关闭实时翻译",
                translationOn: "开启实时翻译",
                translationSetup: "在“设置”中完成 OpenAI 设置以启用实时翻译。",
                translationUnavailable: "实时翻译将暂停，直到 OpenAI 再次可用。",
                captureHelp: "捕获帮助",
                hideCaptureHelp: "隐藏捕获帮助",
                switchToCompactView: "切换到紧凑视图",
                expandOverlay: "展开覆盖",
                openProfilePicker: "打开会议资料选择器"
            }
        },
        captureGuide: {
            eyebrow: "捕捉设置",
            title: "捕获帮助",
            statusReady: "准备就绪后开始捕获",
            footer: "一旦实时字幕出现在此选项卡中，CaptionArc 将开始捕获。",
            stepsCount: "{count} 步骤",
            waitingTitle: "等待实时字幕",
            closeAriaLabel: "关闭捕捉指南",
            startsAutomatically: "自动启动",
            tooltipOpen: "捕获帮助",
            tooltipClose: "隐藏捕获帮助",
            providers: {
                googleMeet: {
                    title: "在 Google Meet 中启用捕获",
                    body: "一旦在此浏览器会议中打开 Google Meet 字幕，CaptionArc 即可开始。",
                    status: "自动启动",
                    footer: "一旦实时字幕出现在此选项卡中，CaptionArc 将自动开始捕获。",
                    troubleshooting: "如果您没有看到字幕控件，请检查会议或浏览器状态是否仍在加载。",
                    steps: {
                        openControls: {
                            title: "打开会议控件",
                            detail: "移动鼠标以显示底部会议工具栏。"
                        },
                        openCaptions: {
                            title: "打开字幕控件",
                            detail: "单击会议工具栏中的字幕或 CC 控件。"
                        },
                        turnOn: {
                            title: "打开字幕",
                            detail: "启用字幕后，CaptionArc 将开始自动捕获文本。"
                        }
                    }
                },
                microsoftTeams: {
                    title: "在 Microsoft Teams 中启用捕获",
                    body: "从 Teams 会议工具栏打开实时字幕后，CaptionArc 即可启动。",
                    status: "自动启动",
                    footer: "一旦实时字幕出现在此选项卡中，CaptionArc 将自动开始捕获。",
                    troubleshooting: "如果字幕不可用，组织者或管理策略可能会限制字幕控制。",
                    steps: {
                        openMore: {
                            title: "打开更多",
                            detail: "使用顶部会议工具栏并打开“更多”菜单。"
                        },
                        openLanguage: {
                            title: "开放语言和演讲",
                            detail: "在“更多”中，选择“语言和语音”。"
                        },
                        chooseCaptions: {
                            title: "选择显示实时字幕",
                            detail: "选择显示实时字幕，CaptionArc 将自动检测字幕窗口。"
                        }
                    }
                },
                zoomWeb: {
                    title: "在 Zoom Web App 中启用捕获",
                    body: "一旦在此浏览器会议中启用 Zoom Web App 字幕，CaptionArc 即可开始。",
                    status: "手动启用字幕",
                    footer: "一旦 Zoom 字幕出现在此选项卡中，CaptionArc 将开始捕获。",
                    troubleshooting: "某些 Zoom 会议可能更喜欢桌面应用程序或根据主持人设置限制字幕控制。",
                    steps: {
                        openControls: {
                            title: "打开会议控件",
                            detail: "使用 Zoom Web App 窗口底部的会议中工具栏。"
                        },
                        openMore: {
                            title: "打开更多",
                            detail: "从会议中工具栏打开更多菜单。"
                        },
                        openCaptions: {
                            title: "开放式字幕",
                            detail: "在“更多”内，打开“字幕”子菜单。"
                        },
                        chooseShow: {
                            title: "选择显示字幕",
                            detail: "选择“显示字幕”以使 Zoom 字幕表面在此选项卡中可用。"
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "会议环节",
            turns: "{count} 圈",
            chat: "{count} 聊天",
            chatCaptureTooltip: "会议聊天捕获已启用。新支持的会议聊天消息将随此会话保存。",
            autoSummarySetupTooltip: "自动摘要将保持暂停状态，直到 OpenAI 设置完成。",
            autoSummaryUnavailableTooltip: "自动摘要将暂停，直到 OpenAI 再次可用。",
            autoSummaryReadyTooltip: "{profile} 将在会议结束时自动运行。",
            aiAlertSetupTooltip: "在“设置”中完成 OpenAI 设置以恢复翻译、摘要和助理指导。",
            aiAlertUnavailableTooltip: "{message} OpenAI ��关会议工具将保持暂停状态，直到问题得到解决。",
            liveState: {
                awaitingReply: {
                    label: "等待回复",
                    tooltip: "Capture 正在等待您对此会议的启动决定。"
                },
                starting: {
                    label: "开始",
                    tooltip: "捕获已获得批准，会议正在准备中。"
                },
                off: {
                    label: "关闭",
                    tooltip: "本次会议的捕获已从启动提示中取消。"
                },
                ended: {
                    label: "结束",
                    tooltip: "本次会议已经结束。重新加入以继续上一会话或开始新会话。"
                },
                lobby: {
                    label: "大堂",
                    tooltip: "加入会议以启动会话计时器并捕获流程。"
                },
                live: {
                    label: "直播",
                    tooltip: "目前正在本次会议中捕获字幕。"
                },
                armed: {
                    label: "武装",
                    tooltip: "字幕已启用，叠加层正在等待下一行。"
                },
                waiting: {
                    label: "等待",
                    tooltip: "会议字幕尚未启用。"
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "默认为标准动作",
            timeoutHint: "默认为 {action}",
            captureConsent: {
                title: "启用该会议的捕获吗？",
                body: "如果您跳过此步骤，则本次会议访问的捕获功能将保持关闭状态。",
                ariaLabel: "捕获启动确认",
                secondaryAction: "现在不行",
                primaryAction: "启用"
            },
            sessionContinuation: {
                title: "继续之前的会话吗？",
                body: "您离开后不久就重新加入了同一个会议。无响应将启动新会话。",
                ariaLabel: "会话继续确认",
                secondaryAction: "新会话",
                primaryAction: "继续"
            },
            sessionEnded: {
                title: "会议结束",
                body: "留在此处查看捕获的项目，或关闭叠加层。没有回应将其关闭。",
                ariaLabel: "会话结束确认",
                secondaryAction: "关闭",
                primaryAction: "留在这里"
            }
        },
        assistant: {
            statusLabel: {
                queued: "排队",
                working: "工作",
                ready: "准备好",
                paused: "已暂停",
                issue: "问题",
                unavailable: "不可用",
                watching: "观看"
            },
            statusDescription: {
                queued: "发现了一个有用的时刻。",
                working: "生成实时指导。",
                latestReady: "最新的辅助指导已准备就绪。",
                ready: "助理已准备好迎接下一刻。",
                paused: "助理在本次会议中缺席。",
                issue: "助理需要注意。",
                unavailable: "OpenAI 目前不可用。",
                watching: "等待一个有用的时刻。"
            },
            emptyState: {
                setupTitle: "完成 OpenAI 设置以使用助手",
                setupBody: "OpenAI 设置不完整，因此实时指导尚无法运行。",
                unavailableTitle: "助理暂时无法使用",
                unavailableBody: "{message} 助理将在 OpenAI 恢复健康后恢复。",
                watchingTitle: "助理正在观看本次会议",
                watchingBody: "当出现有用的问题、请求或风险时，此处将显示实时指导。",
                offTitle: "助理在本次会议中已关闭",
                offBody: "每当您想要恢复实时指导时，请重新打开它。",
                errorTitle: "助理需要关注",
                errorBody: "一代问题中断了实时指导。下一个有效时刻将重试。",
                preparingTitle: "助理正在准备指导",
                preparingBody: "检测到一个有用的时刻，第一个实时指导现在正在排队。",
                workingTitle: "助理正在工作",
                workingBody: "正在为当前会议时刻生成实时指导。"
            },
            footer: {
                setup: "完成 OpenAI 设置",
                unavailable: "OpenAI 不可用",
                sessionStartsAfterJoin: "加入后会话开始",
                workingLiveGuidance: "致力于实时指导",
                turnedOffForSession: "本次会话已关闭",
                generationNeedsAttention: "一代人需要关注",
                latestGuidanceReady: "最新指南已准备就绪",
                watchingSession: "观看本次会议",
                notes: "{count} 注释",
                liveCount: "{count} 直播",
                aiAlertSetup: "完成设置中的 OpenAI 设置后，助理指导才能运行。",
                aiAlertUnavailable: "{message} 助理指导保持暂停状态，直到 OpenAI 再次可用。"
            },
            source: {
                meetingChat: "会议聊天",
                caption: "标题",
                unknownSpeaker: "未知"
            },
            pendingReply: "助理正在准备回复。",
            ui: {
                toggleLiveLabel: "直播",
                readyTitle: "助理已准备就绪",
                watchingSession: "观看本次会议",
                watching: "观看",
                waitingForMoment: "等待一个有用的时刻。",
                headerTitle: "人工智能助手",
                footerTitle: "人工智能助手",
                panelAriaLabel: "AI助手实时指导",
                openSettings: "打开助手设置",
                setupBeforeEnable: "打开助手之前完成 OpenAI 设置",
                unavailableUntilOpenAi: "在 OpenAI 再次可用之前，助手不可用",
                turnOffForSession: "关闭本次会话的助手",
                turnOnForSession: "为此会话打开助手",
                openPanel: "打开助手面板",
                collapsePanel: "折叠助手面板",
                resizePanel: "调整助手面板大小"
            }
        }
    },
    popup: {
        header: {
            devBadge: "开发者",
            openMeetingHistory: "打开会议历史记录",
            openSettings: "打开设置"
        },
        setup: {
            verificationNotTested: "未测试",
            notConfigured: "OpenAI 未配置",
            setupRequired: {
                label: "需要设置",
                description: "添加您的 OpenAI API 密钥并选择一个型号。"
            },
            needsAttention: {
                label: "需要注意",
                description: "查看“设置”中的 OpenAI 设置。"
            },
            ready: {
                label: "准备好",
                description: "OpenAI、模型和目标语言已准备好实时输出。"
            },
            verifySetup: {
                label: "验证设置",
                description: "在“设置”中运行一项连接测试以确认 OpenAI 设置。"
            }
        },
        overlay: {
            badge: "叠加",
            title: "实时可见性",
            switchAriaLabel: "切换实时叠加可见性",
            switchDisabledTitle: "在“设置”中启用捕获启动以使用实时可见性。",
            state: {
                inactive: "不活跃",
                visible: "可见",
                hidden: "隐藏"
            },
            mode: {
                captureStartupOff: "捕获启动已关闭",
                available: "叠加保持可用",
                hidden: "叠加层保持隐藏"
            },
            helper: {
                captureStartupOff: "在“设置”中将“启动”设置为“询问”或“始终”后，实时可见性变得可用。",
                instantToggle: "即时切换开放会议。每个会议应用程序都会记住位置、大小和紧凑状态。"
            }
        },
        pulse: {
            title: "工作空间脉搏"
        },
        rows: {
            live: {
                capturing: {
                    label: "实时捕捉",
                    detail: "{platform} 正在此选项卡中积极监听。",
                    badge: "直播"
                },
                lobby: {
                    label: "加入时准备就绪",
                    detail: "{platform} 已开放并在大厅等候。",
                    badge: "大堂"
                },
                startupOff: {
                    label: "捕获启动已关闭",
                    detail: "当您想再次现场收听时，将“启动”重新设置为“询问”或“始终”。",
                    badge: "关闭"
                },
                idle: {
                    label: "没有现场会议",
                    detail: "打开支持的会议选项卡，CaptionArc 将在此处唤醒。",
                    badge: "空闲"
                }
            },
            summary: {
                busy: {
                    label: "AI摘要正在发挥作用",
                    detail: "会议回顾正在后台进行。",
                    badge: "忙"
                },
                failed: {
                    label: "总结需要注意的地方",
                    detail: "最后的总结没有干净利落地完成。",
                    badge: "重试"
                },
                automatic: {
                    label: "自动摘要已启用",
                    detail: "每次会议结束后，{profileName} 将自行开始回顾。",
                    badge: "汽车"
                },
                manual: {
                    label: "手动汇总模式",
                    detail: "现在没有任何东西在排队。摘要仅在您要求时才会运行。",
                    badge: "手册"
                },
                defaultProfileName: "默认配置文件"
            },
            archive: {
                empty: {
                    label: "存档仍然是空的",
                    detail: "一旦捕获运行，您保存的会议和摘要将开始收集在这里。",
                    badge: "新"
                },
                ready: {
                    label: "{count} 会议已保存",
                    detail: "使用了 {used}。 {updated}。"
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "尚未保存任何会议",
            updatedJustNow: "刚刚更新了",
            updatedMinutesAgo: "{minutes} 分钟前更新",
            updatedHoursAgo: "{hours}h 前更新",
            updatedDaysAgo: "{days}d 前更新"
        },
        meta: {
            aiService: "人工智能服务",
            model: "型号",
            target: "目标",
            startup: "启动",
            modelNotSelected: "未选择",
            pendingIndicator: "OpenAI 尚未得到验证。",
            startupValues: {
                off: "关闭",
                always: "总是",
                ask: "询问"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
