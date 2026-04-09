## Define functions and components as Arrow Functions

Example 1:

```tsx
// NG [NG]
export function DefaultButton() {
  // ...
}

// OK [OK]
export const DefaultButton = () => {
  // ...
};
```

Example 2:

```tsx
// NG [NG]
export function calculateSum() {
  // ...
}

// OK [OK]
export const calculateSum = () => {
  // ...
};
```
