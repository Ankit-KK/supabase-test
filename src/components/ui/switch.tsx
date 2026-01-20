import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, defaultChecked, id, disabled = false, name, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };

    return (
      <div className={cn("checkbox-wrapper-25", className)}>
        <input
          type="checkbox"
          ref={ref}
          id={id}
          name={name}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
