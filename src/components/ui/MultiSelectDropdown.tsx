"use client";
import { useState, useRef, useEffect } from "react";
import Info from "@/components/icons/Info";
import { ChevronDown, X } from "lucide-react";

interface OptionItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  comingSoon?: boolean;
}

interface MultiSelectDropdownProps {
  options?: (string | OptionItem)[];
  value?: string[]; // Array of selected values
  onChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  dropDown?: string;
  innerDropdown?: string;
  innerDropdownSelect?: string;
  label?: string;
  tooltipText?: string;
  containerClassName?: string;
  labelClassName?: string;
  error?: string;
  required?: boolean;
  name?: string;
  onBlur?: () => void;
  maxSelections?: number; // Optional limit on selections
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  className,
  dropDown,
  innerDropdownSelect,
  innerDropdown,
  label,
  tooltipText,
  containerClassName = "",
  labelClassName = "flex gap-2 items-center mb-1",
  error,
  required,
  name,
  onBlur,
  maxSelections,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert string options to OptionItem objects if needed
  const normalizedOptions = options.map(option => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }
    return option;
  });

  // Get selected options for display
  const selectedOptions = normalizedOptions.filter(opt => 
    value.includes(opt.value)
  );

  const handleToggle = (optionValue: string) => {
    if (!onChange) return;

    const isSelected = value.includes(optionValue);
    let newValue: string[];

    if (isSelected) {
      // Remove the option
      newValue = value.filter(v => v !== optionValue);
    } else {
      // Add the option (check max selections)
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if max reached
      }
      newValue = [...value, optionValue];
    }

    onChange(newValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onChange) return;
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        if (onBlur) {
          setTimeout(() => onBlur(), 100);
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onBlur]);

  return (
    <div className={containerClassName}>
      {(label || tooltipText) && (
        <div className={labelClassName}>
          {label && (
            <label className="text-base text-[#121212] capitalize">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {tooltipText && (
            <div className="relative group">
              <div
                className="bg-white text-center rounded-xl absolute bottom-full text-sm -translate-x-1/2 left-1/2 p-3 hidden group-hover:block z-20"
                style={{
                  boxShadow: "0px 0px 20px 0px #0000000F",
                }}
              >
                <p className="text-sm text-[#121212] font-normal w-[330px]">
                  {tooltipText}
                </p>
              </div>
              <div className="cursor-pointer">
                <Info />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          className={`flex items-center w-full border-2 mt-1 text-sm border-[#DFDFDF] bg-[#F3F3F3] rounded-xl pl-3 pr-3 py-3 focus:border-[#7529ED] focus:outline-none min-h-[48px] ${
            error ? 'border-red-500' : ''
          } ${className}`}
          onClick={() => setOpen((o) => !o)}
          onBlur={onBlur}
          type="button"
        >
          <div className="flex justify-between w-full items-center gap-2">
            <div className="flex-1 flex flex-wrap gap-1.5 items-center">
              {selectedOptions.length === 0 ? (
                <span className="text-sm text-[#666666]">{placeholder}</span>
              ) : (
                selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 bg-[#7529ED] text-white text-xs px-2 py-1 rounded-md"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(option.value, e)}
                      className="hover:bg-[#5d1fc9] rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedOptions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-[#666666] hover:text-[#7529ED] px-1"
                >
                  Clear
                </button>
              )}
              <ChevronDown 
                className={`h-[14px] text-[#666666] transition-transform ${open ? 'rotate-180' : ''}`} 
              />
            </div>
          </div>
        </button>
        
        {open && (
          <div
            className={`absolute left-0 right-0 mt-2 border border-[#E4E4E4] bg-white rounded-[20px] shadow-lg z-10 max-h-60 overflow-auto ${dropDown}`}
          >
            {normalizedOptions.map((option, index) => {
              const isSelected = value.includes(option.value);
              const isLast = index === normalizedOptions.length - 1;
              const isDisabled = option.comingSoon || (!isSelected && maxSelections && value.length >= maxSelections);
              
              return (
                <div
                  key={option.value}
                  className={`px-4 py-3 border-b border-[#DFDFDF] cursor-pointer capitalize hover:text-[#7529ED] hover:bg-gray-50 text-[#121212] text-base ${
                    isSelected ? `text-[#7529ED] bg-blue-50 ${innerDropdownSelect}` : ""
                  } ${isLast ? "border-b-0" : ""} ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  } ${innerDropdown}`}
                  onClick={() => !isDisabled && handleToggle(option.value)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#7529ED] border-gray-300 rounded focus:ring-[#7529ED]"
                      disabled={isDisabled}
                    />
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="flex-1">{option.label}</span>
                    {option.comingSoon && (
                      <span className="text-xs text-gray-400">Coming Soon</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default MultiSelectDropdown;