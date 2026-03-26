"use client";
import { useState, useRef, useEffect } from "react";
import Info from "@/components/icons/Info";
import { ChevronDown } from "lucide-react";

interface OptionItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  comingSoon?: boolean;
}

interface SelectDropdownProps {
  options?: (string | OptionItem)[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  isIcons?: boolean;
  className?: string;
  dropDown?: string;
  innerDropdown?: string;
  innerDropdownSelect?: string;
  text?: string;
  icon?: React.ReactNode;
  comingSoonText?: string;
  label?: string;
  tooltipText?: string;
  containerClassName?: string;
  labelClassName?: string;
  error?: string;
  required?: boolean;
  name?: string; // For react-hook-form
  onBlur?: () => void;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  isIcons = true,
  className,
  dropDown,
  innerDropdownSelect,
  innerDropdown,
  text,
  label,
  tooltipText,
  containerClassName = "",
  labelClassName = "flex gap-2 items-center mb-1",
  error,
  required,
  name,
  onBlur,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const selected = value !== undefined ? value : internalValue;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert string options to OptionItem objects if needed
  const normalizedOptions = options.map(option => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }
    return option;
  });

  // Find the selected option
  const selectedOption = normalizedOptions.find(opt => opt.value === selected);
  
  // Show placeholder if no option is selected
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (option: string | OptionItem) => {
    const optionValue = typeof option === "string" ? option : option.value;
    if (onChange) {
      onChange(optionValue);
    } else {
      setInternalValue(optionValue);
    }
    setOpen(false);
    
    if (onBlur) {
      setTimeout(() => onBlur(), 100);
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
        // Trigger validation when dropdown closes
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
          className={`flex items-center w-full border-2 mt-1 text-sm border-[#DFDFDF] bg-[#F3F3F3] rounded-xl pl-3 pr-3 py-3 focus:border-[#7529ED] focus:outline-none ${
            error ? 'border-red-500' : ''
          } ${className}`}
          onClick={() => setOpen((o) => !o)}
          onBlur={onBlur}
          type="button"
        >
          {isIcons && (
            <div className="flex justify-between w-full items-center">
              <span
                className={`text-sm capitalize flex-1 text-left ${
                  selectedOption ? "text-[#121212]" : "text-[#666666]"
                } ${text}`}
              >
                {displayText}
              </span>
              <ChevronDown 
                className={`h-[14px] text-[#666666] transition-transform ${open ? 'rotate-180' : ''}`} 
              />
            </div>
          )}
        </button>
        
        {open && (
          <div
            className={`absolute left-0 right-0 mt-2 border border-[#E4E4E4] bg-white rounded-[20px] shadow-lg z-10 max-h-60 overflow-auto ${dropDown}`}
          >
            {normalizedOptions.map((option, index) => {
              const isSelected = option.value === selected;
              const isLast = index === normalizedOptions.length - 1;
              
              return (
                <div
                  key={option.value}
                  className={`px-4 py-3 border-b border-[#DFDFDF] capitalize text-[#121212] text-base ${
                    option.comingSoon
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:text-[#7529ED] hover:bg-gray-50"
                  } ${isSelected ? `text-[#7529ED] bg-blue-50 ${innerDropdownSelect}` : ""} ${isLast ? "border-b-0" : ""} ${innerDropdown}`}
                  onClick={() => !option.comingSoon && handleSelect(option)}
                >
                  <div className="flex items-center gap-3">
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

export default SelectDropdown;