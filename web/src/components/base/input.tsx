export function InputDecimal(props: React.ComponentProps<"input">) {
  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*(.[0-9]*)?"
      {...props}
    />
  );
}

export function InputNumeric(props: React.ComponentProps<"input">) {
  return <input type="text" inputMode="numeric" pattern="[0-9]" {...props} />;
}
