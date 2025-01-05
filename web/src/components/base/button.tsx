export function Button({ ...props }: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      onClick={(e) => {
        e.preventDefault();
        if (props.onClick) props.onClick(e);
      }}
    />
  );
}
