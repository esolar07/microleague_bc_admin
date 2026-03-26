import React from "react";
import { Info } from "lucide-react";

interface LabeledFieldProps {
  label: string;
  tooltipText?: string;
  children: React.ReactNode;
  labelClassName?: string;
  containerClassName?: string;
}

const LabeledField: React.FC<LabeledFieldProps> = ({
  label,
  tooltipText,
  children,
  labelClassName = "flex gap-2 items-center mb-1",
  containerClassName = "",
}) => {
  return (
    <div className={containerClassName}>
      <div className={labelClassName}>
        <label>{label}</label>
        {tooltipText && (
          <div className="relative group">
            <div
              className="bg-white text-center rounded-[20px] absolute bottom-full -translate-x-1/2 left-1/2 p-5 hidden group-hover:block z-20"
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
      {children}
    </div>
  );
};

export default LabeledField;
