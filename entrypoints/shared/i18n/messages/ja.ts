import type { UiMessageCatalog } from "../types";

export const jaMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "クイックアクセス",
        actions: {
            cancel: "キャンセル",
            clear: "クリア",
            close: "閉じる",
            collapse: "崩壊する",
            confirmDelete: "削除の確認",
            delete: "削除",
            expand: "拡大する",
            hide: "隠す",
            loading: "読み込み中...",
            open: "開く",
            show: "表示する",
            continue: "続行",
            working: "働いています..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "まだコンテンツはありません。",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "会議"
        },
        theme: {
            group: "テーマ",
            system: "システムテーマを使用する",
            light: "ライトテーマを使用する",
            dark: "ダークテーマを使用する"
        },
        optional: "(オプション)",
        helpPopover: {
            eyebrow: "項目ガイド",
            moreAbout: "{label} の詳細",
            close: "ヘルプを閉じる"
        },
        uiLanguage: {
            label: "インターフェース言語",
            description: "ポップアップ、設定、履歴、会議中の UI で使用される言語を選択します。",
            system: "ブラウザ言語を使用する",
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
            privacyPolicy: "プライバシーポリシー",
            termsOfService: "利用規約"
        },
        legal: {
            version: "バージョン {version}",
            copyright: "著作権 © {year} CaptionArc"
        },
        notifications: {
            summaryReady: {
                title: "{title} の要約が準備できました",
                message: "クリックすると会議履歴で完全な要約を開きます。"
            }
        },
        firstRunTerms: {
            eyebrow: "初回セットアップ",
            title: "続行するには利用規約を確認して同意してください",
            body: "セットアップを続行する前に、CaptionArc では現在の利用規約への一度限りの同意が必要です。",
            version: "規約バージョン {version}",
            reviewPrompt: "同意する前に、現在の利用規約とプライバシーポリシーを確認してください。",
            acceptanceNote: "続行すると、現在の利用規約を確認し、プライバシーポリシーを理解したことを確認したものとみなされます。",
            declinedBody: "現在の利用規約が拒否されたため、このデバイスでは CaptionArc は非アクティブのままです。",
            declinedPrompt: "続行する準備ができたら、現在の規約をもう一度確認してください。",
            declinedNote: "このデバイスで現在の利用規約が承認されるまで、CaptionArc はブロックされたままです。",
            accept: "規約に同意"
        },
        legalPages: {
            shared: {
                eyebrow: "法務",
                loadingDescription: "この拡張機能の最新の公開済み法務文書を読み込んでいます。"
            },
            privacyPolicy: {
                title: "プライバシーポリシー",
                subtitle: "リポジトリで公開されているプライバシーポリシーと同じ内容を製品内で表示します。",
                sourceNote: "このページは、拡張機能内のコピーと公開ドキュメントを一致させるため、リポジトリで公開しているものと同じ markdown ソースを描画します。",
                loadingTitle: "プライバシーポリシーを読み込み中"
            },
            termsOfService: {
                title: "利用規約",
                subtitle: "CaptionArc の現在の条件、責任、および法的な境界を確認してください。",
                acceptEyebrow: "初回セットアップ",
                acceptSubtitle: "このデバイスで同意する前に、現在の規約を最後までスクロールしてください。",
                acceptPrompt: "同意を有効にするには現在の利用規約を読んでください。",
                scrollRequired: "同意を有効にするには文書の最後までスクロールしてください。",
                scrollReady: "規約の最後まで到達しました。これで同意してこのページを閉じることができます。",
                accept: "同意して閉じる",
                decline: "同意せず閉じる",
                declineNote: "これらの規約に同意しない場合は、このページを閉じて CaptionArc を使用しないでください。",
                sourceNote: "このページは、拡張機能内のコピーと公開ドキュメントを一致させるため、リポジトリで公開しているものと同じ markdown ソースを描画します。",
                alreadyAcceptedTitle: "現在の規約はすでに同意済みです",
                alreadyAcceptedBody: "このデバイスには、現在の規約バージョンへの同意記録がすでにあります。",
                declinedTitle: "このデバイスでは現在の規約が拒否されました",
                declinedBody: "このデバイスで現在の規約バージョンが承認されるまで、CaptionArc はブロックされたままです。",
                version: "バージョン {version}",
                loadingTitle: "利用規約を読み込み中"
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
            eyebrow: "設定",
            title: "CaptionArc 設定",
            subtitle: "共有 AI サービス、会議プロファイル、ライブ翻訳動作、クラウド保護、および 1 つのコンパクトなコントロー��� サーフェスからのリカバリを構成します。",
            openMeetingHistory: "会議履歴"
        },
        navigation: {
            title: "設定マップ",
            description: "コンソール内でセクションごとに移動します。",
            quickJump: "クイックジャンプ"
        },
        loading: "読み込み中...",
        snapshot: {
            aiEngine: "AIエンジン",
            serviceStatus: "サービス状況",
            model: "モデル",
            primaryProfile: "プライマリプロファイル",
            theme: "テーマ",
            cloudVault: "クラウド保管庫",
            meetingUi: "会議UI",
            none: "なし",
            system: "システム",
            light: "ライト",
            dark: "暗い",
            providerOne: "{count} プロバイダー",
            providerOther: "{count} プロバイダー",
            visibleClickThrough: "可視化・クリックスルー",
            visibleInteractive: "可視化・インタラクティブ",
            hidden: "隠された"
        },
        sections: {
            workspace: {
                eyebrow: "ワークスペース",
                title: "経験とデフォルト",
                description: "共有のデフォルトを一度設定すると、視覚的な動作、会議の流れ、アーカイブ ルールが明確に分離されます。",
                shortLabel: "ワークスペース",
                mapHint: "外観、会議の流れ、アーカイブのデフォルト"
            },
            openAiService: {
                eyebrow: "OpenAI サービス",
                title: "共有AIサービス",
                shortLabel: "OpenAI",
                mapHint: "翻訳、要約、アシス���ント",
                description: "ライブ翻訳、会議の概要、会議中のアシスタントによって使用される共有 OpenAI サービスを管理します。"
            },
            translation: {
                eyebrow: "翻訳",
                title: "ライブ翻訳",
                shortLabel: "翻訳",
                mapHint: "ライブキャプションの動作と調整",
                description: "要約生成やアシスタントの動作を変更せずに、OpenAI がライブ キャプション翻訳を処理する方法を調整します。"
            },
            profiles: {
                eyebrow: "AIとの出会い",
                title: "会議のプロフィール",
                shortLabel: "プロフィール",
                mapHint: "正体、概要、そして助手",
                description: "会議プロファイルは 1 つの会議タイプを一度定義し、その ID を概要生成とライブ アシスタントに再利用します。"
            },
            cloudSync: {
                eyebrow: "クラウド同期",
                title: "パーソナルクラウドボルト",
                shortLabel: "クラウド同期",
                mapHint: "アーカイブ保護とプロバイダー",
                description: "Google Drive、OneDrive、またはその両方を接続して、1 つのローカルファースト アーカイブをデバイス全体で保護します。"
            },
            dataRecovery: {
                eyebrow: "回復",
                title: "データ復旧",
                shortLabel: "回復",
                mapHint: "暗号化されたバックアップとリセット",
                description: "クラウド同期は主要な継続パスです。暗号化されたアーカイブをフォールバック バックアップとして使用するか、クリーン リセットが必要な場合に保存されたアーカイブを削除します。"
            }
        },
        workspace: {
            appearance: {
                title: "外観",
                description: "固定テーマを選択するか、CaptionArc がシステムに自動的に従うようにします。"
            },
            uiLanguage: {
                title: "インターフェース言語",
                description: "ポップアップ、設定、会議履歴、会議中の UI に 1 つの言語を適用します。"
            },
            meetingFlow: {
                title: "会議の流れ",
                description: "CaptionArc がキャプチャを開始する方法、キャプションを支援する方法、および再参加した会議が同じセッションを継続するかどうかを決定する方法を制御します。"
            },
            captureStartup: {
                label: "キャプチャ起動",
                off: {
                    name: "キャプチャをオフにしておきます",
                    description: "サポートされている会議の会議中キャプチャ ボックスを初期化しないでください。"
                },
                ask: {
                    name: "会議ごとに質問する",
                    description: "キャプチャを開始する前に短い承認プロンプトを表示します。これがデフォルトです。"
                },
                always: {
                    name: "常にキャプチャを開始する",
                    description: "最初に質問することなく、すぐにキャプチャ フローを開始します。"
                }
            },
            captionActivation: {
                label: "キャプションの有効化",
                guided: {
                    name: "ガイド付き",
                    description: "現在の流れを維持します。 CaptionArc はインライン ヘルプを表示するので、自分でライブ キャプションをオンにすることができます。"
                },
                automatic: {
                    name: "可能な場合は自動で",
                    description: "参加後、CaptionArc は、会議アプリがライブ キャプションをサポートしている場合は自動的にライブ キャプションをオンにしようとします。それができない場合は、ガイド付きフローに戻ります。"
                }
            },
            sessionContinuation: {
                title: "セッション継続ウィンドウ",
                description: "セッションの最新アクティビティ（会議から退出した時刻を含む）の後、CaptionArc が同じセッションの継続をどれくらい提案するかを決めます。",
                windowLabel: "窓",
                off: "オフ",
                oneHour: "1時間",
                hours: "{count} 時間",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes} 分"
            },
            inMeetingSurfaces: {
                title: "ミーティング中のサーフェス",
                description: "ライブ ミーティング サーフェスが画面上に表示されているときの外観と動作を決定します。"
            },
            overlayOpacity: {
                title: "オーバーレイの不透明度",
                description: "値を低くすると、会議の下がより見やすくなります。",
                subtle: "微妙な",
                solid: "固体"
            },
            overlayClickThrough: {
                label: "クリックスルーモード",
                description: "ライブミーティングのサーフェスが表示されたままクリックを通過させます。"
            },
            meetingArchive: {
                title: "会議アーカイブ",
                description: "後のレビュー、エクスポート、概要の生成のためにどの会議データを保持するかを決定します。"
            },
            meetingArchiveRetention: {
        label: "アーカイブ保持期間",
        description:
          "CaptionArc が終了済みでスター未設定のセッションをローカルアーカイブから削除するまで、どれくらい保持するかを選択します。オフを選ぶと、すべての自動アーカイブ削除が無効になります。",
        off: "オフ",
        days: "{count}日",
        oneYear: "1年",
      },
      storeMeetingChat: {
                label: "ストアミーティングチャット",
                description: "サポートされている会議チャットを保存して、会議履歴、エクスポート、概要に表示できるようにします。"
            }
        },
        legalRisk: {
            shared: {
                eyebrow: "注意して使用",
                warningLabel: "法務およびプライバシー通知"
            },
            captureStartupAlways: {
                dialog: {
                    title: "常時キャプチャ開始は同意の保護を弱めます",
                    body: "このモードは会議ごとの承認確認を省略し、対応する会議を検出するとすぐにキャプチャを開始します。",
                    pointOne: "会議由来の内容を取得し保持してよいと確信できる会議でのみ使用してください。",
                    pointTwo: "有効にした機能によっては、保存された字幕やチャットが後で要約、ライブ支援、エクスポートに使われることがあります。",
                    pointThree: "通知、同意、職場ポリシー、プラットフォームポリシーなど、利用に適用される要件への対応責任は引き続きあなたにあります。",
                    confirm: "常時キャプチャ開始を有効にする"
                },
                warning: {
                    title: "常時キャプチャ開始が有効です",
                    body: "CaptionArc は会議ごとの承認手順を省略します。会議由来の内容を適法に取得し保持できる場合にのみ有効のままにしてください。"
                }
            },
            captionActivationAutomatic: {
                dialog: {
                    title: "自動字幕有効化は会議アプリを代わりに操作します",
                    body: "このモードは、対応する会議画面で可能な場合にライブ字幕を自動でオンにしようとします。",
                    pointOne: "自動有効化は、毎回あなたの手動操作なしで会議 UI を変更するため、ガイド付きモードよりも慎重な扱いが必要になる場合があります。",
                    pointTwo: "自動字幕有効化がポリシーと運用に適している環境でのみ維持してください。",
                    pointThree: "この自動化を利用できるのは、提供元のルールと会議での期待に照らして許容される場合に限られ、その判断責任はあなたにあります。",
                    confirm: "自動字幕有効化を有効にする"
                },
                warning: {
                    title: "自動字幕有効化が有効です",
                    body: "提供元が対応している場合、CaptionArc は字幕を自動でオンにしようとします。ポリシー上センシティブな会議では慎重に確認してください。"
                }
            },
            storeMeetingChat: {
                dialog: {
                    title: "会議チャットの保存はプライバシー感度を高める可能性があります",
                    body: "この設定を有効にすると、対応する会議チャットが保存された会議記録の一部となり、履歴、エクスポート、AI 支援の後続フローに表示されることがあります。",
                    pointOne: "会議チャットには、表示字幕だけよりも機微性や識別性の高い内容が含まれる場合があります。",
                    pointTwo: "これらの機能を使うと、保存されたチャットが後で要約、翻訳、アシスタントの文脈に含まれることがあります。",
                    pointThree: "その内容の保持が通知、同意、秘密保持の期待に合致する場合にのみチャット保存を有効にしてください。",
                    confirm: "会議チャット保存を有効にする"
                },
                warning: {
                    title: "会議チャット保存が有効です",
                    body: "対応する会議チャットは履歴、エクスポート、AI 支援の後続フローのために保持されています。この保持が適切な場合にのみ有効のままにしてください。"
                }
            }
        },
        openAiService: {
            title: "OpenAI サービス",
            sectionDescription: "ライブ翻訳、会議の概要、会議中のアシスタントによって使用される共有 OpenAI サービスを管理します。",
            sharedService: "シェアードサービス",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "1 つの共有 OpenAI サービスは、ライブ翻訳、会議の概要、会議中のアシスタントを強化します。",
            setupDescription: "AI を利用したワークフローに依存する前に、API キーを一度追加し、デフォルトの GPT モデルを選択してアクセスを確認します。",
            verificationLabel: "OpenAI 接続をテストする",
            verifyingLabel: "現在の OpenAI セットアップをテストしています",
            highlights: {
                translation: "ライブ翻訳",
                summaries: "会議の概要",
                assistant: "ライブアシスタント"
            },
            cards: {
                translationTitle: "翻訳",
                translationBody: "ライブキャプション",
                summariesTitle: "概要",
                summariesBody: "会議後の成果物",
                assistantTitle: "アシスタント",
                assistantBody: "ライブガイダンス"
            },
            state: {
                setupRequired: {
                    label: "セットアップが必要です",
                    description: "API キーを追加し、デフォルトの GPT モデルを確認します。",
                    impact: "AI を活用した機能は、OpenAI サービスが完全に構成されるまで利用できません。"
                },
                actionRequired: {
                    label: "アクションが必要です",
                    impact: "OpenAI サービスが再び動作するまで、AI を利用した機能は利用できない可能性があります。"
                },
                ready: {
                    label: "準備完了",
                    impact: "OpenAI は、翻訳、要約、ライブ ガイダンスに利用できます。"
                },
                checking: {
                    label: "チェック中",
                    impact: "接続チェック中です。その結果、製品の AI を活用したあらゆる領域が更新されます。"
                },
                needsVerification: {
                    label: "検証が必要です",
                    description: "接続チェックを 1 回実行して、現在のキーとモデルを確認します。",
                    impact: "設定は引き続き編集できますが、サービスが検証されるまで AI 出力は未確認として扱う必要があります。"
                }
            },
            banners: {
                needsAttention: "OpenAI には注意が必要です",
                finishSetup: "OpenAI セットアップを完了する",
                verifySetup: "OpenAI セットアップを確認する"
            },
            apiKeyInput: {
                label: "APIキー",
                provider: "OpenAI",
                storedLocally: "ローカルに保存",
                credential: "秘密の資格情報",
                show: "APIキーを表示",
                hide: "APIキーを非表示にする",
                helper: "このキーはこのデバイスに保存され、翻訳、要約、ライブ ガイダンスに使用されます。",
                guide: "OpenAI API キー ガイド"
            },
            modelLabel: "モデル"
        },
        models: {
            gpt5Mini: {
                description: "ライブ翻訳に最適なデフォルト: ノイズの多い字幕に対して高速で信頼性が高く、高品質です。",
                badge: "おすすめ"
            },
            gpt52: {
                description: "遅延やコストよりも翻訳の精度やニュアンスが重要な場合に最適です。",
                badge: "最高の品質"
            },
            gpt51: {
                description: "品質とスピードのバランスがとれた強力なオールラウンドモデル。"
            },
            gpt5: {
                description: "GPT-5.2 までは不要だが、Mini や Nano より強い汎用品質が欲しいときに使う主力 GPT-5 モデルです。",
                badge: "主力"
            },
            gpt5Nano: {
                description: "シンプルな出力品質で非常に高速な応答を実現する最小遅延オプション。",
                badge: "最速"
            },
            gpt41: {
                description: "実証済みの汎用翻訳モデルを希望する場合は、安定したレガシーの選択肢を選択します。",
                badge: "レガシー"
            },
            gpt41Mini: {
                description: "ワークロードが軽く、翻訳品質が中程度の低コストの GPT-4.1 バリアント。",
                badge: "ライター"
            },
            gpt41Nano: {
                description: "コストとレイテンシを最優先したい超軽量タスク向けの最小 GPT-4.1 オプションです。"
            },
        },
        help: {
          apiKey: `この端末で CaptionArc が使う OpenAI API キーを入力します。

- キーはこの端末だけに残り、同期やバックアップ出力には含まれません。
- 自分のアクセス方針と課金管理に合うキーを使ってください。
- 検証に失敗した場合は、キー状態、プロジェクト残高、モデル利用権限を確認してください。`,
          model: `ライブ翻訳、要約、アシスタント出力に使う OpenAI モデルを選びます。

- 軽いモデルは会議中の応答が速いことが多いです。
- 強いモデルは文章品質が高いことが多い一方で、遅く高価になる場合があります。
- 迷う場合は推奨デフォルトのままにしてください。

例: 会議中は速いモデルを使い、要約品質を優先したいときだけ強いモデルに切り替えます。`,
          uiLanguage: `この設定は CaptionArc の画面言語そのものを切り替えます。

- 設定画面、会議履歴、クイック画面、会議中 UI の文言に影響します。
- これだけではライブ翻訳や要約の出力言語は変わりません。
- CaptionArc に環境を自動追従させたいなら、ブラウザ/システム設定を使ってください。`,
          translationInstructions: `この指示はライブ翻訳のたびに送信されます。

- 短く具体的に書いてください。
- 用語、トーン、字幕の整え方のルールに使います。
- 長すぎる指示はライブ翻訳を遅くし、不安定にしやすいです。

例: \`製品名は英語のままにして、字幕らしい短い文を優先する。\``,
          captureStartupBehavior: `CaptionArc が対応会議を検出したときの動作を決めます。

- **確認する** はキャプチャ開始前に確認を出します。
- **常に開始** は追加確認なしでキャプチャを始めます。
- **オフ** は手動で有効にするまでキャプチャを待機させます。

安全寄りの標準にしたいなら **確認する** が適しています。`,
          captionActivationBehavior: `会議字幕をどう有効化するかを決めます。

- **ガイド付き** は最後の操作を自分で行います。
- **自動** は提供側 UI が許す場合に字幕を自動で有効化しようとします。
- 自動モードは会議 UI を代わりに操作するため、より慎重に扱う設定です。

明確な必要がない限り **ガイド付き** をおすすめします。`,
          sessionContinuationWindow: `同じ会議に再参加したとき、CaptionArc が同じセッションをどれくらい維持するかを決めます。

- 短い時間だと新しいセッションになりやすくなります。
- 長い時間だと関連する再参加を同じセッションにまとめやすくなります。
- \`0 分\` は再参加のたびに新しいセッションになる意味です。

例: \`120 分\` にすると、10:00 に終わった会議でも同じ会議に 12:00 までに戻れば同じセッションとして続けられます。`,
          overlayClickThrough: `この設定は、会議中のオーバーレイがマウス入力を受け取るか、そのまま下の会議画面に通すかを決めます。

- クリックをオーバーレイ越しに会議画面へ通したいときはオンにします。
- オーバーレイ上の CaptionArc コントロールを直接操作したいときはオフにします。
- クリック透過は読むだけの場面では便利ですが、操作を頻繁に変える場合は不便になりやすいです。`,
          meetingArchiveRetention: `ローカルアーカイブ内の終了済み・未スター付きセッションを自動で整理する期間を決めます。

- 短い期間は古い履歴を早く削除します。
- 長い期間は端末上により多くの履歴を残します。
- **オフ** は自動削除をすべて無効にします。

スター付きセッションは自動削除から保護されたままです。`,
          storeMeetingChat: `対応している会議チャットを保存済み会議レコードに含めるかを決めます。

- 有効にすると、チャットは履歴、エクスポート、要約、アシスタント文脈に含まれる可能性があります。
- チャットには表示字幕より機密性の高い名前、判断、リンクが入ることがあります。
- チャット保存が自分の方針と機密要件に合う場合だけ有効にしてください。`,
          meetingOutputLanguage: `要約や Meeting AI の応答など、会議出力の既定言語を決めます。

- これは UI 言語やライブ翻訳とは別です。
- ふだん最終出力を読みたい言語を選んでください。
- 必要なら後から出力言語を変えることもできます。`,
          profileName: `この名前は、設定画面や後続の AI ワークフローで会議プロファイルを識別するために使われます。

- プロファイル一覧で素早く見分けられるよう、短めに保ってください。
- 単発の会議名ではなく、会議の種類を表す名前にしてください。
- 良い名前にすると、このプロファイルを再利用すべき場面がすぐ分かります。

例: 顧客ヒアリング、週次チーム同期、取締役会アップデート。`,
          profileDescription: `この説明は、その会議プロファイルをいつ使うべきかを素早く思い出すための人向けの補足です。

- 会議の目的、参加者、定例のリズムを短く具体的に書いてください。
- 一目で正しいプロファイルを選べるよう、短く明確に保ってください。
- これはプロファイルの説明であり、長い AI 指示を書く場所ではありません。

例: プロダクト・デザイン・エンジニアリングのリードで行う週次横断レビュー。`,
          autoSummary: `会議終了時にこのプロファイルで自動要約を作るかどうかを決めます。

- ほぼ毎回要約が欲しい定例会議ならオンにします。
- 必要なときだけ要約したいならオフのままにします。
- 自動要約には有効な OpenAI 設定と保存済み会議データも必要です。`,
          summaryEffort: `このプロファイルの要約にどれだけ AI の作業量を使うかを決めます。

- 低いほど速く、安くなります。
- 高いほど長い会議や散らかった会議に向きます。
- 迷うなら **Balanced** が最も無難な既定値です。`,
          summaryInstructions: `この指示はこのプロファイルの要約スタイルを決めます。

- 構成、読み手、繰り返し使う用語のために使ってください。
- ライブアシスタントではなく、要約出力向けの指示に絞ってください。
- 長い方針文より、短く具体的な指示のほうがうまく働くことが多いです。

例: \`最初にエグゼクティブサマリー、その後に担当者付きのアクション項目を書く。\``,
          assistantEnabled: `このプロファイルで Meeting AI を有効または無効にします。

- オフでも他の Meeting AI 設定は見えますが、ライブ提案には影響しません。
- ライブ提案が本当に役立つ会議タイプだけで有効にしてください。
- プロファイルごとに Meeting AI の既定値を変えられます。`,
          assistantResponseIntent: `このプロファイルで Meeting AI が優先する主な役割を決めます。

- 回答、コーチング、要約、リスク抽出のどれに寄せるかをここで決めます。
- 文面だけでなく、提案全体の方向が変わります。
- その会議タイプで普段ほしい助け方に合う意図を選んでください。`,
          assistantResponseFormat: `Meeting AI の応答の形を決めます。

- 短い箇条書きは会議中に素早く確認しやすいです。
- 話し言葉寄りの形式は、そのまま口に出したいときに向いています。
- 時間に追われても使いやすい形式を選んでください。`,
          assistantResponseDepth: `Meeting AI の応答をどれだけ簡潔にするか、どれだけ厚くするかを決めます。

- 浅いほうが速く、さっと読めます。
- 深いほうが背景や理由は増えますが、ライブでは重く感じやすいです。
- 速い会話では軽め、戦略会議では深めが向いています。`,
          assistantResponseTone: `Meeting AI の文体トーンを調整します。

- トーンによって提案はより直接的にも、中立的にも、外交的にもなります。
- 事実自体は変わりませんが、受け取られ方は変わります。
- 個人の好みだけでなく、その会議の空気に合わせてください。`,
          assistantDeliveryBias: `出力の速さと内容の厚さのバランスを決めます。

- タイミング最優先なら速い出力が向いています。
- ニュアンス重視なら、やや遅くても厚い出力が向いています。
- 迷うなら中間設定のままにしてください。`,
          assistantTriggerPolicy: `会議中のどの場面で Meeting AI が提案を出すかを決めます。

- 控えめな方針ほどノイズは減ります。
- 積極的な方針ほど提案は増えますが、割り込みも増えやすいです。
- 必要な瞬間に役立つ最小レベルを選ぶのが安全です。`,
          assistantParticipantScope: `誰の発言や動きを Meeting AI の提案に反映させるかを決めます。

- 狭い範囲は自分の役割に重要な相手へ集中しやすくなります。
- 広い範囲は会議全体の流れを読みたいときに向きます。
- アシスタントが騒がしい、散りやすいと感じたら範囲を狭めてください。`,
          assistantInstructions: `この指示はこのプロファイル向けに Meeting AI の振る舞いを調整します。

- 応答スタイル、繰り返しの制約、領域特有の期待を書くのに使ってください。
- 要約指示やライブ翻訳指示とは分けてください。
- 細かな例外を大量に並べるより、少数の安定したルールのほうがうまく働きます。

例: \`短い話しポイントを優先し、回答を書く前に隠れたリスクを先に示す。\``,
        },
        translation: {
            bestFor: {
                title: "こんな方に最適",
                description: "トーン、専門用語、略語の処理、ノイズの多い字幕のクリーンアップ。"
            },
            keepLean: {
                title: "無駄のない状態を保つ",
                description: "通常、命令が短いほど翻訳が速くなり、ライブ キャプション全体でより安定した状態が保たれます。"
            },
            avoid: {
                title: "避ける",
                description: "長いポリシー、繰り返しのルール、またはフォーマット要件により、すべてのキャプション リクエストが遅くなります。"
            },
            instructionsLabel: "ライブ翻訳の手順",
            instructionsHint: "すべてのキャプション翻訳リクエストに適用されます。字幕のクリーンアップ、用語、翻訳のトーンに使用します。"
        },
        profiles: {
            identity: {
                eyebrow: "プロフィールのアイデンティティ",
                description: "これらのフィールドは、会議タイプのプロファイル自体を定義します。これらは、概要生成とライブ アシスタントによって共有されます。",
                nameLabel: "プロファイル名",
                namePlaceholder: "毎日の同期",
                descriptionLabel: "簡単な説明",
                descriptionPlaceholder: "定期的なチームチェックイン"
            },
            summary: {
                eyebrow: "概要",
                description: "これらの設定は、この会議プロファイルが概要を生成する方法、つまり AI の使用量と、概要の生成中に実行される命令を決定します。",
                autoSummaryLabel: "会議終了後の自動サマリー",
                autoSummaryDescription: "このプロファイルがアクティブな場合、会議の終了後に概要が自動的に開始されます。",
                effortLabel: "取り組みの概要",
                instructionsLabel: "説明の概要",
                instructionsHint: "この会議タイプが会議履歴から選択された場合に���用されます。",
                modes: {
                    economy: {
                        name: "エコノミー",
                        description: "AI の作業を軽減します。スピードが最も重要な短い会議に最適です。",
                        badge: "最速"
                    },
                    balanced: {
                        name: "バランスの取れた",
                        description: "おすすめです。余分な AI 作業を過度に使用せずに、信頼性を高めるための要約戦略を適応させます。"
                    },
                    thorough: {
                        name: "徹底的に",
                        description: "長時間の会議やより複雑な会議では、より多くの AI 作業を使用して、要約の失敗を減らします。",
                        badge: "最も遅い"
                    }
                }
            },
            assistant: {
                eyebrow: "アシスタント",
                description: "これらの設定は、この会議プロファイルがアクティブなときにライブ ガイダンスがどのように動作するかを定義します。",
                enabledLabel: "このプロファイルでアシスタントを使用する",
                enabledDescription: "この会議プロファイルを有効にすると、サポートされている会議でライブ ガイダンスを生成できます。",
                disabledHint: "アシスタントの設定はここに表示されたままになるため、後で確認したり調整したりできますが、このプロファイルがオンになるまでロックされたままになります。",
                responseIntentLabel: "プライマリガイダンスモード",
                responseFormatLabel: "応答フォーマット",
                responseDepthLabel: "応答の深さ",
                responseToneLabel: "応答音",
                deliveryBiasLabel: "スピードと完全性",
                triggerPolicyLabel: "ガイダンスがトリガーされるタイミング",
                participantScopeLabel: "ガイダンスをトリガーできるのは誰ですか",
                instructionsLabel: "アシスタントの指示",
                instructionsHint: "この会議プロファイルがアクティブで、アシスタントがライブ ガイダンスを生成する場合に使用されます。",
                intents: {
                    answerForMe: {
                        name: "アンサー・フォー・ミー",
                        description: "ユーザーが現時点で提供できる最も強力な直接的な回答を草案します。"
                    },
                    improveMyAnswer: {
                        name: "回答を改善する",
                        description: "ユーザーがすでに言っていると思われることを厳密にします。"
                    },
                    suggestNextPoint: {
                        name: "次のポイントを提案する",
                        description: "会議を前進させるために、次の有益な話題を提供します。"
                    },
                    summarizeRecentTurn: {
                        name: "最近のターンの概要",
                        description: "最新のやりとりを、すぐに使える要約に圧縮します。"
                    },
                    surfaceRisks: {
                        name: "表面上のリスク",
                        description: "注意すべきリスク、ギャップ、反対意見を強調します。"
                    },
                    coachMe: {
                        name: "コーチ・ミー",
                        description: "その瞬間により効果的に応答する方法をユーザーにガイドします。"
                    }
                },
                formats: {
                    bullets: {
                        name: "弾丸",
                        description: "スキャンしやすい非常に短い箇条書き。",
                        badge: "最速"
                    },
                    talkingPoints: {
                        name: "論点",
                        description: "ユーザーが自然に言える短い話し言葉形式のポイント。"
                    },
                    shortParagraph: {
                        name: "短い段落",
                        description: "箇条書きが途切れ途切れに感じられる場合は、コンパクトな 1 つの段落にします。"
                    },
                    structuredSections: {
                        name: "構造化されたセクション",
                        description: "明確さが重要な場合は、回答をラベル付きの小さなセクションに分割します。",
                        badge: "最も遅い"
                    },
                    script: {
                        name: "スクリプト",
                        description: "ユーザーが従うことができる、より文字通りの表現を作成します。"
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "ウルトラブリーフ",
                        description: "最高の速度を実現するために設計された最小限の答え。",
                        badge: "最速"
                    },
                    brief: {
                        name: "概要",
                        description: "短くて実用的。ライブ会議に適したデフォルトです。"
                    },
                    standard: {
                        name: "標準",
                        description: "スピードが依然として重要な場合は、もう少しコンテキストを追加します。"
                    },
                    expanded: {
                        name: "拡張された",
                        description: "より完全な回答が役立つ場合は、さらに説明を加えます。",
                        badge: "最も遅い"
                    }
                },
                tones: {
                    neutral: {
                        name: "ニュートラル",
                        description: "バランスが取れていてプロフェッショナル。"
                    },
                    direct: {
                        name: "直接",
                        description: "より簡潔かつしっかりと。"
                    },
                    supportive: {
                        name: "協力的な",
                        description: "漠然としたものではなく、役に立ち、安心させます。"
                    },
                    confident: {
                        name: "自信を持って",
                        description: "ユーザーがより鋭いフレージングを必要とする場合、強力かつ決定的です。"
                    },
                    analytical: {
                        name: "分析的",
                        description: "より推論指向で構造化されています。"
                    }
                },
                delivery: {
                    fastest: {
                        name: "最速",
                        description: "スピードとすぐに役立つことに大きく偏っています。",
                        badge: "最高速度"
                    },
                    balanced: {
                        name: "バランスの取れた",
                        description: "完全性を高めるために速度を犠牲にしてください。"
                    },
                    careful: {
                        name: "慎重に",
                        description: "会議で許可されている場合は、より高い完全性を優先します。",
                        badge: "最も遅い"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "ご質問とご要望",
                        description: "主に質問または要求のようなターンでトリガーします。",
                        badge: "最低負荷"
                    },
                    salienceFirst: {
                        name: "顕著性第一",
                        description: "また、顕著な問題、決定、または緊張点にも反応します。"
                    },
                    proactive: {
                        name: "プロアクティブ",
                        description: "最も熱心なモード。もっと一方的な助けが必要な場合にのみ使用してください。",
                        badge: "最高負荷"
                    }
                },
                scope: {
                    everyone: {
                        name: "みんな",
                        description: "ユーザーと他の参加者の両方を有効なトリガーとして考慮します。",
                        badge: "より重い"
                    },
                    othersOnly: {
                        name: "その他のみ",
                        description: "応答するかどうかを決定するときに、ユーザー自身の順番を無視します。",
                        badge: "ライター"
                    }
                }
            },
            badges: {
                primary: "プライマリー",
                alwaysAvailable: "いつでも利用可能",
                customProfile: "カスタムプロファイル",
                assistantOn: "アシスタントがオン",
                autoSummary: "自動サマリー"
            },
            editor: {
                title: "会議プロファイルエディター",
                description: "プロファイルを 1 つ選択し、その共有 ID、概要動作、およびライブ アシスタントの動作を 1 か所で編集します。",
                addProfile: "会議プロファイルを追加する",
                listTitle: "プロフィール",
                totalCount: "合計 {count}",
                defaultOutputLanguage: "デフォルトの AI 出力言語",
                untitled: "無題のプロフィール",
                noDescription: "まだ説明がありません。",
                noShortDescription: "このプロフィールにはまだ簡単な説明がありません。",
                setAsPrimary: "プライマリとして設定",
                builtInTitle: "組み込みのデフォルトプロファイル",
                builtInDescription: "このプロファイルは、CaptionArc に、特殊な会議タイプが適合しない場合の概要生成とライブ ガイダンスの両方に対する安全な汎用フォールバックを提供します。",
                newName: "新しい会議の種類",
                newDescription: "カスタム会議プロファイル",
                newPrompt: "要求された言語でこの会議を正確に要約してください。このタイプの会議で最も重要な点に焦点を当てます。"
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive アプリ データ フォルダー",
                    subtitle: "Google アカウント内のプライベート拡張機能ストレージ。"
                },
                oneDrive: {
                    title: "OneDrive アプリフォルダー",
                    subtitle: "Microsoft アカウント内のプライベート拡張ストレージ。"
                }
            },
            actions: {
                refreshStatus: "ステータスの更新",
                connect: "接続する",
                retryNow: "今すぐ再試行してください",
                reconnect: "再接続",
                disconnect: "切断する"
            },
            overview: {
                title: "ボールトの概要",
                loadingDescription: "このデバイスの現在のクラウド同期状態をロードしています。",
                offDescription: "パーソナル クラウド プロバイダーはまだ接続されていません。",
                needsAttentionDescription: "アーカイブが再び完全に保護される前に、少なくとも 1 つのクラウド宛先の介入が必要です。",
                syncingDescription: "ボールトは、バックグラウンドでローカルとリモートの変更を積極的に調整しています。",
                upToDateDescription: "接続されたクラウド宛先は、現在のローカル アーカイブに追いつきます。"
            },
            stats: {
                currentDevice: "現在のデバイス",
                connectedProviders: "接続されたプロバイダー",
                connectedProvidersNone: "クラウド宛先がまだ接続されていません",
                connectedProvidersOne: "1 つのクラウド宛先がアクティブです",
                connectedProvidersTwo: "両方のクラウド宛先がアクティブです",
                lastSuccessfulSync: "最後��成功した同期",
                lastSuccessfulSyncHint: "最近成功したプロバイダー チェックポイントに基づきます。",
                queueStatus: "キューのステータス"
            },
            queue: {
                noQueuedChanges: "キューに入れられた変更はありません",
                queuedChanges: "{count} キューに入れられた変更",
                engineProcessing: "エンジンは現在作業を処理しています。",
                tasksReady: "{count} タスクは次の実行の準備ができています。",
                engineIdle: "エンジンは、次のローカルまたはリモートの変更が行われるまでアイドル状態になります。"
            },
            syncHealth: {
                title: "同期の状態",
                attention: "注意",
                status: "ステータス"
            },
            pendingChoice: {
                title: "共有設定はすでにクラウドに存在します",
                badge: "選択が必要です",
                description: "このデバイスにはすでに独自の共有設定があり、接続されたクラウド保管庫には別の設定があります。今後の同期の開始点となるものを選択します。",
                source: "出典: {provider}",
                keepLocal: "このデバイスの共有設定を保持する",
                useCloud: "クラウド共有設定を使用する"
            },
            providerCard: {
                account: "アカウント",
                lastSuccessfulSync: "最後��成功した同期",
                providerStatus: "プロバイダーのステータス"
            },
            scope: {
                sharedTitle: "デバイス間で同期される",
                localTitle: "この端末のみ",
                shared: {
                    meetingSessions: "ミーティングセッション",
                    translations: "翻訳",
                    summaries: "概要",
                    meetingProfiles: "会議プロファイル",
                    sharedSettings: "共有設定"
                },
                local: {
                    apiKeys: "APIキー",
                    verificationStatus: "検証状況",
                    deviceIdentity: "デバイスのアイデンティティ"
                }
            },
            health: {
                syncing: "同期中",
                upToDate: "最新の状態",
                retryingAutomatically: "自動的に再試行します",
                needsAttention: "注意が必要です",
                actionRequired: "アクションが必要です",
                off: "オフ"
            },
            connection: {
                notConnectedTitle: "接��されていません",
                notConnectedDescription: "接続してこのアーカイブの保護を開始してください。",
                connectedTitle: "接続済み",
                connectedAt: "{time} に接続しました"
            },
            sync: {
                notYet: "まだ",
                scannedAt: "スキャン済み {time}",
                noScanRecorded: "まだスキャンが記録されていません。"
            },
            statusMessage: {
                disconnected: "切断されました。このプロバイダーは更新を受信して​​いません。",
                manualRetryAvailable: "自動再試行が一時停止されました。手動で再試行をトリガーできます。",
                syncing: "現在、ローカルとリモート��変更を同期しています。",
                retryingAutomatically: "バックグラウンドで自動的に再試行されます。",
                needsAttention: "保護が完全に復元される前に注意が必要です。",
                actionRequired: "同期を続行するには手動での操作が必要です。",
                upToDate: "プロバイダーは完全に同期されています。",
                connectedWaiting: "接続され、作業を待っています。"
            }
        },
        dataRecovery: {
            backupFile: {
                title: "暗号化されたバックアップファイル",
                description: "エクスポートしたバックアップには、共有設定、会議プロファイル、保存済み会議セッション、文字起こし、チャット履歴、翻訳、要約が含まれます。OpenAI API キーのような端末ローカルの秘密情報はバックアップに含まれません。クラウド同期が利用できないときや、持ち運べる暗号化スナップショットが必要なときに使用します。",
                export: "すべてのデータをエクスポートする",
                import: "バックアップファイルをインポートする"
            },
            passphrase: {
                label: "バックアップパスフレーズ",
                placeholder: "少なくとも 8 文字を使用してください",
                show: "バックアップパスフレーズを表示",
                hide: "バックアップパスフレーズを非表示にする",
                hint: "エクスポートとインポートには同じパスフレーズを使用します。これがないとバックアップを復号化できません。"
            },
            cards: {
                scope: {
                    title: "範囲",
                    description: "1 つの暗号化ファイルには、設定と完全なセッション アーカイブの両方が含まれています。"
                },
                restoreBehavior: {
                    title: "復元動作",
                    description: "インポートすると、現在のローカル アーカイブと設定が選択したバックアップ ファイルに置き換えられ、同期エンジンが再度調整できるようになります。"
                },
                useCase: {
                    title: "ユースケース",
                    description: "マシンの移行、フォールバック回復、アーカイブの移植性に最適です。"
                }
            },
            deleteArchive: {
                title: "保存したアーカイブを削除する",
                syncedDescription: "このデバイス、接続済みクラウドプロバイダー、その他の同期済みデバイスから同期アーカイブを削除します。OpenAI の設定、各種設定、会議プロファイルは保持されます。",
                localDescription: "ローカルストレージから保存済み会議セッションをすべて削除します。OpenAI の設定、各種設定、会議プロファイルは保持されます。"
            },
            confirmDelete: {
                syncedTitle: "同期されたアーカイブをどこからでも削除しますか?",
                localTitle: "保存されたセッションデータをクリアしますか?",
                syncedLabel: "どこでもアーカイブを削除する",
                localLabel: "保存されたセッションをクリアする",
                syncedDescription: "これにより、保存されているすべての会議セッション、トランスクリプト、チャット記録、翻訳、概要が、このデバイス、同期されている他のデバイス、および接続されているクラウド アカウントから完全に削除されます。設定はそのまま残ります。",
                localDescription: "これにより、保存されたすべての会議セッション、トランスクリプト、チャット記録、翻訳、および概要がローカル ストレージから削除されます。設定はそのまま残ります。"
            }
        },
        diagnostics: {
            launcherTitle: "診断",
            launcherSubtitle: "コンソール",
            closeConsole: "診断コンソールを閉じる",
            drawerLabel: "診断コンソール",
            closeDrawer: "診断ドロワーを閉じます",
            actions: {
                enableSession: "このセッションを有効にする",
                disableSession: "このセッションを無効にする",
                copyVisible: "表示されているログをコピーする",
                copiedVisible: "コピーされた表示ログ",
                refresh: "診断を更新する",
                clear: "明確な診断",
                enableSessionDiagnostics: "セッション診断を有効にする"
            },
            filters: {
                all: "すべて",
                searchPlaceholder: "タイトル、概要、キー、ドメイン、機能、プロバイダーを検索します",
                visibleCounts: "表示されるカウント:",
                error: "エラー",
                warn: "警告する",
                info: "情報",
                debug: "デバッグ",
                trace: "トレース"
            },
            summary: {
                loadedWindowTitle: "ロードされたウィンドウ",
                loadedWindowBody: "最新の {limit} 正規イベント最大数",
                visibleNowTitle: "現在表示可能",
                visibleNowBody: "フィルタと検索はクライアント側のみで更新されます。",
                snapshotsTitle: "スナップショット",
                noProvider: "プロバイダーがありません",
                noResolvedSnapshot: "現在のペイロードには解決されたスナップショットがありません。",
                lastSyncTitle: "最終同期",
                waiting: "待っています",
                lastSyncBody: "このタブが非表示になっている間は更新が一時停止します。",
                eventOne: "{count} イベント",
                eventOther: "{count} イベント",
                snapshotOne: "{count} スナップショット",
                snapshotOther: "{count} スナップショット"
            },
            row: {
                session: "セッシ���ン",
                request: "リクエスト",
                correlation: "相関関係",
                tab: "タブ",
                frame: "フレーム",
                document: "文書",
                origin: "起源",
                copied: "コピーされました",
                copyRow: "行をコピー",
                showDetails: "詳細を表示",
                hideDetails: "詳細を隠す",
                senderUrl: "送信者 URL",
                eventKey: "イベントキー",
                description: "説明",
                eventData: "イベントデータ"
            },
            states: {
                requestErrorPrefix: "ランタイム更新に失敗しました。最後に成功したペイロードは、次の再試行まで表示されたままになります。",
                captureOffTitle: "このセッションでは診断キャプチャがオフになっています。",
                captureOffBody: "ビューアは使用できますが、このセッションの診断を有効にするまで新しいログは到着しません。ここで意図的にオーバーライドしない限り、本番環境ではベースライン キャプチャ ポリシーがオフのままになります。",
                waitingTitle: "診断イベントを待機しています。",
                waitingBody: "ドロワーは正規コレクターに接続されています。拡張機能が新しい構造化診断を発行すると、それらは自動的にここに表示されます。",
                noMatchesTitle: "現在のフィルターに一致するイベントはありません。",
                noMatchesBody: "より広いレベルのフィルターを試すか、検索ボックスをクリアしてイベントを表示に戻します。"
            },
            status: {
                unavailableLabel: "利用不可",
                unavailableDescription: "この環境では診断ビューアが有効���なっていません。",
                syncIssueLabel: "同期の問題",
                syncIssueDescription: "ビューアはランタイムからの診断を更新できませんでした。",
                connectingLabel: "接続中",
                connectingDescription: "ビューアは現在の診断構成をロードしています。",
                sessionOffLabel: "セッションオフ",
                sessionOffDescription: "現在、このセッションでは診断キャプチャが無効になっています。既存のキャプチャされたイベントは表示されたままになります。",
                pausedLabel: "一時停止中",
                pausedDescription: "オプション タブが非表示になっている間はポーリングが一時停止され、再び表示されると再開されます。",
                liveLabel: "ライブ",
                liveDescription: "ビューアは最新の正規診断ペイロードをポーリングしています。",
                readyLabel: "準備完了",
                readyDescription: "ドロワーを開いて、最新の正規診断を検査します。"
            },
            requestErrors: {
                runtimeUnavailable: "実行時メッセージングは現在のコンテキストでは使用できません。",
                loadConfigFailed: "診断構成をロードできませんでした。",
                loadPayloadFailed: "診断ペイロードをロードできませんでした。",
                updateConfigFailed: "診断構成を更新できませんでした。",
                clearFailed: "診断をクリアできませんでした。"
            }
        },
        runtime: {
            connection: {
                addApiKey: "OpenAI API キーを追加して、接続をテストします。",
                runTest: "テスト接続を実行して、OpenAI キーと選択したモデルを確認します。",
                testing: "現在の OpenAI セットアップをテストしています...",
                apiKeyRequired: "OpenAI API キーは、接続をテストする前に必要です。",
                modelRequired: "接続をテストする前に、OpenAI モデルを選択してください。",
                apiKeyRejected: "OpenAI が API キーを拒否しました。",
                modelUnavailable: "OpenAI モデルはこのキーでは使用できません: {model}。",
                requestFailed: "OpenAI リクエストは {status} で失敗しました。",
                networkFailed: "OpenAI に到達できませんでした。ネットワーク接続を確認して、もう一度試してください。",
                reachable: "OpenAI は到達可能であり、{model} は使用可能です。"
            },
            dataTransfer: {
                idle: "設定やセッション履歴のフォールバック回復パスとして暗号化バックアップを使用したり、���ラウド同期が接続されているときに保存されたアーカイブをどこからでも削除したりできます。",
                exporting: "設定とセッション履歴を含むフォールバック暗号化アーカイブを準備しています...",
                exportSuccess: "{count} で保存されたセッション{suffix} を使用してエクスポートされた暗号化バックアップ。",
                exportFailed: "データバンドルのエクスポートに失敗しました。",
                importing: "バックアップを復号化し、設定とセッション履歴を復元しています...",
                importSuccess: "バックアップがインポートされました。 {count} セッション{suffix} を復元しました。",
                importFailed: "データバンドルのインポートに失敗しました。",
                clearingSynced: "同期されたアーカイブをこのデバイスから削除し、接続されているクラウド プロバイダーに削除を伝達しています...",
                clearingLocal: "保存されているすべてのセッションをローカル ストレージから削除しています...",
                clearSuccessSynced: "アーカイブはこのデバイスから削除され、接続されているクラウド プロバイダーのキューに削除が追加されました。設定は保存されました。",
                clearSuccessLocal: "保存されたセッションは���除されました。設定は保存されました。",
                clearFailed: "保存されたセッション アーカイブをクリアできませんでした。"
            },
            cloudSync: {
                idleAvailable: "Google Drive または OneDrive に接続すると、クラウド同期が利用可能になります。",
                idleConnected: "クラウド同期ステータスは最新です。",
                idleDisconnected: "クラウド プロバイダーに接続して、アーカイブを自動的に保護します。",
                loadFailed: "クラウド同期状態をロードできませんでした。",
                updated: "クラウド同期ステータスが更新されました。",
                actionFailed: "クラウド同期アクションが失敗しました。",
                connecting: "クラウドプロバイダーに接続しています...",
                connectingProvider: "{provider} へのサインインを開始しています...",
                connectHint: "安全なブラウザー ウィンドウが開くはずです。そこでサインインを完了してからここに戻ってください。",
                connectSuccess: "{provider} に接続しました。",
                connectSuccessHint: "次の同期サイクルからバックグラウンド保護を続行できます。",
                disconnecting: "クラウドプロバイダーを切断しています...",
                disconnectingProvider: "{provider} を切断しています...",
                disconnectHint: "クラウド アクセスを削除している間もローカル アーカイブはこのデバイスに残ります。",
                disconnectSuccess: "{provider} を切断しました。",
                disconnectSuccessHint: "ローカル アーカイブはこのデバイスで引き続き利用できます。",
                retrying: "クラウド同期を再試行しています...",
                retryingProvider: "{provider} の再同期をキューに追加しています...",
                retryHint: "CaptionArc はプロバイダーにバックグラウンド同期の再開を再度求めます。",
                retrySuccess: "新しい同期再試行をキューに追加しました。",
                retrySuccessHint: "次回の実行時にバックグラウンドでそのプロバイダーを再試行します。",
                reconnecting: "クラウドプロバイダーアクセスを更新しています...",
                reconnectingProvider: "{provider} へのアクセスを更新しています...",
                reconnectSuccess: "{provider} へのアクセスを更新しました。",
                resolvingChoice: "共有設定の選択を適用しています...",
                resolveChoiceHint: "次のバックグラウンド サイクルは選択した開始点から調整を行います。",
                choiceSuccess: "共有設定の選択を適用しました。",
                choiceSuccessHint: "クラウド同期は選択した共有設定の基準から継続されます。",
                refreshing: "最新のクラウド同期状態を確認しています...",
                refreshHint: "キューの健全性、プロバイダーのチェックポイント、最近の同期アクティビティを読み取っています。",
                refreshSuccess: "クラウド同期状態を更新しました。",
                refreshSuccessHint: "最新のプロバイダー状態とキューの健全性がこのページに表示されました。"
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "アー��イブ",
            title: "会議履歴",
            subtitle: "拡張機能を離れることなく、保存されたセッションを参照し、トランスクリプトの詳細を再度開き、レコードをエクスポートし、ローカル ストレージを管理します。",
            openSettings: "設定を開く",
            searchLabel: "セッションの検索",
            searchPlaceholder: "タイトル、会議 ID、講演者、キャプション、翻訳を検索します...",
            clearSearch: "検索をクリア",
            sortLabel: "並べ替え",
            providerFilterLabel: "プロバイダーでフィルターする",
            statusFilterLabel: "ステータスでフィルタリングする",
            resetFilters: "フィルターをリセットする",
            resultCountOne: "{count} 会議",
            resultCountOther: "{count} 会議",
            resultCountFiltered: "{total} 回の会議中 {filtered}",
            translatedCaptionCountOne: "{count} 翻訳されたキャプションがアーカイブ全体に保存されます。",
            translatedCaptionCountOther: "{count} 翻訳されたキャプションがアーカイブ全体に保存されました。",
            archiveSnapshotTitle: "アーカイブスナップショット",
            archiveSnapshotSessions: "セッション",
            archiveSnapshotCurrentView: "現在のビュー",
            archiveSnapshotProviderFocus: "プロバイダーの焦点",
            archiveSnapshotStarFilter: "スターフィルター",
            archiveSnapshotUrlHint: "検索状態、フィルター、並べ替え、現在開いているセッションはページ URL に反映されたままとなるため、更���やナビゲーションが予測可能になります。",
            storageFullTitle: "ローカルストレージがいっぱいになりつつある",
            storageFullDescription: "アーカイブはローカル拡張クォータの {percentage}% を使用しています。ストレージが制約になる前に、古いセッションを確認するか、設定から重要なレコードをエクスポートしてください。",
            reviewOldestSessions: "最も古いセッションを確認する",
            loadingTitle: "会議履歴をロードしています",
            loadingDescription: "保存されたセッション、ストレージ状態、および概要ジョブのメタデータを取得します。",
            detailLoadingTitle: "セッションの詳細を読み込んでいます",
            detailLoadingDescription: "この会議の完全なトランスクリプト、メタデータ、概要、およびジョブの状態を準備します。",
            emptyInitialTitle: "会議履歴はまだありません",
            emptyInitialDescription: "サポートされているブラウザー会議で拡張機能がキャプションをキャプチャした後、会議セッションがここに自動的に表示されます。通話に参加し、キャプションが流れ始めると、アーカイブが自動的に構築され始めます。",
            emptyFilteredTitle: "このビューに一致する会議はありません",
            emptyFilteredDescription: "現在の検索、プロバイダー フィルター、または並べ替えビューは、保存されたセッションに一致しませんでした。現在のビューをリセットするか、最も古いセッションを確認して閲覧を続けてください。",
            deleteSessionTitle: "この会議セッションを削除しますか?",
            deleteSessionDescription: "これにより、ローカル履歴から「{title}」が削除されます。この操作は元に戻すことができません。",
            deleteSessionConfirm: "セッションの削除"
        },
        dependency: {
            title: "OpenAI には注意が必要です",
            actionRequired: "アクションが必要です",
            needsVerification: "検証が必要です",
            impact: "{message} サービスが再び準備できるようになるまで、概要の生成、保存されたキャプションの翻訳、およびアシスタントのレビューは利用できません。"
        },
        filters: {
            providerAll: "すべてのプロバイダー",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams ウェブ",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "新しい順",
            sortOldest: "古い順",
            starAll: "すべてのセッション",
            starStarred: "スター付きのみ",
            activeQuery: "クエリ: 「{query}」",
            activeViewingOldest: "最も古い会議を最初に表示する"
        },
        storageIndicator: {
            usage: "{used} / {quota}",
            highUsage: "使用率が高い",
            reviewSoon: "すぐにレビューしてください",
            healthy: "健康"
        },
        confirmDialog: {
            closeDialog: "ダイアログを閉じる",
            confirmAction: "アクションの確認"
        },
        sessionList: {
            today: "今日",
            yesterday: "昨日",
            justNow: "たった今",
            inProgress: "進行中",
            noPreview: "このセッションでは、キャプチャされたキャプションや会議チャット メッセージはまだ利用できません。",
            removeStar: "スターを削除",
            starSession: "スターセッション",
            openDetails: "詳細を開く",
            deleteSession: "セッションの削除",
            generatingSummary: "サマリーの生成",
            starred: "スター付き",
            captionCountOne: "{count} キャプション",
            captionCountOther: "{count} キャプション",
            translatedOriginalOnly: "オリジナルのみ",
            translatedCount: "{count} を翻訳しました",
            chatCountOne: "{count} チャット",
            chatCountOther: "{count} チャット",
            directCall: "直接電話",
            hideIdentifiers: "識別子を隠す",
            showIdentifiers: "識別子の表示",
            loadingMore: "さらに会議を読み込んでいます..."
        },
        detail: {
            backToHistory: "歴史に戻る",
            reviewDescription: "この会議のキャプチャされたトランスクリプト、保存された翻訳、抽出カバレッジ、AI 概要を確認します。",
            inProgress: "進行中",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}m",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}m {seconds}s"
            },
            actions: {
                saveTitle: "タイトルの保存",
                cancelTitleEditing: "タイトル編集をキャンセルする",
                renameSession: "セッション名の変更",
                retry: "再試行"
            },
            exportMenu: {
                open: "エクスポート オプションを開く",
                close: "エクスポート オプションを閉じる",
                title: "トランスクリプトのエクスポート",
                description: "���存された翻訳と保存された概要を Markdown エクスポートに含めるかどうかを選択します。",
                includeTranslationsLabel: "保存された翻訳を含める",
                includeTranslationsAvailable: "保存された翻訳はエクスポート ファイルに含まれます。",
                includeTranslationsUnavailable: "このセッションで使用できる保存された翻訳はまだありません。",
                includeSummariesLabel: "保存���れた概要を含める",
                includeSummariesAvailable: "保存された会議の概要はエクスポート ファイルに追加されます。",
                includeSummariesUnavailable: "このセッションで使用できる保存された会議概要はまだありません。",
                export: "Markdown をダウンロード"
            },
            metadataLabels: {
                provider: "プロバイダー",
                callTitle: "通話タイトル",
                meetingTitle: "会議のタイトル",
                meetingUrl: "ミーティングURL",
                started: "開始しました",
                ended: "終了しました",
                status: "ステータス",
                primaryId: "プライマリID",
                meetingCode: "会議コード",
                meetingId: "ミーティングID",
                conferenceId: "会議ID",
                meetingNumber: "会議番号",
                threadId: "スレッドID",
                callType: "通話タイプ"
            },
            status: {
                ended: "終了しました",
                live: "ライブ"
            },
            sections: {
                metadata: {
                    title: "会議のメタデータ",
                    description: "この保存されたセッションの会議 ID、タイミング、保存された識別子を確認します。",
                    expand: "メタデータを表示する",
                    collapse: "メタデータを非表示にする"
                },
                continuations: {
                    title: "セッションの継続",
                    description: "それぞれの再参加と、同じセッションが再開されるまでに費やした合計時間を検査します。",
                    expand: "続きを表示",
                    collapse: "続きを隠す"
                },
                extraction: {
                    title: "抽出レポート",
                    description: "保存されたアーカイブのトランスクリプト カバレッジ、話者抽出、整合性フィンガープリントを検査します。",
                    expand: "抽出レポートを表示",
                    collapse: "抽出レポートを非表示にする"
                },
                summary: {
                    title: "会議の概要",
                    description: "この会議プロファイルと言語について保存された AI 概要を生成または確認します。",
                    expand: "概要を表示",
                    collapse: "概要を隠す"
                },
                transcript: {
                    title: "成績証明書",
                    description: "保存されたキャプション、会議チャット、翻訳、アシスタントの出力をタイムライン順に確認します。"
                }
            },
            stats: {
                capturedCaptions: "キャプチャされたキャプション",
                translatedCaptions: "翻訳されたキャプション",
                duration: "期間",
                meetingChatMessages: "会議チャットメッセージ",
                rejoins: "再参加",
                totalAwayTime: "合計アウェイ時間",
                lastRejoin: "最後に再参加",
                canonicalEvents: "正規のイベント",
                uniqueSpeakers: "ユニークなスピーカー",
                metadataCoverage: "メタデータの範囲",
                providerIds: "プロバイダーID"
            },
            rejoin: {
                label: "{index} に再参加する",
                awayFor: "{gap} のために出発",
                leftMeeting: "会議を終了しました",
                returnedToMeeting: "会議に戻りました"
            },
            extraction: {
                eventLogFingerprint: "イベントログのフィンガープリント",
                searchFingerprint: "フィンガープリントの検索",
                summaryFingerprint: "サマリーフィンガープリント",
                timelineRange: "タイムライン範囲",
                lastEvent: "最後のイベント",
                noEvents: "イベントはありません",
                coverageBreakdown: "補償範囲の内訳",
                sessionOffsets: "セッションオフセット",
                translatedEvents: "翻訳されたイベント",
                finalCaptionEvents: "最終的なキャプションイベント",
                speakers: "スピーカー",
                noSpeakers: "スピーカーが検出されませんでした。",
                warnings: "警告"
            },
            summaryJob: {
                states: {
                    preflighting: "概要を準備中",
                    extracting: "トランスクリプトの分析",
                    merging: "証��の統合",
                    synthesizing: "執筆概要",
                    continuing: "続きのまとめ",
                    reconciling: "出力の調整",
                    completed: "概要の準備ができました",
                    failed: "サマリーに失敗しました",
                    cancelled: "概要がキャンセルされました",
                    default: "概要を準備中"
                },
                progress: {
                    ready: "準備完了",
                    preparing: "証拠の準備",
                    step: "ステップ {current}/{total}",
                    mergingEvidence: "証��の統合",
                    preparingFinal: "最終的なまとめの準備中",
                    continuation: "{total} の {current} の続き",
                    continuing: "継続世代",
                    finalChecks: "最終チェックの実行"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI は利用できません",
                unavailable: "概要の生成は利用できません",
                generating: "サマリーの生成",
                generateAnother: "別の概要を生成する",
                generate: "会議の概要を生成する",
                generateWithProfile: "{profile} を使用して、保存された会議の概要を作成または更新します。",
                selectMeetingType: "概要を生成する前に、会議プロファイルと出力言語を選択します。",
                generateAnotherAction: "別の {profile} 概要を生成する",
                generateAction: "{profile} 概要を生成する",
                genericProfile: "選択したプロファイル",
                inProgress: "概要の生成はまだ進行中です。",
                noSummaryYet: "{language} には {profile} の概要がまだ保存されていません。",
                noSummaryHint: "今すぐ生成するか、会議プロファイルまたは言語を切り替えて別の保存されたバージョンを確認してください。",
                latestSaved: "最後に保存された概要: {language} の {profile}。",
                evidenceChunks: "{count} 証拠チャンク",
                continuations: "{count} 続き",
                reconciled: "和解した",
                executionStrategy: {
                    singleShot: "シングルショット",
                    structuredSingleShot: "構造化されたシングルショット",
                    multiStage: "多段式"
                },
                version: {
                    latest: "最新 · {time}",
                    automatic: "自動",
                    manual: "マニュアル",
                    auto: "自動",
                    alt: "代替プロファイル",
                    session: "セッションプロファイル",
                    default: "デフォルトのプロファイル",
                    sessionProfile: "セッションプロファイル: {name}",
                    unknownProfile: "不明なプロフィール",
                    generatedWithAnotherProfile: "別のプロファイルで生成",
                    generatedAt: "{time} が生成されました"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "保存されたキャプションの翻訳は利用できません",
                translatingAllCaptions: "すべてのキャプションを翻訳する",
                translateAllCaptions: "すべてのキャプションを翻訳する",
                batchTranslateSubtitle: "{language} のすべてのキャプションに対して保存済みの翻訳を作成します。",
                translateAllCaptionsTo: "すべてのキャプションを {language} に翻訳します",
                emptyTitle: "トランスクリプトやチャット項目はありません",
                emptyDescription: "このセッションには保存されたキャプションや会議チャット メッセージがまだありません。",
                meetingChat: "ミーティングチャット",
                translationAvailable: "翻訳が保存されました",
                message: "メッセージ",
                caption: "キャプション",
                translation: "翻訳",
                noChatTranslation: "このチャット メッセージの翻訳はまだ保存されていません。",
                noCaptionTranslation: "このキャプションの翻訳はまだ保存されていません。",
                translatingChatMessage: "チャットメッセージを翻訳しています",
                translatingCaption: "キャプションの翻訳",
                translateChatMessage: "チャットメッセージを翻訳する",
                translateCaption: "キャプションを翻訳する",
                translateThisItem: "この {item} を {language} に翻訳します",
                aiAssistant: "AIアシスタント",
                triggeredByChat: "このチャットメッセージによってトリガーされました",
                triggeredByCaption: "このキャプションをきっかけに"
            },
            export: {
                sessionDetailsHeading: "セッション詳細",
                titleLabel: "タイトル",
                providerLabel: "プロバイダー",
                startedLabel: "開始しました",
                primaryIdLabel: "プライマリID",
                endedLabel: "終了しました",
                durationLabel: "期間",
                statusLabel: "ステータス",
                capturedChatMessagesLabel: "キャプチャされたチャット メッセージ",
                savedTranslationsLabel: "保存された翻訳",
                totalAwayBeforeRejoinsLabel: "再参加するまでの合計不在時間",
                savedSummariesHeading: "保存された概要",
                generatedLabel: "生成された",
                modelLabel: "モデル",
                summaryEffortLabel: "取り組みの概要",
                executionStrategyLabel: "実行戦略",
                evidenceChunksLabel: "証拠の塊",
                continuationsLabel: "続き",
                reconciledLabel: "和解した",
                coveredCaptionsLabel: "カバーされたキャプション",
                yes: "はい",
                sessionContinuationsHeading: "セッションの継続",
                leftAtLabel: "左に",
                rejoinedAtLabel: "に再参加しました",
                awayForLabel: "遠くへ",
                sessionResumeHeading: "セッション {index} は {gap} 後の {time} に再開されました"
            }
        },
        runtime: {
            settingsLoadFailed: "拡張機能の設定を読み込めませんでした。",
            loadHistoryFailed: "会議履歴の読み込みに失敗しました。",
            loadSessionDetailFailed: "会議セッションの詳細をロードできませんでした。",
            sessionDeleted: "セッションが削除されました。",
            sessionDeleteFailed: "セッションの削除に失敗しました。",
            titleUpdated: "タイトルを更新しました。",
            titleUpdateFailed: "タイトルの更新に失敗しました。",
            starUpdateFailed: "スターの更新に失敗しました。",
            sessionNotFound: "会議セッションが見つかりません。",
            chatMessageNotFound: "チャットメッセージが見つかりません。",
            captionNotFound: "キャプション行が見つかりません。",
            translationFailed: "翻訳に失敗しました。",
            captionTranslated: "キャプションは {language} に翻訳されました。",
            chatTranslated: "チャット メッセージは {language} に翻訳されました。",
            captionTranslateFailed: "キャプションの翻訳に失敗しました。",
            chatTranslateFailed: "チャットメッセージの翻訳に失敗しました。",
            analyzingTranscript: "トランスクリプトの分析",
            noSummarySource: "要約に利用できるトランスクリプトや会議チャットのコンテンツはありません。",
            summaryGenerationFailed: "概要の生成に失敗しました。",
            summaryGenerated: "{language} で生成された概要。",
            summaryCancelFailed: "サマリー生成のキャンセルに失敗しました。",
            batchTranslationFailed: "すべてのキャプションを翻訳できませんでした。",
            allCaptionsAlreadyTranslated: "すべてのキャプションにはすでに {language} 翻訳が付いています。",
            batchTranslatedOne: "{count} キャプションは {language}{suffix} に翻訳されました。",
            batchTranslatedOther: "{count} のキャプションが {language}{suffix} に翻訳されました。",
            batchSkippedSuffix: "、{count} をスキップしました",
            errorOutdated: "{fallback} 詳細: 拡張機能のランタイムが古くなっています。拡張機能をリロードして、もう一度試してください。",
            errorNoDetails: "{fallback} 詳細: 追加のエラー詳細は返されませんでした。",
            errorModelStopped: "{fallback} 詳細: 概要が完了する前にモデルが停止しました。アプリは自動的に再試行するようになりましたが、この応答はまだ完全には回復できませんでした。より大きな出力バジェットを持つモデルを再生成するか、使用して��てください。",
            errorNoProviderDetails: "{fallback} 詳細: 追加のプロバイダーの詳細は返されませんでした。",
            errorWithDetails: "{fallback} 詳細: {details}"
        }
    },
    content: {
        copyFeedback: "コピーしました！",
        timeline: {
            meetingChat: "ミーティングチャット"
        },
        translation: {
            errorFallback: "エラー",
            requestFailed: "翻訳に失敗しました",
            retryAction: "翻訳を再試行する"
        },
        empty: {
            waitingForCaptionsTitle: "字幕を待っています...",
            waitingForCaptionsBody: "会議でキャプションを有効にしてテキストのキャプチャを開始します",
            waitingForCaptionsGoogleMeet: "Google Meet でキャプションをオンにして、テキストのキャプチャを開始します",
            waitingForCaptionsTeams: "[その他] > [言語と音声] > [ライブ キャプションを表示] を開き、テキストのキャ���チャを開始します",
            waitingForCaptionsZoom: "[その他] > [キャプション] > [キャプションを表示] を開き、テキストのキャプチャを開始します",
            capturePendingTitle: "キャプチャーがあなたを待っています",
            capturePendingBody: "起動プロンプトに応答して、この会議のキャプチャを開始できるようにします。",
            captureStartingTitle: "キャプチャの開始",
            captureStartingBody: "現在、ミーティングセッションとスタートアップオブザーバーを準備しています。",
            captureDismissedTitle: "キャプチャはオフのままでした",
            captureDismissedBody: "この会議は起動プロンプトから却下され、オフのままになります。",
            sessionEndedTitle: "セッションが終了しました",
            sessionEndedBody: "このミーティングはこのページではアクティブではありません。",
            waitingToJoinTitle: "ミーティングへの参加を待っています",
            waitingToJoinBody: "会議に参加してセッション タイマーを開始し、フローをキャプチャします。",
            enablingCaptionsTitle: "ライブキャプションを有効にする",
            enablingCaptionsBody: "CaptionArc は現在、この会議のキャプションをオンにしようとしています。",
            readyTitle: "キャプチャの準備ができました",
            readyBody: "話し始めると、会議が継続するにつれてキャプションラインがここに表示されます。",
            segmentEmptyTitle: "文字起こしやチャット項目はありません",
            segmentEmptyBody: "このセッションではキャプションや会議チャットメッセージは記録されませんでした。",
            close: "閉じる"
        },
        sessionSeparator: {
            title: "セッション {index}",
            detail: "{time} に再参加しました · {gap} から離脱しました",
            ariaLabel: "セッション {index} が再開されました"
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "AIには注意が必要です",
                finishOpenAiSetup: "OpenAI セットアップを完了する",
                openAiUnavailable: "OpenAI は利用できません",
                capturePendingTitle: "キャプチャ保留中",
                waitingForAnswer: "あなたの答えを待っています",
                startingCaptureTitle: "キャプチャの開始",
                preparingMeeting: "この会議の準備中",
                captureSkippedTitle: "キャプチャがスキップされました",
                meetingStaysOff: "この会議は中止されます",
                sessionEndedTitle: "セッションが終了しました",
                rejoinToContinue: "続行または再開するには再参加してください",
                waitingToJoinTitle: "参加を待っています",
                sessionStartsAfterJoin: "参加後にセッションが開始されます",
                enablingCaptionsTitle: "キャプションを有効にする",
                tryingLiveCaptions: "ライブキャプションをオンにしようとしています",
                setupRequiredTitle: "セットアップが必要です",
                turnOnMeetingCaptions: "会議のキャプションをオンにする",
                translationIssueTitle: "翻訳の問題",
                retryAvailable: "リトライが可能です",
                translatingLiveTitle: "ライブ翻訳",
                liveTranslationTitle: "ライブ翻訳",
                capturingLiveTitle: "ライブキャプチャー",
                originalCaptionsOnly: "オリジナルのキャプションのみ",
                readyToCaptureTitle: "キャプチャの準備ができました",
                waitingForSpeech: "スピーチを待っています",
                waitingForCaptionsTitle: "字幕を待っています"
            },
            main: {
                captureOnHoldTitle: "キャプチャ保留中",
                waitingForAnswer: "あなたの答えを待っています",
                startingCaptureTitle: "キャプチャの開始",
                preparingMeeting: "この会議の準備中",
                captureSkippedTitle: "キャプチャがスキップされました",
                meetingStaysOff: "この会議は中止されます",
                sessionEndedTitle: "セッションが終了しました",
                rejoinToContinue: "続行または再開するには再参加してください",
                waitingToJoinTitle: "参加を待っています",
                meetingOverlay: "会議オーバーレイ",
                enablingLiveCaptionsTitle: "ライブキャプションを有効にする",
                preparingCapture: "キャプチャの準備中",
                liveCaptureTitle: "ライブキャプチャ"
            },
            profileControl: {
                defaultBadge: "デフォルト"
            },
            translationToggle: {
                label: "自動"
            },
            translationDock: {
                eyebrow: "ライブ翻訳",
                consent: {
                    title: "キャプチャには確認が必要です",
                    body: "起動プロンプトを承認して、この会議のキャプチャを開始します。",
                    badge: "待っています"
                },
                starting: {
                    title: "キャプチャの開始",
                    body: "現在、セッションとオブザーバーのパイプラインを準備しています。",
                    badge: "開始"
                },
                dismissed: {
                    title: "キャプチャはオフのままでした",
                    body: "この会議は起動プロンプトで却下されました。",
                    badge: "オフ"
                },
                setup: {
                    title: "OpenAI セットアップが必要です",
                    body: "[設定] で OpenAI のセットアップを完了して、ライブ翻訳を有効にします。",
                    badge: "セットアップ"
                },
                unavailable: {
                    title: "OpenAI は利用できません",
                    body: "ライブ翻訳を再開する前に、[設定] で OpenAI の設定を確認してください。",
                    badge: "問題"
                },
                off: {
                    title: "翻訳はオフです",
                    body: "ターゲット: {language}。ライブ出力の場合はオンにします。",
                    badge: "オフ"
                },
                error: {
                    title: "翻訳には注意が必要です",
                    body: "いくつかの行が失敗しました。影響を受けるカードでは再試行が可能です。",
                    badge: "問題"
                },
                translating: {
                    title: "{language} に翻訳中",
                    body: "新しい行はライブ翻訳されています。",
                    badge: "働く"
                },
                live: {
                    title: "ライブ翻訳が有効です",
                    body: "{language} でライブ出力をレンダリングします。"
                },
                ready: {
                    title: "翻訳は武装している",
                    body: "キャプションがオンになっています。新しい行は {language} に変換されます。",
                    badge: "準備完了"
                },
                waiting: {
                    title: "字幕を待っています",
                    body: "翻訳を開始するには、会議のキャプションをオンにします。",
                    badge: "待っています"
                }
            },
            tooltips: {
                compactAiSetup: "[設定] で OpenAI のセットアップを完了すると、翻訳、要約、アシスタント ガイダンスが復元されます。",
                compactAiIssue: "{message} OpenAI に依存する機能は、問題が解決されるまで一時停止されたままになります。",
                translationOff: "ライブ翻訳をオフにする",
                translationOn: "ライブ翻訳をオンにする",
                translationSetup: "[設定] で OpenAI のセットアップを完了して、ライブ翻訳を有効にします。",
                translationUnavailable: "ライブ翻訳は、OpenAI が再び利用可能になるまで一時停止されます。",
                captureHelp: "キャプチャヘルプ",
                hideCaptureHelp: "キャプチャヘルプを非表示にする",
                switchToCompactView: "コンパクトビューに切り替える",
                expandOverlay: "オーバーレイを展開する",
                openProfilePicker: "会議プロファイル選択ツールを開く"
            }
        },
        captureGuide: {
            eyebrow: "キャプチャのセットアップ",
            title: "キャプチャヘルプ",
            statusReady: "準備ができたらキャプチャを開始します",
            footer: "CaptionArc は、このタブにライブ キャプションが表示されるとすぐにキャプチャを開始します。",
            stepsCount: "{count} 歩",
            waitingTitle: "ライブキャプションを待っています",
            closeAriaLabel: "攻略ガイドを閉じる",
            startsAutomatically: "自動的に起動します",
            tooltipOpen: "キャプチャヘルプ",
            tooltipClose: "キャプチャヘルプを非表示にする",
            providers: {
                googleMeet: {
                    title: "Google Meet でキャプチャを有効にする",
                    body: "このブラウザ会議で Google Meet キャプションがオンになると、CaptionArc を開始できます。",
                    status: "自動的に起動します",
                    footer: "CaptionArc は、このタブにライブ キャプションが表示されるとすぐに自動的にキャプチャを開始します。",
                    troubleshooting: "キャプション コントロールが表示されない場合は、会議またはブラウザの状態がまだ読み込まれているかどうかを確認してください。",
                    steps: {
                        openControls: {
                            title: "会議コントロールを開く",
                            detail: "マウスを移動すると、下部の会議ツールバーが表示されます。"
                        },
                        openCaptions: {
                            title: "オープンキャプションコントロール",
                            detail: "会議ツールバーのキャプションまたは CC コントロールをクリックします。"
                        },
                        turnOn: {
                            title: "キャプションをオンにする",
                            detail: "キャプションが有効になると、CaptionArc は自動的にテキストのキャプチャを開始します。"
                        }
                    }
                },
                microsoftTeams: {
                    title: "Microsoft Teams でキャプチャを有効にする",
                    body: "CaptionArc は、Teams 会議ツールバーからライブ キャプションをオンにすると開始できます。",
                    status: "自動的に起動します",
                    footer: "CaptionArc は、このタブにライブ キャプションが表示されるとすぐに自動的にキャプチャを開始します。",
                    troubleshooting: "キャプションが利用できない場合は、主催者または管理者のポリシーによってキャプションの制御が制限されている可能性があります。",
                    steps: {
                        openMore: {
                            title: "もっと開く",
                            detail: "上部の会議ツールバーを使用して、[その他] メニューを開きます。"
                        },
                        openLanguage: {
                            title: "オープンな言語とスピーチ",
                            detail: "[その他] 内で、[言語と音声] を選択します。"
                        },
                        chooseCaptions: {
                            title: "「ライブキャプションを表示」を選択します",
                            detail: "[ライブ キャプションを表示] を選択すると、CaptionArc がキャプション ウィンドウを自動的に検出します。"
                        }
                    }
                },
                zoomWeb: {
                    title: "Zoom Web App でキャプチャを有効にする",
                    body: "このブラウザ会議で Zoom Web App キャプションが有効になると、CaptionArc を開始できます。",
                    status: "キャプションを手動で有効にする",
                    footer: "CaptionArc は、このタブに Zoom キャプションが表示されるとすぐにキャプチャを開始します。",
                    troubleshooting: "一部の Zoom 会議では、デスクトップ アプリが優先されたり、主催者の設定に基づいてキャプション コントロールが制限されたりする場合があります。",
                    steps: {
                        openControls: {
                            title: "会議コントロールを開く",
                            detail: "Zoom Web App ウィンドウの下部にある会議中ツールバーを使用します。"
                        },
                        openMore: {
                            title: "もっと開く",
                            detail: "会議中のツールバーから [その他] メニューを開きます。"
                        },
                        openCaptions: {
                            title: "オープンキャプション",
                            detail: "[その他] 内で、[キャプション] サブメニューを開きます。"
                        },
                        chooseShow: {
                            title: "「キャプションを表示」を選択します",
                            detail: "[キャプションの表示] を選択すると、このタブで Zoom 字幕サーフェイスが利用できるようになります。"
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "ミーティングセッション",
            turns: "{count} ターン",
            chat: "{count} チャット",
            chatCaptureTooltip: "会議チャットのキャプチャが有効になっています。新しいサポートされている会議チャット メッセージは、このセッションとともに保存されます。",
            autoSummarySetupTooltip: "自動サマリーは、OpenAI セットアップが完了するまで一時停止されたままになります。",
            autoSummaryUnavailableTooltip: "自動サマリーは、OpenAI が再び利用可能になるまで一時停止されます。",
            autoSummaryReadyTooltip: "{profile} は、この会議が終了すると自動的に実行されます。",
            aiAlertSetupTooltip: "[設定] で OpenAI のセットアップを完了すると、翻訳、要約、アシスタント ガイダンスが復元されます。",
            aiAlertUnavailableTooltip: "{message} OpenAI に依存する会議ツールは、問題が解決されるまで一時停止されたままになります。",
            liveState: {
                awaitingReply: {
                    label: "返信待ち",
                    tooltip: "Capture は、このミーティングの開始決定を待っています。"
                },
                starting: {
                    label: "開始",
                    tooltip: "キャプチャが承認され、会議セッションの準備が行われています。"
                },
                off: {
                    label: "オフ",
                    tooltip: "このミーティングのキャプチャは起動プロンプトから却下されました。"
                },
                ended: {
                    label: "終了しました",
                    tooltip: "このセッションは終了しました。再参加して最後のセッションを続行するか、新しいセッションを開始してください。"
                },
                lobby: {
                    label: "ロビー",
                    tooltip: "会議に参加してセッション タイマーを開始し、フローをキャプチャします。"
                },
                live: {
                    label: "ライブ",
                    tooltip: "現在、このミーティングでキャプションがキャプチャされています。"
                },
                armed: {
                    label: "武装した",
                    tooltip: "キャプションが有効になり、オーバーレイは次の行を待っています。"
                },
                waiting: {
                    label: "待っています",
                    tooltip: "会議のキャプションはまだ有効になっていません。"
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "デフォルトは標準アクションです",
            timeoutHint: "デフォルトは {action} です",
            captureConsent: {
                title: "この会議のキ���プチャを有効にしますか?",
                body: "これをスキップすると、この会議訪問ではキャプチャはオフのままになります。",
                ariaLabel: "キャプチャ起動確認",
                secondaryAction: "今ではありません",
                primaryAction: "有効にする"
            },
            sessionContinuation: {
                title: "前のセッションを続けますか?",
                body: "退席後すぐに同じ会議に再参加しました。応答がない場合は、新しいセッションが開始されます。",
                ariaLabel: "セッション継続確認",
                secondaryAction: "新しいセッション",
                primaryAction: "続ける"
            },
            sessionEnded: {
                title: "セッションが終了しました",
                body: "ここに留まってキャプチャされたアイテムを確認するか、オーバーレイを閉じます。応答がない場合は閉じます。",
                ariaLabel: "セッション終了の確認",
                secondaryAction: "閉じる",
                primaryAction: "ここにいてください"
            }
        },
        assistant: {
            statusLabel: {
                queued: "キューに入れられました",
                working: "働く",
                ready: "準備完了",
                paused: "一時停止中",
                issue: "問題",
                unavailable: "利用不可",
                watching: "見てる"
            },
            statusDescription: {
                queued: "有用な瞬間が検出されました。",
                working: "ライブガイダンスを生成します。",
                latestReady: "最新のアシスタントガイダンスが用意されています。",
                ready: "アシスタントは次の瞬間に備えています。",
                paused: "このセッションではアシスタントがオフになっています。",
                issue: "アシスタントには注意が必要です。",
                unavailable: "OpenAI は現在利用できません。",
                watching: "役に立つ瞬間を待っています。"
            },
            emptyState: {
                setupTitle: "アシスタントを使用するには、OpenAI セットアップを完了してください",
                setupBody: "OpenAI のセットアップが不完全であるため、ライブ ガイダンスをまだ実行できません。",
                unavailableTitle: "アシスタントは一時的に利用できません",
                unavailableBody: "{message} アシスタントは、OpenAI が再び正常になった後に再開されます。",
                watchingTitle: "アシスタントがこの会議を見ています",
                watchingBody: "有用な質問、リクエスト、またはリスクが発生すると、ライブ ガイダンスがここに表示されます。",
                offTitle: "このセッションではアシスタントがオフになっています",
                offBody: "ライブガイダンスを再開したい場合は、いつでもオンに戻してください。",
                errorTitle: "アシスタントには注意が必要です",
                errorBody: "世代の問題によりライブ指導が中断されました。次の有効な時点で再試行されます。",
                preparingTitle: "アシスタントがガイダンスを準備中です",
                preparingBody: "有用な瞬間が検出され、最初のライブ ガイダンスが現在キューに入れられています。",
                workingTitle: "アシスタン��が働いています",
                workingBody: "現在の会議の瞬間に向けてライブ ガイダンスが生成されています。"
            },
            footer: {
                setup: "OpenAI セットアップを完了する",
                unavailable: "OpenAI は利用できません",
                sessionStartsAfterJoin: "参加後にセッションが開始されます",
                workingLiveGuidance: "ライブ指導に取り組んでいます",
                turnedOffForSession: "このセッションではオフになりました",
                generationNeedsAttention: "世代には注意が必要です",
                latestGuidanceReady: "最新のガイダンスが完成しました",
                watchingSession: "このセッションを見ていると",
                notes: "{count} メモ",
                liveCount: "{count} ライブ",
                aiAlertSetup: "アシスタント ガイダンスを実行する前に、[設定] で OpenAI のセットアップを完了してください。",
                aiAlertUnavailable: "{message} アシスタントのガイダンスは、OpenAI が再び利用可能になるまで一時停止されたままになります。"
            },
            source: {
                meetingChat: "ミーティングチャット",
                caption: "キャプション",
                unknownSpeaker: "不明"
            },
            pendingReply: "アシスタントは現時点で返信を準備しています。",
            ui: {
                toggleLiveLabel: "ライブ",
                readyTitle: "アシスタントの準備ができました",
                watchingSession: "このセッションを見ていると",
                watching: "見てる",
                waitingForMoment: "役に立つ瞬間を待っています。",
                headerTitle: "AIアシスタント",
                footerTitle: "AIアシスタント",
                panelAriaLabel: "AIアシスタントによるライブガイダンス",
                openSettings: "アシスタントの設定を開く",
                setupBeforeEnable: "アシスタントをオンにする前に OpenAI セットアップを完了してください",
                unavailableUntilOpenAi: "OpenAI が再び利用可能になるまで、アシスタントは利用できません",
                turnOffForSession: "このセッションではアシスタントをオフにする",
                turnOnForSession: "このセッションでアシスタントをオンにする",
                openPanel: "アシスタントパネルを開く",
                collapsePanel: "アシスタント パネルを折���たたむ",
                resizePanel: "アシスタントパネルのサイズ変更"
            }
        }
    },
    popup: {
        header: {
            devBadge: "開発者",
            openMeetingHistory: "会議履歴を開く",
            openSettings: "設定を開く"
        },
        setup: {
            verificationNotTested: "テストされていません",
            notConfigured: "OpenAI が構成されていません",
            setupRequired: {
                label: "セットアップが必要です",
                description: "OpenAI API キーを追加し、モデルを選択します。"
            },
            needsAttention: {
                label: "注意が必要です",
                description: "[設定] で OpenAI の設定を確認します。"
            },
            ready: {
                label: "準備完了",
                description: "OpenAI、モデル、およびターゲット言語はライブ出力の準備ができています。"
            },
            verifySetup: {
                label: "セットアップの確認",
                description: "[設定] で接続テストを 1 回実行して、OpenAI セットアップを確認します。"
            }
        },
        overlay: {
            badge: "オーバーレイ",
            title: "ライブ可視化",
            switchAriaLabel: "ライブオーバーレイの表示/非表示を切り替えます",
            switchDisabledTitle: "ライブ可視化を使用するには、設定でキャプチャの起動を有効にします。",
            state: {
                inactive: "非アクティブ",
                visible: "見える",
                hidden: "隠された"
            },
            mode: {
                captureStartupOff: "キャプチャの起動がオフになっています",
                available: "オーバーレイは引き続き利用可能",
                hidden: "オーバーレイは非表示のままになります"
            },
            helper: {
                captureStartupOff: "設定で [スタートアップ] を [確認する] または [常に] に設定すると、ライブ表示が利用可能になります。",
                instantToggle: "オープンな会議を瞬時に切り替えます。位置、サイズ、コンパクトな状態は会議アプリごとに記憶されます。"
            }
        },
        pulse: {
            title: "ワークスペースパルス"
        },
        rows: {
            live: {
                capturing: {
                    label: "ライブキャプチャー",
                    detail: "{platform} はこのタブでアクティブにリッスンしていま���。",
                    badge: "ライブ"
                },
                lobby: {
                    label: "参加したら準備完了",
                    detail: "{platform} はオープンしており、ロビーで待機しています。",
                    badge: "ロビー"
                },
                startupOff: {
                    label: "キャプチャの起動がオフになっています",
                    detail: "再びライブで聴きたいときは、スタートアップを「Ask」または「Always」に戻します。",
                    badge: "オフ"
                },
                idle: {
                    label: "ライブ会議はありません",
                    detail: "サポートされている会議タブを開くと、CaptionArc がここで起動します。",
                    badge: "アイドル状態"
                }
            },
            summary: {
                busy: {
                    label: "AIサマリーが機能しています",
                    detail: "会議の要約はバックグラウンドで組み立てられています。",
                    badge: "忙しい"
                },
                failed: {
                    label: "要約には注意が必要です",
                    detail: "最後のまとめはきれいに終わりませんでした。",
                    badge: "再試行"
                },
                automatic: {
                    label: "自動サマリーが有効になっています",
                    detail: "{profileName} は、各会議の終了後に独自に要約を開始します。",
                    badge: "自動"
                },
                manual: {
                    label: "手動要約モード",
                    detail: "現在キューに入れられているものはありません。サマリーは、ユーザーが要求した場合にのみ実行されます。",
                    badge: "マニュアル"
                },
                defaultProfileName: "デフォルトのプロファイル"
            },
            archive: {
                empty: {
                    label: "アーカイブはまだ空です",
                    detail: "キャプチャが実行されると、保存された会議と概要がここに収集され始めます。",
                    badge: "新しい"
                },
                ready: {
                    label: "{count} 件の会議を保存しました",
                    detail: "{used} が使用されました。 {updated}。"
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "まだ保存された会議はありません",
            updatedJustNow: "たった今更新されました",
            updatedMinutesAgo: "{minutes}��前に更新",
            updatedHoursAgo: "{hours}時間前に更新",
            updatedDaysAgo: "{days}日前に更新されました"
        },
        meta: {
            aiService: "AIサービス",
            model: "モデル",
            target: "ターゲット",
            startup: "スタートアップ",
            modelNotSelected: "未選択",
            pendingIndicator: "OpenAI はまだ検証されていません。",
            startupValues: {
                off: "オフ",
                always: "いつも",
                ask: "尋ねる"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
