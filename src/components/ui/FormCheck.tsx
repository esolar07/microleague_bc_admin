"use client";
import { useState, useEffect } from "react";

interface CheckboxProps {
  checked?: boolean;
  onChange?: (value: boolean) => void;
}

const FormCheck: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
}) => {
  const [isOn, setIsOn] = useState(checked);

  useEffect(() => {
    setIsOn(checked);
  }, [checked]);

  const toggle = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    onChange?.(newValue);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`
        relative w-10 h-[22px] rounded-full p-0.5 border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#7529ED] focus:ring-opacity-50
        ${isOn ? "border-[#7529ED] bg-[#7529ED]/10" : "border-[#666666]"}
      `}
    >
      <span
        className={`
          absolute top-0.5 h-4 w-4 rounded-full transition-all ease-in-out duration-300
          ${
            isOn
              ? "bg-[#7529ED] right-0.5"
              : "bg-[#666666] left-0.5"
          }
        `}
      ></span>
    </button>
  );
};

export default FormCheck;