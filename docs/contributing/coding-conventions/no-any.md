## Avoid suggesting code that uses the any type as much as possible

Example:

```tsx
// NG [NG]
type SomeMapType = Record<string, any>;

// OK [OK]
type SomeMapType = Record<string, unknown>;
```
