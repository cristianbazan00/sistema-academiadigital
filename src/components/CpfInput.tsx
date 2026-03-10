import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { maskCpf, unmaskCpf } from "@/lib/cpf";

interface CpfInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onValueChange: (raw: string) => void;
}

const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [display, setDisplay] = useState(() => maskCpf(value));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = unmaskCpf(e.target.value);
      setDisplay(maskCpf(raw));
      onValueChange(raw);
    };

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        maxLength={14}
        placeholder="000.000.000-00"
        value={display}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
CpfInput.displayName = "CpfInput";

export { CpfInput };
