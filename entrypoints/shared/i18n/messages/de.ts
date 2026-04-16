import type { UiMessageCatalog } from "../types";

export const deMessages = {
    common: {
        appName: "CaptionArc",
        quickAccess: "Schnellzugriff",
        actions: {
            cancel: "Abbrechen",
            clear: "Klar",
            close: "Schließen",
            collapse: "Zusammenbruch",
            confirmDelete: "Bestätigen Sie das Löschen",
            delete: "Löschen",
            expand: "Erweitern",
            hide: "Verstecken",
            loading: "Laden...",
            open: "Offen",
            show: "Zeigen",
            continue: "Weiter",
            working: "Arbeiten..."
        },
        brands: {
            openAi: "OpenAI"
        },
        noContentYet: "Noch kein Inhalt.",
        meetingPlatforms: {
            googleMeet: "Google Meet",
            microsoftTeams: "Teams",
            zoomWeb: "Zoom",
            generic: "Treffen"
        },
        theme: {
            group: "Thema",
            system: "Verwenden Sie ein Systemthema",
            light: "Verwenden Sie ein helles Thema",
            dark: "Verwenden Sie ein dunkles Thema"
        },
        optional: "(optional)",
        helpPopover: {
            eyebrow: "Feldhilfe",
            moreAbout: "Mehr zu {label}",
            close: "Hilfe schließen"
        },
        uiLanguage: {
            label: "Schnittstellensprache",
            description: "Wählen Sie die Sprache aus, die für Popup, Einstellungen, Verlauf und Benutzeroberfläche im Meeting verwendet wird.",
            system: "Verwenden Sie die Browsersprache",
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
            privacyPolicy: "Datenschutzrichtlinie",
            termsOfService: "Nutzungsbedingungen"
        },
        legal: {
            version: "Fassung {version}",
            copyright: "Urheberrecht © {year} CaptionArc"
        },
        notifications: {
            summaryReady: {
                title: "Zusammenfassung für {title} ist fertig",
                message: "Klicken Sie, um die vollständige Zusammenfassung im Besprechungsverlauf zu öffnen."
            }
        },
        firstRunTerms: {
            eyebrow: "Ersteinrichtung",
            title: "Bedingungen prüfen und akzeptieren, um fortzufahren",
            body: "CaptionArc benötigt eine einmalige Zustimmung zu den aktuellen Nutzungsbedingungen, bevor Sie mit der Einrichtung fortfahren.",
            version: "Versionsstand der Bedingungen {version}",
            reviewPrompt: "Prüfen Sie vor der Zustimmung die aktuellen Nutzungsbedingungen und die Datenschutzrichtlinie.",
            acceptanceNote: "Mit dem Fortfahren bestätigen Sie, dass Sie die aktuellen Nutzungsbedingungen geprüft haben und die Datenschutzrichtlinie verstehen.",
            declinedBody: "CaptionArc bleibt auf diesem Gerät inaktiv, weil die aktuellen Nutzungsbedingungen abgelehnt wurden.",
            declinedPrompt: "Prüfen Sie die aktuellen Bedingungen erneut, sobald Sie bereit sind fortzufahren.",
            declinedNote: "CaptionArc bleibt blockiert, bis die aktuellen Nutzungsbedingungen für dieses Gerät akzeptiert werden.",
            accept: "Bedingungen akzeptieren"
        },
        legalPages: {
            shared: {
                eyebrow: "Rechtliches",
                loadingDescription: "Die aktuelle veröffentlichte Fassung der rechtlichen Dokumente wird geladen."
            },
            privacyPolicy: {
                title: "Datenschutzrichtlinie",
                subtitle: "Eine In-Product-Kopie derselben Datenschutzrichtlinie, die im Repository veröffentlicht ist.",
                sourceNote: "Diese Seite rendert dieselbe Markdown-Quelle, die auch im Repository veröffentlicht wird, damit In-Product-Kopie und öffentliches Dokument übereinstimmen.",
                loadingTitle: "Datenschutzrichtlinie wird geladen"
            },
            termsOfService: {
                title: "Nutzungsbedingungen",
                subtitle: "Prüfen Sie die aktuellen Bedingungen, Verantwortlichkeiten und rechtlichen Grenzen für CaptionArc.",
                acceptEyebrow: "Ersteinrichtung",
                acceptSubtitle: "Scrollen Sie durch die aktuellen Bedingungen, bevor Sie sie auf diesem Gerät akzeptieren.",
                acceptPrompt: "Lesen Sie die aktuellen Nutzungsbedingungen, um die Zustimmung freizuschalten.",
                scrollRequired: "Scrollen Sie bis zum Ende des Dokuments, um die Zustimmung zu aktivieren.",
                scrollReady: "Sie haben das Ende der Bedingungen erreicht. Sie können jetzt akzeptieren und diese Seite schließen.",
                accept: "Akzeptieren und schließen",
                decline: "Ablehnen und schließen",
                declineNote: "Wenn Sie diesen Bedingungen nicht zustimmen, schließen Sie diese Seite und verwenden Sie CaptionArc nicht.",
                sourceNote: "Diese Seite rendert dieselbe Markdown-Quelle, die auch im Repository veröffentlicht wird, damit In-Product-Kopie und öffentliches Dokument übereinstimmen.",
                alreadyAcceptedTitle: "Aktuelle Bedingungen bereits akzeptiert",
                alreadyAcceptedBody: "Für dieses Gerät liegt bereits eine Zustimmung zur aktuellen Bedingungsversion vor.",
                declinedTitle: "Die aktuellen Bedingungen wurden auf diesem Gerät abgelehnt",
                declinedBody: "CaptionArc bleibt blockiert, bis die aktuelle Bedingungsversion auf diesem Gerät akzeptiert wird.",
                version: "Fassung {version}",
                loadingTitle: "Nutzungsbedingungen werden geladen"
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
            eyebrow: "Einstellungen",
            title: "CaptionArc Einstellungen",
            subtitle: "Konfigurieren Sie den gemeinsamen KI-Dienst, Besprechungsprofile, Live-Übersetzungsverhalten, Cloud-Schutz und Wiederherstellung über eine kompakte Bedienoberfläche.",
            openMeetingHistory: "Sitzungsgeschichte"
        },
        navigation: {
            title: "Einstellungskarte",
            description: "Bewegen Sie sich Abschnitt für Abschnitt durch die Konsole.",
            quickJump: "Schneller Sprung"
        },
        loading: "Laden...",
        snapshot: {
            aiEngine: "KI-Engine",
            serviceStatus: "Servicestatus",
            model: "Modell",
            primaryProfile: "Primäres Profil",
            theme: "Thema",
            cloudVault: "Cloud-Tresor",
            meetingUi: "Meeting-Benutzeroberfläche",
            none: "Keine",
            system: "System",
            light: "Licht",
            dark: "Dunkel",
            providerOne: "{count} Anbieter",
            providerOther: "{count} Anbieter",
            visibleClickThrough: "Sichtbar · Click-through",
            visibleInteractive: "Sichtbar · interaktiv",
            hidden: "Versteckt"
        },
        sections: {
            workspace: {
                eyebrow: "Arbeitsbereich",
                title: "Erfahrung und Vorgaben",
                description: "Legen Sie die gemeinsamen Standardeinstellungen einmal fest und trennen Sie dann visuelles Verhalten, Besprechungsablauf und Archivregeln klar voneinander.",
                shortLabel: "Arbeitsbereich",
                mapHint: "Standardeinstellungen für Darstellung, Besprechungsablauf und Archiv"
            },
            openAiService: {
                eyebrow: "OpenAI Dienst",
                title: "Gemeinsamer KI-Dienst",
                shortLabel: "OpenAI",
                mapHint: "Übersetzung, Zusammenfassungen und Assistent",
                description: "Verwalten Sie den gemeinsamen Dienst OpenAI, der von Live-Übersetzungen, Besprechungszusammenfassungen und dem Besprechungsassistenten verwendet wird."
            },
            translation: {
                eyebrow: "Übersetzung",
                title: "Live-Übersetzung",
                shortLabel: "Übersetzung",
                mapHint: "Verhalten und Optimierung von Live-Untertiteln",
                description: "Optimieren Sie, wie OpenAI die Übersetzung von Live-Untertiteln handhabt, ohne die Erstellung der Zusammenfassung oder das Verhalten des Assistenten zu ändern."
            },
            profiles: {
                eyebrow: "Treffen mit KI",
                title: "Besprechungsprofile",
                shortLabel: "Profile",
                mapHint: "Identität, Zusammenfassung und Assistent",
                description: "Besprechungsprofile definieren einmal einen Besprechungstyp und verwenden diese Identität dann für die Zusammenfassungserstellung und den Live-Assistenten wieder."
            },
            cloudSync: {
                eyebrow: "Cloud-Synchronisierung",
                title: "Persönlicher Cloud-Tresor",
                shortLabel: "Cloud-Synchronisierung",
                mapHint: "Archivschutz und Anbieter",
                description: "Verbinden Sie Google Drive, OneDrive oder beide, um ein lokales Archiv auf Ihren Geräten zu schützen."
            },
            dataRecovery: {
                eyebrow: "Erholung",
                title: "Datenwiederherstellung",
                shortLabel: "Erholung",
                mapHint: "Verschlüsseltes Backup und Reset",
                description: "Die Cloud-Synchronisierung ist der primäre Kontinuitätspfad. Verwenden Sie das verschlüsselte Archiv als Fallback-Backup oder löschen Sie das gespeicherte Archiv, wenn Sie einen sauberen Reset benötigen."
            }
        },
        workspace: {
            appearance: {
                title: "Aussehen",
                description: "Wählen Sie ein festes Thema oder lassen Sie CaptionArc Ihrem System automatisch folgen."
            },
            uiLanguage: {
                title: "Schnittstellensprache",
                description: "Wenden Sie eine Sprache für Popup, Einstellungen, Besprechungsverlauf und die Benutzeroberfläche während der Besprechung an."
            },
            meetingFlow: {
                title: "Besprechungsablauf",
                description: "Steuern Sie, wie CaptionArc mit der Aufnahme beginnt, hilft bei Untertiteln und entscheidet, ob bei einem erneut beigetretenen Meeting dieselbe Sitzung fortgesetzt werden soll."
            },
            captureStartup: {
                label: "Start erfassen",
                off: {
                    name: "Halten Sie die Erfassung ausgeschaltet",
                    description: "Initialisieren Sie die In-Meeting-Erfassungsbox nicht für unterstützte Meetings."
                },
                ask: {
                    name: "Fragen Sie bei jedem Treffen",
                    description: "Zeigen Sie eine kurze Genehmigungsaufforderung an, bevor eine Aufnahme beginnt. Dies ist die Standardeinstellung."
                },
                always: {
                    name: "Beginnen Sie immer mit der Aufnahme",
                    description: "Starten Sie den Capture-Flow sofort, ohne vorher zu fragen."
                }
            },
            captionActivation: {
                label: "Untertitelaktivierung",
                guided: {
                    name: "Geführt",
                    description: "Behalten Sie den aktuellen Fluss bei. CaptionArc zeigt Inline-Hilfe an, damit Sie Live-Untertitel für sich selbst aktivieren können."
                },
                automatic: {
                    name: "Wenn möglich automatisch",
                    description: "Nachdem Sie beigetreten sind, versucht CaptionArc einmal, Live-Untertitel automatisch zu aktivieren, wenn die Meeting-App dies unterstützt, und greift dann auf den geführten Ablauf zurück, wenn dies nicht möglich ist."
                }
            },
            sessionContinuation: {
                title: "Fenster zur Sitzungsfortsetzung",
                description: "Entscheiden Sie, wie lange CaptionArc nach der letzten Sitzungsaktivität (einschließlich des Zeitpunkts, zu dem Sie das Meeting verlassen) anbieten soll, dieselbe Sitzung fortzusetzen.",
                windowLabel: "Fenster",
                off: "Aus",
                oneHour: "1 Stunde",
                hours: "{count} Stunden",
                hoursMinutes: "{hours}h {minutes}m",
                minutes: "{minutes} min"
            },
            inMeetingSurfaces: {
                title: "Oberflächen für Besprechungen",
                description: "Gestalten Sie, wie die Live-Meeting-Oberflächen aussehen und sich verhalten, während sie auf dem Bildschirm angezeigt werden."
            },
            overlayOpacity: {
                title: "Deckkraft der Überlagerung",
                description: "Niedrigere Werte sorgen dafür, dass die Besprechung darunter besser sichtbar ist.",
                subtle: "Subtil",
                solid: "Solide"
            },
            overlayClickThrough: {
                label: "Click-through-Modus",
                description: "Lassen Sie Klicks durch die Live-Meeting-Oberflächen laufen, während sie sichtbar bleiben."
            },
            meetingArchive: {
                title: "Sitzungsarchiv",
                description: "Entscheiden Sie, welche Besprechungsdaten zur späteren Überprüfung, zum Export und zur Erstellung von Zusammenfassungen aufbewahrt werden sollen."
            },
            meetingArchiveRetention: {
        label: "Archiv-Aufbewahrungsfenster",
        description:
          "Wählen Sie, wie lange CaptionArc beendete, nicht markierte Sitzungen aufbewahren soll, bevor sie aus dem lokalen Archiv entfernt werden. Wählen Sie Aus, um jede automatische Archivlöschung zu deaktivieren.",
        off: "Aus",
        days: "{count} Tage",
        oneYear: "1 Jahr",
      },
      storeMeetingChat: {
                label: "Store-Meeting-Chat",
                description: "Speichern Sie unterstützte Besprechungschats, damit sie im Besprechungsverlauf, in Exporten und in Zusammenfassungen angezeigt werden können."
            }
        },
        legalRisk: {
            shared: {
                eyebrow: "Mit Vorsicht verwenden",
                warningLabel: "Rechts- und Datenschutzhinweis"
            },
            captureStartupAlways: {
                dialog: {
                    title: "Automatischer Capture-Start verringert Zustimmungsschutz",
                    body: "Dieser Modus überspringt die Freigabe pro Meeting und startet die Erfassung, sobald ein unterstütztes Meeting erkannt wird.",
                    pointOne: "Nutzen Sie ihn nur in Meetings, in denen Sie sicher sind, dass Sie aus dem Meeting abgeleitete Inhalte erfassen und aufbewahren dürfen.",
                    pointTwo: "Je nach aktivierten Funktionen können gespeicherte Untertitel oder Chats später für Zusammenfassungen, Live-Hinweise oder Exporte verwendet werden.",
                    pointThree: "Sie bleiben für alle Hinweis-, Einwilligungs-, Arbeitsplatz- oder Plattformanforderungen verantwortlich, die für Ihre Nutzung gelten.",
                    confirm: "Automatischen Capture-Start aktivieren"
                },
                warning: {
                    title: "Automatischer Capture-Start ist aktiv",
                    body: "CaptionArc überspringt die Freigabe pro Meeting. Lassen Sie dies nur dort aktiv, wo Sie aus dem Meeting abgeleitete Inhalte rechtmäßig erfassen und aufbewahren dürfen."
                }
            },
            captionActivationAutomatic: {
                dialog: {
                    title: "Automatische Untertitelaktivierung greift für Sie in die Meeting-App ein",
                    body: "Dieser Modus versucht, Live-Untertitel automatisch einzuschalten, wenn die unterstützte Meeting-Oberfläche dies erlaubt.",
                    pointOne: "Die automatische Aktivierung kann sensibler sein als der geführte Modus, weil sie die Meeting-Oberfläche jedes Mal ohne manuellen Schritt verändert.",
                    pointTwo: "Behalten Sie sie nur in Umgebungen bei, in denen eine automatische Untertitelaktivierung mit Ihrer Richtlinie und Ihrem Ablauf vereinbar ist.",
                    pointThree: "Sie bleiben dafür verantwortlich, diese Automatisierung nur dort zu nutzen, wo Anbieterregeln und Meeting-Erwartungen dies zulassen.",
                    confirm: "Automatische Untertitel aktivieren"
                },
                warning: {
                    title: "Automatische Untertitelaktivierung ist aktiv",
                    body: "CaptionArc versucht Untertitel automatisch einzuschalten, wenn der Anbieter dies unterstützt. Prüfen Sie diesen Modus sorgfältig für richtliniensensible Meetings."
                }
            },
            storeMeetingChat: {
                dialog: {
                    title: "Gespeicherter Meeting-Chat kann datenschutzsensibler sein",
                    body: "Wenn dies aktiviert bleibt, wird unterstützter Meeting-Chat Teil Ihres gespeicherten Meeting-Datensatzes und kann in Verlauf, Exporten und KI-gestützten Folgeabläufen erscheinen.",
                    pointOne: "Meeting-Chat kann sensiblere oder stärker identifizierende Inhalte enthalten als sichtbare Untertitel allein.",
                    pointTwo: "Gespeicherter Chat kann später in Zusammenfassungen, Übersetzungen und im Assistentenkontext verwendet werden, wenn diese Funktionen genutzt werden.",
                    pointThree: "Nutzen Sie die Chat-Speicherung nur dort, wo die Aufbewahrung dieses Inhalts zu Ihren Hinweis-, Einwilligungs- und Vertraulichkeitserwartungen passt.",
                    confirm: "Chat-Speicherung aktivieren"
                },
                warning: {
                    title: "Meeting-Chat-Speicherung ist aktiv",
                    body: "Unterstützter Meeting-Chat wird für Verlauf, Export und KI-gestützte Nachverfolgung aufbewahrt. Lassen Sie dies nur aktiviert, wenn diese Aufbewahrung angemessen ist."
                }
            }
        },
        openAiService: {
            title: "OpenAI Dienst",
            sectionDescription: "Verwalten Sie den gemeinsamen Dienst OpenAI, der von Live-Übersetzungen, Besprechungszusammenfassungen und dem Besprechungsassistenten verwendet wird.",
            sharedService: "Gemeinsamer Dienst",
            serviceName: "OpenAI (GPT)",
            serviceDescription: "Ein gemeinsamer OpenAI-Dienst ermöglicht Live-Übersetzungen, Besprechungszusammenfassungen und den Besprechungsassistenten.",
            setupDescription: "Fügen Sie den API-Schlüssel einmal hinzu, wählen Sie das Standard-GPT-Modell und bestätigen Sie den Zugriff, bevor Sie sich auf einen KI-gestützten Workflow verlassen.",
            verificationLabel: "Testen Sie die OpenAI-Verbindung",
            verifyingLabel: "Testen des aktuellen OpenAI-Setups",
            highlights: {
                translation: "Live-Übersetzung",
                summaries: "Besprechungszusammenfassungen",
                assistant: "Live-Assistent"
            },
            cards: {
                translationTitle: "Übersetzung",
                translationBody: "Live-Untertitel",
                summariesTitle: "Zusammenfassungen",
                summariesBody: "Ausgabe nach der Besprechung",
                assistantTitle: "Assistent",
                assistantBody: "Live-Anleitung"
            },
            state: {
                setupRequired: {
                    label: "Einrichtung erforderlich",
                    description: "Fügen Sie den API-Schlüssel hinzu und bestätigen Sie das Standard-GPT-Modell.",
                    impact: "KI-gestützte Funktionen bleiben erst verfügbar, wenn der Dienst OpenAI vollständig konfiguriert ist."
                },
                actionRequired: {
                    label: "Aktion erforderlich",
                    impact: "KI-gestützte Funktionen sind möglicherweise nicht verfügbar, bis der Dienst OpenAI wieder funktioniert."
                },
                ready: {
                    label: "Bereit",
                    impact: "OpenAI steht für Übersetzungen, Zusammenfassungen und Live-Anleitungen zur Verfügung."
                },
                checking: {
                    label: "Überprüfen",
                    impact: "Eine Verbindungsprüfung wird durchgeführt. Das Ergebnis aktualisiert jeden KI-gestützten Bereich des Produkts."
                },
                needsVerification: {
                    label: "Muss überprüft werden",
                    description: "Führen Sie einmal eine Verbindungsprüfung durch, um den aktuellen Schlüssel und das aktuelle Modell zu bestätigen.",
                    impact: "Die Einstellungen können weiterhin bearbeitet werden, die KI-Ausgabe sollte jedoch bis zur Überprüfung des Dienstes als unbestätigt behandelt werden."
                }
            },
            banners: {
                needsAttention: "OpenAI braucht Aufmerksamkeit",
                finishSetup: "Beenden Sie das OpenAI-Setup",
                verifySetup: "Überprüfen Sie das OpenAI-Setup"
            },
            apiKeyInput: {
                label: "API-Schlüssel",
                provider: "OpenAI",
                storedLocally: "Lokal gespeichert",
                credential: "Geheimer Ausweis",
                show: "API-Schlüssel anzeigen",
                hide: "API-Schlüssel ausblenden",
                helper: "Dieser Schlüssel verbleibt auf diesem Gerät und wird für Übersetzungen, Zusammenfassungen und Live-Anleitungen verwendet.",
                guide: "OpenAI API-Schlüsselhandbuch"
            },
            modelLabel: "Modell"
        },
        models: {
            gpt5Mini: {
                description: "Beste Standardeinstellung für Live-Übersetzungen: schnell, zuverlässig und hohe Qualität für verrauschte Untertitel.",
                badge: "Empfohlen"
            },
            gpt52: {
                description: "Am besten, wenn Übersetzungsgenauigkeit und -nuancen wichtiger sind als Latenz oder Kosten.",
                badge: "Höchste Qualität"
            },
            gpt51: {
                description: "Starkes Allround-Modell mit ausgewogenem Qualitäts-Geschwindigkeits-Profil."
            },
            gpt5: {
                description: "Das führende GPT-5-Modell, wenn Sie eine stärkere allgemeine Qualität als bei Mini oder Nano möchten, ohne zu GPT-5.2 zu wechseln.",
                badge: "Flaggschiff"
            },
            gpt5Nano: {
                description: "Option mit der niedrigsten Latenz für sehr schnelle Antworten und einfachere Ausgabequalität.",
                badge: "Am schnellsten"
            },
            gpt41: {
                description: "Stabile Legacy-Auswahl, wenn Sie ein bewährtes Allzweck-Übersetzungsmodell bevorzugen.",
                badge: "Vermächtnis"
            },
            gpt41Mini: {
                description: "Kostengünstigere Variante GPT-4.1 für geringeren Arbeitsaufwand und mäßige Übersetzungsqualität.",
                badge: "Leichter"
            },
            gpt41Nano: {
                description: "Die kleinste GPT-4.1-Option für sehr leichte Aufgaben, bei denen Kosten und Latenz am wichtigsten sind."
            },
        },
        help: {
          apiKey: `Füge den OpenAI-API-Schlüssel ein, den CaptionArc auf diesem Gerät verwenden soll.

- Der Schlüssel bleibt nur auf diesem Gerät und geht nicht in Sync oder Backup-Export ein.
- Nutze am besten einen Schlüssel, der zu deiner Zugriffs- und Kostenpolitik passt.
- Wenn die Verifizierung fehlschlägt, prüfe Schlüsselstatus, Guthaben und Modellzugriff.`,
          model: `Wähle das OpenAI-Modell für Live-Übersetzung, Zusammenfassungen und Assistentenantworten.

- Leichtere Modelle reagieren in Meetings meist schneller.
- Stärkere Modelle schreiben oft besser, können aber langsamer und teurer sein.
- Wenn du unsicher bist, lass die empfohlene Standardeinstellung aktiv.

Beispiel: Nutze im Live-Meeting ein schnelleres Modell und wechsle später zu einem stärkeren, wenn die Qualität der Zusammenfassung wichtiger ist.`,
          uiLanguage: `Diese Einstellung ändert die Sprache der CaptionArc-Oberfläche selbst.

- Sie wirkt sich auf Einstellungen, Meeting-Verlauf, Schnellansichten und UI-Texte im Meeting aus.
- Sie ändert nicht automatisch die Sprache der Live-Übersetzung oder der Zusammenfassungen.
- Nutze die Browser-/Systemoption, wenn CaptionArc der Umgebung automatisch folgen soll.`,
          translationInstructions: `Diese Hinweise werden mit jeder Live-Übersetzungsanfrage gesendet.

- Halte sie kurz und konkret.
- Nutze sie für Begriffe, Tonfall und Regeln zur Untertitel-Bereinigung.
- Lange, richtlinienartige Prompts machen Live-Übersetzung meist langsamer und instabiler.

Beispiel: \`Produktnamen auf Englisch lassen und kurze Untertitel-Sätze bevorzugen.\``,
          captureStartupBehavior: `Das steuert, was passiert, wenn CaptionArc ein unterstütztes Meeting erkennt.

- **Fragen** zeigt vor dem Start eine Bestätigung pro Meeting.
- **Immer** startet die Erfassung ohne zusätzliche Rückfrage.
- **Aus** lässt die Erfassung inaktiv, bis du sie manuell einschaltest.

Wenn du den sichereren Standard willst, nimm **Fragen**.`,
          captionActivationBehavior: `Das steuert, wie Meeting-Untertitel eingeschaltet werden.

- **Geführt** überlässt dir den letzten Schritt.
- **Automatisch** versucht Untertitel selbst zu aktivieren, wenn die Oberfläche es zulässt.
- Der automatische Modus ist sensibler, weil er mit der Meeting-Oberfläche für dich interagiert.

Nimm **Geführt**, solange automatische Aktivierung nicht wirklich nötig ist.`,
          sessionContinuationWindow: `Dieses Zeitfenster bestimmt, wie lange CaptionArc dieselbe Sitzung fortführen darf, wenn du demselben Meeting erneut beitrittst.

- Kürzere Fenster erzeugen öfter neue Sitzungen.
- Längere Fenster halten zusammengehörige Wiedereintritte in derselben Sitzung.
- \`0 Minuten\` bedeutet: Jeder Wiedereintritt startet eine neue Sitzung.

Beispiel: Bei \`120 Minuten\` kann ein Meeting, das um 10:00 endet, bis 12:00 noch in derselben Sitzung weiterlaufen, wenn du demselben Meeting erneut beitrittst.`,
          overlayClickThrough: `Damit steuerst du, ob das Overlay im Meeting Mausklicks abfängt oder durchlässt.

- Aktiviere es, wenn Klicks durch das Overlay zum eigentlichen Meeting gelangen sollen.
- Deaktiviere es, wenn du direkt mit CaptionArc-Steuerelementen auf dem Overlay arbeiten willst.
- Klickdurchleitung ist gut zum passiven Lesen, aber unpraktischer, wenn du oft Bedienelemente anpasst.`,
          meetingArchiveRetention: `Das steuert die automatische Bereinigung beendeter, nicht markierter Sitzungen im lokalen Archiv.

- Kürzere Zeiträume löschen alte Historie früher.
- Längere Zeiträume behalten mehr Verlauf auf dem Gerät.
- **Aus** deaktiviert jede automatische Archiv-Löschung.

Markierte Sitzungen bleiben weiterhin vor automatischem Löschen geschützt.`,
          storeMeetingChat: `Das steuert, ob unterstützter Meeting-Chat Teil des gespeicherten Meeting-Datensatzes wird.

- Wenn aktiviert, kann Chat in Verlauf, Exporten, Zusammenfassungen und Assistenten-Kontext auftauchen.
- Chat enthält oft sensiblere Namen, Entscheidungen oder Links als sichtbare Untertitel.
- Lass es aus, wenn das Speichern von Chat nicht klar zu deinen Richtlinien und Vertraulichkeitsanforderungen passt.`,
          meetingOutputLanguage: `Legt die Standardsprache für Meeting-Ausgaben wie Zusammenfassungen und Meeting-AI-Antworten fest.

- Das ist getrennt von der UI-Sprache und von Live-Übersetzung.
- Wähle die Sprache, in der du das Ergebnis meistens lesen willst.
- Bei Bedarf kannst du die Ausgabesprache später trotzdem ändern.`,
          profileName: `Dieser Name identifiziert ein Meeting-Profil in den Einstellungen und in nachgelagerten KI-Abläufen.

- Halte ihn kurz genug, damit er sich in der Profilliste schnell erfassen lässt.
- Benenne den Meeting-Typ, nicht ein einzelnes einmaliges Meeting.
- Ein guter Name macht sofort klar, wann dieses Profil wieder verwendet werden sollte.

Beispiel: Customer Discovery, Wöchentlicher Team-Check-in oder Board-Update.`,
          profileDescription: `Diese Beschreibung gibt einen schnellen menschlichen Kontext dazu, wann das Meeting-Profil verwendet werden sollte.

- Beschreibe Zweck, Zielgruppe oder typischen Rhythmus des Meetings kurz und konkret.
- Halte den Text knapp, damit du das richtige Profil auf einen Blick erkennst.
- Das ist Profil-Metadaten, nicht der Ort für lange KI-Anweisungen.

Beispiel: Wöchentliche bereichsübergreifende Review mit Leads aus Produkt, Design und Engineering.`,
          autoSummary: `Legt fest, ob dieses Profil nach Meeting-Ende automatisch eine Zusammenfassung erzeugen soll.

- Aktiviere es für wiederkehrende Meeting-Typen, bei denen du fast immer eine Zusammenfassung willst.
- Lass es aus, wenn du Zusammenfassungen nur bei Bedarf willst.
- Automatische Zusammenfassungen brauchen trotzdem eine gültige OpenAI-Einrichtung und gespeicherte Meeting-Daten.`,
          summaryEffort: `Steuert, wie viel KI-Aufwand für die Zusammenfassung dieses Profils eingesetzt wird.

- Weniger Aufwand ist schneller und günstiger.
- Mehr Aufwand passt besser zu langen oder unordentlichen Meetings.
- Wenn du unsicher bist, ist **Ausgewogen** meist der sicherste Standard.`,
          summaryInstructions: `Diese Hinweise formen den Zusammenfassungsstil für dieses Profil.

- Nutze sie für Struktur, Zielgruppe und wiederkehrende Begriffe.
- Halte sie auf die Zusammenfassung bezogen, nicht auf Live-Assistentenverhalten.
- Kurze, konkrete Hinweise funktionieren meist besser als lange Richtlinientexte.

Beispiel: \`Zuerst eine Executive Summary, dann Aktionspunkte mit Verantwortlichen.\``,
          assistantEnabled: `Schaltet Meeting AI für dieses Profil ein oder aus.

- Wenn es aus ist, bleiben die restlichen Meeting-AI-Einstellungen sichtbar, wirken aber nicht auf Live-Hinweise.
- Aktiviere es nur für Meeting-Typen, bei denen Live-Vorschläge wirklich helfen.
- Jedes Profil kann eigene Meeting-AI-Standards haben.`,
          assistantResponseIntent: `Bestimmt die Hauptaufgabe, auf die Meeting AI in diesem Profil optimiert wird.

- Damit steuerst du, ob der Assistent eher antwortet, coacht, zusammenfasst oder Risiken zeigt.
- Es ändert nicht nur die Formulierung, sondern die Richtung der Vorschläge.
- Wähle die Intention, die am besten zu deinem typischen Bedarf in diesem Meeting passt.`,
          assistantResponseFormat: `Steuert die Form der Meeting-AI-Antworten.

- Kurze Bullet-Formate lassen sich im Live-Meeting schneller scannen.
- Sprechnahe Formate sind besser, wenn du Text direkt laut verwenden willst.
- Wähle das Format, das du unter Zeitdruck am leichtesten nutzen kannst.`,
          assistantResponseDepth: `Legt fest, wie knapp oder ausführlich Meeting-AI-Antworten sein sollen.

- Weniger Tiefe ist besser für Tempo und schnelles Erfassen.
- Mehr Tiefe gibt mehr Kontext und Begründung, kann live aber schwerer wirken.
- Für schnelle Calls eher leichter, für Strategie-Meetings eher tiefer einstellen.`,
          assistantResponseTone: `Legt die Standardtonalität von Meeting AI fest.

- Der Ton kann Vorschläge direkter, neutraler oder diplomatischer wirken lassen.
- Die Kernaussage ändert sich nicht, aber die Wirkung schon.
- Richte ihn eher nach dem sozialen Kontext des Meetings als nach rein persönlicher Vorliebe aus.`,
          assistantDeliveryBias: `Steuert den Kompromiss zwischen schneller Ausgabe und vollständigerer Hilfe.

- Schnellere Ausgabe ist besser, wenn Timing am wichtigsten ist.
- Vollständigere Ausgabe ist besser, wenn Nuance wichtiger ist als Latenz.
- Wenn du unsicher bist, bleib bei der mittleren Einstellung.`,
          assistantTriggerPolicy: `Legt fest, wann Meeting AI im Verlauf des Meetings Hinweise geben soll.

- Vorsichtige Richtlinien reduzieren Rauschen.
- Aktivere Richtlinien liefern mehr Hinweise, können aber öfter stören.
- Wähle die niedrigste Stufe, die dir an den wichtigen Momenten noch hilft.`,
          assistantParticipantScope: `Bestimmt, wessen Sprechen oder Aktivität die Vorschläge von Meeting AI beeinflussen soll.

- Engere Bereiche halten den Assistenten auf die für deine Rolle wichtigsten Personen fokussiert.
- Breitere Bereiche helfen bei einem Raum-übergreifenden Gesprächsbild.
- Verenge den Bereich, wenn der Assistent zu unruhig oder leicht ablenkbar wirkt.`,
          assistantInstructions: `Diese Hinweise passen das Verhalten von Meeting AI für dieses Profil an.

- Nutze sie für Antwortstil, wiederkehrende Vorgaben und domänenspezifische Erwartungen.
- Halte sie getrennt von Zusammenfassungs- und Live-Übersetzungsregeln.
- Wenige stabile Regeln funktionieren meist besser als viele Sonderfälle.

Beispiel: \`Kurze Talking Points priorisieren und versteckte Risiken vor der Antwort hervorheben.\``,
        },
        translation: {
            bestFor: {
                title: "Am besten für",
                description: "Ton, technische Terminologie, Umgang mit Abkürzungen und Bereinigung verrauschter Untertitel."
            },
            keepLean: {
                title: "Halten Sie es schlank",
                description: "Kürzere Anweisungen werden in der Regel schneller übersetzt und bleiben bei Live-Untertiteln stabiler."
            },
            avoid: {
                title: "Vermeiden",
                description: "Lange Richtlinien, sich wiederholende Regeln oder Formatierungsanforderungen, die jede Untertitelanfrage verlangsamen."
            },
            instructionsLabel: "Live-Übersetzungsanweisungen",
            instructionsHint: "Wird auf jede Übersetzungsanfrage für Untertitel angewendet. Verwenden Sie es zur Bereinigung von Untertiteln, zur Terminologie und zum Ton der Übersetzung."
        },
        profiles: {
            identity: {
                eyebrow: "Profilidentität",
                description: "Diese Felder definieren das Meeting-Typ-Profil selbst. Sie werden von der Zusammenfassungsgenerierung und dem Live-Assistenten gemeinsam genutzt.",
                nameLabel: "Profilname",
                namePlaceholder: "Tägliche Synchronisierung",
                descriptionLabel: "Kurze Beschreibung",
                descriptionPlaceholder: "Wiederkehrender Team-Check-in"
            },
            summary: {
                eyebrow: "Zusammenfassung",
                description: "Diese Einstellungen beeinflussen, wie dieses Besprechungsprofil Zusammenfassungen generiert: wie viel KI-Aufwand es verbraucht und welche Anweisungen während der Zusammenfassungserstellung ausgeführt werden.",
                autoSummaryLabel: "Automatische Zusammenfassung am Ende des Meetings",
                autoSummaryDescription: "Wenn dieses Profil aktiv ist, startet nach Ende des Meetings automatisch eine Zusammenfassung.",
                effortLabel: "Zusammenfassender Aufwand",
                instructionsLabel: "Zusammenfassende Anweisungen",
                instructionsHint: "Wird verwendet, wenn dieser Besprechungstyp aus dem Besprechungsverlauf ausgewählt wird.",
                modes: {
                    economy: {
                        name: "Wirtschaft",
                        description: "Geringere KI-Arbeit. Am besten für kürzere Meetings geeignet, bei denen Geschwindigkeit am wichtigsten ist.",
                        badge: "Am schnellsten"
                    },
                    balanced: {
                        name: "Ausgewogen",
                        description: "Empfohlen. Passt die Zusammenfassungsstrategie für Zuverlässigkeit an, ohne zusätzliche KI-Arbeit zu beanspruchen."
                    },
                    thorough: {
                        name: "Gründlich",
                        description: "Verwendet mehr KI-Arbeit für längere oder komplexere Besprechungen, um Zusammenfassungsfehler zu reduzieren.",
                        badge: "Am langsamsten"
                    }
                }
            },
            assistant: {
                eyebrow: "Assistent",
                description: "Diese Einstellungen legen fest, wie sich die Live-Anleitung verhält, wenn dieses Besprechungsprofil aktiv ist.",
                enabledLabel: "Verwenden Sie den Assistenten mit diesem Profil",
                enabledDescription: "Wenn es aktiviert ist, kann dieses Besprechungsprofil Live-Anleitungen in unterstützten Besprechungen generieren.",
                disabledHint: "Die Assistant-Einstellungen bleiben hier sichtbar, sodass Sie sie später überprüfen oder anpassen können. Sie bleiben jedoch gesperrt, bis dieses Profil aktiviert wird.",
                responseIntentLabel: "Primärer Führungsmodus",
                responseFormatLabel: "Antwortformat",
                responseDepthLabel: "Reaktionstiefe",
                responseToneLabel: "Antwortton",
                deliveryBiasLabel: "Geschwindigkeit vs. Vollständigkeit",
                triggerPolicyLabel: "Wann die Führung auslösen soll",
                participantScopeLabel: "Wer kann Führung auslösen?",
                instructionsLabel: "Anweisungen des Assistenten",
                instructionsHint: "Wird verwendet, wenn dieses Besprechungsprofil aktiv ist und der Assistent eine Live-Anleitung generiert.",
                intents: {
                    answerForMe: {
                        name: "Antwort für mich",
                        description: "Entwerfen Sie die stärkste direkte Antwort, die der Benutzer derzeit geben kann."
                    },
                    improveMyAnswer: {
                        name: "Verbessere meine Antwort",
                        description: "Verschärfen Sie das, was der Benutzer bereits zu sagen scheint."
                    },
                    suggestNextPoint: {
                        name: "Schlagen Sie den nächsten Punkt vor",
                        description: "Bieten Sie den nächsten nützlichen Gesprächspunkt an, um das Meeting voranzubringen."
                    },
                    summarizeRecentTurn: {
                        name: "Fassen Sie die letzte Runde zusammen",
                        description: "Komprimieren Sie den neuesten Austausch in einer kurzen, brauchbaren Zusammenfassung."
                    },
                    surfaceRisks: {
                        name: "Oberflächenrisiken",
                        description: "Heben Sie Risiken, Lücken oder Einwände hervor, die Aufmerksamkeit verdienen."
                    },
                    coachMe: {
                        name: "Coache mich",
                        description: "Leiten Sie den Benutzer an, wie er im jeweiligen Moment effektiver reagieren kann."
                    }
                },
                formats: {
                    bullets: {
                        name: "Kugeln",
                        description: "Sehr kurze scanfreundliche Aufzählungspunkte.",
                        badge: "Am schnellsten"
                    },
                    talkingPoints: {
                        name: "Gesprächsthemen",
                        description: "Kurze gesprochene Punkte, die der Benutzer natürlich sagen kann."
                    },
                    shortParagraph: {
                        name: "Kurzer Absatz",
                        description: "Ein kompakter Absatz, wenn sich Kugeln zu abgehackt anfühlen würden."
                    },
                    structuredSections: {
                        name: "Strukturierte Abschnitte",
                        description: "Segmentieren Sie die Antwort in kleine, beschriftete Abschnitte, wenn es auf Klarheit ankommt.",
                        badge: "Am langsamsten"
                    },
                    script: {
                        name: "Skript",
                        description: "Schreiben Sie eine wörtlichere Formulierung, der der Benutzer genau folgen kann."
                    }
                },
                depths: {
                    ultraBrief: {
                        name: "Ultrakurz",
                        description: "Minimale Antwort für höchste Geschwindigkeit.",
                        badge: "Am schnellsten"
                    },
                    brief: {
                        name: "Kurz",
                        description: "Kurz und praktisch. Guter Standard für Live-Meetings."
                    },
                    standard: {
                        name: "Standard",
                        description: "Etwas mehr Kontext, wenn Geschwindigkeit immer noch wichtig ist."
                    },
                    expanded: {
                        name: "Erweitert",
                        description: "Weitere Erklärungen, wenn eine ausführlichere Antwort nützlich ist.",
                        badge: "Am langsamsten"
                    }
                },
                tones: {
                    neutral: {
                        name: "Neutral",
                        description: "Ausgewogen und professionell."
                    },
                    direct: {
                        name: "Direkt",
                        description: "Prägnanter und fester."
                    },
                    supportive: {
                        name: "Unterstützend",
                        description: "Hilfreich und beruhigend, ohne vage zu sein."
                    },
                    confident: {
                        name: "Zuversichtlich",
                        description: "Stark und entscheidend, wenn der Benutzer eine schärfere Formulierung benötigt."
                    },
                    analytical: {
                        name: "Analytisch",
                        description: "Argumentationsorientierter und strukturierter."
                    }
                },
                delivery: {
                    fastest: {
                        name: "Am schnellsten",
                        description: "Der Schwerpunkt liegt stark auf Geschwindigkeit und schnellem Nutzen.",
                        badge: "Beste Geschwindigkeit"
                    },
                    balanced: {
                        name: "Ausgewogen",
                        description: "Tauschen Sie etwas Geschwindigkeit gegen eine bessere Vollständigkeit ein."
                    },
                    careful: {
                        name: "Vorsicht",
                        description: "Bevorzugen Sie eine höhere Vollständigkeit, wenn das Meeting dies zulässt.",
                        badge: "Am langsamsten"
                    }
                },
                trigger: {
                    questionsAndRequests: {
                        name: "Fragen und Wünsche",
                        description: "Lösen Sie hauptsächlich bei frage- oder anfrageähnlichen Wendungen aus.",
                        badge: "Niedrigste Belastung"
                    },
                    salienceFirst: {
                        name: "Relevanz zuerst",
                        description: "Reagieren Sie auch auf wichtige Probleme, Entscheidungen oder Spannungspunkte."
                    },
                    proactive: {
                        name: "Proaktiv",
                        description: "Am eifrigsten Modus. Verwenden Sie diese Option nur, wenn Sie weitere unaufgeforderte Hilfe benötigen.",
                        badge: "Höchste Belastung"
                    }
                },
                scope: {
                    everyone: {
                        name: "Jeder",
                        description: "Betrachten Sie sowohl den Benutzer als auch andere Teilnehmer als gültige Auslöser.",
                        badge: "Schwerer"
                    },
                    othersOnly: {
                        name: "Nur andere",
                        description: "Ignorieren Sie bei der Entscheidung, ob der Benutzer antwortet, die eigenen Züge.",
                        badge: "Leichter"
                    }
                }
            },
            badges: {
                primary: "Primär",
                alwaysAvailable: "Immer verfügbar",
                customProfile: "Benutzerdefiniertes Profil",
                assistantOn: "Assistent an",
                autoSummary: "Automatische Zusammenfassung"
            },
            editor: {
                title: "Editor für Besprechungsprofile",
                description: "Wählen Sie ein Profil aus und bearbeiten Sie dann seine gemeinsame Identität, sein Zusammenfassungsverhalten und sein Live-Assistentenverhalten an einem Ort.",
                addProfile: "Besprechungsprofil hinzufügen",
                listTitle: "Profile",
                totalCount: "{count} insgesamt",
                defaultOutputLanguage: "Standard-AI-Ausgabesprache",
                untitled: "Unbenanntes Profil",
                noDescription: "Noch keine Beschreibung.",
                noShortDescription: "Für dieses Profil gibt es noch keine Kurzbeschreibung.",
                setAsPrimary: "Als primär festlegen",
                builtInTitle: "Integriertes Standardprofil",
                builtInDescription: "Dieses Profil bietet CaptionArc einen sicheren Allzweck-Fallback sowohl für die Zusammenfassungserstellung als auch für die Live-Anleitung, wenn kein spezieller Besprechungstyp passt.",
                newName: "Neuer Besprechungstyp",
                newDescription: "Benutzerdefiniertes Besprechungsprofil",
                newPrompt: "Fassen Sie dieses Treffen genau in der gewünschten Sprache zusammen. Konzentrieren Sie sich auf die Punkte, die für diesen Besprechungstyp am wichtigsten sind."
            }
        },
        cloudSync: {
            providers: {
                googleDrive: {
                    title: "Google Drive App-Datenordner",
                    subtitle: "Privater Erweiterungsspeicher in Ihrem Google-Konto."
                },
                oneDrive: {
                    title: "OneDrive App-Ordner",
                    subtitle: "Privater Erweiterungsspeicher in Ihrem Microsoft-Konto."
                }
            },
            actions: {
                refreshStatus: "Status aktualisieren",
                connect: "Verbinden",
                retryNow: "Versuchen Sie es jetzt noch einmal",
                reconnect: "Wieder verbinden",
                disconnect: "Trennen"
            },
            overview: {
                title: "Tresorübersicht",
                loadingDescription: "Der aktuelle Cloud-Synchronisierungsstatus für dieses Gerät wird geladen.",
                offDescription: "Es sind noch keine persönlichen Cloud-Anbieter angeschlossen.",
                needsAttentionDescription: "Mindestens ein Cloud-Ziel muss eingegriffen werden, bevor das Archiv wieder vollständig geschützt ist.",
                syncingDescription: "Der Tresor gleicht aktiv lokale und Remote-Änderungen im Hintergrund ab.",
                upToDateDescription: "Die angeschlossenen Cloud-Ziele werden mit dem aktuellen lokalen Archiv eingeholt."
            },
            stats: {
                currentDevice: "Aktuelles Gerät",
                connectedProviders: "Angeschlossene Anbieter",
                connectedProvidersNone: "Noch keine Cloud-Ziele verbunden",
                connectedProvidersOne: "Ein Cloud-Ziel ist aktiv",
                connectedProvidersTwo: "Beide Cloud-Ziele sind aktiv",
                lastSuccessfulSync: "Letzte erfolgreiche Synchronisierung",
                lastSuccessfulSyncHint: "Basierend auf dem letzten erfolgreichen Anbieter-Checkpoint.",
                queueStatus: "Warteschlangenstatus"
            },
            queue: {
                noQueuedChanges: "Keine Änderungen in der Warteschlange",
                queuedChanges: "{count} Änderungen in der Warteschlange",
                engineProcessing: "Die Engine verarbeitet gerade Arbeiten.",
                tasksReady: "{count} Aufgaben sind für die nächste Ausführung bereit.",
                engineIdle: "Der Motor bleibt bis zur nächsten lokalen oder Remote-Änderung im Leerlauf."
            },
            syncHealth: {
                title: "Gesundheit synchronisieren",
                attention: "Achtung",
                status: "Status"
            },
            pendingChoice: {
                title: "In der Cloud sind bereits freigegebene Einstellungen vorhanden",
                badge: "Auswahl erforderlich",
                description: "Dieses Gerät verfügt bereits über eigene gemeinsame Einstellungen und der verbundene Cloud-Tresor verfügt über einen anderen Satz. Wählen Sie aus, welcher der Ausgangspunkt für die zukünftige Synchronisierung sein soll.",
                source: "Quelle: {provider}",
                keepLocal: "Behalten Sie die freigegebenen Einstellungen dieses Geräts bei",
                useCloud: "Verwenden Sie freigegebene Cloud-Einstellungen"
            },
            providerCard: {
                account: "Konto",
                lastSuccessfulSync: "Letzte erfolgreiche Synchronisierung",
                providerStatus: "Anbieterstatus"
            },
            scope: {
                sharedTitle: "Geräteübergreifend synchronisiert",
                localTitle: "Nur dieses Gerät",
                shared: {
                    meetingSessions: "Besprechungssitzungen",
                    translations: "Übersetzungen",
                    summaries: "Zusammenfassungen",
                    meetingProfiles: "Besprechungsprofile",
                    sharedSettings: "Geteilte Einstellungen"
                },
                local: {
                    apiKeys: "API-Schlüssel",
                    verificationStatus: "Verifizierungsstatus",
                    deviceIdentity: "Geräteidentität"
                }
            },
            health: {
                syncing: "Synchronisierung",
                upToDate: "Auf dem neuesten Stand",
                retryingAutomatically: "Automatischer Wiederholungsversuch",
                needsAttention: "Braucht Aufmerksamkeit",
                actionRequired: "Aktion erforderlich",
                off: "Aus"
            },
            connection: {
                notConnectedTitle: "Nicht verbunden",
                notConnectedDescription: "Stellen Sie eine Verbindung her, um mit dem Schutz dieses Archivs zu beginnen.",
                connectedTitle: "Verbunden",
                connectedAt: "Verbunden {time}"
            },
            sync: {
                notYet: "Noch nicht",
                scannedAt: "Gescannt {time}",
                noScanRecorded: "Noch kein Scan aufgezeichnet."
            },
            statusMessage: {
                disconnected: "Nicht verbunden. Dieser Anbieter erhält keine Updates.",
                manualRetryAvailable: "Automatische Wiederholungsversuche angehalten. Sie können einen manuellen Wiederholungsversuch auslösen.",
                syncing: "Lokale und Remote-Änderungen werden jetzt synchronisiert.",
                retryingAutomatically: "Automatischer Wiederholungsversuch im Hintergrund.",
                needsAttention: "Benötigt Aufmerksamkeit, bevor der Schutz vollständig wiederhergestellt ist.",
                actionRequired: "Bevor die Synchronisierung fortgesetzt werden kann, sind manuelle Maßnahmen erforderlich.",
                upToDate: "Anbieter ist vollständig synchronisiert.",
                connectedWaiting: "Verbunden und auf Arbeit wartend."
            }
        },
        dataRecovery: {
            backupFile: {
                title: "Verschlüsselte Sicherungsdatei",
                description: "Das exportierte Backup enthält Ihre gemeinsamen Einstellungen, Besprechungsprofile, gespeicherten Besprechungssitzungen, Transkripte, den Chatverlauf, Übersetzungen und Zusammenfassungen. Gerätespezifische Geheimnisse wie der OpenAI-API-Schlüssel bleiben aus dem Backup heraus. Verwenden Sie es, wenn die Cloud-Synchronisierung nicht verfügbar ist oder Sie einen tragbaren verschlüsselten Schnappschuss benötigen.",
                export: "Alle Daten exportieren",
                import: "Sicherungsdatei importieren"
            },
            passphrase: {
                label: "Backup-Passphrase",
                placeholder: "Verwenden Sie mindestens 8 Zeichen",
                show: "Backup-Passphrase anzeigen",
                hide: "Backup-Passphrase ausblenden",
                hint: "Verwenden Sie für Export und Import dieselbe Passphrase. Ohne sie kann das Backup nicht entschlüsselt werden."
            },
            cards: {
                scope: {
                    title: "Umfang",
                    description: "Eine verschlüsselte Datei enthält beide Einstellungen und das komplette Sitzungsarchiv."
                },
                restoreBehavior: {
                    title: "Verhalten wiederherstellen",
                    description: "Beim Import werden das aktuelle lokale Archiv und die Einstellungen durch die von Ihnen ausgewählte Sicherungsdatei ersetzt. Anschließend kann die Synchronisierungs-Engine erneut einen Abgleich durchführen."
                },
                useCase: {
                    title: "Anwendungsfall",
                    description: "Ideal für Maschinenmigration, Fallback-Wiederherstellung und Archivportabilität."
                }
            },
            deleteArchive: {
                title: "Gespeichertes Archiv löschen",
                syncedDescription: "Löschen Sie das synchronisierte Archiv von diesem Gerät, Ihren verbundenen Cloud-Anbietern und anderen synchronisierten Geräten. Ihre OpenAI-Einrichtung, Präferenzen und Besprechungsprofile bleiben erhalten.",
                localDescription: "Entfernen Sie alle gespeicherten Besprechungssitzungen aus dem lokalen Speicher. Dadurch bleiben Ihre OpenAI-Einrichtung, Präferenzen und Besprechungsprofile erhalten."
            },
            confirmDelete: {
                syncedTitle: "Synchronisiertes Archiv überall löschen?",
                localTitle: "Gespeicherte Sitzungsdaten löschen?",
                syncedLabel: "Archiv überall löschen",
                localLabel: "Gespeicherte Sitzungen löschen",
                syncedDescription: "Dadurch werden alle gespeicherten Besprechungssitzungen, Transkripte, Chat-Aufzeichnungen, Übersetzungen und Zusammenfassungen dauerhaft von diesem Gerät, Ihren anderen synchronisierten Geräten und Ihren verbundenen Cloud-Konten gelöscht. Ihre Einstellungen bleiben davon unberührt.",
                localDescription: "Dadurch werden alle gespeicherten Besprechungssitzungen, Transkripte, Chataufzeichnungen, Übersetzungen und Zusammenfassungen aus dem lokalen Speicher entfernt. Ihre Einstellungen bleiben davon unberührt."
            }
        },
        diagnostics: {
            launcherTitle: "Diagnose",
            launcherSubtitle: "Konsole",
            closeConsole: "Schließen Sie die Diagnosekonsole",
            drawerLabel: "Diagnosekonsole",
            closeDrawer: "Schließen Sie die Diagnoseschublade",
            actions: {
                enableSession: "Aktivieren Sie diese Sitzung",
                disableSession: "Deaktivieren Sie diese Sitzung",
                copyVisible: "Sichtbare Protokolle kopieren",
                copiedVisible: "Sichtbare Protokolle kopiert",
                refresh: "Diagnose aktualisieren",
                clear: "Klare Diagnose",
                enableSessionDiagnostics: "Aktivieren Sie die Sitzungsdiagnose"
            },
            filters: {
                all: "Alle",
                searchPlaceholder: "Suchtitel, Zusammenfassung, Schlüssel, Domäne, Funktion, Anbieter",
                visibleCounts: "Sichtbare Zählungen:",
                error: "Fehler",
                warn: "Warnen",
                info: "Infos",
                debug: "Debuggen",
                trace: "Spur"
            },
            summary: {
                loadedWindowTitle: "Geladenes Fenster",
                loadedWindowBody: "Neueste {limit} kanonische Ereignisse max.",
                visibleNowTitle: "Jetzt sichtbar",
                visibleNowBody: "Filter und Suchaktualisierung nur clientseitig.",
                snapshotsTitle: "Schnappschüsse",
                noProvider: "kein Anbieter",
                noResolvedSnapshot: "Kein aufgelöster Snapshot in der aktuellen Nutzlast.",
                lastSyncTitle: "Letzte Synchronisierung",
                waiting: "Warten",
                lastSyncBody: "Aktualisierungen werden angehalten, während diese Registerkarte ausgeblendet ist.",
                eventOne: "{count} Ereignis",
                eventOther: "{count} Ereignisse",
                snapshotOne: "{count} Schnappschuss",
                snapshotOther: "{count} Schnappschüsse"
            },
            row: {
                session: "Sitzung",
                request: "Anfrage",
                correlation: "Korrelation",
                tab: "Tab",
                frame: "Rahmen",
                document: "Dokument",
                origin: "Herkunft",
                copied: "Kopiert",
                copyRow: "Zeile kopieren",
                showDetails: "Details anzeigen",
                hideDetails: "Details ausblenden",
                senderUrl: "Absender-URL",
                eventKey: "Ereignisschlüssel",
                description: "Beschreibung",
                eventData: "Ereignisdaten"
            },
            states: {
                requestErrorPrefix: "Die Laufzeitaktualisierung ist fehlgeschlagen. Die letzte erfolgreiche Nutzlast bleibt bis zum nächsten Wiederholungsversuch sichtbar.",
                captureOffTitle: "Die Diagnoseerfassung ist für diese Sitzung deaktiviert.",
                captureOffBody: "Der Viewer ist verfügbar, es werden jedoch keine neuen Protokolle empfangen, bis Sie die Diagnose für diese Sitzung aktivieren. Die Produktion behält ihre grundlegende Erfassungsrichtlinie bei, es sei denn, Sie überschreiben sie hier absichtlich.",
                waitingTitle: "Warten auf Diagnoseereignisse.",
                waitingBody: "Die Schublade ist mit dem kanonischen Kollektor verbunden. Sobald die Erweiterung neue strukturierte Diagnosen ausgibt, werden diese hier automatisch angezeigt.",
                noMatchesTitle: "Keine Ereignisse entsprechen den aktuellen Filtern.",
                noMatchesBody: "Versuchen Sie es mit einem umfassenderen Filter oder löschen Sie das Suchfeld, um Ereignisse wieder anzuzeigen."
            },
            status: {
                unavailableLabel: "Nicht verfügbar",
                unavailableDescription: "Der Diagnose-Viewer ist für diese Umgebung nicht aktiviert.",
                syncIssueLabel: "Synchronisierungsproblem",
                syncIssueDescription: "Der Viewer konnte die Diagnose aus der Laufzeit nicht aktualisieren.",
                connectingLabel: "Verbinden",
                connectingDescription: "Der Viewer lädt die aktuelle Diagnosekonfiguration.",
                sessionOffLabel: "Sitzung aus",
                sessionOffDescription: "Die Diagnoseerfassung ist derzeit für diese Sitzung deaktiviert. Vorhandene erfasste Ereignisse bleiben sichtbar.",
                pausedLabel: "Angehalten",
                pausedDescription: "Die Umfrage wird angehalten, während die Registerkarte „Optionen“ ausgeblendet ist, und fortgesetzt, wenn sie wieder sichtbar wird.",
                liveLabel: "Lebe",
                liveDescription: "Der Viewer fragt die neueste kanonische Diagnosenutzlast ab.",
                readyLabel: "Bereit",
                readyDescription: "Öffnen Sie die Schublade, um die neuesten kanonischen Diagnosen einzusehen."
            },
            requestErrors: {
                runtimeUnavailable: "Laufzeitnachrichten sind im aktuellen Kontext nicht verfügbar.",
                loadConfigFailed: "Die Diagnosekonfiguration konnte nicht geladen werden.",
                loadPayloadFailed: "Die Diagnosenutzlast konnte nicht geladen werden.",
                updateConfigFailed: "Die Diagnosekonfiguration konnte nicht aktualisiert werden.",
                clearFailed: "Die Diagnose konnte nicht gelöscht werden."
            }
        },
        runtime: {
            connection: {
                addApiKey: "Fügen Sie Ihren API-Schlüssel OpenAI hinzu und testen Sie dann die Verbindung.",
                runTest: "Führen Sie Test Connection aus, um Ihren OpenAI-Schlüssel und das ausgewählte Modell zu überprüfen.",
                testing: "Testen des aktuellen OpenAI-Setups ...",
                apiKeyRequired: "Der API-Schlüssel OpenAI ist erforderlich, bevor die Verbindung getestet werden kann.",
                modelRequired: "Wählen Sie ein OpenAI-Modell, bevor Sie die Verbindung testen.",
                apiKeyRejected: "OpenAI hat den API-Schlüssel abgelehnt.",
                modelUnavailable: "OpenAI Modell für diesen Schlüssel nicht verfügbar: {model}.",
                requestFailed: "OpenAI-Anfrage ist mit {status} fehlgeschlagen.",
                networkFailed: "OpenAI konnte nicht erreicht werden. Überprüfen Sie Ihre Netzwerkverbindung und versuchen Sie es erneut.",
                reachable: "OpenAI ist erreichbar und {model} ist verfügbar."
            },
            dataTransfer: {
                idle: "Verwenden Sie verschlüsselte Backups als Fallback-Wiederherstellungspfad für Einstellungen und Sitzungsverlauf oder entfernen Sie das gespeicherte Archiv überall, wenn eine Verbindung zur Cloud-Synchronisierung besteht.",
                exporting: "Vorbereiten eines verschlüsselten Fallback-Archivs mit Einstellungen und Sitzungsverlauf ...",
                exportSuccess: "Verschlüsseltes Backup exportiert mit {count} gespeicherter Sitzung{suffix}.",
                exportFailed: "Das Datenpaket konnte nicht exportiert werden.",
                importing: "Entschlüsseln der Sicherungs- und Wiederherstellungseinstellungen und des Sitzungsverlaufs ...",
                importSuccess: "Backup importiert. {count} Sitzung{suffix} wiederhergestellt.",
                importFailed: "Das Datenpaket konnte nicht importiert werden.",
                clearingSynced: "Löschen des synchronisierten Archivs von diesem Gerät und Weiterleiten der Entfernung an verbundene Cloud-Anbieter ...",
                clearingLocal: "Alle gespeicherten Sitzungen werden aus dem lokalen Speicher entfernt...",
                clearSuccessSynced: "Das Archiv wurde von diesem Gerät gelöscht und die Entfernung wurde für Ihre verbundenen Cloud-Anbieter in die Warteschlange gestellt. Ihre Einstellungen wurden beibehalten.",
                clearSuccessLocal: "Gespeicherte Sitzungen wurden entfernt. Ihre Einstellungen wurden beibehalten.",
                clearFailed: "Das gespeicherte Sitzungsarchiv konnte nicht gelöscht werden."
            },
            cloudSync: {
                idleAvailable: "Die Cloud-Synchronisierung ist verfügbar, wenn Sie Google Drive oder OneDrive verbinden.",
                idleConnected: "Der Cloud-Synchronisierungsstatus ist aktuell.",
                idleDisconnected: "Verbinden Sie einen Cloud-Anbieter, um Ihr Archiv automatisch zu schützen.",
                loadFailed: "Der Cloud-Synchronisierungsstatus konnte nicht geladen werden.",
                updated: "Cloud-Synchronisierungsstatus aktualisiert.",
                actionFailed: "Die Cloud-Synchronisierungsaktion ist fehlgeschlagen.",
                connecting: "Cloud-Anbieter verbinden...",
                connectingProvider: "Anmeldung für {provider} wird gestartet...",
                connectHint: "Es sollte sich ein sicheres Browserfenster öffnen. Melden Sie sich dort an und kehren Sie dann hierher zurück.",
                connectSuccess: "{provider} verbunden.",
                connectSuccessHint: "Der Hintergrundschutz kann ab dem nächsten Synchronisierungszyklus fortgesetzt werden.",
                disconnecting: "Verbindung zum Cloud-Anbieter wird getrennt...",
                disconnectingProvider: "{provider} wird getrennt...",
                disconnectHint: "Das lokale Archiv bleibt auf diesem Gerät, während der Cloud-Zugriff entfernt wird.",
                disconnectSuccess: "{provider} getrennt.",
                disconnectSuccessHint: "Ihr lokales Archiv bleibt auf diesem Gerät verfügbar.",
                retrying: "Cloud-Synchronisierung wird erneut versucht...",
                retryingProvider: "Ein weiterer Synchronisierungsversuch für {provider} wird in die Warteschlange gestellt...",
                retryHint: "CaptionArc fordert den Anbieter auf, die Hintergrundsynchronisierung erneut fortzusetzen.",
                retrySuccess: "Ein neuer Synchronisierungsversuch wurde in die Warteschlange gestellt.",
                retrySuccessHint: "Der Anbieter wird beim nächsten Lauf im Hintergrund erneut versucht.",
                reconnecting: "Erfrischender Cloud-Anbieter-Zugriff...",
                reconnectingProvider: "Zugriff für {provider} wird aktualisiert...",
                reconnectSuccess: "Zugriff für {provider} aktualisiert.",
                resolvingChoice: "Die Auswahl der freigegebenen Einstellungen wird angewendet...",
                resolveChoiceHint: "Der nächste Hintergrundlauf gleicht vom ausgewählten Ausgangspunkt aus ab.",
                choiceSuccess: "Gemeinsame Einstellungswahl angewendet.",
                choiceSuccessHint: "Die Cloud-Synchronisierung wird vom ausgewählten gemeinsamen Einstellungsstand fortgesetzt.",
                refreshing: "Neuester Cloud-Synchronisierungsstatus wird geprüft...",
                refreshHint: "Warteschlangenzustand, Anbieter-Checkpoints und jüngste Synchronisierungsaktivität werden gelesen.",
                refreshSuccess: "Cloud-Synchronisierungsstatus aktualisiert.",
                refreshSuccessHint: "Der neueste Anbieterstatus und der Warteschlangenzustand sind jetzt auf dieser Seite sichtbar."
            }
        }
    },
    history: {
        page: {
            archiveEyebrow: "Archiv",
            title: "Sitzungsgeschichte",
            subtitle: "Durchsuchen Sie gespeicherte Sitzungen, öffnen Sie Transkriptdetails erneut, exportieren Sie Datensätze und verwalten Sie den lokalen Speicher, ohne die Erweiterung zu verlassen.",
            openSettings: "Einstellungen öffnen",
            searchLabel: "Suchsitzungen",
            searchPlaceholder: "Suchen Sie nach Titeln, Besprechungs-IDs, Rednern, Bildunterschriften oder Übersetzungen ...",
            clearSearch: "Suche löschen",
            sortLabel: "Sortieren",
            providerFilterLabel: "Nach Anbieter filtern",
            statusFilterLabel: "Nach Status filtern",
            resetFilters: "Filter zurücksetzen",
            resultCountOne: "{count} Treffen",
            resultCountOther: "{count} Treffen",
            resultCountFiltered: "{filtered} von {total} Besprechungen",
            translatedCaptionCountOne: "{count} übersetzte Untertitel in Ihrem Archiv gespeichert.",
            translatedCaptionCountOther: "{count} übersetzte Untertitel, die in Ihrem Archiv gespeichert sind.",
            archiveSnapshotTitle: "Schnappschuss archivieren",
            archiveSnapshotSessions: "Sitzungen",
            archiveSnapshotCurrentView: "Aktuelle Ansicht",
            archiveSnapshotProviderFocus: "Anbieterfokus",
            archiveSnapshotStarFilter: "Sternfilter",
            archiveSnapshotUrlHint: "Suchstatus, Filter, Sortierung und die aktuell geöffnete Sitzung werden weiterhin in der Seiten-URL angezeigt, sodass sich Aktualisierung und Navigation vorhersehbar anfühlen.",
            storageFullTitle: "Der lokale Speicher wird langsam voll",
            storageFullDescription: "Ihr Archiv verwendet {percentage} % des lokalen Erweiterungskontingents. Überprüfen Sie ältere Sitzungen oder exportieren Sie wichtige Datensätze aus den Einstellungen, bevor der Speicher zu einer Einschränkung wird.",
            reviewOldestSessions: "Überprüfen Sie die ältesten Sitzungen",
            loadingTitle: "Besprechungsverlauf wird geladen",
            loadingDescription: "Rufen Sie Ihre gespeicherten Sitzungen, den Speicherstatus und die Metadaten des zusammenfassenden Auftrags ab.",
            detailLoadingTitle: "Sitzungsdetails werden geladen",
            detailLoadingDescription: "Vorbereiten des vollständigen Transkripts, der Metadaten, der Zusammenfassungen und des Auftragsstatus für dieses Meeting.",
            emptyInitialTitle: "Noch keine Besprechungshistorie",
            emptyInitialDescription: "Besprechungssitzungen werden hier automatisch angezeigt, nachdem die Erweiterung Untertitel in einer unterstützten Browserbesprechung erfasst. Sobald Sie an einem Anruf teilnehmen und Untertitel übertragen werden, beginnt das Archiv mit dem Aufbau.",
            emptyFilteredTitle: "Keine Besprechungen stimmen mit dieser Ansicht überein",
            emptyFilteredDescription: "Die aktuelle Suche, der Anbieterfilter oder die Sortieransicht stimmten mit keiner der gespeicherten Sitzungen überein. Setzen Sie die aktuelle Ansicht zurück oder überprüfen Sie Ihre ältesten Sitzungen, um mit dem Surfen fortzufahren.",
            deleteSessionTitle: "Diese Besprechungssitzung löschen?",
            deleteSessionDescription: "Dadurch wird „{title}“ aus dem lokalen Verlauf entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
            deleteSessionConfirm: "Sitzung löschen"
        },
        dependency: {
            title: "OpenAI braucht Aufmerksamkeit",
            actionRequired: "Aktion erforderlich",
            needsVerification: "Muss überprüft werden",
            impact: "{message} Die Erstellung von Zusammenfassungen, die Übersetzung gespeicherter Untertitel und die Überprüfung durch den Assistenten bleiben nicht verfügbar, bis der Dienst wieder verfügbar ist."
        },
        filters: {
            providerAll: "Alle Anbieter",
            providerGoogleMeet: "Google Meet",
            providerMicrosoftTeams: "Microsoft Teams Web",
            providerZoomWeb: "Zoom Web App",
            sortNewest: "Das Neueste zuerst",
            sortOldest: "Älteste zuerst",
            starAll: "Alle Sitzungen",
            starStarred: "Nur mit Sternen versehen",
            activeQuery: "Abfrage: „{query}“",
            activeViewingOldest: "Älteste Besprechungen zuerst anzeigen"
        },
        storageIndicator: {
            usage: "{used} von {quota}",
            highUsage: "Hohe Nutzung",
            reviewSoon: "Rezension bald",
            healthy: "Gesund"
        },
        confirmDialog: {
            closeDialog: "Dialog schließen",
            confirmAction: "Aktion bestätigen"
        },
        sessionList: {
            today: "Heute",
            yesterday: "Gestern",
            justNow: "Gerade eben",
            inProgress: "In Bearbeitung",
            noPreview: "Für diese Sitzung sind noch keine erfassten Untertitel oder Besprechungs-Chatnachrichten verfügbar.",
            removeStar: "Stern entfernen",
            starSession: "Star-Session",
            openDetails: "Details öffnen",
            deleteSession: "Sitzung löschen",
            generatingSummary: "Zusammenfassung erstellen",
            starred: "Mit einem Stern versehen",
            captionCountOne: "{count} Bildunterschrift",
            captionCountOther: "{count} Untertitel",
            translatedOriginalOnly: "Nur Original",
            translatedCount: "{count} übersetzt",
            chatCountOne: "{count} Chat",
            chatCountOther: "{count} Chats",
            directCall: "Direkter Anruf",
            hideIdentifiers: "Kennungen ausblenden",
            showIdentifiers: "Identifikatoren anzeigen",
            loadingMore: "Weitere Meetings werden geladen..."
        },
        detail: {
            backToHistory: "Zurück zur Geschichte",
            reviewDescription: "Überprüfen Sie das erfasste Transkript, die gespeicherten Übersetzungen, die Extraktionsabdeckung und die KI-Zusammenfassungen für dieses Meeting.",
            inProgress: "In Bearbeitung",
            durationShort: {
                hours: "{count}h",
                minutes: "{count}m",
                seconds: "{count}s",
                hoursMinutes: "{hours}h {minutes}m",
                minutesSeconds: "{minutes}m {seconds}s"
            },
            actions: {
                saveTitle: "Titel speichern",
                cancelTitleEditing: "Titelbearbeitung abbrechen",
                renameSession: "Sitzung umbenennen",
                retry: "Versuchen Sie es noch einmal"
            },
            exportMenu: {
                open: "Exportoptionen öffnen",
                close: "Exportoptionen schließen",
                title: "Transkript exportieren",
                description: "Wählen Sie aus, ob gespeicherte Übersetzungen und gespeicherte Zusammenfassungen in den Markdown-Export einbezogen werden sollen.",
                includeTranslationsLabel: "Gespeicherte Übersetzungen einschließen",
                includeTranslationsAvailable: "Gespeicherte Übersetzungen werden in die Exportdatei übernommen.",
                includeTranslationsUnavailable: "Für diese Sitzung sind noch keine gespeicherten Übersetzungen verfügbar.",
                includeSummariesLabel: "Gespeicherte Zusammenfassungen einschließen",
                includeSummariesAvailable: "Gespeicherte Besprechungszusammenfassungen werden an die Exportdatei angehängt.",
                includeSummariesUnavailable: "Für diese Sitzung sind noch keine gespeicherten Besprechungszusammenfassungen verfügbar.",
                export: "Markdown herunterladen"
            },
            metadataLabels: {
                provider: "Anbieter",
                callTitle: "Titel nennen",
                meetingTitle: "Titel der Besprechung",
                meetingUrl: "Besprechungs-URL",
                started: "Begonnen",
                ended: "Beendet",
                status: "Status",
                primaryId: "Primäre ID",
                meetingCode: "Besprechungscode",
                meetingId: "Besprechungs-ID",
                conferenceId: "Konferenz-ID",
                meetingNumber: "Sitzungsnummer",
                threadId: "Thread-ID",
                callType: "Anruftyp"
            },
            status: {
                ended: "Beendet",
                live: "Lebe"
            },
            sections: {
                metadata: {
                    title: "Meeting-Metadaten",
                    description: "Überprüfen Sie die Besprechungsidentität, den Zeitpunkt und die gespeicherten Kennungen für diese gespeicherte Sitzung.",
                    expand: "Metadaten anzeigen",
                    collapse: "Metadaten ausblenden"
                },
                continuations: {
                    title: "Fortsetzung der Sitzung",
                    description: "Überprüfen Sie jeden erneuten Beitritt und die gesamte Abwesenheitszeit, bevor dieselbe Sitzung wieder aufgenommen wird.",
                    expand: "Fortsetzungen anzeigen",
                    collapse: "Fortsetzungen ausblenden"
                },
                extraction: {
                    title: "Extraktionsbericht",
                    description: "Überprüfen Sie die Transkriptabdeckung, die Sprecherextraktion und die Integritäts-Fingerabdrücke für das gespeicherte Archiv.",
                    expand: "Extraktionsbericht anzeigen",
                    collapse: "Extraktionsbericht ausblenden"
                },
                summary: {
                    title: "Zusammenfassung der Besprechung",
                    description: "Generieren oder überprüfen Sie gespeicherte KI-Zusammenfassungen für dieses Besprechungsprofil und diese Sprache.",
                    expand: "Zusammenfassung anzeigen",
                    collapse: "Zusammenfassung ausblenden"
                },
                transcript: {
                    title: "Transkript",
                    description: "Überprüfen Sie gespeicherte Untertitel, Besprechungschat, Übersetzungen und Assistentenausgaben in der Reihenfolge der Zeitleiste."
                }
            },
            stats: {
                capturedCaptions: "Untertitel erfasst",
                translatedCaptions: "Übersetzte Bildunterschriften",
                duration: "Dauer",
                meetingChatMessages: "Chat-Nachrichten für Besprechungen",
                rejoins: "Kommt wieder",
                totalAwayTime: "Gesamte Abwesenheitszeit",
                lastRejoin: "Letzter erneuter Beitritt",
                canonicalEvents: "Kanonische Ereignisse",
                uniqueSpeakers: "Einzigartige Lautsprecher",
                metadataCoverage: "Metadatenabdeckung",
                providerIds: "Anbieter-IDs"
            },
            rejoin: {
                label: "Wieder beitreten {index}",
                awayFor: "Auswärts für {gap}",
                leftMeeting: "Linkes Treffen",
                returnedToMeeting: "Zur Besprechung zurückgekehrt"
            },
            extraction: {
                eventLogFingerprint: "Fingerabdruck des Ereignisprotokolls",
                searchFingerprint: "Fingerabdruck suchen",
                summaryFingerprint: "Zusammenfassender Fingerabdruck",
                timelineRange: "Zeitleistenbereich",
                lastEvent: "Letzte Veranstaltung",
                noEvents: "Keine Veranstaltungen",
                coverageBreakdown: "Aufschlüsselung der Deckung",
                sessionOffsets: "Sitzungsoffsets",
                translatedEvents: "Übersetzte Ereignisse",
                finalCaptionEvents: "Abschließende Untertitelereignisse",
                speakers: "Lautsprecher",
                noSpeakers: "Keine Lautsprecher erkannt.",
                warnings: "Warnungen"
            },
            summaryJob: {
                states: {
                    preflighting: "Zusammenfassung vorbereiten",
                    extracting: "Transkript analysieren",
                    merging: "Beweise zusammenführen",
                    synthesizing: "Zusammenfassung schreiben",
                    continuing: "Fortsetzung der Zusammenfassung",
                    reconciling: "Ausgabe abgleichen",
                    completed: "Zusammenfassung fertig",
                    failed: "Zusammenfassung fehlgeschlagen",
                    cancelled: "Zusammenfassung abgebrochen",
                    default: "Zusammenfassung vorbereiten"
                },
                progress: {
                    ready: "Bereit",
                    preparing: "Beweise vorbereiten",
                    step: "Schritt {current} von {total}",
                    mergingEvidence: "Beweise zusammenführen",
                    preparingFinal: "Erstellung einer abschließenden Zusammenfassung",
                    continuation: "Fortsetzung {current} von {total}",
                    continuing: "Weiterführende Generation",
                    finalChecks: "Endkontrollen durchführen"
                }
            },
            summary: {
                openAiUnavailable: "OpenAI nicht verfügbar",
                unavailable: "Die Generierung einer Zusammenfassung ist nicht verfügbar",
                generating: "Zusammenfassung erstellen",
                generateAnother: "Erstellen Sie eine weitere Zusammenfassung",
                generate: "Besprechungszusammenfassung erstellen",
                generateWithProfile: "Verwenden Sie {profile}, um eine gespeicherte Besprechungszusammenfassung zu erstellen oder zu aktualisieren.",
                selectMeetingType: "Wählen Sie ein Besprechungsprofil und eine Ausgabesprache aus, bevor Sie eine Zusammenfassung erstellen.",
                generateAnotherAction: "Generieren Sie eine weitere {profile}-Zusammenfassung",
                generateAction: "Generieren Sie eine {profile}-Zusammenfassung",
                genericProfile: "ausgewähltes Profil",
                inProgress: "Die Erstellung der Zusammenfassung ist noch im Gange.",
                noSummaryYet: "Noch keine gespeicherte {profile}-Zusammenfassung in {language}.",
                noSummaryHint: "Erstellen Sie jetzt eine oder wechseln Sie das Meeting-Profil oder die Sprache, um eine andere gespeicherte Version zu überprüfen.",
                latestSaved: "Zuletzt gespeicherte Zusammenfassung: {profile} in {language}.",
                evidenceChunks: "{count} Beweisstücke",
                continuations: "{count} Fortsetzungen",
                reconciled: "Versöhnt",
                executionStrategy: {
                    singleShot: "Einzelschuss",
                    structuredSingleShot: "Strukturierter Einzelschuss",
                    multiStage: "Mehrstufig"
                },
                version: {
                    latest: "Neueste · {time}",
                    automatic: "Automatisch",
                    manual: "Handbuch",
                    auto: "Automatisch",
                    alt: "Alt-Profil",
                    session: "Sitzungsprofil",
                    default: "Standardprofil",
                    sessionProfile: "Sitzungsprofil: {name}",
                    unknownProfile: "Unbekanntes Profil",
                    generatedWithAnotherProfile: "Mit einem anderen Profil generiert",
                    generatedAt: "Generiert {time}"
                }
            },
            transcript: {
                savedCaptionTranslationUnavailable: "Die Übersetzung der gespeicherten Untertitel ist nicht verfügbar",
                translatingAllCaptions: "Alle Untertitel werden übersetzt",
                translateAllCaptions: "Übersetzen Sie alle Untertitel",
                batchTranslateSubtitle: "Erstellen Sie gespeicherte Übersetzungen für jede Bildunterschrift in {language}.",
                translateAllCaptionsTo: "Alle Untertitel in {language} übersetzen",
                emptyTitle: "Keine Transkript- oder Chat-Elemente",
                emptyDescription: "Für diese Sitzung sind noch keine Untertitel oder Besprechungs-Chatnachrichten gespeichert.",
                meetingChat: "Besprechungschat",
                translationAvailable: "Übersetzung gespeichert",
                message: "Nachricht",
                caption: "Bildunterschrift",
                translation: "Übersetzung",
                noChatTranslation: "Für diese Chat-Nachricht wurde noch keine Übersetzung gespeichert.",
                noCaptionTranslation: "Für diese Bildunterschrift wurde noch keine Übersetzung gespeichert.",
                translatingChatMessage: "Chat-Nachricht übersetzen",
                translatingCaption: "Bildunterschrift übersetzen",
                translateChatMessage: "Chat-Nachricht übersetzen",
                translateCaption: "Übersetzen Sie die Bildunterschrift",
                translateThisItem: "Übersetzen Sie diesen {item} in {language}",
                aiAssistant: "KI-Assistent",
                triggeredByChat: "Ausgelöst durch diese Chat-Nachricht",
                triggeredByCaption: "Ausgelöst durch diese Bildunterschrift"
            },
            export: {
                sessionDetailsHeading: "Sitzungsdetails",
                titleLabel: "Titel",
                providerLabel: "Anbieter",
                startedLabel: "Begonnen",
                primaryIdLabel: "Primäre ID",
                endedLabel: "Beendet",
                durationLabel: "Dauer",
                statusLabel: "Status",
                capturedChatMessagesLabel: "Erfasste Chatnachrichten",
                savedTranslationsLabel: "Gespeicherte Übersetzungen",
                totalAwayBeforeRejoinsLabel: "Gesamte Abwesenheitszeit vor dem Wiedereinstieg",
                savedSummariesHeading: "Gespeicherte Zusammenfassungen",
                generatedLabel: "Generiert",
                modelLabel: "Modell",
                summaryEffortLabel: "Zusammenfassender Aufwand",
                executionStrategyLabel: "Ausführungsstrategie",
                evidenceChunksLabel: "Beweisstücke",
                continuationsLabel: "Fortsetzungen",
                reconciledLabel: "Versöhnt",
                coveredCaptionsLabel: "Überdachte Bildunterschriften",
                yes: "Ja",
                sessionContinuationsHeading: "Fortsetzung der Sitzung",
                leftAtLabel: "Links um",
                rejoinedAtLabel: "Wieder beigetreten um",
                awayForLabel: "Weg für",
                sessionResumeHeading: "Sitzung {index} wurde um {time} nach {gap} fortgesetzt"
            }
        },
        runtime: {
            settingsLoadFailed: "Erweiterungseinstellungen konnten nicht geladen werden.",
            loadHistoryFailed: "Der Besprechungsverlauf konnte nicht geladen werden.",
            loadSessionDetailFailed: "Die Details der Besprechungssitzung konnten nicht geladen werden.",
            sessionDeleted: "Sitzung gelöscht.",
            sessionDeleteFailed: "Die Sitzung konnte nicht gelöscht werden.",
            titleUpdated: "Titel aktualisiert.",
            titleUpdateFailed: "Der Titel konnte nicht aktualisiert werden.",
            starUpdateFailed: "Der Stern konnte nicht aktualisiert werden.",
            sessionNotFound: "Besprechungssitzung nicht gefunden.",
            chatMessageNotFound: "Chat-Nachricht nicht gefunden.",
            captionNotFound: "Beschriftungszeile nicht gefunden.",
            translationFailed: "Die Übersetzung ist fehlgeschlagen.",
            captionTranslated: "Beschriftung übersetzt in {language}.",
            chatTranslated: "Chat-Nachricht übersetzt in {language}.",
            captionTranslateFailed: "Die Beschriftung konnte nicht übersetzt werden.",
            chatTranslateFailed: "Die Chat-Nachricht konnte nicht übersetzt werden.",
            analyzingTranscript: "Transkript analysieren",
            noSummarySource: "Für die Zusammenfassung stehen keine Transkripte oder Besprechungschatinhalte zur Verfügung.",
            summaryGenerationFailed: "Die Generierung der Zusammenfassung ist fehlgeschlagen.",
            summaryGenerated: "Zusammenfassung generiert in {language}.",
            summaryCancelFailed: "Die Erstellung der Zusammenfassung konnte nicht abgebrochen werden.",
            batchTranslationFailed: "Es konnten nicht alle Untertitel übersetzt werden.",
            allCaptionsAlreadyTranslated: "Alle Untertitel verfügen bereits über {language} Übersetzungen.",
            batchTranslatedOne: "{count} Bildunterschrift übersetzt in {language}{suffix}.",
            batchTranslatedOther: "{count} Untertitel übersetzt in {language}{suffix}.",
            batchSkippedSuffix: ", {count} übersprungen",
            errorOutdated: "{fallback} Details: Die Laufzeit der Erweiterung ist veraltet. Laden Sie die Erweiterung neu und versuchen Sie es erneut.",
            errorNoDetails: "{fallback} Details: Es wurden keine zusätzlichen Fehlerdetails zurückgegeben.",
            errorModelStopped: "{fallback} Details: Das Modell wurde gestoppt, bevor die Zusammenfassung abgeschlossen werden konnte. Die App versucht es nun automatisch erneut, diese Antwort konnte jedoch immer noch nicht vollständig wiederhergestellt werden. Versuchen Sie, ein Modell mit einem größeren Ausgabebudget neu zu generieren oder zu verwenden.",
            errorNoProviderDetails: "{fallback} Details: Es wurden keine zusätzlichen Anbieterdetails zurückgegeben.",
            errorWithDetails: "{fallback} Details: {details}"
        }
    },
    content: {
        copyFeedback: "Kopiert!",
        timeline: {
            meetingChat: "Besprechungschat"
        },
        translation: {
            errorFallback: "Fehler",
            requestFailed: "Die Übersetzung ist fehlgeschlagen",
            retryAction: "Versuchen Sie die Übersetzung erneut"
        },
        empty: {
            waitingForCaptionsTitle: "Warten auf Untertitel...",
            waitingForCaptionsBody: "Aktivieren Sie Untertitel in Ihrem Meeting, um mit der Texterfassung zu beginnen",
            waitingForCaptionsGoogleMeet: "Aktivieren Sie Untertitel in Google Meet, um mit der Texterfassung zu beginnen",
            waitingForCaptionsTeams: "Öffnen Sie Mehr > Sprache und Sprache > Live-Untertitel anzeigen, um mit der Texterfassung zu beginnen",
            waitingForCaptionsZoom: "Öffnen Sie Mehr > Untertitel > Untertitel anzeigen, um mit der Texterfassung zu beginnen",
            capturePendingTitle: "Capture wartet auf Sie",
            capturePendingBody: "Beantworten Sie die Startaufforderung, damit die Aufzeichnung dieses Meetings beginnen kann.",
            captureStartingTitle: "Aufnahme wird gestartet",
            captureStartingBody: "Wir bereiten jetzt die Sitzungssitzung und die Startup-Beobachter vor.",
            captureDismissedTitle: "Capture blieb ausgeschaltet",
            captureDismissedBody: "Diese Besprechung wurde aus der Startaufforderung ausgeschlossen und bleibt deaktiviert.",
            sessionEndedTitle: "Sitzung beendet",
            sessionEndedBody: "Dieses Treffen ist auf dieser Seite nicht mehr aktiv.",
            waitingToJoinTitle: "Ich warte auf die Teilnahme an der Besprechung",
            waitingToJoinBody: "Treten Sie dem Meeting bei, um den Sitzungstimer zu starten und den Ablauf zu erfassen.",
            enablingCaptionsTitle: "Live-Untertitel aktivieren",
            enablingCaptionsBody: "CaptionArc versucht gerade, Untertitel für dieses Meeting zu aktivieren.",
            readyTitle: "Die Aufnahme ist bereit",
            readyBody: "Beginnen Sie zu sprechen und im weiteren Verlauf der Besprechung werden hier Untertitelzeilen angezeigt.",
            segmentEmptyTitle: "Keine Transkript- oder Chat-Elemente",
            segmentEmptyBody: "Dieser Sitzungsabschnitt hat keine Untertitel oder Besprechungs-Chatnachrichten erfasst.",
            close: "Schließen"
        },
        sessionSeparator: {
            title: "Sitzung {index}",
            detail: "Wieder beigetreten {time} · Weg {gap}",
            ariaLabel: "Sitzung {index} wurde fortgesetzt"
        },
        header: {
            compactStatus: {
                aiNeedsAttentionTitle: "KI braucht Aufmerksamkeit",
                finishOpenAiSetup: "Beenden Sie das OpenAI-Setup",
                openAiUnavailable: "OpenAI ist nicht verfügbar",
                capturePendingTitle: "Aufnahme steht aus",
                waitingForAnswer: "Ich warte auf Ihre Antwort",
                startingCaptureTitle: "Aufnahme wird gestartet",
                preparingMeeting: "Vorbereitung dieses Treffens",
                captureSkippedTitle: "Aufnahme übersprungen",
                meetingStaysOff: "Dieses Treffen bleibt aus",
                sessionEndedTitle: "Sitzung beendet",
                rejoinToContinue: "Melden Sie sich erneut an, um fortzufahren oder neu zu starten",
                waitingToJoinTitle: "Ich warte auf den Beitritt",
                sessionStartsAfterJoin: "Die Sitzung beginnt nach dem Beitritt",
                enablingCaptionsTitle: "Untertitel aktivieren",
                tryingLiveCaptions: "Ich versuche, Live-Untertitel einzuschalten",
                setupRequiredTitle: "Einrichtung erforderlich",
                turnOnMeetingCaptions: "Aktivieren Sie Besprechungsuntertitel",
                translationIssueTitle: "Übersetzungsproblem",
                retryAvailable: "Ein erneuter Versuch ist verfügbar",
                translatingLiveTitle: "Live übersetzen",
                liveTranslationTitle: "Live-Übersetzung",
                capturingLiveTitle: "Live-Aufnahme",
                originalCaptionsOnly: "Nur Originaluntertitel",
                readyToCaptureTitle: "Bereit zur Aufnahme",
                waitingForSpeech: "Warten auf Rede",
                waitingForCaptionsTitle: "Warten auf Untertitel"
            },
            main: {
                captureOnHoldTitle: "Aufnahme in der Warteschleife",
                waitingForAnswer: "Ich warte auf Ihre Antwort",
                startingCaptureTitle: "Aufnahme wird gestartet",
                preparingMeeting: "Vorbereitung dieses Treffens",
                captureSkippedTitle: "Aufnahme übersprungen",
                meetingStaysOff: "Dieses Treffen bleibt aus",
                sessionEndedTitle: "Sitzung beendet",
                rejoinToContinue: "Melden Sie sich erneut an, um fortzufahren oder neu zu starten",
                waitingToJoinTitle: "Ich warte auf den Beitritt",
                meetingOverlay: "Meeting-Overlay",
                enablingLiveCaptionsTitle: "Live-Untertitel aktivieren",
                preparingCapture: "Aufnahme wird vorbereitet",
                liveCaptureTitle: "Live-Aufnahme"
            },
            profileControl: {
                defaultBadge: "Standard"
            },
            translationToggle: {
                label: "Automatisch"
            },
            translationDock: {
                eyebrow: "Live-Übersetzung",
                consent: {
                    title: "Die Aufnahme muss bestätigt werden",
                    body: "Genehmigen Sie die Startaufforderung, um mit der Aufzeichnung dieses Meetings zu beginnen.",
                    badge: "Warten"
                },
                starting: {
                    title: "Aufnahme wird gestartet",
                    body: "Wir bereiten jetzt die Sitzungs- und Beobachterpipeline vor.",
                    badge: "Beginnt"
                },
                dismissed: {
                    title: "Capture blieb ausgeschaltet",
                    body: "Diese Besprechung wurde aus der Startaufforderung ausgeschlossen.",
                    badge: "Aus"
                },
                setup: {
                    title: "OpenAI Einrichtung erforderlich",
                    body: "Beenden Sie die Einrichtung von OpenAI in den Einstellungen, um die Live-Übersetzung zu aktivieren.",
                    badge: "Einrichtung"
                },
                unavailable: {
                    title: "OpenAI ist nicht verfügbar",
                    body: "Überprüfen Sie die OpenAI-Einrichtung in den Einstellungen, bevor die Live-Übersetzung fortgesetzt werden kann.",
                    badge: "Problem"
                },
                off: {
                    title: "Die Übersetzung ist deaktiviert",
                    body: "Ziel: {language}. Schalten Sie es für die Live-Ausgabe ein.",
                    badge: "Aus"
                },
                error: {
                    title: "Übersetzung braucht Aufmerksamkeit",
                    body: "Einige Leitungen sind fehlgeschlagen. Auf den betroffenen Karten ist ein erneuter Versuch möglich.",
                    badge: "Problem"
                },
                translating: {
                    title: "Übersetzen in {language}",
                    body: "Neue Zeilen werden live übersetzt.",
                    badge: "Arbeiten"
                },
                live: {
                    title: "Live-Übersetzung aktiv",
                    body: "Live-Ausgabe in {language} rendern."
                },
                ready: {
                    title: "Die Übersetzung ist aktiviert",
                    body: "Untertitel sind aktiviert. Neue Zeilen werden in {language} übersetzt.",
                    badge: "Bereit"
                },
                waiting: {
                    title: "Warten auf Untertitel",
                    body: "Aktivieren Sie Besprechungsuntertitel, um mit der Übersetzung zu beginnen.",
                    badge: "Warten"
                }
            },
            tooltips: {
                compactAiSetup: "Beenden Sie die Einrichtung von OpenAI in den Einstellungen, um Übersetzungen, Zusammenfassungen und Assistentenführung wiederherzustellen.",
                compactAiIssue: "{message} OpenAI-abhängige Funktionen bleiben angehalten, bis das Problem behoben ist.",
                translationOff: "Schalten Sie die Live-Übersetzung aus",
                translationOn: "Aktivieren Sie die Live-Übersetzung",
                translationSetup: "Beenden Sie die Einrichtung von OpenAI in den Einstellungen, um die Live-Übersetzung zu aktivieren.",
                translationUnavailable: "Die Live-Übersetzung wird angehalten, bis OpenAI wieder verfügbar ist.",
                captureHelp: "Capture-Hilfe",
                hideCaptureHelp: "Capture-Hilfe ausblenden",
                switchToCompactView: "Wechseln Sie zur Kompaktansicht",
                expandOverlay: "Overlay erweitern",
                openProfilePicker: "Öffnen Sie die Meeting-Profilauswahl"
            }
        },
        captureGuide: {
            eyebrow: "Capture-Setup",
            title: "Capture-Hilfe",
            statusReady: "Die Aufnahme beginnt, wenn sie bereit ist",
            footer: "CaptionArc beginnt mit der Aufnahme, sobald Live-Untertitel auf dieser Registerkarte angezeigt werden.",
            stepsCount: "{count} Schritte",
            waitingTitle: "Warten auf Live-Untertitel",
            closeAriaLabel: "Schließen Sie die Aufnahmeanleitung",
            startsAutomatically: "Startet automatisch",
            tooltipOpen: "Capture-Hilfe",
            tooltipClose: "Capture-Hilfe ausblenden",
            providers: {
                googleMeet: {
                    title: "Erfassung aktivieren in Google Meet",
                    body: "CaptionArc kann beginnen, sobald Google Meet Untertitel in diesem Browser-Meeting aktiviert sind.",
                    status: "Startet automatisch",
                    footer: "CaptionArc beginnt automatisch mit der Aufnahme, sobald Live-Untertitel auf dieser Registerkarte angezeigt werden.",
                    troubleshooting: "Wenn Sie kein Steuerelement für Untertitel sehen, prüfen Sie, ob der Besprechungs- oder Browserstatus noch geladen wird.",
                    steps: {
                        openControls: {
                            title: "Öffnen Sie die Besprechungssteuerung",
                            detail: "Bewegen Sie Ihre Maus, um die untere Besprechungssymbolleiste anzuzeigen."
                        },
                        openCaptions: {
                            title: "Steuerelemente für offene Untertitel",
                            detail: "Klicken Sie in der Besprechungssymbolleiste auf die Untertitel oder das CC-Steuerelement."
                        },
                        turnOn: {
                            title: "Untertitel aktivieren",
                            detail: "Sobald Untertitel aktiviert sind, beginnt CaptionArc automatisch mit der Texterfassung."
                        }
                    }
                },
                microsoftTeams: {
                    title: "Erfassung aktivieren in Microsoft Teams",
                    body: "CaptionArc kann gestartet werden, sobald Live-Untertitel über die Besprechungssymbolleiste Teams aktiviert sind.",
                    status: "Startet automatisch",
                    footer: "CaptionArc beginnt automatisch mit der Aufnahme, sobald Live-Untertitel auf dieser Registerkarte angezeigt werden.",
                    troubleshooting: "Wenn Untertitel nicht verfügbar sind, schränkt der Organisator oder die Administratorrichtlinie möglicherweise die Untertitelsteuerung ein.",
                    steps: {
                        openMore: {
                            title: "Öffnen Sie Mehr",
                            detail: "Verwenden Sie die obere Meeting-Symbolleiste und öffnen Sie das Menü „Mehr“."
                        },
                        openLanguage: {
                            title: "Offene Sprache und Sprache",
                            detail: "Wählen Sie unter „Mehr“ die Option „Sprache und Sprache“ aus."
                        },
                        chooseCaptions: {
                            title: "Wählen Sie Live-Untertitel anzeigen",
                            detail: "Wählen Sie „Live-Untertitel anzeigen“ und CaptionArc erkennt das Untertitelfenster automatisch."
                        }
                    }
                },
                zoomWeb: {
                    title: "Erfassung aktivieren in Zoom Web App",
                    body: "CaptionArc kann beginnen, sobald Zoom Web App Untertitel in diesem Browser-Meeting aktiviert sind.",
                    status: "Untertitel manuell aktivieren",
                    footer: "CaptionArc beginnt mit der Aufnahme, sobald Zoom Untertitel auf dieser Registerkarte angezeigt werden.",
                    troubleshooting: "Einige Zoom-Meetings bevorzugen möglicherweise die Desktop-App oder schränken die Untertitelsteuerung basierend auf den Host-Einstellungen ein.",
                    steps: {
                        openControls: {
                            title: "Öffnen Sie die Besprechungssteuerung",
                            detail: "Verwenden Sie die Meeting-Symbolleiste unten im Fenster Zoom Web App."
                        },
                        openMore: {
                            title: "Öffnen Sie Mehr",
                            detail: "Öffnen Sie das Menü „Mehr“ in der Meeting-Symbolleiste."
                        },
                        openCaptions: {
                            title: "Untertitel öffnen",
                            detail: "Öffnen Sie in „Mehr“ das Untermenü „Untertitel“."
                        },
                        chooseShow: {
                            title: "Wählen Sie „Untertitel anzeigen“.",
                            detail: "Wählen Sie „Untertitel anzeigen“, um die Untertiteloberfläche „Zoom“ auf dieser Registerkarte verfügbar zu machen."
                        }
                    }
                }
            }
        },
        footer: {
            sessionFallbackTitle: "Sitzungssitzung",
            turns: "{count} Umdrehungen",
            chat: "{count} Chat",
            chatCaptureTooltip: "Die Chat-Erfassung von Besprechungen ist aktiviert. Neue unterstützte Meeting-Chat-Nachrichten werden mit dieser Sitzung gespeichert.",
            autoSummarySetupTooltip: "Automatische Zusammenfassungen bleiben angehalten, bis die Einrichtung von OpenAI abgeschlossen ist.",
            autoSummaryUnavailableTooltip: "Automatische Zusammenfassungen werden angehalten, bis OpenAI wieder verfügbar ist.",
            autoSummaryReadyTooltip: "{profile} wird automatisch ausgeführt, wenn dieses Meeting endet.",
            aiAlertSetupTooltip: "Beenden Sie die Einrichtung von OpenAI in den Einstellungen, um Übersetzungen, Zusammenfassungen und Assistentenführung wiederherzustellen.",
            aiAlertUnavailableTooltip: "{message} OpenAI-abhängige Besprechungstools bleiben angehalten, bis das Problem behoben ist.",
            liveState: {
                awaitingReply: {
                    label: "Warte auf Antwort",
                    tooltip: "Capture wartet auf Ihre Startentscheidung für dieses Treffen."
                },
                starting: {
                    label: "Beginnt",
                    tooltip: "Die Aufnahme wurde genehmigt und die Besprechungssitzung wird vorbereitet."
                },
                off: {
                    label: "Aus",
                    tooltip: "Die Aufnahme wurde für dieses Meeting über die Startaufforderung verworfen."
                },
                ended: {
                    label: "Beendet",
                    tooltip: "Diese Sitzung ist beendet. Melden Sie sich erneut an, um die letzte Sitzung fortzusetzen oder eine neue zu starten."
                },
                lobby: {
                    label: "Lobby",
                    tooltip: "Treten Sie dem Meeting bei, um den Sitzungstimer zu starten und den Ablauf zu erfassen."
                },
                live: {
                    label: "Lebe",
                    tooltip: "In dieser Besprechung werden derzeit Untertitel erfasst."
                },
                armed: {
                    label: "Bewaffnet",
                    tooltip: "Untertitel sind aktiviert und das Overlay wartet auf die nächsten Zeilen."
                },
                waiting: {
                    label: "Warten",
                    tooltip: "Besprechungsuntertitel sind noch nicht aktiviert."
                }
            }
        },
        prompts: {
            defaultTimeoutHint: "Standardmäßig wird die Standardaktion verwendet",
            timeoutHint: "Standardmäßig ist {action}",
            captureConsent: {
                title: "Aufnahme für dieses Meeting aktivieren?",
                body: "Wenn Sie dies überspringen, bleibt die Erfassung für diesen Besprechungsbesuch deaktiviert.",
                ariaLabel: "Erfassen Sie die Startbestätigung",
                secondaryAction: "Nicht jetzt",
                primaryAction: "Aktivieren"
            },
            sessionContinuation: {
                title: "Mit der vorherigen Sitzung fortfahren?",
                body: "Sie nahmen kurz nach Ihrer Abreise wieder an derselben Besprechung teil. Keine Antwort startet eine neue Sitzung.",
                ariaLabel: "Bestätigung der Sitzungsfortsetzung",
                secondaryAction: "Neue Sitzung",
                primaryAction: "Weiter"
            },
            sessionEnded: {
                title: "Sitzung beendet",
                body: "Bleiben Sie hier, um erfasste Elemente zu überprüfen, oder schließen Sie das Overlay. Keine Antwort schließt es.",
                ariaLabel: "Bestätigung für beendete Sitzung",
                secondaryAction: "Schließen",
                primaryAction: "Bleib hier"
            }
        },
        assistant: {
            statusLabel: {
                queued: "In der Warteschlange",
                working: "Arbeiten",
                ready: "Bereit",
                paused: "Angehalten",
                issue: "Problem",
                unavailable: "Nicht verfügbar",
                watching: "Zuschauen"
            },
            statusDescription: {
                queued: "Ein nützlicher Moment wurde erkannt.",
                working: "Live-Anleitung erstellen.",
                latestReady: "Die neueste Assistentenführung ist bereit.",
                ready: "Der Assistent ist für den nächsten Moment bereit.",
                paused: "Der Assistent ist für diese Sitzung ausgeschaltet.",
                issue: "Der Assistent braucht Aufmerksamkeit.",
                unavailable: "OpenAI ist derzeit nicht verfügbar.",
                watching: "Warten auf einen nützlichen Moment."
            },
            emptyState: {
                setupTitle: "Beenden Sie die Einrichtung von OpenAI, um den Assistenten zu verwenden",
                setupBody: "Die Einrichtung von OpenAI ist unvollständig, daher kann die Live-Führung noch nicht ausgeführt werden.",
                unavailableTitle: "Der Assistent ist vorübergehend nicht verfügbar",
                unavailableBody: "{message} Der Assistent wird fortfahren, sobald OpenAI wieder fehlerfrei ist.",
                watchingTitle: "Der Assistent beobachtet dieses Meeting",
                watchingBody: "Wenn eine nützliche Frage, Anfrage oder ein Risiko auftaucht, wird hier eine Live-Anleitung angezeigt.",
                offTitle: "Der Assistent ist für diese Sitzung ausgeschaltet",
                offBody: "Schalten Sie es wieder ein, wenn Sie die Liveführung fortsetzen möchten.",
                errorTitle: "Der Assistent braucht Aufmerksamkeit",
                errorBody: "Ein Generationsproblem hat die Liveführung unterbrochen. Beim nächsten gültigen Zeitpunkt wird es erneut versucht.",
                preparingTitle: "Der Assistent bereitet die Anleitung vor",
                preparingBody: "Ein nützlicher Moment wurde erkannt und die erste Live-Anleitung steht nun in der Warteschlange.",
                workingTitle: "Der Assistent arbeitet",
                workingBody: "Für den aktuellen Besprechungsmoment wird eine Live-Anleitung generiert."
            },
            footer: {
                setup: "Schließen Sie die Einrichtung von OpenAI ab",
                unavailable: "OpenAI ist nicht verfügbar",
                sessionStartsAfterJoin: "Die Sitzung beginnt nach dem Beitritt",
                workingLiveGuidance: "Ich arbeite an der Live-Anleitung",
                turnedOffForSession: "Für diese Sitzung deaktiviert",
                generationNeedsAttention: "Generation braucht Aufmerksamkeit",
                latestGuidanceReady: "Die neuesten Leitlinien sind fertig",
                watchingSession: "Ich schaue mir diese Sitzung an",
                notes: "{count} Notizen",
                liveCount: "{count} live",
                aiAlertSetup: "Schließen Sie die Einrichtung von OpenAI in den Einstellungen ab, bevor die Assistentenführung ausgeführt werden kann.",
                aiAlertUnavailable: "{message} Die Assistentenführung bleibt angehalten, bis OpenAI wieder verfügbar ist."
            },
            source: {
                meetingChat: "Besprechungschat",
                caption: "Bildunterschrift",
                unknownSpeaker: "Unbekannt"
            },
            pendingReply: "Der Assistent bereitet für diesen Moment eine Antwort vor.",
            ui: {
                toggleLiveLabel: "Lebe",
                readyTitle: "Der Assistent ist bereit",
                watchingSession: "Ich schaue mir diese Sitzung an",
                watching: "Zuschauen",
                waitingForMoment: "Warten auf einen nützlichen Moment.",
                headerTitle: "KI-Assistent",
                footerTitle: "KI-Assistent",
                panelAriaLabel: "Live-Anleitung durch KI-Assistent",
                openSettings: "Öffnen Sie die Assistenteneinstellungen",
                setupBeforeEnable: "Beenden Sie die Einrichtung von OpenAI, bevor Sie den Assistenten einschalten",
                unavailableUntilOpenAi: "Der Assistent ist nicht verfügbar, bis OpenAI wieder verfügbar ist",
                turnOffForSession: "Schalten Sie den Assistenten für diese Sitzung aus",
                turnOnForSession: "Schalten Sie den Assistenten für diese Sitzung ein",
                openPanel: "Assistentenbereich öffnen",
                collapsePanel: "Assistentenbereich einklappen",
                resizePanel: "Größe des Assistentenfensters ändern"
            }
        }
    },
    popup: {
        header: {
            devBadge: "Entwickler",
            openMeetingHistory: "Besprechungsverlauf öffnen",
            openSettings: "Einstellungen öffnen"
        },
        setup: {
            verificationNotTested: "Nicht getestet",
            notConfigured: "OpenAI nicht konfiguriert",
            setupRequired: {
                label: "Einrichtung erforderlich",
                description: "Fügen Sie Ihren API-Schlüssel OpenAI hinzu und wählen Sie ein Modell aus."
            },
            needsAttention: {
                label: "Braucht Aufmerksamkeit",
                description: "Überprüfen Sie die Einrichtung von OpenAI in den Einstellungen."
            },
            ready: {
                label: "Bereit",
                description: "OpenAI, Modell und Zielsprache sind für die Live-Ausgabe bereit."
            },
            verifySetup: {
                label: "Überprüfen Sie die Einrichtung",
                description: "Führen Sie einen Verbindungstest in den Einstellungen durch, um die Einrichtung von OpenAI zu bestätigen."
            }
        },
        overlay: {
            badge: "Überlagerung",
            title: "Live-Sichtbarkeit",
            switchAriaLabel: "Schalten Sie die Sichtbarkeit des Live-Overlays um",
            switchDisabledTitle: "Aktivieren Sie den Aufnahmestart in den Einstellungen, um die Live-Sichtbarkeit zu nutzen.",
            state: {
                inactive: "Inaktiv",
                visible: "Sichtbar",
                hidden: "Versteckt"
            },
            mode: {
                captureStartupOff: "Der Capture-Start ist deaktiviert",
                available: "Overlay bleibt verfügbar",
                hidden: "Overlay bleibt ausgeblendet"
            },
            helper: {
                captureStartupOff: "Die Live-Sichtbarkeit wird verfügbar, nachdem „Start“ in den Einstellungen auf „Fragen“ oder „Immer“ eingestellt ist.",
                instantToggle: "Sofortiges Umschalten für offene Besprechungen. Position, Größe und kompakter Zustand werden pro Meeting-App gespeichert."
            }
        },
        pulse: {
            title: "Arbeitsbereich-Puls"
        },
        rows: {
            live: {
                capturing: {
                    label: "Live-Aufnahme",
                    detail: "{platform} hört diesen Tab aktiv zu.",
                    badge: "Lebe"
                },
                lobby: {
                    label: "Bereit, wenn Sie beitreten",
                    detail: "{platform} ist geöffnet und steht in der Lobby bereit.",
                    badge: "Lobby"
                },
                startupOff: {
                    label: "Der Capture-Start ist deaktiviert",
                    detail: "Stellen Sie „Startup“ wieder auf „Fragen“ oder „Immer“ ein, wenn Sie wieder live zuhören möchten.",
                    badge: "Aus"
                },
                idle: {
                    label: "Kein Live-Meeting",
                    detail: "Öffnen Sie eine unterstützte Besprechungsregisterkarte und CaptionArc wird hier aktiviert.",
                    badge: "Leerlauf"
                }
            },
            summary: {
                busy: {
                    label: "Die KI-Zusammenfassung funktioniert",
                    detail: "Im Hintergrund wird eine Besprechungszusammenfassung zusammengestellt.",
                    badge: "Beschäftigt"
                },
                failed: {
                    label: "Zusammenfassung erfordert Aufmerksamkeit",
                    detail: "Die letzte Zusammenfassung wurde nicht sauber abgeschlossen.",
                    badge: "Versuchen Sie es noch einmal"
                },
                automatic: {
                    label: "Die automatische Zusammenfassung ist aktiviert",
                    detail: "{profileName} beginnt nach Ende jedes Meetings selbstständig mit einer Zusammenfassung.",
                    badge: "Automatisch"
                },
                manual: {
                    label: "Manueller Zusammenfassungsmodus",
                    detail: "Im Moment befindet sich nichts in der Warteschlange. Zusammenfassungen werden nur angezeigt, wenn Sie danach fragen.",
                    badge: "Handbuch"
                },
                defaultProfileName: "Das Standardprofil"
            },
            archive: {
                empty: {
                    label: "Das Archiv ist noch leer",
                    detail: "Ihre gespeicherten Besprechungen und Zusammenfassungen werden hier gesammelt, sobald die Erfassung ausgeführt wird.",
                    badge: "Neu"
                },
                ready: {
                    label: "{count} Besprechungen gespeichert",
                    detail: "{used} verwendet. {updated}."
                }
            }
        },
        relativeTime: {
            noMeetingsSaved: "Es wurden noch keine Besprechungen gespeichert",
            updatedJustNow: "Gerade erst aktualisiert",
            updatedMinutesAgo: "Vor {minutes}m aktualisiert",
            updatedHoursAgo: "Vor {hours}h aktualisiert",
            updatedDaysAgo: "Vor {days}d aktualisiert"
        },
        meta: {
            aiService: "KI-Dienst",
            model: "Modell",
            target: "Ziel",
            startup: "Startup",
            modelNotSelected: "Nicht ausgewählt",
            pendingIndicator: "OpenAI wurde noch nicht verifiziert.",
            startupValues: {
                off: "Aus",
                always: "Immer",
                ask: "Fragen Sie"
            }
        },
        footer: {
            version: "v{version}",
            copyright: "© {year} CaptionArc"
        }
    }
} as const satisfies UiMessageCatalog;
