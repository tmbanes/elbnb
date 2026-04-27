declare module "@react-email/render" {
  export function render(
    element: unknown,
    options?: { pretty?: boolean; plainText?: boolean }
  ): Promise<string> | string;
}

