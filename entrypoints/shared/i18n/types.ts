export type SupportedUiLocale =
  | "en"
  | "fa"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ru"
  | "hi"
  | "zh"
  | "ja"
  | "ko";

export type UiLanguageSetting = "system" | SupportedUiLocale;

export type LocaleDirection = "ltr" | "rtl";

export type InterpolationPrimitive =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined;

export type InterpolationValues = Record<string, InterpolationPrimitive>;

export type MessageTree = {
  readonly [key: string]: string | MessageTree;
};

export type MessageTreeOverrides<T> = {
  readonly [Key in keyof T]?: T[Key] extends string
    ? string
    : T[Key] extends MessageTree
      ? MessageTreeOverrides<T[Key]>
      : never;
};

type CanonicalUiMessageCatalog = typeof import("./messages/en").enMessages;

type LocalizedMessageTree<T> = {
  readonly [Key in keyof T]: T[Key] extends string
    ? string
    : T[Key] extends MessageTree
      ? LocalizedMessageTree<T[Key]>
      : never;
};

type DotPathJoin<Prefix extends string, Suffix extends string> =
  `${Prefix}.${Suffix}`;

export type DotPath<T extends MessageTree> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends MessageTree
      ? DotPathJoin<Key, DotPath<T[Key]>>
      : never;
}[keyof T & string];

export type UiMessageCatalog = LocalizedMessageTree<CanonicalUiMessageCatalog>;

export type UiMessageCatalogOverrides = MessageTreeOverrides<UiMessageCatalog>;

export type UiMessageKey = DotPath<CanonicalUiMessageCatalog>;

export type UiTranslator = (
  key: UiMessageKey,
  params?: InterpolationValues
) => string;